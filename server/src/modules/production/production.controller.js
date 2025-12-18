// server/src/modules/production/production.controller.js

const service = require("./production.service");

async function createBatch(req, res) {
    try {
        const batch = await service.createBatch(req.tenantId, req.body);
        res.status(201).json(batch);
    } catch (err) {
        console.error("createBatch error:", err);
        res.status(400).json({ message: err.message || "Partiya yaratishda xatolik" });
    }
}

async function getBatches(req, res) {
    try {
        const list = await service.getBatches(req.tenantId, req.query);
        res.json(list);
    } catch (err) {
        console.error("getBatches error:", err);
        res.status(500).json({ message: "Partiyalarni olishda xatolik" });
    }
}

async function getBatch(req, res) {
    try {
        const id = Number(req.params.id);
        if (!id) {
            return res.status(400).json({ message: "Noto'g'ri ID" });
        }
        const batch = await service.getBatchById(req.tenantId, id);
        res.json(batch);
    } catch (err) {
        console.error("getBatch error:", err);
        if (err.message === "Partiya topilmadi") {
            return res.status(404).json({ message: err.message });
        }
        res.status(500).json({ message: "Partiyani olishda xatolik" });
    }
}

async function updateBatch(req, res) {
    try {
        const id = Number(req.params.id);
        if (!id) {
            return res.status(400).json({ message: "Noto'g'ri ID" });
        }
        const batch = await service.updateBatch(req.tenantId, id, req.body);
        res.json(batch);
    } catch (err) {
        console.error("updateBatch error:", err);
        if (err.message === "Partiya topilmadi") {
            return res.status(404).json({ message: err.message });
        }
        res.status(400).json({ message: err.message || "Partiyani yangilashda xatolik" });
    }
}

async function deleteBatch(req, res) {
    try {
        const id = Number(req.params.id);
        if (!id) {
            return res.status(400).json({ message: "Noto'g'ri ID" });
        }
        await service.deleteBatch(req.tenantId, id);
        res.status(204).end();
    } catch (err) {
        console.error("deleteBatch error:", err);
        if (err.message === "Partiya topilmadi") {
            return res.status(404).json({ message: err.message });
        }
        res.status(400).json({ message: err.message || "Partiyani o'chirishda xatolik" });
    }
}

module.exports = {
    createBatch,
    getBatches,
    getBatch,
    updateBatch,
    deleteBatch,
};
