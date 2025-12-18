const repo = require('./plans.repository');

async function createPlan(data) {
    if (!data.name) throw new Error('Plan nomi majburiy');

    return await repo.createPlan({
        name: data.name,
        price: data.price || 0,
        features: data.features || [], // ['sales', 'production', 'warehouse', ...]
        limits: data.limits || {}
    });
}

async function getPlans() {
    return await repo.getPlans();
}

async function updatePlan(id, data) {
    if (!data.name) throw new Error('Plan nomi majburiy');
    return await repo.updatePlan(id, {
        name: data.name,
        price: data.price || 0,
        features: data.features || [],
        limits: data.limits || {}
    });
}

async function deletePlan(id) {
    return await repo.deletePlan(id);
}

module.exports = {
    createPlan,
    getPlans,
    updatePlan,
    deletePlan
};
