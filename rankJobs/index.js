const axios = require("axios");

const SYSTEM_PROMPT = `
You are scoring job postings for a cybersecurity professional.
Score each job from 0 to 10 based on overall fit.
Return JSON ONLY in this format:
{ "score": number, "reason": string }
`;

module.exports = async function (context, req) {
  try {
    const jobs = req.body;

    if (!Array.isArray(jobs)) {
      throw new Error("Expected array of normalized jobs");
    }

    const endpoint = "https://r0cst-mj4pr9nd-eastus2.cognitiveservices.azure.com";
    const apiKey = "DZx3inHSdU0wGU29sqrUW8VokGZRqoVBFGjYzPpBj1WKFCg7ylNTJQQJ99BLACHYHv6XJ3w3AAAAACOGKJvI";
    const deployment = "gpt-5.2-chat";

    if (!endpoint || !apiKey || !deployment) {
      throw new Error("Missing Azure OpenAI configuration");
    }

    const scoredJobs = [];

    for (const job of jobs) {
      const response = await axios.post(
        `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`,
        {
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description: ${job.description}
`
            }
          ],
          temperature: 1
        },
        {
          headers: {
            "Content-Type": "application/json",
            "api-key": apiKey
          }
        }
      );

      const modelOutput = JSON.parse(
        response.data.choices[0].message.content
      );

      scoredJobs.push({
        ...job,
        score: modelOutput.score,
        reason: modelOutput.reason
      });
    }

    context.res = {
      status: 200,
      body: scoredJobs
    };
  } catch (err) {
    context.res = {
      status: 500,
      body: {
        error: err.message,
        details: err.response?.data || null
      }
    };
  }
};