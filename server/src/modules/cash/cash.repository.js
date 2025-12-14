// server/src/modules/cash/cash.repository.js
const { run, get, all } = require("../../db/connection");

function buildPeriodCondition(columnExpr, mode, date) {
    const m = String(mode || "day").toLowerCase();

    if (m === "week") {
        return {
            clause: `${columnExpr} >= date(?, '-6 day') AND ${columnExpr} <= date(?)`,
            params: [date, date],
        };
    }
    if (m === "month") {
        return {
            clause: `strftime('%Y-%m', ${columnExpr}) = strftime('%Y-%m', ?)`,
            params: [date],
        };
    }
    if (m === "year") {
        return {
            clause: `strftime('%Y', ${columnExpr}) = strftime('%Y', ?)`,
            params: [date],
        };
    }
    return { clause: `${columnExpr} = ?`, params: [date] };
}

async function createEntry({ cash_date, branch_id, amount, note, created_by }) {
    const r = await run(
        `
      INSERT INTO cash_entries (cash_date, branch_id, amount, note, created_by)
      VALUES (?, ?, ?, ?, ?)
    `,
        [cash_date, branch_id, amount, note || null, created_by || null]
    );

    const row = await get(`SELECT * FROM cash_entries WHERE id = ?`, [r.lastID]);
    return row;
}

async function remove(id) {
    return run(`DELETE FROM cash_entries WHERE id = ?`, [id]);
}

async function list({ date, mode, branchType, branchId, limit = 200, offset = 0 }) {
    const cond = buildPeriodCondition("ce.cash_date", mode, date);

    const params = [...cond.params];
    let where = `WHERE ${cond.clause}`;

    if (branchType) {
        where += ` AND UPPER(IFNULL(b.branch_type,'BRANCH')) = ?`;
        params.push(String(branchType).toUpperCase());
    }

    if (branchId) {
        where += ` AND ce.branch_id = ?`;
        params.push(branchId);
    }

    params.push(limit, offset);

    const rows = await all(
        `
      SELECT
        ce.*,
        b.name AS branch_name,
        UPPER(IFNULL(b.branch_type,'BRANCH')) AS branch_type,
        u.full_name AS created_by_name
      FROM cash_entries ce
      JOIN branches b ON b.id = ce.branch_id
      LEFT JOIN users u ON u.id = ce.created_by
      ${where}
      ORDER BY ce.cash_date DESC, ce.id DESC
      LIMIT ? OFFSET ?
    `,
        params
    );

    return rows;
}

async function summary({ date, mode, branchType, branchId }) {
    const salesCond = buildPeriodCondition("s.sale_date", mode, date);
    const cashCond = buildPeriodCondition("ce.cash_date", mode, date);

    // per-branch summary
    const params = [...salesCond.params, ...cashCond.params];
    let branchWhere = `WHERE b.is_active = 1`;

    if (branchType) {
        branchWhere += ` AND UPPER(IFNULL(b.branch_type,'BRANCH')) = ?`;
        params.push(String(branchType).toUpperCase());
    }
    if (branchId) {
        branchWhere += ` AND b.id = ?`;
        params.push(branchId);
    }

    const byBranch = await all(
        `
      WITH
      period_sales AS (
        SELECT branch_id, IFNULL(SUM(total_amount),0) AS sales_amount_period
        FROM sales s
        WHERE ${salesCond.clause}
        GROUP BY branch_id
      ),
      all_sales AS (
        SELECT branch_id, IFNULL(SUM(total_amount),0) AS sales_amount_all
        FROM sales
        GROUP BY branch_id
      ),
      period_cash AS (
        SELECT branch_id,
          IFNULL(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END),0) AS cash_in_period,
          IFNULL(SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END),0) AS cash_out_period,
          IFNULL(SUM(amount),0) AS cash_net_period
        FROM cash_entries ce
        WHERE ${cashCond.clause}
        GROUP BY branch_id
      ),
      all_cash AS (
        SELECT branch_id,
          IFNULL(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END),0) AS cash_in_all,
          IFNULL(SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END),0) AS cash_out_all,
          IFNULL(SUM(amount),0) AS cash_net_all
        FROM cash_entries
        GROUP BY branch_id
      )
      SELECT
        b.id AS branch_id,
        b.name AS branch_name,
        UPPER(IFNULL(b.branch_type,'BRANCH')) AS branch_type,

        IFNULL(ps.sales_amount_period,0) AS sales_amount_period,
        IFNULL(pc.cash_in_period,0) AS cash_in_period,
        IFNULL(pc.cash_out_period,0) AS cash_out_period,

        IFNULL(asl.sales_amount_all,0) AS sales_amount_all,
        IFNULL(ac.cash_in_all,0) AS cash_in_all,
        IFNULL(ac.cash_out_all,0) AS cash_out_all,

        -- ✅ CURRENT: sotuvlar + qo‘lda kirim - admin olgan pul
        (IFNULL(asl.sales_amount_all,0) + IFNULL(ac.cash_in_all,0) - IFNULL(ac.cash_out_all,0)) AS current_amount
      FROM branches b
      LEFT JOIN period_sales ps ON ps.branch_id = b.id
      LEFT JOIN all_sales asl ON asl.branch_id = b.id
      LEFT JOIN period_cash pc ON pc.branch_id = b.id
      LEFT JOIN all_cash ac ON ac.branch_id = b.id
      ${branchWhere}
      ORDER BY current_amount DESC
    `,
        params
    );

    // totals (admin summary card uchun)
    const totals = byBranch.reduce(
        (acc, r) => {
            acc.sales_amount_period += Number(r.sales_amount_period || 0);
            acc.cash_in_period += Number(r.cash_in_period || 0);
            acc.cash_out_period += Number(r.cash_out_period || 0);
            acc.current_amount += Number(r.current_amount || 0);
            return acc;
        },
        { sales_amount_period: 0, cash_in_period: 0, cash_out_period: 0, current_amount: 0 }
    );

    return { totals, byBranch };
}

module.exports = {
    createEntry,
    remove,
    list,
    summary,
};
