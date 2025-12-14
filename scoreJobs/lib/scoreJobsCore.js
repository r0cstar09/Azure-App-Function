// lib/scoreJobsCore.js

module.exports = async function scoreJobsCore(jobs) {
  if (!Array.isArray(jobs)) {
    throw new Error("Expected jobs to be an array");
  }

  return jobs.map(job => ({
    id: job.id,
    title: job.title || "",
    company: job.company?.display_name || "",
    location: job.location?.display_name || "",
    salary_min: job.salary_min ?? null,
    salary_max: job.salary_max ?? null,
    description: job.description || "",
    redirect_url: job.redirect_url || "",
    created: job.created || "",
    score: 0,
    reason: "Not scored yet"
  }));
};