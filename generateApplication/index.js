const axios = require("axios");

const SYSTEM_PROMPT = `
You are a senior technical recruiter and cybersecurity hiring manager.

Take my original resume and ignore the information that talks about all of the duties I had in the job.
Instead, use my job title and infer how someone with that job title would reasonably have experience
aligned to the job description.

Rules:
- Use ONLY information present in the resume.
- Do NOT invent experience, companies, titles, dates, or certifications.
- You may rephrase responsibilities to better align with the job description.
- Do NOT explicitly claim use of tools unless they appear in the resume.
- If a tool is mentioned in the job description, imply familiarity without false claims.
- Be concise, professional, and realistic.
`;

const RESUME_URL =
  "https://jobhuntresumes.blob.core.windows.net/resumes/master-resume.md?sp=r&st=2025-12-14T03:53:58Z&se=2026-12-13T12:08:58Z&spr=https&sv=2024-11-04&sr=b&sig=XhcXabP%2Bb1Sg4Mi2mNkN3zFOIw3eXYtj2IUEmtVin%2B4%3D";

module.exports = async function (context, req) {
  try {
    const { job } = req.body;
    if (!job) throw new Error("Expected { job } in request body");

    // 1. Fetch master resume
    const resumeResponse = await axios.get(RESUME_URL);
    const resumeText = resumeResponse.data;

    // 2. Azure OpenAI config
    const endpoint =
      "https://r0cst-mj4pr9nd-eastus2.cognitiveservices.azure.com";
    const apiKey =
      "DZx3inHSdU0wGU29sqrUW8VokGZRqoVBFGjYzPpBj1WKFCg7ylNTJQQJ99BLACHYHv6XJ3w3AAAAACOGKJvI";
    const deployment = "gpt-5.2-chat";

    if (!endpoint || !apiKey || !deployment) {
      throw new Error("Missing Azure OpenAI configuration");
    }

    // 3. Prompt (MARKDOWN OUTPUT ONLY)
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
Return a SINGLE Markdown document (NO JSON, NO code blocks) with the following structure:

# Tony Muzo
Toronto, ON | tony@tonymuzo.dev | 437-962-8228 | https://tonymuzo.dev

## Professional Summary
(3–4 concise lines tailored to the role)

## Core Skills
(8–12 bullet points, realistic and aligned to the job)

## Professional Experience
For EACH role in the master resume:
- Company | Title | Location | Dates
- 3–6 bullet points tailored to the job description

## Certifications
(List exactly as in the master resume)

---

## Cover Letter
(Max 1 page, tailored to the role)

IMPORTANT:
- Use ONLY facts present in the master resume
- Do NOT fabricate tools, employers, or experience
- Output MUST be valid Markdown
`;

    // 4. Call Azure OpenAI
    const response = await axios.post(
      `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`,
      {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 1,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey
        }
      }
    );

    // 5. RETURN MARKDOWN DIRECTLY
    const markdownOutput = response.data.choices[0].message.content;

    context.res = {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8"
      },
      body: markdownOutput
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