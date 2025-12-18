const service = require('./sales.service');

async function createSale(req, res) {
    try {
        const payload = req.body;
        const sale = await service.createSale(req.tenantId, payload);
        res.status(201).json(sale);
    } catch (err) {
        console.error('createSale error:', err);

        if (err.code === 'STOCK_NOT_ENOUGH') {
            return res.status(400).json({
                message: err.message || "Omborda mahsulot yetarli emas",
                shortages: err.shortages || [],
            });
        }

        res.status(400).json({ message: err.message || "Sotuvni saqlashda xatolik" });
    }
}

module.exports = {
    createSale,
};
