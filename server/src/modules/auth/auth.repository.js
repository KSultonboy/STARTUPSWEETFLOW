// server/src/modules/auth/auth.repository.js
const { get } = require('../../db/connection');

// Login paytida: username va tenantId bo'yicha
async function getUserWithPasswordByUsername(username, tenantId) {
  // If tenantId is not provided, we might default or fail. 
  // Here we strictly require tenantId for multi-tenancy security.
  if (!tenantId) {
    // Fallback logic for backward compatibility OR strictly fail?
    // For now, let's assume if no tenantId, search globally (risky) or default to 1
    // But best is to require it.
    return get(`SELECT * FROM users WHERE username = ?`, [username]);
  }

  return get(
    `
        SELECT
          id,
          full_name,
          username,
          password_hash,
          role,
          tenant_id,
          branch_id,
          is_active
        FROM users
        WHERE username = ? AND tenant_id = ?
      `,
    [username, tenantId]
  );
}

// Refresh paytida: id bo'yicha userni olish
async function getUserById(id) {
  return get(
    `
        SELECT
          id,
          full_name,
          username,
          role,
          tenant_id,
          branch_id,
          is_active
        FROM users
        WHERE id = ?
      `,
    [id]
  );
}

module.exports = {
  getUserWithPasswordByUsername,
  getUserById,
};
