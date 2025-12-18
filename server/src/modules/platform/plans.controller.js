const service = require('./plans.service');

async function createPlan(req, res) {
    try {
        const plan = await service.createPlan(req.body);
        res.status(201).json(plan);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function getPlans(req, res) {
    try {
        const plans = await service.getPlans();
        res.json(plans);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function updatePlan(req, res) {
    try {
        const { id } = req.params;
        const result = await service.updatePlan(id, req.body);
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function deletePlan(req, res) {
    try {
        const { id } = req.params;
        await service.deletePlan(id);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

module.exports = {
    createPlan,
    getPlans,
    updatePlan,
    deletePlan
};
