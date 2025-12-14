const fs = require("fs");
const path = require("path");

// === IMPORT PIPELINE STEPS ===
// These MUST be plain functions, NOT Azure HTTP handlers
const fetchJobs = require("../fetchJobs");
const scoreJobs = require("../scoreJobs");
const rankJobs = require("../rankJobs");
const generateApplication = require("../generateApplication");

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

    // === SCORE ===
    context.log("[STEP] Scoring jobs");
    const scored = await scoreJobs(jobs);

    // === RANK ===
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
      const outFile = path.join(jobDir, "application.md");

      ensureDir(jobDir);

      if (fs.existsSync(outFile)) {
        context.log(`[SKIP] Exists: ${company}/${title}`);
        continue;
      }

      context.log(`[GEN] ${job.title} @ ${job.company}`);

      try {
        const markdown = await generateApplication(job);
        fs.writeFileSync(outFile, markdown, "utf8");
        context.log(`[OK] Saved ${company}/${title}/application.md`);
      } catch (err) {
        context.log.error(
          `[FAIL] Generate for ${job.title} @ ${job.company}: ${err.message}`
        );
      }
    }

    context.log(`[DONE] Orchestrator completed at ${new Date().toISOString()}`);
  } catch (err) {
    context.log.error("[FATAL] Orchestrator crashed:", err);
    throw err; // marks invocation as failed in Azure
  }
};