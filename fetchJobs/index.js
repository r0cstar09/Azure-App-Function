const axios = require("axios");

module.exports = async function (context, req) {
    const { query } = req.query;

    const ADZUNA_ID = process.env.ADZUNA_APP_ID;
    const ADZUNA_KEY = process.env.ADZUNA_APP_KEY;

    const url = `https://api.adzuna.com/v1/api/jobs/ca/search/1?app_id=${ADZUNA_ID}&app_key=${ADZUNA_KEY}&results_per_page=20&what=${encodeURIComponent(query)}`;

    try {
        const response = await axios.get(url);
        context.res = {
            status: 200,
            body: response.data
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: { error: error.message }
        };
    }
};