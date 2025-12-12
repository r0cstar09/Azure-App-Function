const axios = require("axios");

module.exports = async function (context, req) {
  try {
    const ADZUNA_ID = process.env.ADZUNA_APP_ID;
    const ADZUNA_KEY = process.env.ADZUNA_APP_KEY;

    if (!ADZUNA_ID || !ADZUNA_KEY) {
      throw new Error("Missing Adzuna credentials");
    }

    const query = req.query.q || "developer";

    const url =
      `https://api.adzuna.com/v1/api/jobs/ca/search/1` +
      `?app_id=${ADZUNA_ID}` +
      `&app_key=${ADZUNA_KEY}` +
      `&what=${encodeURIComponent(query)}`;

    const response = await axios.get(url);

    context.res = {
      status: 200,
      body: response.data
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