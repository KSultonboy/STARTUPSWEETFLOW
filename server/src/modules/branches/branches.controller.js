const service = require('./branches.service');

// GET /api/branches
async function getBranches(req, res) {
    try {
        const branches = await service.getBranches(req.tenantId);
        res.json(branches);
    } catch (err) {
        console.error('getBranches error:', err);
        res
            .status(500)
            .json({ message: err.message || 'Filiallarni olishda xatolik' });
    }
}

// POST /api/branches
async function createBranch(req, res) {
    try {
        const created = await service.createBranch(req.tenantId, req.body || {});
        res.status(201).json(created);
    } catch (err) {
        console.error('createBranch error:', err);
        res
            .status(400)
            .json({ message: err.message || 'Filialni yaratishda xatolik' });
    }
}

// PUT /api/branches/:id
async function updateBranch(req, res) {
    try {
        const { id } = req.params;
        const updated = await service.updateBranch(req.tenantId, id, req.body || {});
        res.json(updated);
    } catch (err) {
        console.error('updateBranch error:', err);
        res
            .status(400)
            .json({ message: err.message || 'Filialni yangilashda xatolik' });
    }
}

// DELETE /api/branches/:id
async function deleteBranch(req, res) {
    try {
        const { id } = req.params;
        const result = await service.deleteBranch(req.tenantId, id);
        res.json(result);
    } catch (err) {
        console.error('deleteBranch error:', err);
        res
            .status(400)
            .json({ message: err.message || 'Filialni o‘chirishda xatolik' });
    }
}

module.exports = {
    getBranches,
    createBranch,
    updateBranch,
    deleteBranch,
};
