const rankJobsCore = require("./lib/rankJobsCore");

module.exports = async function (context, req) {
  try {
    const jobs = req.body;

    const ranked = await rankJobsCore(jobs);

    context.res = {
      status: 200,
      body: ranked
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