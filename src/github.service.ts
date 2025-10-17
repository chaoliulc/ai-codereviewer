import { readFileSync } from "fs";
import { Octokit } from "@octokit/rest";
import parseDiff, { File } from "parse-diff";
import minimatch from "minimatch";
import { EventData,PRDetails } from "./interface";

export class GitHubService {
    constructor(private octokit: Octokit, private githubEventPath: string) { }

    getEventData(): EventData {
        return JSON.parse(readFileSync(this.githubEventPath || "", "utf8"));
    }

    async getPRDetails(): Promise<PRDetails> {
        const { repository, number } = this.getEventData();
        const prResponse = await this.octokit.pulls.get({
            owner: repository.owner.login,
            repo: repository.name,
            pull_number: number,
        });
        return {
            owner: repository.owner.login,
            repo: repository.name,
            pull_number: number,
            title: prResponse.data.title ?? "",
            description: prResponse.data.body ?? "",
        };
    }

    async createReviewComment(
        owner: string,
        repo: string,
        pull_number: number,
        comments: Array<{ body: string; path: string; line: number }>
    ): Promise<void> {
        await this.octokit.pulls.createReview({
            owner,
            repo,
            pull_number,
            comments,
            event: "COMMENT",
        });
    }

    async compareCommits(
        eventData: EventData,
        owner: string,
        repo: string,
    ): Promise<string | null> {
        const newBaseSha = eventData.before;
        const newHeadSha = eventData.after;

        const response = await this.octokit.repos.compareCommits({
            headers: {
                accept: "application/vnd.github.v3.diff",
            },
            owner: owner,
            repo: repo,
            base: newBaseSha,
            head: newHeadSha,
        });

        return String(response.data);
    }

    async getFilteredDiff(
        eventData: EventData,
        owner: string,
        repo: string,
        pullNumber: number,
        excludePatterns: Array<string>
    ): Promise<Array<File>> {
        let diff: string | null;
        if (eventData.action === "opened") {
            const response = await this.octokit.pulls.get({
                owner,
                repo,
                pull_number: pullNumber,
                mediaType: { format: "diff" },
            });
            // @ts-expect-error - response.data is a string
            diff = response?.data;
        } else if (eventData.action === "synchronize") {
            diff = await this.compareCommits(
                eventData,
                owner,
                repo
            );
        } else {
            console.log("Unsupported event:", eventData.action);
            diff = null;
        }
        if (diff) {
            const parsedDiff = parseDiff(diff);
            return parsedDiff.filter((file) => {
                return !excludePatterns.some((pattern) =>
                    minimatch(file.to ?? "", pattern)
                );
            });
        } else {
            return [];
        }
    }
}