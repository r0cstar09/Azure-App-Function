// scorejobs/index.js

const scoreJobsCore = require("../lib/scoreJobsCore");

module.exports = async function (context, req) {
  try {
    const jobs = req.body?.results;

    const normalized = await scoreJobsCore(jobs);

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