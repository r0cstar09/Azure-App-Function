const fs = require("fs");
const path = require("path");

/* ===============================
   IMPORT YOUR FUNCTIONS
   =============================== */
const fetchJobs = require("./fetchJobs");
const scoreJobs = require("./scoreJobs");
const rankJobs = require("./rankJobs");
const generateApplication = require("./generateApplication");

/* ===============================
   CONFIG
   =============================== */
const SCORE_THRESHOLD = 3;
const OUTPUT_DIR = path.join(__dirname, "applications");

/* ===============================
   HELPERS
   =============================== */

// sanitize for filesystem safety
function safeName(str) {
  return str
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "_")
    .trim();
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/* ===============================
   ORCHESTRATOR
   =============================== */
async function run() {
  console.log("▶ Fetching jobs...");
  const jobs = await fetchJobs();

  console.log(`▶ Scoring ${jobs.length} jobs...`);
  const scored = await scoreJobs(jobs);

  console.log("▶ Ranking jobs...");
  const ranked = await rankJobs(scored);

  const shortlisted = ranked.filter(j => j.score > SCORE_THRESHOLD);

  console.log(`▶ ${shortlisted.length} jobs above threshold (${SCORE_THRESHOLD})`);

  for (const job of shortlisted) {
    const company = safeName(job.company || "Unknown_Company");
    const title = safeName(job.title || "Unknown_Title");

    const companyDir = path.join(OUTPUT_DIR, company);
    const jobDir = path.join(companyDir, title);
    const filePath = path.join(jobDir, "application.md");

    // Ensure directories exist BEFORE checking file
    ensureDir(jobDir);

    // 🔑 EARLY SKIP — NO API CALL
    if (fs.existsSync(filePath)) {
      console.log(`↷ Skipping (already exists): ${job.title} @ ${job.company}`);
      continue;
    }

    console.log(`▶ Generating application for: ${job.title} @ ${job.company}`);

    try {
      const markdown = await generateApplication(job);

      fs.writeFileSync(filePath, markdown, "utf8");

      console.log(`✓ Saved → ${filePath}`);
    } catch (err) {
      console.error(`✗ Failed for ${job.title} @ ${job.company}`);
      console.error(err.message);
    }
  }

  console.log("✔ Orchestration complete.");
}

/* ===============================
   EXECUTE
   =============================== */
run().catch(err => {
  console.error("Fatal orchestrator error:");
  console.error(err);
});