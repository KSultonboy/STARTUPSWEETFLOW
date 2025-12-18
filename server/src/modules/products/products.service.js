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
    const barcode = (data.barcode || '').trim() || null;

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
        barcode,
    };

    // Agar barcode berilgan bo'lsa, shu tenant ichida unique ekanini tekshiramiz
    if (barcode) {
        const existing = await repo.findByBarcode(tenantId, barcode);
        if (existing) {
            throw new Error('Bu shtrix kod ushbu tenantdagi boshqa mahsulotga biriktirilgan.');
        }
    }

    return repo.create(tenantId, payload);
}

async function updateProduct(tenantId, id, data) {
    if (!id) {
        throw new Error('Noto‘g‘ri mahsulot ID');
    }

    const name = (data.name || '').trim();
    const unit = (data.unit || '').trim();
    const barcode = (data.barcode || '').trim() || null;

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
        barcode,
    };

    if (barcode) {
        const existing = await repo.findByBarcode(tenantId, barcode);
        if (existing && existing.id !== id) {
            throw new Error('Bu shtrix kod ushbu tenantdagi boshqa mahsulotga biriktirilgan.');
        }
    }

    return repo.update(tenantId, id, payload);
}

async function deleteProduct(tenantId, id) {
    if (!id) {
        throw new Error('Noto‘g‘ri mahsulot ID');
    }
    await repo.remove(tenantId, id);
}

async function getProductByBarcode(tenantId, barcode) {
    const trimmed = (barcode || '').trim();
    if (!trimmed) return null;
    return repo.findByBarcode(tenantId, trimmed);
}

module.exports = {
    getAllProducts,
    getDecorationProducts,
    getUtilityProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductByBarcode,
};
