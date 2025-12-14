const axios = require("axios");

/* =========================
   HARD-CODED SECRETS
   ========================= */
const AZURE_OPENAI_ENDPOINT =
  "https://r0cst-mj4pr9nd-eastus2.cognitiveservices.azure.com";

const AZURE_OPENAI_KEY =
  "DZx3inHSdU0wGU29sqrUW8VokGZRqoVBFGjYzPpBj1WKFCg7ylNTJQQJ99BLACHYHv6XJ3w3AAAAACOGKJvI";

const AZURE_OPENAI_DEPLOYMENT =
  "gpt-5.2-chat";

/* ========================= */

const SYSTEM_PROMPT = `
Take my original resume and ignore the information that talks about all of the duties I had in the job.
Instead, use my job titles and infer the type of experience someone in that role would typically have,
aligned to the job description.

Rules:
- Use ONLY information present in the resume.
- Do NOT invent companies, roles, tools, or experience.
- You may rephrase responsibilities to align with the job description.
- Do NOT claim direct experience with tools unless explicitly listed.
- Be concise, professional, and realistic.
`;

const RESUME_URL =
  "https://jobhuntresumes.blob.core.windows.net/resumes/master-resume.md";

module.exports = async function (context, req) {
  try {
    /* --------------------------------
       1. Normalize input payload
    --------------------------------- */
    const job = req.body?.job ?? req.body;

    if (!job || !job.title || !job.description) {
      throw new Error("Invalid job payload");
    }

    const normalizedJob = {
      title: job.title,
      company: job.company || "Unknown Company",
      location: job.location || "N/A",
      description: job.description
    };

    /* --------------------------------
       2. Fetch master resume
    --------------------------------- */
    const resumeResponse = await axios.get(RESUME_URL);
    const resumeText = resumeResponse.data;

    /* --------------------------------
       3. Build prompt (MARKDOWN output)
    --------------------------------- */
    const userPrompt = `
MASTER RESUME:
${resumeText}

JOB POSTING:
Title: ${normalizedJob.title}
Company: ${normalizedJob.company}
Location: ${normalizedJob.location}

Description:
${normalizedJob.description}

TASK:
Return a SINGLE Markdown document (no JSON, no code blocks) with:

# Tony Muzo
629 King Street West, Toronto, ON M5V 0G9  
437-962-8228 | tony@tonymuzo.dev | tonymuzo.dev

## Summary
(3–4 lines tailored to this role)

## Skills
(8–12 concise bullets aligned to the job)

## Professional Experience
For each role in the resume:
- Company | Title | Location | Dates
- 3–6 tailored bullets per role

## Certifications
(List exactly as in the resume)

## Competitions & Achievements
(Include only if present)

---

## Cover Letter
(Max 1 page, tailored)
`;

    /* --------------------------------
       4. Call Azure OpenAI
    --------------------------------- */
    const response = await axios.post(
      `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-02-15-preview`,
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
          "api-key": AZURE_OPENAI_KEY
        }
      }
    );

    /* --------------------------------
       5. Return Markdown directly
    --------------------------------- */
    const markdown = response.data.choices[0].message.content;

    context.res = {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8"
      },
      body: markdown
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