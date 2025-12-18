const { run, get, all } = require('../../db/connection');

async function createPlan({ name, price, features = [], limits = {} }) {
    const res = await run(
        `INSERT INTO plans (name, price, features_json, limits_json, created_at) VALUES (?, ?, ?, ?, datetime('now'))`,
        [name, price, JSON.stringify(features), JSON.stringify(limits)]
    );
    return await get('SELECT * FROM plans WHERE id = ?', [res.lastID]);
}

async function getPlans() {
    const rows = await all('SELECT * FROM plans ORDER BY id ASC');
    return rows.map(r => ({
        ...r,
        features: r.features_json ? JSON.parse(r.features_json) : [],
        limits: r.limits_json ? JSON.parse(r.limits_json) : {}
    }));
}

async function getPlanById(id) {
    const row = await get('SELECT * FROM plans WHERE id = ?', [id]);
    if (!row) return null;
    return {
        ...row,
        features: row.features_json ? JSON.parse(row.features_json) : [],
        limits: row.limits_json ? JSON.parse(row.limits_json) : {}
    };
}

async function updatePlan(id, { name, price, features = [], limits = {} }) {
    await run(
        `UPDATE plans SET name = ?, price = ?, features_json = ?, limits_json = ? WHERE id = ?`,
        [name, price, JSON.stringify(features), JSON.stringify(limits), id]
    );
    return await getPlanById(id);
}

async function deletePlan(id) {
    await run('DELETE FROM plans WHERE id = ?', [id]);
    return { success: true };
}

module.exports = {
    createPlan,
    getPlans,
    getPlanById,
    updatePlan,
    deletePlan
};
