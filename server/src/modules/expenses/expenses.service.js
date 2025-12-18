const repo = require('./expenses.repository');

/**
 * items massivini tozalab, faqat haqiqiy bandlarni qaytaradi.
 */
function normalizeItems(rawItems) {
    const items = Array.isArray(rawItems) ? rawItems : [];
    const result = [];

    for (const row of items) {
        const productId = row.product_id ? Number(row.product_id) : null;
        const name = (row.name || '').trim();
        const qty = Number(row.quantity || 0);
        const unitPrice = Number(row.unit_price || 0);

        // butunlay bo'sh qator -> skip
        if (!productId && !name) continue;
        if (!qty || qty <= 0) continue;
        if (!unitPrice || unitPrice <= 0) continue;

        const total = qty * unitPrice;

        result.push({
            product_id: productId,
            name,
            quantity: qty,
            unit_price: unitPrice,
            total_price: total,
        });
    }

    return result;
}

/**
 * Kiruvchi so'rovni validatsiya qilish
 */
function validateExpenseInput(body) {
    const expense_date = (body.date || body.expense_date || '').trim();
    const type = (body.type || '').trim(); // ingredients / decor / utility
    const description = (body.description || '').trim();

    if (!expense_date) {
        throw new Error('Sana majburiy.');
    }
    if (!type) {
        throw new Error('Xarajat turi majburiy.');
    }

    const normalizedItems = normalizeItems(body.items);

    if (!normalizedItems.length) {
        throw new Error('Kamida bitta xarajat bandini kiriting.');
    }

    const total_amount = normalizedItems.reduce(
        (sum, it) => sum + (it.total_price || 0),
        0
    );

    return {
        expense_date,
        type,
        description,
        items: normalizedItems,
        total_amount,
    };
}

async function createExpense(tenantId, body, currentUser) {
    const validated = validateExpenseInput(body);

    const payload = {
        expense_date: validated.expense_date,
        type: validated.type, // 'ingredients' | 'decor' | 'utility'
        total_amount: validated.total_amount,
        description: validated.description,
        created_by: currentUser?.id || null,
    };

    const expenseId = await repo.insertExpense(tenantId, payload);

    // Expense bandlarini yozamiz
    for (const item of validated.items) {
        await repo.insertExpenseItem(tenantId, expenseId, item);
    }

    // 🟢 DEKOR xarajatlari omborga kirim bo'lishi kerak
    if (validated.type === 'decor') {
        const branchId = body.branch_id || null; // hozircha yo'q bo'lsa, markaziy

        for (const item of validated.items) {
            if (!item.product_id) continue;
            if (!item.quantity || item.quantity <= 0) continue;

            await repo.insertWarehouseMovement(tenantId, {
                product_id: item.product_id,
                quantity: item.quantity,
                branch_id: branchId,
                movement_type: 'IN',
            });
        }
    }

    return getExpenseById(tenantId, expenseId);
}

async function updateExpense(tenantId, id, body, currentUser) {
    if (!id) {
        throw new Error('Noto‘g‘ri xarajat ID');
    }

    // validatsiya & totalni qayta hisoblash
    const validated = validateExpenseInput(body);

    const existing = await repo.findById(tenantId, id);
    if (!existing) {
        throw new Error('Xarajat topilmadi');
    }

    const payload = {
        expense_date: validated.expense_date,
        type: validated.type,
        total_amount: validated.total_amount,
        description: validated.description,
    };

    // headerni yangilash
    await repo.updateExpenseHeader(tenantId, id, payload);

    // eski itemlarni o'chirib, yangilarini yozamiz
    await repo.deleteExpenseItems(tenantId, id);
    for (const item of validated.items) {
        await repo.insertExpenseItem(tenantId, id, item);
    }

    return getExpenseById(tenantId, id);
}

async function deleteExpense(tenantId, id) {
    if (!id) {
        throw new Error('Noto‘g‘ri xarajat ID');
    }
    const existing = await repo.findById(tenantId, id);
    if (!existing) {
        throw new Error('Xarajat topilmadi');
    }

    await repo.deleteExpenseItems(tenantId, id);
    await repo.deleteExpense(tenantId, id);
}

async function getExpensesByType(tenantId, type) {
    const t = (type || '').trim();
    if (!t) {
        throw new Error('type parametri majburiy');
    }

    const headers = await repo.listByType(tenantId, t);
    const result = [];

    for (const h of headers) {
        const full = await repo.findById(tenantId, h.id);
        if (!full) continue;

        result.push({
            id: full.header.id,
            expense_date: full.header.expense_date,
            type: full.header.type,
            total_amount: full.header.total_amount,
            description: full.header.description,
            created_by: full.header.created_by,
            created_at: full.header.created_at,
            items: full.items,
        });
    }

    return result;
}

async function getExpenseById(tenantId, id) {
    const exp = await repo.findById(tenantId, id);
    if (!exp) {
        throw new Error('Xarajat topilmadi');
    }

    return {
        id: exp.header.id,
        expense_date: exp.header.expense_date,
        type: exp.header.type,
        total_amount: exp.header.total_amount,
        description: exp.header.description,
        created_by: exp.header.created_by,
        created_at: exp.header.created_at,
        items: exp.items,
    };
}

module.exports = {
    createExpense,
    updateExpense,
    deleteExpense,
    getExpensesByType,
    getExpenseById,
};
