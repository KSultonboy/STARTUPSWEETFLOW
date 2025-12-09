const { run, get, all } = require('../../db/connection');

/**
 * Yangi qaytish (vazvrat) yozish:
 *  - returns (status = PENDING)
 *  - return_items (status = PENDING)
 *  - warehouse_movements:
 *      * filial omboridan OUT (rezerv) — APPROVE/CANCEL paytida yana harakat bo'ladi
 */
async function createReturn({ branchId, date, comment, items, userId }) {
    const returnDate = date || new Date().toISOString().slice(0, 10);

    await run('BEGIN TRANSACTION');

    try {
        // 1) returns header
        const result = await run(
            `
        INSERT INTO returns (branch_id, return_date, status, comment, created_by)
        VALUES (?, ?, 'PENDING', ?, ?)
      `,
            [branchId, returnDate, comment || null, userId || null]
        );

        const returnId = result.lastID;

        // 2) return_items + filial OUT (rezerv)
        for (const item of items) {
            const qty = Number(item.quantity);

            await run(
                `
          INSERT INTO return_items (return_id, product_id, quantity, unit, reason, status)
          VALUES (?, ?, ?, ?, ?, 'PENDING')
        `,
                [
                    returnId,
                    item.product_id,
                    qty,
                    item.unit || null,
                    item.reason || null,
                ]
            );

            // Filial omboridan OUT (rezerv)
            await run(
                `
          INSERT INTO warehouse_movements (product_id, branch_id, movement_type, source_type, source_id, quantity)
          VALUES (?, ?, 'OUT', 'RETURN', ?, ?)
        `,
                [item.product_id, branchId, returnId, qty]
            );
        }

        await run('COMMIT');

        const header = await get(
            `
        SELECT
          r.id,
          r.branch_id,
          b.name AS branch_name,
          r.return_date,
          r.status,
          r.comment,
          r.created_at
        FROM returns r
        LEFT JOIN branches b ON b.id = r.branch_id
        WHERE r.id = ?
      `,
            [returnId]
        );

        return header;
    } catch (err) {
        await run('ROLLBACK');
        throw err;
    }
}

/**
 * Qaytishlar ro‘yxati (header + agregatlar)
 */
async function listReturns({ branchId, status, dateFrom, dateTo, limit, offset }) {
    const params = [];
    const conds = [];

    if (branchId) {
        conds.push('r.branch_id = ?');
        params.push(branchId);
    }

    if (status) {
        conds.push('r.status = ?');
        params.push(status);
    }

    if (dateFrom) {
        conds.push('r.return_date >= ?');
        params.push(dateFrom);
    }

    if (dateTo) {
        conds.push('r.return_date <= ?');
        params.push(dateTo);
    }

    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

    params.push(limit, offset);

    const rows = await all(
        `
      SELECT
        r.id,
        r.return_date,
        r.branch_id,
        b.name AS branch_name,
        r.status,
        r.comment,
        IFNULL(SUM(ri.quantity), 0) AS total_quantity,
        COUNT(ri.id) AS item_count
      FROM returns r
      JOIN return_items ri ON ri.return_id = r.id
      LEFT JOIN branches b ON b.id = r.branch_id
      ${where}
      GROUP BY r.id, r.return_date, r.branch_id, b.name, r.status, r.comment
      ORDER BY r.return_date DESC, r.id DESC
      LIMIT ? OFFSET ?
    `,
        params
    );

    return rows;
}

/**
 * Bitta qaytishning to‘liq ma’lumoti (header + items)
 */
async function getReturnById(id) {
    const header = await get(
        `
      SELECT
        r.id,
        r.return_date,
        r.branch_id,
        b.name AS branch_name,
        r.status,
        r.comment,
        r.created_at
      FROM returns r
      LEFT JOIN branches b ON b.id = r.branch_id
      WHERE r.id = ?
    `,
        [id]
    );

    if (!header) return null;

    const items = await all(
        `
      SELECT
        ri.id,
        ri.product_id,
        p.name AS product_name,
        ri.quantity,
        ri.unit,
        ri.reason,
        ri.status
      FROM return_items ri
      JOIN products p ON p.id = ri.product_id
      WHERE ri.return_id = ?
      ORDER BY ri.id ASC
    `,
        [id]
    );

    return { header, items };
}

/**
 * Ichki helper: itemlar statusiga qarab returns.status ni yangilash
 *  - agar kamida bitta PENDING bo'lsa => PENDING
 *  - agar kamida bitta APPROVED bo'lsa => APPROVED
 *  - aks holda (hammasi CANCELED) => CANCELED
 */
async function recalcReturnStatus(returnId) {
    const items = await all(
        `
      SELECT status
      FROM return_items
      WHERE return_id = ?
    `,
        [returnId]
    );

    if (!items || items.length === 0) {
        await run(
            `UPDATE returns SET status = 'CANCELED' WHERE id = ?`,
            [returnId]
        );
        return;
    }

    const hasPending = items.some((x) => x.status === 'PENDING');
    const hasApproved = items.some((x) => x.status === 'APPROVED');

    let newStatus = 'CANCELED';
    if (hasPending) {
        newStatus = 'PENDING';
    } else if (hasApproved) {
        newStatus = 'APPROVED';
    }

    await run(
        `UPDATE returns SET status = ? WHERE id = ?`,
        [newStatus, returnId]
    );
}

