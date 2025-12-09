// server/src/modules/history/history.controller.js
const service = require('./history.service');

async function getActivities(req, res) {
    try {
        const user = req.user || {};
        const role = user.role || null;

        const limit = parseInt(req.query.limit, 10) || 50;
        const offset = parseInt(req.query.offset, 10) || 0;

        let type = req.query.type || 'all';   // 'all' | 'sale' | 'production' | 'transfer' | 'return'
        const dateFrom = req.query.from || req.query.date_from || null;
        const dateTo = req.query.to || req.query.date_to || null;
        let branchId = req.query.branch_id || null;

        // 🔵 ROLE MANTIQI
        if (role === 'production') {
            type = 'production';
            branchId = null;
        } else if (role === 'branch') {
            type = 'sale';
            branchId = user.branch_id;
        }
        // admin → hech narsa o‘zgarmaydi

        const activities = await service.getActivities({
            limit,
            offset,
            type,
            dateFrom,
            dateTo,
            branchId,
        });

        res.json(activities);
    } catch (err) {
        console.error("getActivities error:", err);
        res.status(500).json({ message: "Tarixni olishda xatolik" });
    }
}

module.exports = {
    getActivities,
};
