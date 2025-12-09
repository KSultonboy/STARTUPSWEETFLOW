const { run, get, all } = require('../../db/connection');

// Yangi expense header
async function insertExpense({ expense_date, type, total_amount, description, created_by }) {
  const res = await run(
    `
      INSERT INTO expenses (expense_date, type, total_amount, description, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `,
    [expense_date, type, total_amount, description || null, created_by || null]
  );
  return res.lastID;
}

// Expense headerni yangilash
async function updateExpenseHeader(id, { expense_date, type, total_amount, description }) {
  await run(
    `
      UPDATE expenses
      SET
        expense_date = ?,
        type = ?,
        total_amount = ?,
        description = ?
      WHERE id = ?
    `,
    [expense_date, type, total_amount, description || null, id]
  );
}

// Bandlarni kiritish
async function insertExpenseItem(expenseId, item) {
  await run(
    `
      INSERT INTO expense_items
        (expense_id, product_id, name, quantity, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
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
async function deleteExpenseItems(expenseId) {
  await run(`DELETE FROM expense_items WHERE expense_id = ?`, [expenseId]);
}

// Bitta xarajat headerini o'chirish
async function deleteExpense(id) {
  await run(`DELETE FROM expenses WHERE id = ?`, [id]);
}

// header + items
async function findById(id) {
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
      WHERE e.id = ?
    `,
    [id]
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
      WHERE ei.expense_id = ?
      ORDER BY ei.id ASC
    `,
    [id]
  );

  return { header, items };
}

// Ro'yxat (type bo'yicha faqat headerlar)
async function listByType(type) {
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
      WHERE e.type = ?
      ORDER BY e.expense_date DESC, e.id DESC
    `,
    [type]
  );
  return rows;
}

/**
 * Ombor harakati yozish (kirim/chiqim)
 * Hozir dekor xarajatlari uchun faqat 'IN' ishlatamiz.
 *
 * warehouse_movements jadvalidan getCurrentStock funksiyasi faqat
 * product_id, branch_id, movement_type, quantity ustunlarini ishlatyapti,
 * shuning uchun shu to‘rttasini yozsak kifoya.
 */
async function insertWarehouseMovement({ product_id, quantity, branch_id = null, movement_type = 'IN' }) {
  await run(
    `
      INSERT INTO warehouse_movements (product_id, branch_id, movement_type, quantity)
      VALUES (?, ?, ?, ?)
    `,
    [product_id, branch_id, movement_type, quantity]
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
