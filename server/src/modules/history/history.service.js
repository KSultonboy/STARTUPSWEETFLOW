// server/src/modules/history/history.service.js
const repo = require('./history.repository');

async function getActivities(filters) {
    return repo.getActivities(filters);
}

module.exports = {
    getActivities,
};
