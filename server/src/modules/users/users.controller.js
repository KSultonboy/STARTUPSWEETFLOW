const service = require('./users.service');

async function getUsers(req, res) {
    try {
        const users = await service.getUsers(req.tenantId);
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function createUser(req, res) {
    try {
        // Pass req.tenantFeatures to service
        const user = await service.createUser(req.tenantId, req.body, req.tenantFeatures);
        res.status(201).json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function updateUser(req, res) {
    try {
        const id = Number(req.params.id);
        if (!id) return res.status(400).json({ message: 'ID xato' });

        // Pass req.tenantFeatures to service
        const user = await service.updateUser(req.tenantId, id, req.body, req.tenantFeatures);
        res.json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function deleteUser(req, res) {
    try {
        const id = Number(req.params.id);
        if (!id) return res.status(400).json({ message: 'ID xato' });

        await service.deleteUser(req.tenantId, id);
        res.status(204).end();
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser
};
