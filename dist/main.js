"use strict";
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
Object.defineProperty(exports, "__esModule", { value: true });
var core = require("@actions/core");
var openai_1 = require("openai");
var rest_1 = require("@octokit/rest");
var github_service_1 = require("./github.service");
var llm_1 = require("./llm");
var dotenv_1 = require("dotenv");
function getConfig() {
    dotenv_1.default.config();
    return {
        llmApiKey: core.getInput("LLM_API_KEY") || process.env.OPENAI_API_KEY || "",
        llmApiModel: core.getInput("LLM_API_MODEL") || process.env.OPENAI_API_MODEL || "",
        githubToken: core.getInput("GITHUB_TOKEN") || process.env.GITHUB_TOKEN || "",
        llmBaseUrl: core.getInput("LLM_BASE_URL") || process.env.LLM_BASE_URL || "",
        githubEventPath: process.env.GITHUB_EVENT_PATH || "",
    };
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var config, githubService, eventData, llmService, prDetails, diff, comments;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    config = getConfig();
                    githubService = new github_service_1.GitHubService(new rest_1.Octokit({ auth: config.githubToken }), config.githubEventPath);
                    eventData = githubService.getEventData();
                    llmService = new llm_1.LLMService(new openai_1.default({
                        apiKey: config.llmApiKey,
                        baseURL: config.llmBaseUrl,
                    }), config.llmApiModel);
                    return [4 /*yield*/, githubService.getPRDetails()];
                case 1:
                    prDetails = _a.sent();
                    return [4 /*yield*/, githubService.getFilteredDiff(eventData, prDetails.owner, prDetails.repo, prDetails.pull_number, core.getInput("exclude").split(",").map(function (s) { return s.trim(); }))];
                case 2:
                    diff = _a.sent();
                    if (diff.length === 0) {
                        console.log("No diff found");
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, llmService.generateReviewComments(diff, prDetails)];
                case 3:
                    comments = _a.sent();
                    if (!(comments.length > 0)) return [3 /*break*/, 5];
                    return [4 /*yield*/, githubService.createReviewComment(prDetails.owner, prDetails.repo, prDetails.pull_number, comments)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    });
}
main().catch(function (error) {
    console.error("Error:", error);
    process.exit(1);
});
