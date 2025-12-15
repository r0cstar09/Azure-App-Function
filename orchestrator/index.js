const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

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

function markdownToDocx(mdPath, docxPath) {
  return new Promise((resolve, reject) => {
    execFile(
      "pandoc",
      [mdPath, "-o", docxPath],
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(stderr || err.message));
        } else {
          resolve();
        }
      }
    );
  });
}

// === ORCHESTRATOR ===
module.exports = async function (context, myTimer) {
  context.log(`[START] Orchestrator fired at ${new Date().toISOString()}`);

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

    // === SCORE ===
    context.log("[STEP] Scoring jobs");
    const scored = await scoreJobs(jobs);

    // === RANK ===
    context.log("[STEP] Ranking jobs");
    const ranked = await rankJobs(scored);

    const shortlisted = ranked.filter(j => j.score > SCORE_THRESHOLD);
    context.log(`[INFO] ${shortlisted.length} jobs above threshold`);

    for (const job of shortlisted) {
      const company = safeName(job.company);
      const title = safeName(job.title);

      const jobDir = path.join(OUTPUT_DIR, company, title);
      const mdFile = path.join(jobDir, "application.md");
      const docxFile = path.join(jobDir, "application.docx");

      ensureDir(jobDir);

      if (fs.existsSync(mdFile) && fs.existsSync(docxFile)) {
        context.log(`[SKIP] Exists: ${company}/${title}`);
        continue;
      }

      context.log(`[GEN] ${job.title} @ ${job.company}`);

      // --- Generate Markdown ---
      if (!fs.existsSync(mdFile)) {
        const markdown = await generateApplication(job);
        fs.writeFileSync(mdFile, markdown, "utf8");
        context.log("[OK] Markdown saved");
      }

      // --- Convert to DOCX ---
      if (!fs.existsSync(docxFile)) {
        await markdownToDocx(mdFile, docxFile);
        context.log("[OK] DOCX saved");
      }
    }

    context.log(`[DONE] Orchestrator completed`);
  } catch (err) {
    context.log.error("[FATAL] Orchestrator crashed:", err);
    throw err;
  }
};