// server/src/modules/transfers/transfers.repository.js

const { run, get, all } = require("../../db/connection");

/**
 * Bitta transferni id bo'yicha, itemlari bilan qaytarish
 */

async function findById(id) {
    const transfer = await get(
        `
    SELECT
      t.id,
      t.transfer_date,
      t.from_branch_id,
      t.to_branch_id,
      t.status,
      t.note,
      t.created_by,
      t.created_at,
      t.updated_at,
      bfrom.name AS from_branch_name,
      bto.name   AS to_branch_name,
      IFNULL(bto.type, 'BRANCH') AS to_branch_type
    FROM transfers t
    LEFT JOIN branches bfrom ON bfrom.id = t.from_branch_id
    LEFT JOIN branches bto   ON bto.id = t.to_branch_id
    WHERE t.id = ?
    `,
        [id]
    );

    if (!transfer) return null;

    const items = await all(
        `
    SELECT
      ti.id,
      ti.transfer_id,
      ti.product_id,
      ti.quantity,
      ti.status,
      p.name AS product_name,
      p.unit AS product_unit
    FROM transfer_items ti
    JOIN products p ON p.id = ti.product_id
    WHERE ti.transfer_id = ?
    ORDER BY ti.id ASC
    `,
        [id]
    );

    return { ...transfer, items };
}


/**
 * Barcha transferlar (admin uchun)
 */
/**
 * Barcha transferlar (admin uchun)
 */
async function findAll() {
    const transfers = await all(
        `
    SELECT
      t.id,
      t.transfer_date,
      t.from_branch_id,
      t.to_branch_id,
      t.status,
      t.note,
      t.created_by,
      t.created_at,
      t.updated_at,
      bfrom.name AS from_branch_name,
      bto.name   AS to_branch_name,
      IFNULL(bto.type, 'BRANCH') AS to_branch_type
    FROM transfers t
    LEFT JOIN branches bfrom ON bfrom.id = t.from_branch_id
    LEFT JOIN branches bto   ON bto.id = t.to_branch_id
    ORDER BY t.id DESC
    `
    );

    const result = [];
    for (const t of transfers) {
        const items = await all(
            `
      SELECT
        ti.id,
        ti.transfer_id,
        ti.product_id,
        ti.quantity,
        ti.status,
        p.name AS product_name,
        p.unit AS product_unit
      FROM transfer_items ti
      JOIN products p ON p.id = ti.product_id
      WHERE ti.transfer_id = ?
      ORDER BY ti.id ASC
      `,
            [t.id]
        );
        result.push({ ...t, items });
    }

    return result;
}


/**
 * Yangi transfer yaratish:
 *  - transfers jadvaliga yozadi
 *  - transfer_items ga yozadi
 *  - markaziy ombordan OUT (warehouse_movements)
 */
async function createTransfer({ transfer_date, to_branch_id, note, created_by, items }) {
    await run("BEGIN TRANSACTION");

    try {
        const fromBranchId = null; // markaziy ombor

        const res = await run(
            `
      INSERT INTO transfers
        (transfer_date, from_branch_id, to_branch_id, status, note, created_by, created_at)
      VALUES
        (?, ?, ?, 'PENDING', ?, ?, datetime('now'))
      `,
            [transfer_date, fromBranchId, to_branch_id, note || null, created_by || null]
        );

        const transferId = res.lastID;

        if (Array.isArray(items) && items.length > 0) {
            for (const item of items) {
                const productId = Number(item.product_id);
                const qty = Number(item.quantity);

                if (!productId || !qty || qty <= 0) continue;

                // 1) transfer_items
                await run(
                    `
          INSERT INTO transfer_items (transfer_id, product_id, quantity, status)
          VALUES (?, ?, ?, 'PENDING')
          `,
                    [transferId, productId, qty]
                );

                // 2) markaziy ombordan OUT
                await run(
                    `
          INSERT INTO warehouse_movements
            (product_id, branch_id, movement_type, source_type, source_id, quantity, created_at)
          VALUES
            (?, NULL, 'OUT', 'transfer', ?, ?, datetime('now'))
          `,
                    [productId, transferId, qty]
                );
            }
        }

        await run("COMMIT");
        return findById(transferId);
    } catch (err) {
        await run("ROLLBACK");
        throw err;
    }
}

/**
 * Berilgan filial uchun kiruvchi transferlar (PENDING yoki PARTIAL)
 */
async function findIncomingForBranch(branchId) {
    const transfers = await all(
        `
    SELECT
      t.id,
      t.transfer_date,
      t.from_branch_id,
      t.to_branch_id,
      t.status,
      t.note,
      t.created_by,
      t.created_at,
      t.updated_at,
      bfrom.name AS from_branch_name,
      bto.name   AS to_branch_name
    FROM transfers t
    LEFT JOIN branches bfrom ON bfrom.id = t.from_branch_id
    LEFT JOIN branches bto   ON bto.id = t.to_branch_id
    WHERE t.to_branch_id = ?
      AND t.status IN ('PENDING', 'PARTIAL')
    ORDER BY t.id ASC
    `,
        [branchId]
    );

    const result = [];
    for (const t of transfers) {
        const items = await all(
            `
      SELECT
        ti.id,
        ti.transfer_id,
        ti.product_id,
        ti.quantity,
        ti.status,
        p.name AS product_name,
        p.unit AS product_unit
      FROM transfer_items ti
      JOIN products p ON p.id = ti.product_id
      WHERE ti.transfer_id = ?
      ORDER BY ti.id ASC
      `,
            [t.id]
        );
        result.push({ ...t, items });
    }

    return result;
}

