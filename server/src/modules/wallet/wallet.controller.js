const platformService = require('../platform/platform.service');

async function getMyWallet(req, res) {
    try {
        const tenantId = req.tenantId;
        const wallet = await platformService.getTenantWallet(tenantId);
        res.json(wallet);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function topUpMyWallet(req, res) {
    try {
        const tenantId = req.tenantId;
        const { amount } = req.body;
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            return res.status(400).json({ message: 'Summa noto‘g‘ri' });
        }
        const result = await platformService.topUpWallet(tenantId, Number(amount));
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

module.exports = {
    getMyWallet,
    topUpMyWallet
};
