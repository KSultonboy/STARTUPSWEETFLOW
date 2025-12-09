const service = require('./expenses.service');

/**
 * POST /api/expenses
 */
async function createExpense(req, res) {
    try {
        const currentUser = req.user || null;
        const exp = await service.createExpense(req.body || {}, currentUser);
        res.status(201).json(exp);
    } catch (err) {
        console.error('createExpense error:', err);
        res
            .status(400)
            .json({ message: err.message || 'Xarajatni saqlashda xatolik' });
    }
}

/**
 * PUT /api/expenses/:id
 */
async function updateExpense(req, res) {
    try {
        const id = Number(req.params.id);
        if (!id) {
            return res.status(400).json({ message: 'Noto‘g‘ri ID' });
        }
        const currentUser = req.user || null;
        const exp = await service.updateExpense(id, req.body || {}, currentUser);
        res.json(exp);
    } catch (err) {
        console.error('updateExpense error:', err);
        if (err.message === 'Xarajat topilmadi') {
            return res.status(404).json({ message: err.message });
        }
        res
            .status(400)
            .json({ message: err.message || 'Xarajatni yangilashda xatolik' });
    }
}

/**
 * DELETE /api/expenses/:id
 */
async function deleteExpense(req, res) {
    try {
        const id = Number(req.params.id);
        if (!id) {
            return res.status(400).json({ message: 'Noto‘g‘ri ID' });
        }
        await service.deleteExpense(id);
        res.status(204).end();
    } catch (err) {
        console.error('deleteExpense error:', err);
        if (err.message === 'Xarajat topilmadi') {
            return res.status(404).json({ message: err.message });
        }
        res
            .status(400)
            .json({ message: err.message || 'Xarajatni o‘chirishda xatolik' });
    }
}

/**
 * GET /api/expenses?type=ingredients|decor|utility
 */
async function getExpenses(req, res) {
    try {
        const { type } = req.query;
        const list = await service.getExpensesByType(type);
        res.json(list);
    } catch (err) {
        console.error('getExpenses error:', err);
        res
            .status(400)
            .json({ message: err.message || 'Xarajatlarni olishda xatolik' });
    }
}

/**
 * GET /api/expenses/:id
 */
async function getExpenseById(req, res) {
    try {
        const id = Number(req.params.id);
        if (!id) {
            return res.status(400).json({ message: 'Noto‘g‘ri ID' });
        }
        const exp = await service.getExpenseById(id);
        res.json(exp);
    } catch (err) {
        console.error('getExpenseById error:', err);
        if (err.message === 'Xarajat topilmadi') {
            return res.status(404).json({ message: err.message });
        }
        res
            .status(400)
            .json({ message: err.message || 'Xarajatni olishda xatolik' });
    }
}

module.exports = {
    createExpense,
    updateExpense,
    deleteExpense,
    getExpenses,
    getExpenseById,
};
