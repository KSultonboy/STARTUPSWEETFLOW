const service = require('./features.service');

async function getTenantFeatures(req, res) {
    try {
        const { tenantId } = req.params;
        const features = await service.getTenantFeatures(tenantId);
        res.json(features);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function updateTenantFeatures(req, res) {
    try {
        const { tenantId } = req.params;
        const features = await service.updateTenantFeatures(tenantId, req.body);
        res.json(features);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

module.exports = {
    getTenantFeatures,
    updateTenantFeatures
};
