// server/src/modules/branches/branches.repository.js

const { all, get, run } = require('../../db/connection');

/**
 * Barcha filial/do‘konlarni olish.
 */
async function getAllBranches(tenantId) {
  const rows = await all(
    `
      SELECT
        id,
        name,
        IFNULL(is_active, 1) AS is_active,
        IFNULL(use_central_stock, 0) AS use_central_stock,
        branch_type
      FROM branches
      WHERE tenant_id = ?
      ORDER BY id ASC
    `,
    [tenantId]
  );

  return rows;
}

/**
 * Bitta joyni id bo'yicha olish
 */
async function getBranchById(tenantId, id) {
  const row = await get(
    `
      SELECT
        id,
        name,
        IFNULL(is_active, 1) AS is_active,
        IFNULL(use_central_stock, 0) AS use_central_stock,
        branch_type
      FROM branches
      WHERE id = ? AND tenant_id = ?
    `,
    [id, tenantId]
  );

  return row || null;
}

/**
 * Yangi joy (filial/do‘kon) yaratish
 */
async function createBranch(tenantId, data) {
  const name = (data.name || '').trim();
  const isActive =
    typeof data.is_active === 'number' ? data.is_active : 1;
  const useCentral =
    typeof data.use_central_stock === 'number'
      ? data.use_central_stock
      : 0;
  const branchType = (data.branch_type || 'BRANCH').toUpperCase();

  const result = await run(
    `
      INSERT INTO branches (tenant_id, name, is_active, use_central_stock, branch_type)
      VALUES (?, ?, ?, ?, ?)
    `,
    [tenantId, name, isActive, useCentral, branchType]
  );

  const created = await getBranchById(tenantId, result.lastID);
  return created;
}

/**
 * Joyni yangilash
 */
async function updateBranch(tenantId, id, data) {
  const existing = await getBranchById(tenantId, id);
  if (!existing) {
    throw new Error('Filial/do‘kon topilmadi.');
  }

  const name =
    data.name != null ? String(data.name).trim() : existing.name;
  const isActive =
    typeof data.is_active === 'number'
      ? data.is_active
      : existing.is_active;
  const useCentral =
    typeof data.use_central_stock === 'number'
      ? data.use_central_stock
      : existing.use_central_stock;
  const branchType =
    data.branch_type != null
      ? String(data.branch_type).toUpperCase()
      : existing.branch_type || 'BRANCH';

  await run(
    `
      UPDATE branches
      SET
        name = ?,
        is_active = ?,
        use_central_stock = ?,
        branch_type = ?
      WHERE id = ? AND tenant_id = ?
    `,
    [name, isActive, useCentral, branchType, id, tenantId]
  );

  const updated = await getBranchById(tenantId, id);
  return updated;
}

/**
 * Soft delete
 */
async function deleteBranch(tenantId, id) {
  const existing = await getBranchById(tenantId, id);
  if (!existing) {
    throw new Error('Filial/do‘kon topilmadi.');
  }

  await run(
    `
      UPDATE branches
      SET is_active = 0
      WHERE id = ? AND tenant_id = ?
    `,
    [id, tenantId]
  );

  const updated = await getBranchById(tenantId, id);
  return updated;
}

module.exports = {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
};
