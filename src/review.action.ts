#!/usr/bin/env node
import fetch from "node-fetch";
import * as core from "@actions/core";

// 自动识别平台
const isGitHub = !!process.env.GITHUB_REPOSITORY;
const isGitLab = !!process.env.CI_PROJECT_PATH;


// 统一参数解析
const context = {
  repo: isGitHub
    ? process.env.GITHUB_REPOSITORY
    : process.env.CI_PROJECT_PATH,
  pr_number: process.env.GITHUB_EVENT_NAME === "pull_request"
    ? process.env.GITHUB_REF?.split("/")[2]
    : process.env.CI_MERGE_REQUEST_IID,
  branch: process.env.GITHUB_REF_NAME || process.env.CI_COMMIT_REF_NAME,
  commit_sha: process.env.GITHUB_SHA || process.env.CI_COMMIT_SHA,
  actor: process.env.GITHUB_ACTOR || process.env.GITLAB_USER_LOGIN,
  pipeline_id: process.env.GITHUB_RUN_ID || process.env.CI_PIPELINE_ID,
  eventName: process.env.GITHUB_EVENT_NAME || process.env.CI_MERGE_REQUEST_EVENT_NAME,
  api_key: core.getInput("api_key") || process.env.PING_AI_REVIEWER_API_KEY,
  api_url: core.getInput("api_url") || process.env.PING_AI_REVIEWER_API_URL || "https://ping-ai-reviewer.vercel.app/review/github/review",
};

console.log("context:", JSON.stringify(context));

if (!context.api_key) {
  console.error("❌ 缺少 API Key: 请设置环境变量 PING_AI_REVIEWER_API_KEY");
  process.exit(1);
}

console.log(`🚀 检测到平台：${isGitHub ? "GitHub" : isGitLab ? "GitLab" : "未知环境"}`);
console.log(`📦 仓库：${context.repo}`);
console.log(`🔖 分支：${context.branch}`);
console.log(`💬 PR/MR：${context.pr_number || "无"}`);

(async () => {
  try {
    const res = await fetch(context.api_url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${context.api_key}`,
        "Content-Type": "application/json",
        "User-Agent": "Ping-AI-Reviewer-Action",
      },
      body: JSON.stringify({
        repo: context.repo,
        prNumber: context.pr_number,
        branch: context.branch,
        commitSha: context.commit_sha,
        actor: context.actor,
        pipelineId: context.pipeline_id,
        eventName: context.eventName,
        platform: isGitHub ? "github" : isGitLab ? "gitlab" : "unknown",
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`❌ API 调用失败 (${res.status}): ${text}`);
      process.exit(1);
    }

    const data = await res.json();
    console.log("✅ 审查请求已发送成功：");
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("💥 请求失败:", err);
    process.exit(1);
  }
})();
