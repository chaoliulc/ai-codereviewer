#!/usr/bin/env node
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var node_fetch_1 = require("node-fetch");
var core = require("@actions/core");
// 自动识别平台
var isGitHub = !!process.env.GITHUB_REPOSITORY;
var isGitLab = !!process.env.CI_PROJECT_PATH;
// 统一参数解析
var context = {
    repo: isGitHub
        ? process.env.GITHUB_REPOSITORY
        : process.env.CI_PROJECT_PATH,
    pr_number: process.env.GITHUB_EVENT_NAME === "pull_request"
        ? (_a = process.env.GITHUB_REF) === null || _a === void 0 ? void 0 : _a.split("/")[2]
        : process.env.CI_MERGE_REQUEST_IID,
    branch: process.env.GITHUB_REF_NAME || process.env.CI_COMMIT_REF_NAME,
    commit_sha: process.env.GITHUB_SHA || process.env.CI_COMMIT_SHA,
    actor: process.env.GITHUB_ACTOR || process.env.GITLAB_USER_LOGIN,
    pipeline_id: process.env.GITHUB_RUN_ID || process.env.CI_PIPELINE_ID,
    api_key: core.getInput("api_key") || process.env.PING_AI_REVIEWER_API_KEY,
    api_url: core.getInput("api_url") || process.env.PING_AI_REVIEWER_API_URL || "https://ping-ai-reviewer.vercel.app/review/webhook",
};
if (!context.api_key) {
    console.error("❌ 缺少 API Key: 请设置环境变量 PING_AI_REVIEWER_API_KEY");
    process.exit(1);
}
console.log("\uD83D\uDE80 \u68C0\u6D4B\u5230\u5E73\u53F0\uFF1A".concat(isGitHub ? "GitHub" : isGitLab ? "GitLab" : "未知环境"));
console.log("\uD83D\uDCE6 \u4ED3\u5E93\uFF1A".concat(context.repo));
console.log("\uD83D\uDD16 \u5206\u652F\uFF1A".concat(context.branch));
console.log("\uD83D\uDCAC PR/MR\uFF1A".concat(context.pr_number || "无"));
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var res, text, data, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, (0, node_fetch_1.default)(context.api_url, {
                        method: "POST",
                        headers: __assign({ "Authorization": "Bearer ".concat(context.api_key), "Content-Type": "application/json", "User-Agent": "Ping-AI-Reviewer-Action" }, (isGitHub ? { "X-GitHub-Event": process.env.GITHUB_EVENT_NAME } : {})),
                        body: JSON.stringify({
                            repo: context.repo,
                            pr_number: context.pr_number,
                            branch: context.branch,
                            commit_sha: context.commit_sha,
                            actor: context.actor,
                            pipeline_id: context.pipeline_id,
                            platform: isGitHub ? "github" : isGitLab ? "gitlab" : "unknown",
                        }),
                    })];
            case 1:
                res = _a.sent();
                if (!!res.ok) return [3 /*break*/, 3];
                return [4 /*yield*/, res.text()];
            case 2:
                text = _a.sent();
                console.error("\u274C API \u8C03\u7528\u5931\u8D25 (".concat(res.status, "): ").concat(text));
                process.exit(1);
                _a.label = 3;
            case 3: return [4 /*yield*/, res.json()];
            case 4:
                data = _a.sent();
                console.log("✅ 审查请求已发送成功：");
                console.log(JSON.stringify(data, null, 2));
                return [3 /*break*/, 6];
            case 5:
                err_1 = _a.sent();
                console.error("💥 请求失败:", err_1);
                process.exit(1);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); })();
