const repo = require('./products.repository');

async function getAllProducts(tenantId) {
    return repo.findAll(tenantId);
}

async function getDecorationProducts(tenantId) {
    return repo.findDecorations(tenantId);
}

async function getUtilityProducts(tenantId) {
    return repo.findUtilities(tenantId);
}

async function createProduct(tenantId, data) {
    const name = (data.name || '').trim();
    const unit = (data.unit || '').trim();

    if (!name) {
        throw new Error('Mahsulot nomi majburiy.');
    }
    if (!unit) {
        throw new Error('O‘lchov birligi majburiy.');
    }

    const existingByName = await repo.findByName(tenantId, name);
    if (existingByName) {
        throw new Error('Bu nomdagi mahsulot allaqachon mavjud.');
    }


    const payload = {
        name,
        unit,
        category: data.category || 'PRODUCT', // PRODUCT / DECORATION / UTILITY
        price: Number(data.price) || 0,
        wholesale_price: Number(data.wholesale_price) || 0,
    };

    return repo.create(tenantId, payload);
}

async function updateProduct(tenantId, id, data) {
    if (!id) {
        throw new Error('Noto‘g‘ri mahsulot ID');
    }

    const name = (data.name || '').trim();
    const unit = (data.unit || '').trim();

    if (!name) {
        throw new Error('Mahsulot nomi majburiy.');
    }
    if (!unit) {
        throw new Error('O‘lchov birligi majburiy.');
    }

    const existingByName = await repo.findByName(tenantId, name);
    if (existingByName && Number(existingByName.id) !== Number(id)) {
        throw new Error('Bu nomdagi mahsulot allaqachon mavjud.');
    }


    const payload = {
        name,
        unit,
        category: data.category || 'PRODUCT',
        price: Number(data.price) || 0,
        wholesale_price: Number(data.wholesale_price) || 0,
    };

    return repo.update(tenantId, id, payload);
}

async function deleteProduct(tenantId, id) {
    if (!id) {
        throw new Error('Noto‘g‘ri mahsulot ID');
    }
    await repo.remove(tenantId, id);
}

module.exports = {
    getAllProducts,
    getDecorationProducts,
    getUtilityProducts,
    createProduct,
    updateProduct,
    deleteProduct,
};
