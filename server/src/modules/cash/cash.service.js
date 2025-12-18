// server/src/modules/cash/cash.service.js
const repo = require("./cash.repository");

async function list(tenantId, params) {
    return repo.list({ tenantId, ...params });
}

/**
 * Current hisob:
 * current = SUM(sales.total_amount) + SUM(cash_entries.amount)
 *  - sales: sotuvdan tushgan pul (auto IN)
 *  - cash_entries: admin OUT => minus, manual IN => plus
 */
async function summary(tenantId, params) {
    return repo.summary({ tenantId, ...params });
}

async function cashOut(tenantId, { branch_id, amount, cash_date, note, created_by }) {
    // minus yozamiz
    return repo.createEntry({
        tenant_id: tenantId,
        cash_date,
        branch_id,
        amount: -Math.abs(amount),
        note,
        created_by,
    });
}

async function cashIn(tenantId, { branch_id, amount, cash_date, note, created_by }) {
    return repo.createEntry({
        tenant_id: tenantId,
        cash_date,
        branch_id,
        amount: Math.abs(amount),
        note,
        created_by,
    });
}

async function remove(tenantId, id) {
    return repo.remove(tenantId, id);
}

module.exports = {
    list,
    summary,
    cashOut,
    cashIn,
    remove,
};
