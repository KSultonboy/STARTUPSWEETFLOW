const { get, all } = require('../db/connection');

async function tenantScope(req, res, next) {
    let tenantId = null;

    // 1. Agar user login qilgan bo'lsa (JWT ichida tenantId bor)
    if (req.user && req.user.tenantId) {
        tenantId = req.user.tenantId;
    }
    // 2. Agar headerda kelsa (masalan 'x-tenant-id') - optionally
    else if (req.headers['x-tenant-id']) {
        tenantId = req.headers['x-tenant-id'];
    }

    if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID talab qilinadi (missing tenant context)' });
    }

    req.tenantId = tenantId;

    // Check tenant billing status and block if suspended due to unpaid
    try {
        const tenant = await get('SELECT id, status, unpaid FROM tenants WHERE id = ?', [tenantId]);
        if (!tenant) return res.status(404).json({ message: 'Tenant topilmadi' });
        if (tenant.status === 'SUSPENDED') {
            return res.status(403).json({ message: 'To\'lov amalga oshirilmagan. Xizmat bloklangan.' });
        }
    } catch (err) {
        console.error('Error checking tenant status', err);
        return res.status(500).json({ message: 'Tenant status tekshirilmadi' });
    }

    // 3. Load Tenant Features
    try {
        const rows = await all('SELECT feature_key, enabled FROM tenant_features WHERE tenant_id = ?', [tenantId]);

        // Convert to easy lookup object: { sales: true, production: false }
        // Default to TRUE if not in DB? Or FALSE? 
        // Strategy: If db table is empty for tenant, fallback to Plan defaults or ALL true?
        // Let's assume: If row exists and enabled=1 -> true. If row exists and enabled=0 -> false.
        // If row doesn't exist -> we might need to check Plan. For now, let's just use what's in tenant_features.
        // If completely empty, maybe we assume everything is enabled (legacy support) OR disabled.
        // For SaaS, usually disabled unless Plan says so. 
        // BUT for simplicity now: we will attach what we find. Logic elsewhere will decide default.

        const features = {};
        if (rows && rows.length > 0) {
            rows.forEach(r => {
                features[r.feature_key] = !!r.enabled;
            });
        }

        req.tenantFeatures = features;

    } catch (err) {
        console.error("Error loading features:", err);
        // Don't crash, just empty features
        req.tenantFeatures = {};
    }

    next();
}

module.exports = tenantScope;
