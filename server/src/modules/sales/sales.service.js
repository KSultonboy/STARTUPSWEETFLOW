const repo = require('./sales.repository');

function validateSaleInput(data) {
    if (!data) {
        throw new Error("Ma'lumot yuborilmadi");
    }

    const { branch_id, user_id, sale_date, items, allow_negative_stock } = data;

    if (!branch_id) {
        throw new Error("branch_id majburiy");
    }

    if (!sale_date) {
        throw new Error("sale_date majburiy (YYYY-MM-DD)");
    }

    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Hech bo'lmaganda bitta pozitsiya (item) bo'lishi kerak");
    }

    const cleanedItems = items
        .map((item) => ({
            product_id: Number(item.product_id) || null,
            quantity: Number(item.quantity) || 0,
            unit_price: Number(item.unit_price) || 0,
        }))
        .filter((i) => i.product_id && i.quantity > 0);

    if (cleanedItems.length === 0) {
        throw new Error("Kamida bitta to'g'ri to'ldirilgan pozitsiya kerak");
    }

    return {
        branch_id: Number(branch_id),
        user_id: user_id ? Number(user_id) : null,
        sale_date,
        items: cleanedItems,
        allow_negative_stock: !!allow_negative_stock,
    };
}

async function createSale(tenantId, data) {
    const validData = validateSaleInput(data);
    const sale = await repo.createSale(tenantId, validData);
    return sale;
}

module.exports = {
    createSale,
};
