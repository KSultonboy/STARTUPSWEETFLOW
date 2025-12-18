// server/src/modules/reports/reports.service.js
const repo = require('./reports.repository');

async function getOverview(tenantId, date, mode = 'day') {
    const overview = await repo.getOverview(tenantId, date, mode);
    return overview;
}

module.exports = {
    getOverview,
};