/**
 * Transfer item statuslarini hisoblab, transfers.status ni yangilash
 */
async function recalcTransferStatus(transferId) {
    const row = await get(
        `
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'ACCEPTED' THEN 1 ELSE 0 END) AS accepted,
      SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected,
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending
    FROM transfer_items
    WHERE transfer_id = ?
    `,
        [transferId]
    );

    const total = row.total || 0;
    const accepted = row.accepted || 0;
    const rejected = row.rejected || 0;
    const pending = row.pending || 0;

    let newStatus = "PENDING";

    if (pending > 0 && (accepted > 0 || rejected > 0)) {
        newStatus = "PARTIAL";
    } else if (pending > 0 && accepted === 0 && rejected === 0) {
        newStatus = "PENDING";
    } else if (pending === 0 && rejected === 0 && accepted > 0) {
        newStatus = "COMPLETED";
    } else if (pending === 0 && accepted === 0 && rejected > 0) {
        newStatus = "CANCELLED";
    } else if (pending === 0 && accepted > 0 && rejected > 0) {
        newStatus = "PARTIAL";
    }

    await run(
        `
    UPDATE transfers
    SET status = ?, updated_at = datetime('now')
    WHERE id = ?
    `,
        [newStatus, transferId]
    );
}

/**
 * Itemni qabul qilish (ACCEPT):
 *  - branch omboriga IN
 *  - item.status = ACCEPTED
 *  - transfer.status ni qayta hisoblash
 */
async function acceptItem({ transferId, itemId, branchId }) {
    await run("BEGIN TRANSACTION");
    try {
        const item = await get(
            `
      SELECT
        ti.id,
        ti.transfer_id,
        ti.product_id,
        ti.quantity,
        ti.status,
        t.to_branch_id
      FROM transfer_items ti
      JOIN transfers t ON t.id = ti.transfer_id
      WHERE ti.id = ?
        AND ti.transfer_id = ?
      `,
            [itemId, transferId]
        );

        if (!item) {
            throw new Error("Transfer item topilmadi");
        }
        if (item.to_branch_id !== branchId) {
            throw new Error("Bu item boshqa filial uchun");
        }
        if (item.status !== "PENDING") {
            throw new Error("Bu item allaqachon qayta ishlangan");
        }

        // Filial omboriga IN
        await run(
            `
      INSERT INTO warehouse_movements
        (product_id, branch_id, movement_type, source_type, source_id, quantity, created_at)
      VALUES
        (?, ?, 'IN', 'transfer', ?, ?, datetime('now'))
      `,
            [item.product_id, branchId, transferId, item.quantity]
        );

        // Item status
        await run(
            `
      UPDATE transfer_items
      SET status = 'ACCEPTED'
      WHERE id = ?
      `,
            [itemId]
        );

        await recalcTransferStatus(transferId);
        await run("COMMIT");

        return findById(transferId);
    } catch (err) {
        await run("ROLLBACK");
        throw err;
    }
}

/**
 * Itemni bekor qilish (REJECT):
 *  - markaziy omborga IN
 *  - item.status = REJECTED
 *  - transfer.status ni qayta hisoblash
 */
async function rejectItem({ transferId, itemId, branchId }) {
    await run("BEGIN TRANSACTION");
    try {
        const item = await get(
            `
      SELECT
        ti.id,
        ti.transfer_id,
        ti.product_id,
        ti.quantity,
        ti.status,
        t.to_branch_id
      FROM transfer_items ti
      JOIN transfers t ON t.id = ti.transfer_id
      WHERE ti.id = ?
        AND ti.transfer_id = ?
      `,
            [itemId, transferId]
        );

        if (!item) {
            throw new Error("Transfer item topilmadi");
        }
        if (item.to_branch_id !== branchId) {
            throw new Error("Bu item boshqa filial uchun");
        }
        if (item.status !== "PENDING") {
            throw new Error("Bu item allaqachon qayta ishlangan");
        }

        // Markaziy omborga IN
        await run(
            `
      INSERT INTO warehouse_movements
        (product_id, branch_id, movement_type, source_type, source_id, quantity, created_at)
      VALUES
        (?, NULL, 'IN', 'transfer', ?, ?, datetime('now'))
      `,
            [item.product_id, transferId, item.quantity]
        );

        // Item status
        await run(
            `
      UPDATE transfer_items
      SET status = 'REJECTED'
      WHERE id = ?
      `,
            [itemId]
        );

        await recalcTransferStatus(transferId);
        await run("COMMIT");

        return findById(transferId);
    } catch (err) {
        await run("ROLLBACK");
        throw err;
    }
}

module.exports = {
    findById,
    findAll,
    findIncomingForBranch,
    createTransfer,
    acceptItem,
    rejectItem,
};
