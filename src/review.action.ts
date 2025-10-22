#!/usr/bin/env node
import fetch from "node-fetch";
import * as core from "@actions/core";
import * as github from "@actions/github";

// 自动识别平台
const isGitHub = !!process.env.GITHUB_REPOSITORY;
const isGitLab = !!process.env.CI_PROJECT_PATH;

// GitHub 上下文（仅在 GitHub 环境有效）
const githubContext = isGitHub ? github.context : null;

// 统一参数解析
const context = {
  //提取纯仓库名称（移除 owner 前缀）
  // GitHub：GITHUB_REPOSITORY 格式为 "owner/repo" → 取 split 后最后一段
  // GitLab：CI_PROJECT_PATH 格式可能为 "group/owner/repo" → 同样取最后一段
  repo: (() => {
    if (isGitHub && process.env.GITHUB_REPOSITORY) {
      return process.env.GITHUB_REPOSITORY.split("/").pop() || "";
    }
    if (isGitLab && process.env.CI_PROJECT_PATH) {
      return process.env.CI_PROJECT_PATH.split("/").pop() || "";
    }
    return ""; // 兜底空字符串
  })(),
  pr_number: isGitHub
    ? githubContext?.payload?.pull_request?.number?.toString()
    : process.env.CI_MERGE_REQUEST_IID,
  branch: process.env.GITHUB_REF_NAME || process.env.CI_COMMIT_REF_NAME,
  commit_sha: process.env.GITHUB_SHA || process.env.CI_COMMIT_SHA,
  eventType: process.env.GITHUB_EVENT_NAME || process.env.CI_EVENT_NAME,
  api_key: core.getInput("api_key") || process.env.PING_AI_REVIEWER_API_KEY,
  api_url: core.getInput("api_url") || process.env.PING_AI_REVIEWER_API_URL || "https://ping-ai-reviewer.vercel.app/review/github/review",
  token: (core.getInput("token") || process.env.EXPLICIT_TOKEN || process.env.GITHUB_TOKEN || process.env.GITLAB_TOKEN)?.toString() || "",
  pr_state: isGitHub
    ? githubContext?.payload?.pull_request?.state
    : process.env.CI_MERGE_REQUEST_STATE,
  project_id: isGitHub
    ? process.env.GITHUB_REPOSITORY_ID
    : process.env.CI_PROJECT_ID,
  project_name: isGitHub
    ? process.env.GITHUB_REPOSITORY?.split("/")[1]
    : process.env.CI_PROJECT_NAME,
  owner: isGitHub
    ? process.env.GITHUB_REPOSITORY?.split("/")[0]
    : process.env.CI_PROJECT_NAMESPACE,

  // 补充：源分支（PR/MR 来自的分支）
  sourceBranch: isGitHub
    ? githubContext?.payload?.pull_request?.head?.ref // GitHub：PR 源分支（head.ref）
    : process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME, // GitLab：内置变量

  // 补充：目标分支（PR/MR 要合并到的分支）
  targetBranch: isGitHub
    ? githubContext?.payload?.pull_request?.base?.ref // GitHub：PR 目标分支（base.ref）
    : process.env.CI_MERGE_REQUEST_TARGET_BRANCH_NAME // GitLab：内置变量
  ,
  llm_provider: core.getInput("llm_provider") || process.env.LLM_PROVIDER,
  llm_provider_api_key: core.getInput("llm_provider_api_key") || process.env.LLM_PROVIDER_API_KEY,
};

// 打印所有 token 来源（用于调试）
console.log("===== token 来源调试 =====");
console.log("core.getInput('token'):", JSON.stringify(core.getInput("token")));
console.log("process.env.EXPLICIT_TOKEN:", JSON.stringify(process.env.EXPLICIT_TOKEN));
console.log("process.env.GITHUB_TOKEN:", JSON.stringify(process.env.GITHUB_TOKEN));
console.log("process.env.GITLAB_TOKEN:", JSON.stringify(process.env.GITLAB_TOKEN));
console.log("最终 context.token:", JSON.stringify(context.token));
console.log("===========================");

// 新增 token 校验（在 API 调用前）
if (!context.token || typeof context.token !== "string") {
  console.error("❌ token 无效：token 不能为空且必须是字符串");
  console.error("请检查：");
  console.error("- 在 GitHub 环境中，确保 GITHUB_TOKEN 已自动注入（通常默认存在）");
  console.error("- 在 GitLab 环境中，需设置 CI/CD 变量 GITLAB_TOKEN");
  console.error("- 或通过 Action 的 with: { token: ... } 传递有效 token");
  process.exit(1);
}

// 校验必填参数
if (!context.llm_provider_api_key) {
  console.error("❌ 缺少 LLM_PROVIDER_API_KEY: 请设置环境变量 LLM_PROVIDER_API_KEY");
  process.exit(1);
}

if (!context.llm_provider) {
  console.error("❌ 缺少 LLM_PROVIDER: 请设置环境变量 LLM_PROVIDER");
  process.exit(1);
}

// 打印关键信息（补充源分支和目标分支）
console.log(`🚀 检测到平台：${isGitHub ? "GitHub" : isGitLab ? "GitLab" : "未知环境"}`);
console.log(`📦 仓库：${context.repo}（ID: ${context.project_id}）`);
console.log(`👤 所有者：${context.owner}`);
console.log(`🔖 源分支 → 目标分支：${context.sourceBranch || "无"} → ${context.targetBranch || "无"}`);
console.log(`💬 PR/MR：${context.pr_number || "无"}（状态：${context.pr_state || "未知"}）`);

(async () => {
  try {
    const body = {
      // 原有参数
      repo: context.repo,
      mrNumber: context.pr_number,
      commitSha: context.commit_sha,
      eventType: context.eventType,
      token: context.token,
      mrState: context.pr_state,
      projectId: context.project_id,
      projectName: context.project_name,
      owner: context.owner,
      // 补充源分支和目标分支
      sourceBranch: context.sourceBranch,
      targetBranch: context.targetBranch,
      llmProvider: context.llm_provider,
      llmProviderApiKey: context.llm_provider_api_key,
    };
    console.log("body:", JSON.stringify(body, null, 2));
    const res = await fetch(context.api_url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${context.api_key}`,
        "Content-Type": "application/json",
        "User-Agent": "Ping-AI-Reviewer-Action",
      },
      body: JSON.stringify(body),
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