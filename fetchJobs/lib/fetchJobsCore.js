const axios = require("axios");

module.exports = async function fetchJobsCore() {
  // HARD-CODED SECRETS (as requested)
  const ADZUNA_ID = "4932376e";
  const ADZUNA_KEY = "da19c3e0f2a2b74a51b6f8ca2a2ff545";

  const query = "cyber security";

  const url =
    "https://api.adzuna.com/v1/api/jobs/ca/search/1" +
    `?app_id=${ADZUNA_ID}` +
    `&app_key=${ADZUNA_KEY}` +
    `&what=${encodeURIComponent(query)}` +
    `&max_days_old=30` +
    `&results_per_page=50`;

  const response = await axios.get(url);

  // IMPORTANT: return the data
  return response.data.results;
};