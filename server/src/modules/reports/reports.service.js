// server/src/modules/reports/reports.service.js
const repo = require('./reports.repository');

async function getOverview(date, mode = 'day') {
    const overview = await repo.getOverview(date, mode);
    return overview;
}

module.exports = {
    getOverview,
};
