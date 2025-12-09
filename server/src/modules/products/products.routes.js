const express = require('express');
const router = express.Router();
const controller = require('./products.controller');

// GET /api/products
router.get('/', controller.getAllProducts);

// GET /api/products/decorations – bezak mahsulotlar
router.get('/decorations', controller.getDecorationProducts);

// ✅ YANGI: kommunal (UTILITY) mahsulotlar
router.get('/utilities', controller.getUtilityProducts);

// POST /api/products
router.post('/', controller.createProduct);

// PUT /api/products/:id
router.put('/:id', controller.updateProduct);

// DELETE /api/products/:id
router.delete('/:id', controller.deleteProduct);

module.exports = router;
