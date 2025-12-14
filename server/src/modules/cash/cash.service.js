// server/src/modules/cash/cash.service.js
const repo = require("./cash.repository");

async function list(params) {
    return repo.list(params);
}

/**
 * Current hisob:
 * current = SUM(sales.total_amount) + SUM(cash_entries.amount)
 *  - sales: sotuvdan tushgan pul (auto IN)
 *  - cash_entries: admin OUT => minus, manual IN => plus
 */
async function summary(params) {
    return repo.summary(params);
}

async function cashOut({ branch_id, amount, cash_date, note, created_by }) {
    // minus yozamiz
    return repo.createEntry({
        cash_date,
        branch_id,
        amount: -Math.abs(amount),
        note,
        created_by,
    });
}

async function cashIn({ branch_id, amount, cash_date, note, created_by }) {
    return repo.createEntry({
        cash_date,
        branch_id,
        amount: Math.abs(amount),
        note,
        created_by,
    });
}

async function remove(id) {
    return repo.remove(id);
}

module.exports = {
    list,
    summary,
    cashOut,
    cashIn,
    remove,
};
