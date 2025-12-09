const { all, get, run } = require("../../db/connection");

/**
 * Eslatma:
 *  branches jadvalida quyidagi ustun bo'lishi kerak:
 *   - type TEXT DEFAULT 'BRANCH'  -- 'BRANCH' yoki 'OUTLET'
 *
 * Agar hali qo'shilmagan bo'lsa, SQLite da bir marta:
 *   ALTER TABLE branches ADD COLUMN type TEXT DEFAULT 'BRANCH';
 */

/**
 * Barcha filiallar / do'konlarni olish.
 */
async function getAllBranches() {
  const rows = await all(
    `
      SELECT
        id,
        name,
        IFNULL(is_active, 1) AS is_active,
        IFNULL(use_central_stock, 0) AS use_central_stock,
        IFNULL(type, 'BRANCH') AS type
      FROM branches
      ORDER BY id ASC
    `,
    []
  );

  return rows;
}

/**
 * Bitta filial/do'konni id bo'yicha olish
 */
async function getBranchById(id) {
  const row = await get(
    `
      SELECT
        id,
        name,
        IFNULL(is_active, 1) AS is_active,
        IFNULL(use_central_stock, 0) AS use_central_stock,
        IFNULL(type, 'BRANCH') AS type
      FROM branches
      WHERE id = ?
    `,
    [id]
  );

  return row || null;
}

/**
 * Yangi filial / do'kon yaratish
 *
 * data:
 *  - name: string
 *  - is_active?: number (0/1) – default 1
 *  - use_central_stock?: number (0/1) – default 0
 *  - type?: 'BRANCH' | 'OUTLET' – default 'BRANCH'
 */
async function createBranch(data) {
  const name = (data.name || "").trim();
  const isActive =
    typeof data.is_active === "number" ? data.is_active : 1;
  const useCentral =
    typeof data.use_central_stock === "number"
      ? data.use_central_stock
      : 0;
  const typeRaw = data.type || "BRANCH";
  const type = String(typeRaw).toUpperCase() === "OUTLET" ? "OUTLET" : "BRANCH";

  const result = await run(
    `
      INSERT INTO branches (name, is_active, use_central_stock, type)
      VALUES (?, ?, ?, ?)
    `,
    [name, isActive, useCentral, type]
  );

  const created = await getBranchById(result.lastID);
  return created;
}

/**
 * Filial/do'konni yangilash
 */
async function updateBranch(id, data) {
  const existing = await getBranchById(id);
  if (!existing) {
    throw new Error("Filial/do‘kon topilmadi.");
  }

  const name =
    data.name != null ? String(data.name).trim() : existing.name;
  const isActive =
    typeof data.is_active === "number"
      ? data.is_active
      : existing.is_active;
  const useCentral =
    typeof data.use_central_stock === "number"
      ? data.use_central_stock
      : existing.use_central_stock;

  const typeRaw =
    data.type != null ? String(data.type).toUpperCase() : existing.type || "BRANCH";
  const type = typeRaw === "OUTLET" ? "OUTLET" : "BRANCH";

  await run(
    `
      UPDATE branches
      SET
        name = ?,
        is_active = ?,
        use_central_stock = ?,
        type = ?
      WHERE id = ?
    `,
    [name, isActive, useCentral, type, id]
  );

  const updated = await getBranchById(id);
  return updated;
}

/**
 * Soft delete – is_active = 0
 */
async function deleteBranch(id) {
  const existing = await getBranchById(id);
  if (!existing) {
    throw new Error("Filial/do‘kon topilmadi.");
  }

  await run(
    `
      UPDATE branches
      SET is_active = 0
      WHERE id = ?
    `,
    [id]
  );

  const updated = await getBranchById(id);
  return updated;
}

module.exports = {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
};
