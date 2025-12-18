// server/src/modules/warehouse/warehouse.repository.js
const { all, get } = require('../../db/connection');

/**
 * Filial haqida ma'lumot olish (use_central_stock va branch_type ni bilish uchun)
 */
async function getBranchById(tenantId, branchId) {
  if (!branchId) return null;

  const row = await get(
    `
      SELECT
        id,
        name,
        IFNULL(use_central_stock, 0) AS use_central_stock,
        UPPER(IFNULL(branch_type, 'BRANCH')) AS branch_type
      FROM branches
      WHERE id = ? AND tenant_id = ?
    `,
    [branchId, tenantId]
  );

  return row || null;
}

/**
 * Hozirgi qoldiqni qaytaradi:
 * MANTIQ:
 *   - branches.use_central_stock = 1 BO'LSA YOKI branch_type = 'OUTLET' BO'LSA
 *     o‘sha filial/do‘konning harakatlari "Markaziy ombor" bilan BIRGA hisoblanadi.
 *     Ya'ni logical_branch_id = NULL bo‘ladi va Markaziy ombor qatori bilan qo‘shiladi.
 */
async function getCurrentStock(tenantId, branchId) {
  // Qaysi rejimda ishlayotganimizni aniqlaymiz
  let mode = 'all'; // 'all' | 'central' | 'branch' | 'none'
  let branchFilterId = null;

  if (!branchId) {
    mode = 'all';
  } else if (branchId === 'central') {
    // maxsus qiymat: admin filtrlashdan tanlagan "Markaziy ombor"
    mode = 'central';
  } else {
    // Muayyan filial/do‘kon id bo'yicha kelgan bo'lsa (branch user yoki admin filtri)
    const branch = await getBranchById(tenantId, branchId);

    if (!branch) {
      mode = 'none'; // bunday filial yo‘q
    } else if (branch.use_central_stock || branch.branch_type === 'OUTLET') {
      // Bu filial/do‘konning alohida ombori yo'q,
      // yoki bu OUTLET – hammasi Markaziy bilan birga yuritiladi
      mode = 'central';
    } else {
      // Oddiy filial – alohida ombor qoldig‘i
      mode = 'branch';
      branchFilterId = branch.id;
    }
  }

  if (mode === 'none') {
    return [];
  }

  let whereClause = '';
  const params = [tenantId]; // Tenant ID har doim birinchi parametr bo'lishi kerak subqueryda emas, balki join/where da

  if (mode === 'central') {
    // faqat Markaziy ombor (va OUTLET + use_central_stock=1 bo‘lganlar bilan birga)
    whereClause = 'WHERE logical_branch_id IS NULL';
  } else if (mode === 'branch') {
    whereClause = 'WHERE logical_branch_id = ?';
    params.push(branchFilterId);
  }
  // 'all' bo'lsa whereClause bo'sh qoladi – hamma omborlar chiqadi

  const sql = `
    SELECT
      x.product_id,
      x.product_name,
      x.unit,
      x.logical_branch_id   AS branch_id,
      x.logical_branch_name AS branch_name,
      SUM(x.quantity_delta) AS quantity
    FROM (
      SELECT
        wm.product_id,
        p.name AS product_name,
        p.unit,
        -- logical_branch_id:
        --   * wm.branch_id NULL bo'lsa => Markaziy ombor
        --   * filial/do‘kon branch_type = 'OUTLET' bo'lsa => Markaziy ombor
        --   * use_central_stock = 1 bo'lsa => Markaziy ombor
        --   * aks holda => o'z filial id
        CASE
          WHEN wm.branch_id IS NULL THEN NULL
          WHEN UPPER(IFNULL(b.branch_type, 'BRANCH')) = 'OUTLET' THEN NULL
          WHEN IFNULL(b.use_central_stock, 0) = 1 THEN NULL
          ELSE wm.branch_id
        END AS logical_branch_id,
        CASE
          WHEN wm.branch_id IS NULL THEN 'Markaziy ombor'
          WHEN UPPER(IFNULL(b.branch_type, 'BRANCH')) = 'OUTLET' THEN 'Markaziy ombor'
          WHEN IFNULL(b.use_central_stock, 0) = 1 THEN 'Markaziy ombor'
          ELSE b.name
        END AS logical_branch_name,
        CASE
          WHEN wm.movement_type = 'IN' THEN wm.quantity
          ELSE -wm.quantity
        END AS quantity_delta
      FROM warehouse_movements wm
      JOIN products p ON p.id = wm.product_id
      LEFT JOIN branches b ON b.id = wm.branch_id
      WHERE wm.tenant_id = ? 
    ) x
    ${whereClause}
    GROUP BY x.product_id, x.logical_branch_id
    HAVING quantity <> 0
    ORDER BY x.product_name ASC, x.logical_branch_name ASC
  `;

  const rows = await all(sql, params);

  return rows;
}

module.exports = {
  getBranchById,
  getCurrentStock,
};
