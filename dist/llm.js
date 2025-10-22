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
exports.LLMService = void 0;
var LLMService = /** @class */ (function () {
    function LLMService(llmClient, llmModel) {
        this.llmClient = llmClient;
        this.llmModel = llmModel;
    }
    LLMService.prototype.createPrompt = function (file, chunk, prDetails) {
        return "Your task is to review pull requests. Instructions:\n- Provide the response in following JSON format:  {\"reviews\": [{\"lineNumber\":  <line_number>, \"reviewComment\": \"<review comment>\"}]}\n- Do not give positive comments or compliments.\n- Provide comments and suggestions ONLY if there is something to improve, otherwise \"reviews\" should be an empty array.\n- Write the comment in GitHub Markdown format.\n- Use the given description only for the overall context and only comment the code.\n- IMPORTANT: NEVER suggest adding comments to the code.\n\nReview the following code diff in the file \"".concat(file.to, "\" and take the pull request title and description into account when writing the response.\n  \nPull request title: ").concat(prDetails.title, "\nPull request description:\n\n---\n").concat(prDetails.description, "\n---\n\nGit diff to review:\n\n```diff\n").concat(chunk.content, "\n").concat(chunk.changes
            // @ts-expect-error - ln and ln2 exists where needed
            .map(function (c) { return "".concat(c.ln ? c.ln : c.ln2, " ").concat(c.content); })
            .join("\n"), "\n```\n");
    };
    LLMService.prototype.getAIResponse = function (prompt) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var queryConfig, response, res, error_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        queryConfig = {
                            model: this.llmModel,
                            temperature: 0.2,
                            max_tokens: 700,
                            top_p: 1,
                            frequency_penalty: 0,
                            presence_penalty: 0,
                        };
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.llmClient.chat.completions.create(__assign(__assign({}, queryConfig), { messages: [
                                    {
                                        role: "system",
                                        content: prompt,
                                    },
                                ] }))];
                    case 2:
                        response = _c.sent();
                        res = ((_b = (_a = response.choices[0].message) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.trim()) || "{}";
                        return [2 /*return*/, JSON.parse(res).reviews];
                    case 3:
                        error_1 = _c.sent();
                        console.error("Error:", error_1);
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    LLMService.prototype.generateReviewComments = function (parsedDiff, prDetails) {
        return __awaiter(this, void 0, void 0, function () {
            var comments, _i, parsedDiff_1, file, _a, _b, chunk, prompt_1, aiResponse, newComments;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        comments = [];
                        _i = 0, parsedDiff_1 = parsedDiff;
                        _c.label = 1;
                    case 1:
                        if (!(_i < parsedDiff_1.length)) return [3 /*break*/, 6];
                        file = parsedDiff_1[_i];
                        if (file.to === "/dev/null")
                            return [3 /*break*/, 5]; // Ignore deleted files
                        _a = 0, _b = file.chunks;
                        _c.label = 2;
                    case 2:
                        if (!(_a < _b.length)) return [3 /*break*/, 5];
                        chunk = _b[_a];
                        prompt_1 = this.createPrompt(file, chunk, prDetails);
                        return [4 /*yield*/, this.getAIResponse(prompt_1)];
                    case 3:
                        aiResponse = _c.sent();
                        if (aiResponse) {
                            newComments = this.parseComment(file, chunk, aiResponse);
                            if (newComments) {
                                comments.push.apply(comments, newComments);
                            }
                        }
                        _c.label = 4;
                    case 4:
                        _a++;
                        return [3 /*break*/, 2];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, comments];
                }
            });
        });
    };
    LLMService.prototype.parseComment = function (file, chunk, aiResponses) {
        return aiResponses.flatMap(function (aiResponse) {
            if (!file.to) {
                return [];
            }
            return {
                body: aiResponse.reviewComment,
                path: file.to,
                line: Number(aiResponse.lineNumber),
            };
        });
    };
    return LLMService;
}());
exports.LLMService = LLMService;
