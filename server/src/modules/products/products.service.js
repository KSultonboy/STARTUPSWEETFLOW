const repo = require('./products.repository');

async function getAllProducts() {
    return repo.findAll();
}

async function getDecorationProducts() {
    return repo.findDecorations();
}

async function getUtilityProducts() {
    return repo.findUtilities();
}

async function createProduct(data) {
    const name = (data.name || '').trim();
    const unit = (data.unit || '').trim();

    if (!name) {
        throw new Error('Mahsulot nomi majburiy.');
    }
    if (!unit) {
        throw new Error('O‘lchov birligi majburiy.');
    }

    const payload = {
        name,
        unit,
        category: data.category || 'PRODUCT', // PRODUCT / DECORATION / UTILITY
        price: Number(data.price) || 0,
        wholesale_price: Number(data.wholesale_price) || 0,
    };

    return repo.create(payload);
}

async function updateProduct(id, data) {
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

    const payload = {
        name,
        unit,
        category: data.category || 'PRODUCT',
        price: Number(data.price) || 0,
        wholesale_price: Number(data.wholesale_price) || 0,
    };

    return repo.update(id, payload);
}

async function deleteProduct(id) {
    if (!id) {
        throw new Error('Noto‘g‘ri mahsulot ID');
    }
    await repo.remove(id);
}

module.exports = {
    getAllProducts,
    getDecorationProducts,
    getUtilityProducts,
    createProduct,
    updateProduct,
    deleteProduct,
};
