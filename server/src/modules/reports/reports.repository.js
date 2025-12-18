// server/src/modules/reports/reports.repository.js
const { get, all } = require("../../db/connection");

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

  return {
    clause: `${columnExpr} = ?`,
    params: [date],
  };
}

async function getOverview(tenantId, date, mode = "day") {
  if (!tenantId) {
    throw new Error("tenantId is required for reports");
  }

  // 1) Filiallar (oddiy branchlar)
  const branchesRow = await get(
    `
      SELECT COUNT(*) AS total
      FROM branches
      WHERE tenant_id = ?
        AND is_active = 1
        AND (UPPER(branch_type) = 'BRANCH' OR branch_type IS NULL)
    `,
    [tenantId]
  );

  // 2) Ulgurji do'konlar (OUTLET)
  const outletsRow = await get(
    `
      SELECT COUNT(*) AS total
      FROM branches
      WHERE tenant_id = ?
        AND is_active = 1
        AND UPPER(branch_type) = 'OUTLET'
    `,
    [tenantId]
  );

  // 3) Foydalanuvchilar
  const usersRow = await get(
    `SELECT COUNT(*) AS total FROM users WHERE tenant_id = ? AND is_active = 1`,
    [tenantId]
  );

  // 4) Mahsulotlar
  const productsRow = await get(
    `SELECT COUNT(*) AS total FROM products WHERE tenant_id = ?`,
    [tenantId]
  );

  // === Period bo‘yicha savdo ===
  const salesDateCond = buildPeriodCondition("sale_date", mode, date);

  // 5) Savdo (jami va cheklar soni) – period bo‘yicha
  const salesRow = await get(
    `
      SELECT 
        IFNULL(SUM(total_amount), 0) AS total_amount,
        COUNT(*) AS sale_count
      FROM sales
      WHERE tenant_id = ?
        AND ${salesDateCond.clause}
    `,
    [tenantId, ...salesDateCond.params]
  );
  const todaySalesAmount = salesRow?.total_amount || 0;
  const todaySalesCount = salesRow?.sale_count || 0;

  // 6) Eng ko‘p sotilgan mahsulotlar – period bo‘yicha
  const topProducts = await all(
    `
      SELECT
        p.id   AS product_id,
        p.name AS product_name,
        b.name AS branch_name,
        SUM(si.quantity)               AS sold_quantity,
        IFNULL(SUM(si.total_price), 0) AS total_amount
      FROM sale_items si
      JOIN sales    s ON s.id = si.sale_id
      JOIN products p ON p.id = si.product_id
      LEFT JOIN branches b ON b.id = s.branch_id
      WHERE s.tenant_id = ?
        AND ${salesDateCond.clause}
      GROUP BY p.id, p.name, branch_name
      ORDER BY sold_quantity DESC
      LIMIT 10
    `,
    [tenantId, ...salesDateCond.params]
  );

  // 7) Oylik grafika – tanlangan sananing OYI bo‘yicha
  const monthlyCond = buildPeriodCondition("sale_date", "month", date);
  const monthlySales = await all(
    `
      SELECT
        sale_date,
        IFNULL(SUM(total_amount), 0) AS total_amount,
        COUNT(*) AS sale_count
      FROM sales
      WHERE tenant_id = ?
        AND ${monthlyCond.clause}
      GROUP BY sale_date
      ORDER BY sale_date ASC
    `,
    [tenantId, ...monthlyCond.params]
  );

  // === Period bo‘yicha xarajatlar ===
  const expenseDateCond = buildPeriodCondition("e.expense_date", mode, date);

  // 8) Xarajatlar (jami)
  const expenseTotalRow = await get(
    `
      SELECT
        IFNULL(SUM(ei.total_price), 0) AS total_amount
      FROM expenses e
      JOIN expense_items ei ON ei.expense_id = e.id
      WHERE e.tenant_id = ?
        AND ei.tenant_id = ?
        AND ${expenseDateCond.clause}
    `,
    [tenantId, tenantId, ...expenseDateCond.params]
  );
  const totalExpenses = expenseTotalRow?.total_amount || 0;

  // 9) Xarajat turlari bo‘yicha (period)
  const expensesByType = await all(
    `
      SELECT
        e.type AS expense_type,
        IFNULL(SUM(ei.total_price), 0) AS total_amount
      FROM expenses e
      JOIN expense_items ei ON ei.expense_id = e.id
      WHERE e.tenant_id = ?
        AND ei.tenant_id = ?
        AND ${expenseDateCond.clause}
      GROUP BY e.type
    `,
    [tenantId, tenantId, ...expenseDateCond.params]
  );

  // === Period bo‘yicha ishlab chiqarish ===
  const prodDateCond = buildPeriodCondition("pb.batch_date", mode, date);

  // 10) Ishlab chiqarish umumiy
  const productionRow = await get(
    `
      SELECT
        COUNT(DISTINCT pb.id) AS batch_count,
        IFNULL(SUM(pi.quantity), 0) AS total_quantity
      FROM production_batches pb
      LEFT JOIN production_items pi ON pi.batch_id = pb.id
      WHERE pb.tenant_id = ?
        AND ${prodDateCond.clause}
    `,
    [tenantId, ...prodDateCond.params]
  );

  const productionBatchCount = productionRow?.batch_count || 0;
  const productionQuantity = productionRow?.total_quantity || 0;

  // 10.1) Ishlab chiqarish – mahsulotlar bo‘yicha
  const productionByProduct = await all(
    `
      SELECT
        p.id   AS product_id,
        p.name AS product_name,
        p.unit AS unit,
        IFNULL(SUM(pi.quantity), 0) AS total_quantity
      FROM production_batches pb
      JOIN production_items pi ON pi.batch_id = pb.id
      JOIN products p          ON p.id        = pi.product_id
      WHERE pb.tenant_id = ?
        AND ${prodDateCond.clause}
      GROUP BY p.id, p.name, p.unit
      ORDER BY total_quantity DESC
    `,
    [tenantId, ...prodDateCond.params]
  );

  // === Period bo‘yicha filial/do‘kon savdosi (salesByBranch) ===
  const salesByBranch = await all(
    `
      SELECT
        b.id   AS branch_id,
        b.name AS branch_name,
        UPPER(IFNULL(b.branch_type, 'BRANCH')) AS branch_type,
        IFNULL(SUM(s.total_amount), 0) AS total_amount,
        COUNT(s.id) AS sale_count
      FROM sales s
      LEFT JOIN branches b ON b.id = s.branch_id
      WHERE s.tenant_id = ?
        AND ${salesDateCond.clause}
      GROUP BY b.id, b.name, branch_type
      ORDER BY total_amount DESC
    `,
    [tenantId, ...salesDateCond.params]
  );

  // === Period bo‘yicha OUTLETlarga transferlar ===
  const transferDateCond = buildPeriodCondition("t.transfer_date", mode, date);

  const outletTransfersRow = await get(
    `
      SELECT
        IFNULL(SUM(
          ti.quantity *
          CASE
            WHEN p.wholesale_price IS NOT NULL AND p.wholesale_price > 0
              THEN p.wholesale_price
            ELSE p.price
          END
        ), 0) AS total_amount
      FROM transfer_items ti
      JOIN transfers t ON t.id = ti.transfer_id
      JOIN branches b ON b.id = t.to_branch_id
      JOIN products p ON p.id = ti.product_id
      WHERE t.tenant_id = ?
        AND ${transferDateCond.clause}
        AND UPPER(IFNULL(b.branch_type, 'BRANCH')) = 'OUTLET'
        AND ti.status = 'ACCEPTED'
    `,
    [tenantId, ...transferDateCond.params]
  );

  const outletTransfersAmountPeriod = outletTransfersRow?.total_amount || 0;

  const outletTransfersByBranch = await all(
    `
      SELECT
        b.id   AS branch_id,
        b.name AS branch_name,
        UPPER(IFNULL(b.branch_type, 'BRANCH')) AS branch_type,
        IFNULL(SUM(
          ti.quantity *
          CASE
            WHEN p.wholesale_price IS NOT NULL AND p.wholesale_price > 0
              THEN p.wholesale_price
            ELSE p.price
          END
        ), 0) AS total_amount
      FROM transfer_items ti
      JOIN transfers t ON t.id = ti.transfer_id
      JOIN branches b ON b.id = t.to_branch_id
      JOIN products p ON p.id = ti.product_id
      WHERE t.tenant_id = ?
        AND ${transferDateCond.clause}
        AND UPPER(IFNULL(b.branch_type, 'BRANCH')) = 'OUTLET'
        AND ti.status = 'ACCEPTED'
      GROUP BY b.id, b.name, branch_type
      ORDER BY total_amount DESC
    `,
    [tenantId, ...transferDateCond.params]
  );

  // === Period bo‘yicha vazvratlar ===
  const returnsDateCond = buildPeriodCondition("date(wm.created_at)", mode, date);

  const returnsPeriodRow = await get(
    `
      SELECT
        IFNULL(SUM(
          wm.quantity *
          CASE
            WHEN p.wholesale_price IS NOT NULL AND p.wholesale_price > 0
              THEN p.wholesale_price
            ELSE p.price
          END
        ), 0) AS total_amount
      FROM warehouse_movements wm
      JOIN products p ON p.id = wm.product_id
      WHERE wm.tenant_id = ?
        AND wm.source_type = 'return'
        AND ${returnsDateCond.clause}
    `,
    [tenantId, ...returnsDateCond.params]
  );

  const returnsAmountPeriod = returnsPeriodRow?.total_amount || 0;

  const returnsByProduct = await all(
    `
      SELECT
        p.id   AS product_id,
        p.name AS product_name,
        p.unit AS unit,
        IFNULL(SUM(wm.quantity), 0) AS total_quantity,
        IFNULL(SUM(
          wm.quantity *
          CASE
            WHEN p.wholesale_price IS NOT NULL AND p.wholesale_price > 0
              THEN p.wholesale_price
            ELSE p.price
          END
        ), 0) AS total_amount
      FROM warehouse_movements wm
      JOIN products p ON p.id = wm.product_id
      WHERE wm.tenant_id = ?
        AND wm.source_type = 'return'
        AND ${returnsDateCond.clause}
      GROUP BY p.id, p.name, p.unit
      ORDER BY total_amount DESC
    `,
    [tenantId, ...returnsDateCond.params]
  );

  const returnsByBranchToday = await all(
    `
      SELECT
        b.id   AS branch_id,
        b.name AS branch_name,
        UPPER(IFNULL(b.branch_type, 'BRANCH')) AS branch_type,
        IFNULL(SUM(
          wm.quantity *
          CASE
            WHEN p.wholesale_price IS NOT NULL AND p.wholesale_price > 0
              THEN p.wholesale_price
            ELSE p.price
          END
        ), 0) AS total_amount
      FROM warehouse_movements wm
      JOIN products p ON p.id = wm.product_id
      LEFT JOIN branches b ON b.id = wm.branch_id
      WHERE wm.tenant_id = ?
        AND wm.source_type = 'return'
        AND ${returnsDateCond.clause}
      GROUP BY b.id, b.name, branch_type
    `,
    [tenantId, ...returnsDateCond.params]
  );

  // === KASSA (period) ===
  const cashDateCond = buildPeriodCondition("c.cash_date", mode, date);

  const cashPeriodRow = await get(
    `
      SELECT IFNULL(SUM(c.amount), 0) AS total_amount
      FROM cash_entries c
      WHERE c.tenant_id = ?
        AND ${cashDateCond.clause}
    `,
    [tenantId, ...cashDateCond.params]
  );
  const cashReceivedPeriod = cashPeriodRow?.total_amount || 0;

  const cashByBranchPeriod = await all(
    `
      SELECT
        b.id AS branch_id,
        b.name AS branch_name,
        UPPER(IFNULL(b.branch_type,'BRANCH')) AS branch_type,
        IFNULL(SUM(c.amount), 0) AS total_amount
      FROM cash_entries c
      LEFT JOIN branches b ON b.id = c.branch_id
      WHERE c.tenant_id = ?
        AND ${cashDateCond.clause}
      GROUP BY b.id, b.name, branch_type
      ORDER BY total_amount DESC
    `,
    [tenantId, ...cashDateCond.params]
  );

  // === Qarzlar – ALL TIME (faqat shu tenant)
  const salesAllRow = await get(
    `SELECT IFNULL(SUM(total_amount), 0) AS total_amount FROM sales WHERE tenant_id = ?`,
    [tenantId]
  );
  const salesAllAmount = salesAllRow?.total_amount || 0;

  const outletTransfersAllRow = await get(
    `
      SELECT
        IFNULL(SUM(
          ti.quantity *
          CASE
            WHEN p.wholesale_price IS NOT NULL AND p.wholesale_price > 0
              THEN p.wholesale_price
            ELSE p.price
          END
        ), 0) AS total_amount
      FROM transfer_items ti
      JOIN transfers t ON t.id = ti.transfer_id
      JOIN branches b ON b.id = t.to_branch_id
      JOIN products p ON p.id = ti.product_id
      WHERE t.tenant_id = ?
        AND UPPER(IFNULL(b.branch_type, 'BRANCH')) = 'OUTLET'
        AND ti.status = 'ACCEPTED'
    `,
    [tenantId]
  );
  const outletTransfersAllAmount = outletTransfersAllRow?.total_amount || 0;

  const returnsAllRow = await get(
    `
      SELECT
        IFNULL(SUM(
          wm.quantity *
          CASE
            WHEN p.wholesale_price IS NOT NULL AND p.wholesale_price > 0
              THEN p.wholesale_price
            ELSE p.price
          END
        ), 0) AS total_amount
      FROM warehouse_movements wm
      JOIN products p ON p.id = wm.product_id
      WHERE wm.tenant_id = ?
        AND wm.source_type = 'return'
    `,
    [tenantId]
  );
  const returnsAllAmount = returnsAllRow?.total_amount || 0;

  const cashAllRow = await get(
    `SELECT IFNULL(SUM(amount), 0) AS total_amount FROM cash_entries WHERE tenant_id = ?`,
    [tenantId]
  );
  const cashReceivedAllTime = cashAllRow?.total_amount || 0;

  const debtsAmount =
    salesAllAmount + outletTransfersAllAmount - returnsAllAmount - cashReceivedAllTime;

  // === Yakuniy ko‘rsatkichlar ===
  const totalRevenue = todaySalesAmount + outletTransfersAmountPeriod;
  const cashReceivedToday = cashReceivedPeriod;
  const profit = totalRevenue - totalExpenses - returnsAmountPeriod;

  return {
    stats: {
      totalBranches: branchesRow?.total || 0,
      totalOutlets: outletsRow?.total || 0,
      totalUsers: usersRow?.total || 0,
      totalProducts: productsRow?.total || 0,

      todaySalesAmount,
      todaySalesCount,

      totalExpenses,
      totalRevenue,
      returnsAmountToday: returnsAmountPeriod,
      debtsAmount,
      cashReceivedToday,

      profit,
      productionBatchCount,
      productionQuantity,
    },
    topProducts,
    monthlySales,
    salesByBranch,
    expensesByType,
    productionByProduct,
    returnsByProduct,
    outletTransfersByBranch,
    returnsByBranchToday,
    cashByBranchPeriod,
  };
}

module.exports = {
  getOverview,
};

