// server/src/modules/auth/auth.repository.js
const { get } = require('../../db/connection');

// Login paytida: username bo'yicha parol bilan birga olish
async function getUserWithPasswordByUsername(username) {
    return get(
        `
        SELECT
          id,
          full_name,
          username,
          password_hash,
          role,
          branch_id,
          is_active
        FROM users
        WHERE username = ?
      `,
        [username]
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
