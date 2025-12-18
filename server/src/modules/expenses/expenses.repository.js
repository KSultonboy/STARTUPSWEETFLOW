const { run, get, all } = require('../../db/connection');

// Yangi expense header
async function insertExpense(tenantId, { expense_date, type, total_amount, description, created_by }) {
  const res = await run(
    `
      INSERT INTO expenses (tenant_id, expense_date, type, total_amount, description, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `,
    [tenantId, expense_date, type, total_amount, description || null, created_by || null]
  );
  return res.lastID;
}

// Expense headerni yangilash
async function updateExpenseHeader(tenantId, id, { expense_date, type, total_amount, description }) {
  await run(
    `
      UPDATE expenses
      SET
        expense_date = ?,
        type = ?,
        total_amount = ?,
        description = ?
      WHERE id = ? AND tenant_id = ?
    `,
    [expense_date, type, total_amount, description || null, id, tenantId]
  );
}

// Bandlarni kiritish
async function insertExpenseItem(tenantId, expenseId, item) {
  await run(
    `
      INSERT INTO expense_items
        (tenant_id, expense_id, product_id, name, quantity, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      tenantId,
      expenseId,
      item.product_id || null,
      item.name || null,
      item.quantity,
      item.unit_price,
      item.total_price,
    ]
  );
}

// Bir xarajatga tegishli bandlarni o'chirish
async function deleteExpenseItems(tenantId, expenseId) {
  await run(`DELETE FROM expense_items WHERE expense_id = ? AND tenant_id = ?`, [expenseId, tenantId]);
}

// Bitta xarajat headerini o'chirish
async function deleteExpense(tenantId, id) {
  await run(`DELETE FROM expenses WHERE id = ? AND tenant_id = ?`, [id, tenantId]);
}

// header + items
async function findById(tenantId, id) {
  const header = await get(
    `
      SELECT
        e.id,
        e.expense_date,
        e.type,
        e.total_amount,
        e.description,
        e.created_by,
        e.created_at
      FROM expenses e
      WHERE e.id = ? AND e.tenant_id = ?
    `,
    [id, tenantId]
  );

  if (!header) return null;

  const items = await all(
    `
      SELECT
        ei.id,
        ei.product_id,
        p.name AS product_name,
        ei.name,
        ei.quantity,
        ei.unit_price,
        ei.total_price
      FROM expense_items ei
      LEFT JOIN products p ON p.id = ei.product_id
      WHERE ei.expense_id = ? AND ei.tenant_id = ?
      ORDER BY ei.id ASC
    `,
    [id, tenantId]
  );

  return { header, items };
}

// Ro'yxat (type bo'yicha faqat headerlar)
async function listByType(tenantId, type) {
  const rows = await all(
    `
      SELECT
        e.id,
        e.expense_date,
        e.type,
        e.total_amount,
        e.description,
        e.created_by,
        e.created_at
      FROM expenses e
      WHERE e.type = ? AND e.tenant_id = ?
      ORDER BY e.expense_date DESC, e.id DESC
    `,
    [type, tenantId]
  );
  return rows;
}

async function insertWarehouseMovement(tenantId, { product_id, quantity, branch_id = null, movement_type = 'IN' }) {
  await run(
    `
      INSERT INTO warehouse_movements (tenant_id, product_id, branch_id, movement_type, quantity)
      VALUES (?, ?, ?, ?, ?)
    `,
    [tenantId, product_id, branch_id, movement_type, quantity]
  );
}

module.exports = {
  insertExpense,
  updateExpenseHeader,
  insertExpenseItem,
  deleteExpenseItems,
  deleteExpense,
  findById,
  listByType,
  insertWarehouseMovement,
};
