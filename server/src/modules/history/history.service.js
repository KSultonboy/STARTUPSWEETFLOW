// server/src/modules/history/history.service.js
const repo = require('./history.repository');

async function getActivities(tenantId, filters) {
    return repo.getActivities({ tenantId, ...filters });
}

module.exports = {
    getActivities,
};
