const repo = require('./features.repository');

// Available features list for validation (optional)
const AVAILABLE_FEATURES = ['sales', 'production', 'warehouse', 'accounting']; // etc

async function getTenantFeatures(tenantId) {
    return await repo.getTenantFeatures(tenantId);
}

async function updateTenantFeatures(tenantId, featuresObj) {
    // featuresObj: { sales: true, production: false }
    const keys = Object.keys(featuresObj);

    for (const key of keys) {
        // validate key if needed
        await repo.updateTenantFeature(tenantId, key, featuresObj[key]);
    }

    return await repo.getTenantFeatures(tenantId);
}

module.exports = {
    getTenantFeatures,
    updateTenantFeatures
};
