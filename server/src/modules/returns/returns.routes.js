const express = require('express');
const router = express.Router();
const controller = require('./returns.controller');
const { requireAuth } = require('../../middleware/auth');

// GET /api/returns
router.get('/', requireAuth, controller.listReturns);

// GET /api/returns/:id
router.get('/:id', requireAuth, controller.getReturnById);

// POST /api/returns
router.post('/', requireAuth, controller.createReturn);

// POST /api/returns/:id/approve  – BARCHA pending itemlar
router.post('/:id/approve', requireAuth, controller.approveReturn);

// POST /api/returns/:id/items/:itemId/approve – bitta itemni tasdiqlash
router.post(
    '/:id/items/:itemId/approve',
    requireAuth,
    controller.approveReturnItem
);

// POST /api/returns/:id/items/:itemId/cancel – bitta itemni bekor qilish
router.post(
    '/:id/items/:itemId/cancel',
    requireAuth,
    controller.cancelReturnItem
);

module.exports = router;
