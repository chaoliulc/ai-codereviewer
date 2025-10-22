import { readFileSync } from "fs";
import parseDiff from "parse-diff";
import minimatch from "minimatch";
export class GitHubService {
    constructor(octokit, githubEventPath) {
        this.octokit = octokit;
        this.githubEventPath = githubEventPath;
    }
    getEventData() {
        return JSON.parse(readFileSync(this.githubEventPath || "", "utf8"));
    }
    async getPRDetails() {
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
    async createReviewComment(owner, repo, pull_number, comments) {
        await this.octokit.pulls.createReview({
            owner,
            repo,
            pull_number,
            comments,
            event: "COMMENT",
        });
    }
    async compareCommits(eventData, owner, repo) {
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
    async getFilteredDiff(eventData, owner, repo, pullNumber, excludePatterns) {
        let diff;
        if (eventData.action === "opened") {
            const response = await this.octokit.pulls.get({
                owner,
                repo,
                pull_number: pullNumber,
                mediaType: { format: "diff" },
            });
            // @ts-expect-error - response.data is a string
            diff = response?.data;
        }
        else if (eventData.action === "synchronize") {
            diff = await this.compareCommits(eventData, owner, repo);
        }
        else {
            console.log("Unsupported event:", eventData.action);
            diff = null;
        }
        if (diff) {
            const parsedDiff = parseDiff(diff);
            return parsedDiff.filter((file) => {
                return !excludePatterns.some((pattern) => minimatch(file.to ?? "", pattern));
            });
        }
        else {
            return [];
        }
    }
}
