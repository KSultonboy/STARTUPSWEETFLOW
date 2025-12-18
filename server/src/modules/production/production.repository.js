// server/src/modules/production/production.repository.js

const { run, get, all } = require("../../db/connection");

/**
 * Bir partiyani id bo'yicha olish (+ items)
 */
async function findBatchById(tenantId, id) {
    const batch = await get(
        `
    SELECT
      pb.id,
      pb.batch_date,
      pb.shift,
      pb.created_by,
      pb.note,
      pb.created_at
    FROM production_batches pb
    WHERE pb.id = ? AND pb.tenant_id = ?
    `,
        [id, tenantId]
    );

    if (!batch) return null;

    const items = await all(
        `
    SELECT
      pi.id,
      pi.batch_id,
      pi.product_id,
      pi.quantity,
      p.name AS product_name,
      p.unit AS product_unit
    FROM production_items pi
    JOIN products p ON p.id = pi.product_id
    WHERE pi.batch_id = ? AND pi.tenant_id = ?
    ORDER BY pi.id ASC
    `,
        [id, tenantId]
    );

    return { ...batch, items };
}

/**
 * Yangi ishlab chiqarish partiyasi yaratish
 *  - production_batches ga yozadi
 *  - production_items ga yozadi
 *  - warehouse_movements ga IN yozadi (markaziy ombor)
 */
async function createBatch(tenantId, { batch_date, shift, created_by, note, items }) {
    await run("BEGIN TRANSACTION");

    try {
        const result = await run(
            `
      INSERT INTO production_batches (tenant_id, batch_date, shift, created_by, note, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      `,
            [tenantId, batch_date, shift || null, created_by || null, note || null]
        );

        const batchId = result.lastID;

        if (Array.isArray(items) && items.length > 0) {
            for (const item of items) {
                const productId = Number(item.product_id);
                const qty = Number(item.quantity);

                if (!productId || !qty || qty <= 0) continue;

                // production_items
                await run(
                    `
          INSERT INTO production_items (tenant_id, batch_id, product_id, quantity)
          VALUES (?, ?, ?, ?)
          `,
                    [tenantId, batchId, productId, qty]
                );

                // warehouse_movements: markaziy omborga IN
                await run(
                    `
          INSERT INTO warehouse_movements
            (tenant_id, product_id, branch_id, movement_type, source_type, source_id, quantity, created_at)
          VALUES
            (?, ?, NULL, 'IN', 'production', ?, ?, datetime('now'))
          `,
                    [tenantId, productId, batchId, qty]
                );
            }
        }

        await run("COMMIT");
        return findBatchById(tenantId, batchId);
    } catch (err) {
        await run("ROLLBACK");
        throw err;
    }
}

/**
 * Partiyalar ro'yxati (ixtiyoriy sana bo'yicha filter)
 */
async function findBatches({ tenantId, date } = {}) {
    let where = "WHERE pb.tenant_id = ?";
    const params = [tenantId];

    if (date) {
        where += " AND pb.batch_date = ?";
        params.push(date);
    }

    const batches = await all(
        `
    SELECT
      pb.id,
      pb.batch_date,
      pb.shift,
      pb.created_by,
      pb.note,
      pb.created_at
    FROM production_batches pb
    ${where}
    ORDER BY pb.batch_date DESC, pb.id DESC
    `,
        params
    );

    // har bir batchga items ulab beramiz
    const result = [];
    for (const b of batches) {
        const items = await all(
            `
      SELECT
        pi.id,
        pi.batch_id,
        pi.product_id,
        pi.quantity,
        p.name AS product_name,
        p.unit AS product_unit
      FROM production_items pi
      JOIN products p ON p.id = pi.product_id
      WHERE pi.batch_id = ?
      ORDER BY pi.id ASC
      `,
            [b.id]
        );
        result.push({ ...b, items });
    }

    return result;
}

/**
 * Partiyani yangilash:
 *  - production_batches update
 *  - eski production_items va warehouse_movements (source_type='production') ni o'chirib tashlaydi
 *  - yangilarini qaytadan yozadi
 */
async function updateBatch(tenantId, id, { batch_date, shift, created_by, note, items }) {
    await run("BEGIN TRANSACTION");

    try {
        await run(
            `
      UPDATE production_batches
      SET
        batch_date = ?,
        shift = ?,
        created_by = ?,
        note = ?
      WHERE id = ? AND tenant_id = ?
      `,
            [batch_date, shift || null, created_by || null, note || null, id, tenantId]
        );

        // Eski items
        await run(`DELETE FROM production_items WHERE batch_id = ? AND tenant_id = ?`, [id, tenantId]);

        // Eski ombor yozuvlari
        await run(
            `
      DELETE FROM warehouse_movements
      WHERE tenant_id = ? AND source_type = 'production' AND source_id = ?
      `,
            [tenantId, id]
        );

        if (Array.isArray(items) && items.length > 0) {
            for (const item of items) {
                const productId = Number(item.product_id);
                const qty = Number(item.quantity);

                if (!productId || !qty || qty <= 0) continue;

                await run(
                    `
          INSERT INTO production_items (tenant_id, batch_id, product_id, quantity)
          VALUES (?, ?, ?, ?)
          `,
                    [tenantId, id, productId, qty]
                );

                await run(
                    `
          INSERT INTO warehouse_movements
            (tenant_id, product_id, branch_id, movement_type, source_type, source_id, quantity, created_at)
          VALUES
            (?, ?, NULL, 'IN', 'production', ?, ?, datetime('now'))
          `,
                    [tenantId, productId, id, qty]
                );
            }
        }

        await run("COMMIT");
        return findBatchById(tenantId, id);
    } catch (err) {
        await run("ROLLBACK");
        throw err;
    }
}

/**
 * Partiyani o'chirish:
 *  - production_items
 *  - warehouse_movements (source_type=production)
 *  - production_batches
 */
async function deleteBatch(tenantId, id) {
    await run("BEGIN TRANSACTION");

    try {
        await run(`DELETE FROM production_items WHERE batch_id = ? AND tenant_id = ?`, [id, tenantId]);

        await run(
            `
      DELETE FROM warehouse_movements
      WHERE tenant_id = ? AND source_type = 'production' AND source_id = ?
      `,
            [tenantId, id]
        );

        await run(`DELETE FROM production_batches WHERE id = ? AND tenant_id = ?`, [id, tenantId]);

        await run("COMMIT");
    } catch (err) {
        await run("ROLLBACK");
        throw err;
    }
}

module.exports = {
    findBatchById,
    findBatches,
    createBatch,
    updateBatch,
    deleteBatch,
};
