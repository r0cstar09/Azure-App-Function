const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { marked } = require("marked");

// === IMPORT CORE PIPELINE STEPS (NOT HTTP FUNCTIONS) ===
const fetchJobs = require("../fetchJobs/lib/fetchJobsCore");
const scoreJobs = require("../scoreJobs/lib/scoreJobsCore");
const rankJobs = require("../rankJobs/lib/rankJobsCore");
const generateApplication = require("../generateApplication/lib/generateApplicationCore");

// === CONFIG ===
const SCORE_THRESHOLD = 3;
const OUTPUT_DIR = path.join(__dirname, "..", "applications");

// === HELPERS ===
function safeName(str = "") {
  return (
    str
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
      .replace(/\s+/g, "_")
      .trim() || "Unknown"
  );
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function markdownToPdf(markdown, pdfPath) {
  const html = `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                       Roboto, Helvetica, Arial, sans-serif;
          padding: 40px;
          line-height: 1.5;
          color: #111;
        }
        h1 { font-size: 28px; }
        h2 { font-size: 22px; margin-top: 1.2em; }
        h3 { font-size: 18px; margin-top: 1em; }
        ul { margin-left: 20px; }
      </style>
    </head>
    <body>
      ${marked.parse(markdown)}
    </body>
  </html>
  `;

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  await page.pdf({
    path: pdfPath,
    format: "A4",
    margin: { top: "20mm", bottom: "20mm", left: "20mm", right: "20mm" }
  });

  await browser.close();
}

// === ORCHESTRATOR ===
module.exports = async function (context, myTimer) {
  const startTs = new Date().toISOString();
  context.log(`[START] Orchestrator fired at ${startTs}`);

  if (myTimer?.IsPastDue) {
    context.log.warn("[WARN] Timer is past due");
  }

  try {
    // === FETCH ===
    context.log("[STEP] Fetching jobs");
    const jobs = await fetchJobs();
    context.log(`[INFO] Fetched ${jobs.length} jobs`);

    if (!jobs.length) {
      context.log("[INFO] No jobs found, exiting.");
      return;
    }

    // === SCORE (NORMALIZE) ===
    context.log("[STEP] Scoring jobs");
    const scored = await scoreJobs(jobs);

    // === RANK (AI SCORING) ===
    context.log("[STEP] Ranking jobs");
    const ranked = await rankJobs(scored);

    const shortlisted = ranked.filter(j => j.score > SCORE_THRESHOLD);
    context.log(
      `[INFO] ${shortlisted.length} jobs above threshold (${SCORE_THRESHOLD})`
    );

    // === GENERATE APPLICATIONS ===
    for (const job of shortlisted) {
      const company = safeName(job.company);
      const title = safeName(job.title);

      const companyDir = path.join(OUTPUT_DIR, company);
      const jobDir = path.join(companyDir, title);
      const mdFile = path.join(jobDir, "application.md");
      const pdfFile = path.join(jobDir, "application.pdf");

      ensureDir(jobDir);

      if (fs.existsSync(mdFile) && fs.existsSync(pdfFile)) {
        context.log(`[SKIP] Exists: ${company}/${title}`);
        continue;
      }

      context.log(`[GEN] ${job.title} @ ${job.company}`);

      try {
        let markdown;

        if (!fs.existsSync(mdFile)) {
          markdown = await generateApplication(job);
          fs.writeFileSync(mdFile, markdown, "utf8");
          context.log("[OK] Markdown saved");
        } else {
          markdown = fs.readFileSync(mdFile, "utf8");
        }

        if (!fs.existsSync(pdfFile)) {
          await markdownToPdf(markdown, pdfFile);
          context.log("[OK] PDF saved");
        }

      } catch (err) {
        context.log.error(
          `[FAIL] ${job.title} @ ${job.company}: ${err.message}`
        );
      }
    }

    context.log(`[DONE] Orchestrator completed at ${new Date().toISOString()}`);
  } catch (err) {
    context.log.error("[FATAL] Orchestrator crashed:", err);
    throw err;
  }
};const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { marked } = require("marked");

// === IMPORT CORE PIPELINE STEPS (NOT HTTP FUNCTIONS) ===
const fetchJobs = require("../fetchJobs/lib/fetchJobsCore");
const scoreJobs = require("../scoreJobs/lib/scoreJobsCore");
const rankJobs = require("../rankJobs/lib/rankJobsCore");
const generateApplication = require("../generateApplication/lib/generateApplicationCore");

// === CONFIG ===
const SCORE_THRESHOLD = 3;
const OUTPUT_DIR = path.join(__dirname, "..", "applications");

// === HELPERS ===
function safeName(str = "") {
  return (
    str
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
      .replace(/\s+/g, "_")
      .trim() || "Unknown"
  );
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function markdownToPdf(markdown, pdfPath) {
  const html = `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                       Roboto, Helvetica, Arial, sans-serif;
          padding: 40px;
          line-height: 1.5;
          color: #111;
        }
        h1 { font-size: 28px; }
        h2 { font-size: 22px; margin-top: 1.2em; }
        h3 { font-size: 18px; margin-top: 1em; }
        ul { margin-left: 20px; }
      </style>
    </head>
    <body>
      ${marked.parse(markdown)}
    </body>
  </html>
  `;

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  await page.pdf({
    path: pdfPath,
    format: "A4",
    margin: { top: "20mm", bottom: "20mm", left: "20mm", right: "20mm" }
  });

  await browser.close();
}

// === ORCHESTRATOR ===
module.exports = async function (context, myTimer) {
  const startTs = new Date().toISOString();
  context.log(`[START] Orchestrator fired at ${startTs}`);

  if (myTimer?.IsPastDue) {
    context.log.warn("[WARN] Timer is past due");
  }

  try {
    // === FETCH ===
    context.log("[STEP] Fetching jobs");
    const jobs = await fetchJobs();
    context.log(`[INFO] Fetched ${jobs.length} jobs`);

    if (!jobs.length) {
      context.log("[INFO] No jobs found, exiting.");
      return;
    }

    // === SCORE (NORMALIZE) ===
    context.log("[STEP] Scoring jobs");
    const scored = await scoreJobs(jobs);

    // === RANK (AI SCORING) ===
    context.log("[STEP] Ranking jobs");
    const ranked = await rankJobs(scored);

    const shortlisted = ranked.filter(j => j.score > SCORE_THRESHOLD);
    context.log(
      `[INFO] ${shortlisted.length} jobs above threshold (${SCORE_THRESHOLD})`
    );

    // === GENERATE APPLICATIONS ===
    for (const job of shortlisted) {
      const company = safeName(job.company);
      const title = safeName(job.title);

      const companyDir = path.join(OUTPUT_DIR, company);
      const jobDir = path.join(companyDir, title);
      const mdFile = path.join(jobDir, "application.md");
      const pdfFile = path.join(jobDir, "application.pdf");

      ensureDir(jobDir);

      if (fs.existsSync(mdFile) && fs.existsSync(pdfFile)) {
        context.log(`[SKIP] Exists: ${company}/${title}`);
        continue;
      }

      context.log(`[GEN] ${job.title} @ ${job.company}`);

      try {
        let markdown;

        if (!fs.existsSync(mdFile)) {
          markdown = await generateApplication(job);
          fs.writeFileSync(mdFile, markdown, "utf8");
          context.log("[OK] Markdown saved");
        } else {
          markdown = fs.readFileSync(mdFile, "utf8");
        }

        if (!fs.existsSync(pdfFile)) {
          await markdownToPdf(markdown, pdfFile);
          context.log("[OK] PDF saved");
        }

      } catch (err) {
        context.log.error(
          `[FAIL] ${job.title} @ ${job.company}: ${err.message}`
        );
      }
    }

    context.log(`[DONE] Orchestrator completed at ${new Date().toISOString()}`);
  } catch (err) {
    context.log.error("[FATAL] Orchestrator crashed:", err);
    throw err;
  }
};