// server/src/modules/reports/reports.controller.js
const service = require('./reports.service');

async function getOverview(req, res) {
    try {
        const tenantId = req.tenantId;

        let { date, mode } = req.query;

        // Sana berilmasa – bugungi sana
        if (!date) {
            const now = new Date();
            date = now.toISOString().slice(0, 10);
        }

        // Mode berilmasa – kunlik
        if (!mode) {
            mode = 'day'; // day | week | month | year
        }

        const data = await service.getOverview(tenantId, date, mode);
        res.json({ date, mode, ...data });
    } catch (err) {
        console.error('getOverview error:', err);
        res.status(500).json({ message: 'Hisobotni olishda xatolik' });
    }
}

module.exports = {
    getOverview,
};
