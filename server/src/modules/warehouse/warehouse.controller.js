const service = require('./warehouse.service');

async function getCurrentStock(req, res) {
    try {
        const { branch_id } = req.query; // ixtiyoriy filter

        const stock = await service.getCurrentStock(req.tenantId, branch_id);
        res.json(stock);
    } catch (err) {
        console.error('getCurrentStock error:', err);
        res.status(500).json({ message: 'Ombor qoldiqlarini olishda xatolik' });
    }
}

module.exports = {
    getCurrentStock,
};
