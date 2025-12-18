const { run, get, all } = require('../../db/connection');

async function getTenantFeatures(tenantId) {
    const rows = await all('SELECT feature_key, enabled FROM tenant_features WHERE tenant_id = ?', [tenantId]);
    const features = {};
    rows.forEach(r => {
        features[r.feature_key] = !!r.enabled;
    });
    return features;
}

async function updateTenantFeature(tenantId, key, enabled) {
    // Check if exists
    const existing = await get('SELECT id FROM tenant_features WHERE tenant_id = ? AND feature_key = ?', [tenantId, key]);

    if (existing) {
        await run('UPDATE tenant_features SET enabled = ? WHERE id = ?', [enabled ? 1 : 0, existing.id]);
    } else {
        await run('INSERT INTO tenant_features (tenant_id, feature_key, enabled) VALUES (?, ?, ?)', [tenantId, key, enabled ? 1 : 0]);
    }
}

module.exports = {
    getTenantFeatures,
    updateTenantFeature
};
