// server/src/modules/users/users.repository.js

const { run, all, get } = require("../../db/connection");

async function findAll(tenantId) {
  const query = `
    SELECT 
      u.id,
      u.full_name,
      u.username,
      u.role,
      u.branch_id,
      u.is_active,
      u.created_at,
      u.updated_at,
      b.name AS branch_name,
      b.code AS branch_code
    FROM users u
    LEFT JOIN branches b ON u.branch_id = b.id
    WHERE u.tenant_id = ?
    ORDER BY u.id DESC
  `;
  return all(query, [tenantId]);
}

async function findById(tenantId, id) {
  const query = `
    SELECT 
      u.id,
      u.full_name,
      u.username,
      u.role,
      u.branch_id,
      u.is_active,
      u.created_at,
      u.updated_at,
      b.name AS branch_name,
      b.code AS branch_code
    FROM users u
    LEFT JOIN branches b ON u.branch_id = b.id
    WHERE u.id = ? AND u.tenant_id = ?
  `;
  return get(query, [id, tenantId]);
}

// LOGIN uchun username bo'yicha user (password_hash bilan)
async function findByUsername(username, tenantId) {
  // If tenantId provided, strict check
  if (tenantId) {
    return get(
      `SELECT * FROM users WHERE username = ? AND tenant_id = ?`,
      [username, tenantId]
    );
  }
  // Backward compat or loose check (should rely on auth repo generally)
  return get(`SELECT * FROM users WHERE username = ?`, [username]);
}

// Eski auth modul moslashishi uchun alias
async function findWithPasswordByUsername(username) {
  // Auth repo alohida, bu general users moduli.
  // Bu yerda tenantId siz chaqirsa xato bo'lishi mumkin multi-tenantda.
  // Ammo login vaqtida auth.repository ishlatiladi.
  return findByUsername(username);
}

async function create(tenantId, {
  full_name,
  username,
  password_hash,
  role,
  branch_id,
  is_active,
}) {
  const result = await run(
    `
    INSERT INTO users (tenant_id, full_name, username, password_hash, role, branch_id, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `,
    [tenantId, full_name, username, password_hash, role, branch_id || null, is_active ? 1 : 1]
  );
  const id = result.lastID;
  return findById(tenantId, id);
}

async function update(
  tenantId,
  id,
  { full_name, username, password_hash, role, branch_id, is_active }
) {
  // password_hash bo'sh bo'lsa eski qiymat o'zgarishsiz qolishi uchun COALESCE ishlatamiz
  await run(
    `
    UPDATE users
    SET
      full_name   = ?,
      username    = ?,
      role        = ?,
      branch_id   = ?,
      is_active   = ?,
      password_hash = COALESCE(?, password_hash),
      updated_at  = datetime('now')
    WHERE id = ? AND tenant_id = ?
  `,
    [
      full_name,
      username,
      role,
      branch_id || null,
      is_active ? 1 : 0,
      password_hash || null,
      id,
      tenantId
    ]
  );

  return findById(tenantId, id);
}

async function remove(tenantId, id) {
  await run(`DELETE FROM users WHERE id = ? AND tenant_id = ?`, [id, tenantId]);
}

module.exports = {
  findAll,
  findById,
  findByUsername,
  findWithPasswordByUsername,
  create,
  update,
  remove,
};
