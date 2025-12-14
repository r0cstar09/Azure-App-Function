const axios = require("axios");

const SYSTEM_PROMPT = `
Take my original resume and ignore the information that talks about all of the duties i had in the job. Instead use my job title and figure out how someone with that job title would have the experience in the things that are wanted in the job description. That way you can show how the previous experience meets what they want in the job description but stay within the confines of what someone in that position that I was in would typically do. Basically I want to show them i can do the job they want without outright lying about what I've done.  You can take more liberties when talking about the Incident response role at Cisco because I would’ve worked with different clients there so you can talk about participating in the stuff thats in the job description as a team member but do not specify that I used specific tools in that role or in any SOC analyst role. Adapt the words in the job description so that you do not outright lie about tool experience but you make it seem as though it would be easy for me to learn that tool. So for example if the job description mentions Splunk then don’t say I used splunk but imply that I would be able to use it. For the city of St. John’s our firewalls are cisco ftd’s and we use the fmc to manage it all from Cisco. Our EDR is Secure Endpoint. Our SIEM is Wazuh at the city of St. John’s and we use a hybrid set up of on-prem Active Directory but we have a Microsoft 365 Firewall. Our WAF is Barracuda.  
Rules:
- Use ONLY information present in the resume.
- Do NOT invent experience, companies, titles, or skills.
- Tailor language to the job description.
- Be concise and professional.
- Output JSON ONLY.
`;

const RESUME_URL =
  "https://jobhuntresumes.blob.core.windows.net/resumes/master-resume.md?sp=r&st=2025-12-14T03:53:58Z&se=2026-12-13T12:08:58Z&spr=https&sv=2024-11-04&sr=b&sig=XhcXabP%2Bb1Sg4Mi2mNkN3zFOIw3eXYtj2IUEmtVin%2B4%3D";

module.exports = async function (context, req) {
  try {
    const { job } = req.body;
    if (!job) throw new Error("Expected { job } in request body");

    // 1. Fetch master resume from Blob
    const resumeResponse = await axios.get(RESUME_URL);
    const resumeText = resumeResponse.data;

    // 2. Azure OpenAI config (env vars)
    const endpoint = "https://r0cst-mj4pr9nd-eastus2.cognitiveservices.azure.com";
    const apiKey = "DZx3inHSdU0wGU29sqrUW8VokGZRqoVBFGjYzPpBj1WKFCg7ylNTJQQJ99BLACHYHv6XJ3w3AAAAACOGKJvI";
    const deployment = "gpt-5.2-chat";

    if (!endpoint || !apiKey || !deployment) {
      throw new Error("Missing Azure OpenAI configuration");
    }

    // 3. Build prompt
    const userPrompt = `
MASTER RESUME:
${resumeText}

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}

Description:
${job.description}

TASK:
1. Produce a tailored resume as concise bullet points.
2. Produce a role-specific cover letter (max 1 page).

Return JSON exactly in this format:
{
  "tailored_resume": [ "bullet", "bullet", "bullet" ],
  "cover_letter": "text"
}
`;

    // 4. Call Azure OpenAI
    const response = await axios.post(
      `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`,
      {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
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

    const output = JSON.parse(
      response.data.choices[0].message.content
    );

    context.res = {
      status: 200,
      body: output
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