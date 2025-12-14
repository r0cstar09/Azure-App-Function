const generateApplicationCore = require("./lib/generateApplicationCore");

module.exports = async function (context, req) {
  try {
    const job = req.body?.job ?? req.body;

    const markdown = await generateApplicationCore(job);

    context.res = {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8"
      },
      body: markdown
    };
  } catch (err) {
    context.res = {
      status: 500,
      body: {
        error: err.message,
        details: err.response?.data || null
      }
    };
  }
};