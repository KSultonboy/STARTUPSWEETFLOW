// server/src/modules/transfers/transfers.controller.js

const service = require("./transfers.service");

async function createTransfer(req, res) {
    try {
        const user = req.user || null;
        const transfer = await service.createTransfer(req.tenantId, req.body || {}, user);
        res.status(201).json(transfer);
    } catch (err) {
        console.error("createTransfer error:", err);
        res
            .status(400)
            .json({ message: err.message || "Transfer yaratishda xatolik" });
    }
}

async function getAllTransfers(req, res) {
    try {
        const list = await service.getAllTransfers(req.tenantId);
        res.json(list);
    } catch (err) {
        console.error("getAllTransfers error:", err);
        res.status(500).json({ message: "Transferlarni olishda xatolik" });
    }
}

async function getTransfer(req, res) {
    try {
        const id = Number(req.params.id);
        if (!id) return res.status(400).json({ message: "Noto'g'ri ID" });

        const transfer = await service.getTransferById(req.tenantId, id);
        res.json(transfer);
    } catch (err) {
        console.error("getTransfer error:", err);
        if (err.message === "Transfer topilmadi") {
            return res.status(404).json({ message: err.message });
        }
        res.status(500).json({ message: "Transferni olishda xatolik" });
    }
}

/**
 * Filial uchun kiruvchi transferlar (branch qabul qilish sahifasida)
 */
async function getIncomingForBranch(req, res) {
    try {
        const branchId = Number(req.params.branchId);
        const list = await service.getIncomingForBranch(req.tenantId, branchId);
        res.json(list);
    } catch (err) {
        console.error("getIncomingForBranch error:", err);
        res.status(400).json({
            message: err.message || "Kiruvchi transferlarni olishda xatolik",
        });
    }
}

async function acceptItem(req, res) {
    try {
        const transferId = Number(req.params.id);
        const itemId = Number(req.params.itemId);
        const branchId = Number(req.body.branch_id);

        if (!transferId || !itemId || !branchId) {
            return res.status(400).json({ message: "Noto'g'ri parametrlar" });
        }

        const updated = await service.acceptItem(req.tenantId, transferId, itemId, branchId);
        res.json(updated);
    } catch (err) {
        console.error("acceptItem error:", err);
        res
            .status(400)
            .json({ message: err.message || "Itemni qabul qilishda xatolik" });
    }
}

async function rejectItem(req, res) {
    try {
        const transferId = Number(req.params.id);
        const itemId = Number(req.params.itemId);
        const branchId = Number(req.body.branch_id);

        if (!transferId || !itemId || !branchId) {
            return res.status(400).json({ message: "Noto'g'ri parametrlar" });
        }

        const updated = await service.rejectItem(req.tenantId, transferId, itemId, branchId);
        res.json(updated);
    } catch (err) {
        console.error("rejectItem error:", err);
        res
            .status(400)
            .json({ message: err.message || "Itemni bekor qilishda xatolik" });
    }
}

/**
 * Transferni tahrirlash
 */
async function updateTransfer(req, res) {
    try {
        const user = req.user || null;
        const id = Number(req.params.id);
        if (!id) return res.status(400).json({ message: "Noto'g'ri ID" });

        const updated = await service.updateTransfer(req.tenantId, id, req.body || {}, user);
        res.json(updated);
    } catch (err) {
        console.error("updateTransfer error:", err);
        res
            .status(400)
            .json({ message: err.message || "Transferni tahrirlashda xatolik" });
    }
}

/**
 * Transferni bekor qilish / o‘chirish
 */
async function cancelTransfer(req, res) {
    try {
        const id = Number(req.params.id);
        if (!id) return res.status(400).json({ message: "Noto'g'ri ID" });

        await service.cancelTransfer(req.tenantId, id);
        res.json({ success: true });
    } catch (err) {
        console.error("cancelTransfer error:", err);
        res
            .status(400)
            .json({ message: err.message || "Transferni bekor qilishda xatolik" });
    }
}

module.exports = {
    createTransfer,
    getAllTransfers,
    getTransfer,
    getIncomingForBranch,
    acceptItem,
    rejectItem,
    updateTransfer,
    cancelTransfer,
};
