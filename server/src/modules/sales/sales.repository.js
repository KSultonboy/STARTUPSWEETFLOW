const { run, get } = require('../../db/connection');

/**
 * Berilgan product + branch uchun hozirgi qoldiqni qaytaradi
 */
async function getCurrentStock(tenantId, productId, branchId) {
    const row = await get(
        `
    SELECT 
      COALESCE(
        SUM(
          CASE 
            WHEN movement_type = 'IN' THEN quantity
            ELSE -quantity
          END
        ),
        0
      ) AS quantity
    FROM warehouse_movements
    WHERE product_id = ? AND branch_id = ? AND tenant_id = ?
    `,
        [productId, branchId, tenantId]
    );

    return row ? row.quantity : 0;
}

/**
 * Sotuv yaratish:
 *  - agar allow_negative_stock = false bo'lsa, avval qoldiqni tekshiradi
 *  - sales jadvaliga yozadi
 *  - sale_items jadvaliga yozadi
 *  - warehouse_movements ga OUT yozadi
 */
async function createSale(tenantId, { branch_id, user_id, sale_date, items, allow_negative_stock }) {
    // 0) Qoldiqni tekshirish (faqat allow_negative_stock == false bo'lsa)
    if (!allow_negative_stock) {
        const shortages = [];

        for (const item of items) {
            const { product_id, quantity } = item;
            const currentStock = await getCurrentStock(tenantId, product_id, branch_id);

            if (currentStock < quantity) {
                shortages.push({
                    product_id,
                    required: quantity,
                    available: currentStock,
                });
            }
        }

        if (shortages.length > 0) {
            const err = new Error("Omborda ayrim mahsulotlar yetarli emas");
            err.code = "STOCK_NOT_ENOUGH";
            err.shortages = shortages;
            throw err;
        }
    }

    // Transaction boshlaymiz
    await run('BEGIN TRANSACTION');

    try {
        // 1) Avval sales jadvaliga yozamiz (total_amount hozircha 0)
        const insertSale = await run(
            `
      INSERT INTO sales (tenant_id, branch_id, user_id, sale_date, total_amount, created_at)
      VALUES (?, ?, ?, ?, 0, datetime('now'))
      `,
            [tenantId, branch_id, user_id || null, sale_date]
        );

        const saleId = insertSale.lastID;

        let totalAmount = 0;

        // 2) Har bir itemni sale_items va warehouse_movements ga yozamiz
        for (const item of items) {
            const { product_id, quantity, unit_price } = item;
            const total_price = quantity * unit_price;

            // sale_items
            await run(
                `
        INSERT INTO sale_items (tenant_id, sale_id, product_id, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
                [tenantId, saleId, product_id, quantity, unit_price, total_price]
            );

            totalAmount += total_price;

            // warehouse_movements (OUT)
            await run(
                `
        INSERT INTO warehouse_movements
          (tenant_id, product_id, branch_id, movement_type, source_type, source_id, quantity, created_at)
        VALUES
          (?, ?, ?, 'OUT', 'sale', ?, ?, datetime('now'))
        `,
                [tenantId, product_id, branch_id, saleId, quantity]
            );
        }

        // 3) sales jadvalida total_amount ni yangilaymiz
        await run(
            `
      UPDATE sales
      SET total_amount = ?
      WHERE id = ? AND tenant_id = ?
      `,
            [totalAmount, saleId, tenantId]
        );

        // 4) Yakun: COMMIT
        await run('COMMIT');

        const saleRow = await get(
            `
      SELECT id, branch_id, user_id, sale_date, total_amount, created_at
      FROM sales
      WHERE id = ? AND tenant_id = ?
      `,
            [saleId, tenantId]
        );

        return {
            ...saleRow,
            items,
        };
    } catch (err) {
        await run('ROLLBACK');
        throw err;
    }
}

module.exports = {
    createSale,
};
