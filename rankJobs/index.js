const axios = require("axios");

const SYSTEM_PROMPT = `
You are scoring job postings for a cybersecurity professional transitioning into B2B sales.
Score each job from 0–10 based on overall fit.
Return JSON ONLY as: { "score": number, "reason": string }.
`;

module.exports = async function (context, req) {
  try {
    const jobs = req.body;
    if (!Array.isArray(jobs)) throw new Error("Expected array of normalized jobs");

    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

    if (!endpoint || !apiKey || !deployment) {
      throw new Error("Missing Azure OpenAI configuration");
    }

    const scored = [];
    for (const job of jobs) {
      const userContent = JSON.stringify({
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description
      });

      const res = await axios.post(
        `${endpoint}openai/deployments/${deployment}/chat/completions?api-version=2024-06-01`,
        {
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userContent }
          ],
          temperature: 0.2
        },
        { headers: { "api-key": apiKey } }
      );

      const parsed = JSON.parse(res.data.choices[0].message.content);
      scored.push({ ...job, score: parsed.score, reason: parsed.reason });
    }

    context.res = { status: 200, body: scored };
  } catch (err) {
    context.res = { status: 500, body: { error: err.message } };
  }
};