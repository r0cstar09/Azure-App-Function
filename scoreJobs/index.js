module.exports = async function (context, req) {
  try {
    const jobs = req.body?.results;

    if (!Array.isArray(jobs)) {
      throw new Error("Expected req.body.results to be an array");
    }

    const normalized = jobs.map(job => ({
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

    context.res = {
      status: 200,
      body: normalized
    };
  } catch (err) {
    context.res = {
      status: 500,
      body: {
        error: err.message
      }
    };
  }
};