const service = require('./returns.service');

async function createReturn(req, res) {
    try {
        const user = req.user || null;
        const payload = req.body || {};

        const created = await service.createReturn(payload, user);
        res.status(201).json(created);
    } catch (err) {
        console.error('createReturn error:', err);
        res
            .status(400)
            .json({ message: err.message || 'Qaytishni yaratishda xatolik' });
    }
}

async function listReturns(req, res) {
    try {
        const user = req.user || null;

        const filters = {
            branch_id: req.query.branch_id || null,
            status: req.query.status || null,
            date_from: req.query.date_from || null,
            date_to: req.query.date_to || null,
            limit: parseInt(req.query.limit, 10) || 50,
            offset: parseInt(req.query.offset, 10) || 0,
        };

        const rows = await service.listReturns(filters, user);
        res.json(rows);
    } catch (err) {
        console.error('listReturns error:', err);
        res
            .status(400)
            .json({ message: err.message || 'Qaytishlar ro‘yxatini olishda xatolik' });
    }
}

async function getReturnById(req, res) {
    try {
        const user = req.user || null;
        const { id } = req.params;

        const data = await service.getReturnById(id, user);
        if (!data) {
            return res.status(404).json({ message: 'Qaytish topilmadi' });
        }

        res.json(data);
    } catch (err) {
        console.error('getReturnById error:', err);
        res
            .status(400)
            .json({ message: err.message || 'Qaytish ma’lumotini olishda xatolik' });
    }
}

/**
 * BARCHA pending itemlarni tasdiqlash
 */
async function approveReturn(req, res) {
    try {
        const user = req.user || null;
        const { id } = req.params;

        await service.approveReturn(id, user);
        res.json({ success: true });
    } catch (err) {
        console.error('approveReturn error:', err);
        res
            .status(400)
            .json({ message: err.message || 'Qaytishni tasdiqlashda xatolik' });
    }
}

/**
 * Bitta itemni tasdiqlash
 */
async function approveReturnItem(req, res) {
    try {
        const user = req.user || null;
        const { id, itemId } = req.params;

        await service.approveReturnItem(id, itemId, user);
        res.json({ success: true });
    } catch (err) {
        console.error('approveReturnItem error:', err);
        res
            .status(400)
            .json({ message: err.message || 'Mahsulotni tasdiqlashda xatolik' });
    }
}

/**
 * Bitta itemni bekor qilish
 */
async function cancelReturnItem(req, res) {
    try {
        const user = req.user || null;
        const { id, itemId } = req.params;

        await service.cancelReturnItem(id, itemId, user);
        res.json({ success: true });
    } catch (err) {
        console.error('cancelReturnItem error:', err);
        res
            .status(400)
            .json({ message: err.message || 'Mahsulotni bekor qilishda xatolik' });
    }
}

module.exports = {
    createReturn,
    listReturns,
    getReturnById,
    approveReturn,
    approveReturnItem,
    cancelReturnItem,
};
