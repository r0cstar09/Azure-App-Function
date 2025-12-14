const axios = require("axios");

const SYSTEM_PROMPT = `
You are scoring job postings for a cybersecurity professional.

Rules:
- Score from 0 to 10 (integer only)
- Be concise and factual
- Return ONLY valid JSON
- No markdown
- No explanations outside JSON

Required format:
{ "score": number, "reason": string }
`;

module.exports = async function rankJobsCore(jobs) {
  if (!Array.isArray(jobs)) {
    throw new Error("Expected array of normalized jobs");
  }

  // HARD-CODED SECRETS (as requested)
  const endpoint = "https://r0cst-mj4pr9nd-eastus2.cognitiveservices.azure.com";
  const apiKey = "DZx3inHSdU0wGU29sqrUW8VokGZRqoVBFGjYzPpBj1WKFCg7ylNTJQQJ99BLACHYHv6XJ3w3AAAAACOGKJvI";
  const deployment = "gpt-5.2-chat";

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

Description:
${job.description}
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

    const raw = response.data.choices[0].message.content.trim();

    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}") + 1;

    if (start === -1 || end === -1) {
      throw new Error("Model did not return valid JSON");
    }

    const parsed = JSON.parse(raw.slice(start, end));

    scoredJobs.push({
      ...job,
      score: parsed.score,
      reason: parsed.reason
    });
  }

  return scoredJobs;
};