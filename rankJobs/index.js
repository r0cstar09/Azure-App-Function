const axios = require("axios");

module.exports = async function (context, req) {
  try {
    const ENDPOINT = "https://r0cst-mj4pr9nd-eastus2.cognitiveservices.azure.com";
    const DEPLOYMENT = "gpt-5.2-chat"; // NOT the resource name
    const API_KEY = "REDACTED_REPLACE_AFTER_ROTATION";

    const response = await axios.post(
      `${ENDPOINT}/openai/deployments/${DEPLOYMENT}/chat/completions?api-version=2024-02-15-preview`,
      {
        messages: [
          {
            role: "system",
            content:
              "Score a cybersecurity job from 0–10. Return JSON only: {\"score\": number, \"reason\": string}"
          },
          {
            role: "user",
            content: "Senior SOC Analyst role requiring SIEM, IR, cloud security."
          }
        ],
        temperature: 0.2
      },
      {
        headers: {
          "api-key": API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    context.res = {
      status: 200,
      body: response.data.choices[0].message.content
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