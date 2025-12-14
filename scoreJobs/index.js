module.exports = async function (context, req) {
  try {
    const jobs = req.body;

    if (!Array.isArray(jobs)) {
      throw new Error("Expected array of job objects");
    }

    const normalized = jobs.map(job => ({
      id: job.id || null,
      redirect_url: job.redirect_url || null,
      title: job.title || "",
      company: job.company || "",
      location: job.location || "",
      salary_min: job.salary_min ?? null,
      salary_max: job.salary_max ?? null,
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
};