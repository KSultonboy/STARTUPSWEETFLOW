const { run, all, get } = require('../../db/connection');

async function findAll(tenantId) {
  const query = `
    SELECT
      id,
      name,
      unit,
      category,
      price,
      wholesale_price,
      created_at,
      updated_at
    FROM products
    WHERE tenant_id = ?
    ORDER BY id ASC
  `;
  return all(query, [tenantId]);
}

async function findDecorations(tenantId) {
  const query = `
    SELECT
      id,
      name,
      unit,
      category,
      price,
      wholesale_price,
      created_at,
      updated_at
    FROM products
    WHERE tenant_id = ? AND category = 'DECORATION'
    ORDER BY name ASC
  `;
  return all(query, [tenantId]);
}

async function findUtilities(tenantId) {
  const query = `
    SELECT
      id,
      name,
      unit,
      category,
      price,
      wholesale_price,
      created_at,
      updated_at
    FROM products
    WHERE tenant_id = ? AND category = 'UTILITY'
    ORDER BY name ASC
  `;
  return all(query, [tenantId]);
}

async function findById(tenantId, id) {
  const query = `
    SELECT
      id,
      name,
      unit,
      category,
      price,
      wholesale_price,
      created_at,
      updated_at
    FROM products
    WHERE id = ? AND tenant_id = ?
  `;
  return get(query, [id, tenantId]);
}

async function findByName(tenantId, name) {
  const query = `
    SELECT
      id,
      name,
      unit,
      category,
      price,
      wholesale_price,
      created_at,
      updated_at
    FROM products
    WHERE tenant_id = ?
      AND LOWER(TRIM(name)) = LOWER(TRIM(?))
    LIMIT 1
  `;
  return get(query, [tenantId, name]);
}

async function create(tenantId, { name, unit, category, price, wholesale_price }) {
  const query = `
    INSERT INTO products (tenant_id, name, unit, category, price, wholesale_price, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `;
  const result = await run(query, [
    tenantId,
    name,
    unit,
    category || 'PRODUCT',
    price || 0,
    wholesale_price || 0,
  ]);
  const insertedId = result.lastID;
  return findById(tenantId, insertedId);
}

async function update(tenantId, id, { name, unit, category, price, wholesale_price }) {
  const query = `
    UPDATE products
    SET
      name = ?,
      unit = ?,
      category = ?,
      price = ?,
      wholesale_price = ?,
      updated_at = datetime('now')
    WHERE id = ? AND tenant_id = ?
  `;
  await run(query, [
    name,
    unit,
    category || 'PRODUCT',
    price || 0,
    wholesale_price || 0,
    id,
    tenantId
  ]);
  return findById(tenantId, id);
}

async function remove(tenantId, id) {
  const query = `DELETE FROM products WHERE id = ? AND tenant_id = ?`;
  await run(query, [id, tenantId]);
}

module.exports = {
  findAll,
  findDecorations,
  findUtilities,
  findById,
  findByName,
  create,
  update,
  remove,
};
