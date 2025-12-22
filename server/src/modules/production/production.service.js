// server/src/modules/production/production.service.js

const repo = require("./production.repository");

function validateBatchInput(data = {}) {
    const { batch_date, shift, note, created_by, items } = data;

    if (!batch_date) {
        throw new Error("batch_date majburiy (YYYY-MM-DD)");
    }

    const cleaned = {
        batch_date,
        shift: shift || null,
        note: note || null,
        created_by: created_by ? Number(created_by) : null,
        items: [],
    };

    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Kamida bitta mahsulot kiritish kerak");
    }

    const cleanedItems = items
        .map((i) => ({
            product_id: Number(i.product_id) || 0,
            quantity: Number(i.quantity) || 0,
        }))
        .filter((i) => i.product_id && i.quantity > 0);

    if (cleanedItems.length === 0) {
        throw new Error(
            "Kamida bitta to'g'ri mahsulot kiritish kerak (product_id va quantity > 0)"
        );
    }

    cleaned.items = cleanedItems;
    return cleaned;
}

async function createBatch(tenantId, data) {
    const valid = validateBatchInput(data);

    return repo.createBatch(tenantId, valid);
}

async function getBatches(tenantId, query) {
    const date = query?.date || null;
    return repo.findBatches({ tenantId, date });
}

async function getBatchById(tenantId, id) {
    const batch = await repo.findBatchById(tenantId, id);
    if (!batch) {
        throw new Error("Partiya topilmadi");
    }
    return batch;
}

async function updateBatch(tenantId, id, data) {
    const exists = await repo.findBatchById(tenantId, id);
    if (!exists) {
        throw new Error("Partiya topilmadi");
    }
    const valid = validateBatchInput(data);
    return repo.updateBatch(tenantId, id, valid);
}

async function deleteBatch(tenantId, id) {
    const exists = await repo.findBatchById(tenantId, id);
    if (!exists) {
        throw new Error("Partiya topilmadi");
    }
    await repo.deleteBatch(tenantId, id);
}

module.exports = {
    createBatch,
    getBatches,
    getBatchById,
    updateBatch,
    deleteBatch,
};
