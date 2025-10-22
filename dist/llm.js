export class LLMService {
    constructor(llmClient, llmModel) {
        this.llmClient = llmClient;
        this.llmModel = llmModel;
    }
    createPrompt(file, chunk, prDetails) {
        return `Your task is to review pull requests. Instructions:
- Provide the response in following JSON format:  {"reviews": [{"lineNumber":  <line_number>, "reviewComment": "<review comment>"}]}
- Do not give positive comments or compliments.
- Provide comments and suggestions ONLY if there is something to improve, otherwise "reviews" should be an empty array.
- Write the comment in GitHub Markdown format.
- Use the given description only for the overall context and only comment the code.
- IMPORTANT: NEVER suggest adding comments to the code.

Review the following code diff in the file "${file.to}" and take the pull request title and description into account when writing the response.
  
Pull request title: ${prDetails.title}
Pull request description:

---
${prDetails.description}
---

Git diff to review:

\`\`\`diff
${chunk.content}
${chunk.changes
            // @ts-expect-error - ln and ln2 exists where needed
            .map((c) => `${c.ln ? c.ln : c.ln2} ${c.content}`)
            .join("\n")}
\`\`\`
`;
    }
    async getAIResponse(prompt) {
        const queryConfig = {
            model: this.llmModel,
            temperature: 0.2,
            max_tokens: 700,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        };
        try {
            const response = await this.llmClient.chat.completions.create({
                ...queryConfig,
                messages: [
                    {
                        role: "system",
                        content: prompt,
                    },
                ],
            });
            const res = response.choices[0].message?.content?.trim() || "{}";
            return JSON.parse(res).reviews;
        }
        catch (error) {
            console.error("Error:", error);
            return null;
        }
    }
    async generateReviewComments(parsedDiff, prDetails) {
        const comments = [];
        for (const file of parsedDiff) {
            if (file.to === "/dev/null")
                continue; // Ignore deleted files
            for (const chunk of file.chunks) {
                const prompt = this.createPrompt(file, chunk, prDetails);
                const aiResponse = await this.getAIResponse(prompt);
                if (aiResponse) {
                    const newComments = this.parseComment(file, chunk, aiResponse);
                    if (newComments) {
                        comments.push(...newComments);
                    }
                }
            }
        }
        return comments;
    }
    parseComment(file, chunk, aiResponses) {
        return aiResponses.flatMap((aiResponse) => {
            if (!file.to) {
                return [];
            }
            return {
                body: aiResponse.reviewComment,
                path: file.to,
                line: Number(aiResponse.lineNumber),
            };
        });
    }
}