/**
 * Admin BARCHA PENDING itemlarni tasdiqlaydi:
 *  - markaziy omborga IN
 *  - item.status = APPROVED
 *  - returns.status qayta hisoblanadi
 */
async function approveReturnAllPending(id, adminId) {
    await run('BEGIN TRANSACTION');

    try {
        const header = await get(
            `
        SELECT
          r.id,
          r.branch_id,
          r.status
        FROM returns r
        WHERE r.id = ?
      `,
            [id]
        );

        if (!header) {
            throw new Error('Qaytish topilmadi.');
        }

        // PENDING bo'lsa yaxshi, APPROVED/CANCELED ham bo'lishi mumkin,
        // biz faqat PENDING itemlarga tegamiz.
        const items = await all(
            `
        SELECT
          ri.id,
          ri.product_id,
          ri.quantity,
          ri.status
        FROM return_items ri
        WHERE ri.return_id = ?
      `,
            [id]
        );

        const pendingItems = items.filter((it) => it.status === 'PENDING');

        if (!pendingItems.length) {
            // Tasdiqlanadigan item yo'q — bu xato emas, lekin foydalanuvchiga aytamiz
            throw new Error('Tasdiqlanadigan mahsulot yo‘q.');
        }

        for (const it of pendingItems) {
            const qty = Number(it.quantity);

            // Markaziy omborga IN (branch_id = NULL)
            await run(
                `
          INSERT INTO warehouse_movements (product_id, branch_id, movement_type, source_type, source_id, quantity)
          VALUES (?, NULL, 'IN', 'RETURN', ?, ?)
        `,
                [it.product_id, header.id, qty]
            );

            // Item status = APPROVED
            await run(
                `
          UPDATE return_items
          SET status = 'APPROVED'
          WHERE id = ?
        `,
                [it.id]
            );
        }

        await recalcReturnStatus(id);

        await run('COMMIT');
    } catch (err) {
        await run('ROLLBACK');
        throw err;
    }
}

/**
 * Bitta itemni APPROVE qilish (admin)
 *  - markaziy omborga IN
 *  - item.status = APPROVED
 *  - returns.status qayta hisoblanadi
 */
async function approveReturnItem(returnId, itemId, adminId) {
    await run('BEGIN TRANSACTION');

    try {
        const header = await get(
            `
        SELECT
          r.id,
          r.branch_id,
          r.status
        FROM returns r
        WHERE r.id = ?
      `,
            [returnId]
        );

        if (!header) {
            throw new Error('Qaytish topilmadi.');
        }

        const item = await get(
            `
        SELECT
          ri.id,
          ri.product_id,
          ri.quantity,
          ri.status
        FROM return_items ri
        WHERE ri.id = ? AND ri.return_id = ?
      `,
            [itemId, returnId]
        );

        if (!item) {
            throw new Error('Mahsulot bandi topilmadi.');
        }

        if (item.status !== 'PENDING') {
            throw new Error('Bu mahsulot allaqachon qayta ishlangan.');
        }

        const qty = Number(item.quantity);

        await run(
            `
        INSERT INTO warehouse_movements (product_id, branch_id, movement_type, source_type, source_id, quantity)
        VALUES (?, NULL, 'IN', 'RETURN', ?, ?)
      `,
            [item.product_id, header.id, qty]
        );

        await run(
            `
        UPDATE return_items
        SET status = 'APPROVED'
        WHERE id = ?
      `,
            [item.id]
        );

        await recalcReturnStatus(returnId);

        await run('COMMIT');
    } catch (err) {
        await run('ROLLBACK');
        throw err;
    }
}

/**
 * Bitta itemni CANCEL qilish (admin)
 *  - filial omboriga IN (rezervni qaytarish)
 *  - item.status = CANCELED
 *  - returns.status qayta hisoblanadi
 */
async function cancelReturnItem(returnId, itemId, adminId) {
    await run('BEGIN TRANSACTION');

    try {
        const header = await get(
            `
        SELECT
          r.id,
          r.branch_id,
          r.status
        FROM returns r
        WHERE r.id = ?
      `,
            [returnId]
        );

        if (!header) {
            throw new Error('Qaytish topilmadi.');
        }

        const item = await get(
            `
        SELECT
          ri.id,
          ri.product_id,
          ri.quantity,
          ri.status
        FROM return_items ri
        WHERE ri.id = ? AND ri.return_id = ?
      `,
            [itemId, returnId]
        );

        if (!item) {
            throw new Error('Mahsulot bandi topilmadi.');
        }

        if (item.status !== 'PENDING') {
            throw new Error('Bu mahsulot allaqachon qayta ishlangan.');
        }

        const qty = Number(item.quantity);

        // Filial omboriga IN (rezervni qaytarish)
        await run(
            `
        INSERT INTO warehouse_movements (product_id, branch_id, movement_type, source_type, source_id, quantity)
        VALUES (?, ?, 'IN', 'RETURN_CANCEL', ?, ?)
      `,
            [item.product_id, header.branch_id, header.id, qty]
        );

        await run(
            `
        UPDATE return_items
        SET status = 'CANCELED'
        WHERE id = ?
      `,
            [item.id]
        );

        await recalcReturnStatus(returnId);

        await run('COMMIT');
    } catch (err) {
        await run('ROLLBACK');
        throw err;
    }
}

module.exports = {
    createReturn,
    listReturns,
    getReturnById,
    approveReturnAllPending,
    approveReturnItem,
    cancelReturnItem,
};
