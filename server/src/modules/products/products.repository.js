const { run, all, get } = require('../../db/connection');

async function findAll() {
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
    ORDER BY id ASC
  `;
  return all(query);
}

async function findDecorations() {
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
    WHERE category = 'DECORATION'
    ORDER BY name ASC
  `;
  return all(query);
}

async function findUtilities() {
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
    WHERE category = 'UTILITY'
    ORDER BY name ASC
  `;
  return all(query);
}

async function findById(id) {
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
    WHERE id = ?
  `;
  return get(query, [id]);
}

async function create({ name, unit, category, price, wholesale_price }) {
  const query = `
    INSERT INTO products (name, unit, category, price, wholesale_price, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `;
  const result = await run(query, [
    name,
    unit,
    category || 'PRODUCT',
    price || 0,
    wholesale_price || 0,
  ]);
  const insertedId = result.lastID;
  return findById(insertedId);
}

async function update(id, { name, unit, category, price, wholesale_price }) {
  const query = `
    UPDATE products
    SET
      name = ?,
      unit = ?,
      category = ?,
      price = ?,
      wholesale_price = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `;
  await run(query, [
    name,
    unit,
    category || 'PRODUCT',
    price || 0,
    wholesale_price || 0,
    id,
  ]);
  return findById(id);
}

async function remove(id) {
  const query = `DELETE FROM products WHERE id = ?`;
  await run(query, [id]);
}

module.exports = {
  findAll,
  findDecorations,
  findUtilities,
  findById,
  create,
  update,
  remove,
};
