const repo = require('./returns.repository');

function validateReturnInput(payload) {
    if (!payload || typeof payload !== 'object') {
        throw new Error('Ma’lumot kiritilmadi.');
    }

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
        throw new Error('Kamida bitta mahsulot kiriting.');
    }

    for (let i = 0; i < payload.items.length; i++) {
        const it = payload.items[i] || {};
        const row = i + 1;

        if (!it.product_id) {
            throw new Error(`(${row}-qatorda) mahsulot tanlanmagan.`);
        }

        const qty = Number(it.quantity);
        if (!Number.isFinite(qty) || qty <= 0) {
            throw new Error(`(${row}-qatorda) miqdor noto‘g‘ri.`);
        }
    }
}

/**
 * Yangi qaytish yaratish
 *  - filial (branch) user: faqat o'z filialidan
 *  - admin: hozircha qaytish yaratmaydi, faqat ko'radi/tasdiqlaydi
 */
async function createReturn(tenantId, payload, user) {
    if (!user) {
        throw new Error('Foydalanuvchi aniqlanmadi.');
    }

    if (user.role !== 'branch' && user.role !== 'admin') {
        throw new Error('Sizda qaytish yaratish huquqi yo‘q.');
    }

    validateReturnInput(payload);

    let branchId = null;

    if (user.role === 'branch') {
        branchId = user.branch_id || payload.branch_id || null;
    } else if (user.role === 'admin') {
        branchId = payload.branch_id || null;
    }

    if (!branchId) {
        throw new Error('Filial aniqlanmadi.');
    }

    const created = await repo.createReturn({
        tenantId,
        branchId,
        date: payload.date,
        comment: payload.comment,
        items: payload.items,
        userId: user.id,
    });

    return created;
}

/**
 * Qaytishlar ro'yxati
 *  - admin: hammasi (filter bilan)
 *  - branch: faqat o'z filialidagilar
 */
async function listReturns(tenantId, filters, user) {
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    let branchId = null;
    let status = null;

    if (user && user.role === 'branch') {
        branchId = user.branch_id || null;
    } else if (user && user.role === 'admin') {
        if (filters.branch_id && filters.branch_id !== 'all') {
            branchId = filters.branch_id;
        }
        if (filters.status && filters.status !== 'all') {
            status = filters.status;
        }
    }

    const rows = await repo.listReturns({
        tenantId,
        branchId,
        status,
        dateFrom: filters.date_from || null,
        dateTo: filters.date_to || null,
        limit,
        offset,
    });

    return rows;
}

/**
 * Bitta qaytishni olish
 */
async function getReturnById(tenantId, id, user) {
    const data = await repo.getReturnById(tenantId, id);
    if (!data) return null;

    // Branch user – faqat o'z filialidagi qaytishni ko'radi
    if (user && user.role === 'branch') {
        if (data.header.branch_id !== user.branch_id) {
            throw new Error('Bu qaytishga kirish huquqingiz yo‘q.');
        }
    }

    return data;
}

/**
 * Admin BARCHA PENDING itemlarni tasdiqlaydi
 */
async function approveReturn(id, user) {
    if (!user || user.role !== 'admin') {
        throw new Error('Faqat admin qaytishni tasdiqlashi mumkin.');
    }

    await repo.approveReturnAllPending(id, user.id);
}

/**
 * Admin bitta itemni tasdiqlaydi
 */
async function approveReturnItem(id, itemId, user) {
    if (!user || user.role !== 'admin') {
        throw new Error('Faqat admin mahsulotni tasdiqlashi mumkin.');
    }

    await repo.approveReturnItem(id, itemId, user.id);
}

/**
 * Admin bitta itemni bekor qiladi
 */
async function cancelReturnItem(id, itemId, user) {
    if (!user || user.role !== 'admin') {
        throw new Error('Faqat admin mahsulotni bekor qilishi mumkin.');
    }

    await repo.cancelReturnItem(id, itemId, user.id);
}

/**
 * Qaytishni tahrirlash (faqat PENDING)
 *  - branch: faqat o'z filialidagi qaytishni tahrirlaydi
 *  - admin: istalgan PENDING qaytishni tahrirlay oladi
 */
async function updateReturn(id, payload, user) {
    if (!user) {
        throw new Error('Foydalanuvchi aniqlanmadi.');
    }

    if (user.role !== 'branch' && user.role !== 'admin') {
        throw new Error('Sizda qaytishni tahrirlash huquqi yo‘q.');
    }

    validateReturnInput(payload);

    const existing = await repo.getReturnById(user.tenantId, id);
    if (!existing) {
        throw new Error('Qaytish topilmadi.');
    }

    if (existing.header.status !== 'PENDING') {
        throw new Error('Faqat kutilayotgan vazvratni tahrirlash mumkin.');
    }

    let branchId = null;

    if (user.role === 'branch') {
        if (existing.header.branch_id !== user.branch_id) {
            throw new Error('Bu qaytishga kirish huquqingiz yo‘q.');
        }
        branchId = existing.header.branch_id;
    } else if (user.role === 'admin') {
        // Admin branchni ham o‘zgartira olishi mumkin, hozircha optional
        branchId = payload.branch_id || existing.header.branch_id;
    }

    if (!branchId) {
        throw new Error('Filial aniqlanmadi.');
    }

    const updated = await repo.updateReturn(id, {
        branchId,
        date: payload.date,
        comment: payload.comment,
        items: payload.items,
        userId: user.id,
    });

    return updated;
}

/**
 * Qaytishni o‘chirish (faqat PENDING)
 *  - branch: faqat o'z filialidagi qaytishni o'chira oladi
 *  - admin: istalgan PENDING qaytishni o‘chira oladi
 */
async function deleteReturn(id, user) {
    if (!user) {
        throw new Error('Foydalanuvchi aniqlanmadi.');
    }

    if (user.role !== 'branch' && user.role !== 'admin') {
        throw new Error('Sizda qaytishni o‘chirish huquqi yo‘q.');
    }

    const existing = await repo.getReturnById(user.tenantId, id);
    if (!existing) {
        throw new Error('Qaytish topilmadi.');
    }

    if (existing.header.status !== 'PENDING') {
        throw new Error('Faqat kutilayotgan vazvratni o‘chirish mumkin.');
    }

    if (user.role === 'branch' && existing.header.branch_id !== user.branch_id) {
        throw new Error('Bu qaytishga kirish huquqingiz yo‘q.');
    }

    await repo.deleteReturn(id);
}

module.exports = {
    createReturn,
    listReturns,
    getReturnById,
    approveReturn,
    approveReturnItem,
    cancelReturnItem,
    // 🔴 yangi servislar
    updateReturn,
    deleteReturn,
};
