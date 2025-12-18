const service = require('./platform.service');

async function login(req, res) {
    try {
        const result = await service.login(req.body);
        res.json(result);
    } catch (err) {
        res.status(401).json({ message: err.message });
    }
}

async function getTenants(req, res) {
    try {
        const tenants = await service.getTenants();
        res.json(tenants);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function createTenant(req, res) {
    try {
        const tenant = await service.createTenant(req.body);
        res.status(201).json(tenant);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function createTenantAdmin(req, res) {
    try {
        const { tenantId } = req.params;
        const user = await service.createTenantAdmin(tenantId, req.body);
        res.status(201).json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

module.exports = {
    login,
    getTenants,
    createTenant,
    createTenantAdmin,
    updateTenant,
    deleteTenant,
    resetAdminPassword,
    // Wallet endpoints
    getTenantWallet,
    topUpWallet
};

async function getTenantWallet(req, res) {
    try {
        const { id } = req.params;
        const wallet = await service.getTenantWallet(id);
        res.json(wallet);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function topUpWallet(req, res) {
    try {
        const { id } = req.params;
        const { amount } = req.body;
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            return res.status(400).json({ message: 'Summa noto‘g‘ri' });
        }
        const result = await service.topUpWallet(id, Number(amount));
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function resetAdminPassword(req, res) {
    try {
        const { id } = req.params;
        const result = await service.resetAdminPassword(id);
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function updateTenant(req, res) {
    try {
        const { id } = req.params;
        const result = await service.updateTenant(id, req.body);
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function deleteTenant(req, res) {
    try {
        const { id } = req.params;
        await service.deleteTenant(id);
        res.json({ success: true, message: "Do'kon o'chirildi" });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}
