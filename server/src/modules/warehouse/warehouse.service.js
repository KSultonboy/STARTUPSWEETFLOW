const repo = require('./warehouse.repository');

async function getCurrentStock(tenantId, branchId) {
    const stock = await repo.getCurrentStock(tenantId, branchId);
    return stock;
}

module.exports = {
    getCurrentStock,
};
