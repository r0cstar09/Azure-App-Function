module.exports = async function (context, req) {
  try {
    const jobs = req.body?.results;

    if (!Array.isArray(jobs)) {
      throw new Error("Expected Adzuna job results array");
    }

    const normalized = jobs.map(job => ({
      title: job.title || "",
      company: job.company?.display_name || "",
      location: job.location?.display_name || "",
      salary_min: job.salary_min || null,
      salary_max: job.salary_max || null,
      description: job.description || "",
      score: 0,
      reason: "Not scored yet"
    }));

    context.res = {
      status: 200,
      body: normalized
    };
  } catch (err) {
    context.res = {
      status: 500,
      body: { error: err.message }
    };
  }
};KEY RESPONSIBILITIES