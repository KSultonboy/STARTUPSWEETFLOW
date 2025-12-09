const service = require('./products.service');

async function getAllProducts(req, res) {
    try {
        const products = await service.getAllProducts();
        res.json(products);
    } catch (err) {
        console.error('getAllProducts error:', err);
        res.status(500).json({ message: 'Server xatosi' });
    }
}

async function getDecorationProducts(req, res) {
    try {
        const products = await service.getDecorationProducts();
        res.json(products);
    } catch (err) {
        console.error('getDecorationProducts error:', err);
        res.status(500).json({ message: 'Server xatosi' });
    }
}

async function getUtilityProducts(req, res) {
    try {
        const products = await service.getUtilityProducts();
        res.json(products);
    } catch (err) {
        console.error('getUtilityProducts error:', err);
        res.status(500).json({ message: 'Server xatosi' });
    }
}

async function createProduct(req, res) {
    try {
        const product = await service.createProduct(req.body);
        res.status(201).json(product);
    } catch (err) {
        console.error('createProduct error:', err);
        res.status(400).json({ message: err.message || "Xato so'rov" });
    }
}

async function updateProduct(req, res) {
    try {
        const id = Number(req.params.id);
        if (!id) {
            return res.status(400).json({ message: 'Noto‘g‘ri ID' });
        }
        const product = await service.updateProduct(id, req.body);
        res.json(product);
    } catch (err) {
        console.error('updateProduct error:', err);
        if (err.message === 'Mahsulot topilmadi') {
            return res.status(404).json({ message: err.message });
        }
        res.status(400).json({ message: err.message || "Xato so'rov" });
    }
}

async function deleteProduct(req, res) {
    try {
        const id = Number(req.params.id);
        if (!id) {
            return res.status(400).json({ message: 'Noto‘g‘ri ID' });
        }
        await service.deleteProduct(id);
        res.status(204).end();
    } catch (err) {
        console.error('deleteProduct error:', err);
        if (err.message === 'Mahsulot topilmadi') {
            return res.status(404).json({ message: err.message });
        }
        res.status(400).json({ message: err.message || "Xato so'rov" });
    }
}

module.exports = {
    getAllProducts,
    getDecorationProducts,
    getUtilityProducts,
    createProduct,
    updateProduct,
    deleteProduct,
};
