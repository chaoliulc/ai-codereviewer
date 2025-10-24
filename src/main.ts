import * as core from "@actions/core";
import OpenAI from "openai";
import { Octokit } from "@octokit/rest";
import { GitHubService } from "./github.service";
import { LLMService } from "./llm";
import dotenv from "dotenv";

function getConfig() {
  dotenv.config();
  return {
    llmApiKey: core.getInput("LLM_API_KEY") || process.env.OPENAI_API_KEY || "",
    llmApiModel: core.getInput("LLM_API_MODEL") || process.env.OPENAI_API_MODEL || "",
    githubToken: core.getInput("GITHUB_TOKEN") || process.env.GITHUB_TOKEN || "",
    llmBaseUrl: core.getInput("LLM_BASE_URL") || process.env.LLM_BASE_URL || "",
    githubEventPath: process.env.GITHUB_EVENT_PATH || "",
  }
}

async function main() {
  console.log("test");
  const config = getConfig();
  const githubService = new GitHubService(new Octokit({ auth: config.githubToken }), config.githubEventPath)
  const eventData = githubService.getEventData();
  const llmService = new LLMService(new OpenAI({
    apiKey: config.llmApiKey,
    baseURL: config.llmBaseUrl,
  }), config.llmApiModel);
  const prDetails = await githubService.getPRDetails();
  let diff = await githubService.getFilteredDiff(
    eventData,
    prDetails.owner,
    prDetails.repo,
    prDetails.pull_number,
    core.getInput("exclude").split(",").map((s) => s.trim())
  );
  if (diff.length === 0) {
    console.log("No diff found");
    return;
  }
  const comments = await llmService.generateReviewComments(diff, prDetails);
  if (comments.length > 0) {
    await githubService.createReviewComment(
      prDetails.owner,
      prDetails.repo,
      prDetails.pull_number,
      comments
    );
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
