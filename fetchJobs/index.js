const fetchJobsCore = require("../lib/fetchJobsCore");

module.exports = async function (context, req) {
  try {
    const jobs = await fetchJobsCore();

    context.res = {
      status: 200,
      body: jobs
    };
  } catch (err) {
    context.res = {
      status: 500,
      body: { error: err.message }
    };
  }
};