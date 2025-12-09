const express = require('express');
const router = express.Router();
const controller = require('./expenses.controller');

// GET /api/expenses?type=ingredients|decor|utility
router.get('/', controller.getExpenses);

// GET /api/expenses/:id
router.get('/:id', controller.getExpenseById);

// POST /api/expenses
router.post('/', controller.createExpense);

// PUT /api/expenses/:id
router.put('/:id', controller.updateExpense);

// DELETE /api/expenses/:id
router.delete('/:id', controller.deleteExpense);

module.exports = router;
