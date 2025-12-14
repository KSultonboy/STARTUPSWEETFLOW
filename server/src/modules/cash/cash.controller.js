// server/src/modules/cash/cash.controller.js
const service = require("./cash.service");

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

async function list(req, res) {
    try {
        const date = req.query.date || todayISO();
        const mode = req.query.mode || "day";
        const branchType = (req.query.branchType || "BRANCH").toUpperCase();
        const branchId = req.query.branchId ? Number(req.query.branchId) : null;

        const limit = req.query.limit ? Number(req.query.limit) : 200;
        const offset = req.query.offset ? Number(req.query.offset) : 0;

        const data = await service.list({ date, mode, branchType, branchId, limit, offset });
        res.json(data);
    } catch (err) {
        console.error("cash.list error:", err);
        res.status(500).json({ message: "Kassa tarixini olishda xatolik" });
    }
}

async function summary(req, res) {
    try {
        const date = req.query.date || todayISO();
        const mode = req.query.mode || "day";
        const branchType = (req.query.branchType || "BRANCH").toUpperCase();
        const branchId = req.query.branchId ? Number(req.query.branchId) : null;

        const data = await service.summary({ date, mode, branchType, branchId });
        res.json({ date, mode, branchType, ...data });
    } catch (err) {
        console.error("cash.summary error:", err);
        res.status(500).json({ message: "Kassa summary olishda xatolik" });
    }
}

async function cashOut(req, res) {
    try {
        const { branch_id, amount, cash_date, note } = req.body || {};
        const branchId = Number(branch_id);
        const amt = Number(amount);

        if (!branchId || !(amt > 0)) {
            return res.status(400).json({ message: "branch_id va amount (0 dan katta) shart" });
        }

        // created_by ixtiyoriy: agar sizda req.user bo‘lsa, qo‘shib ketadi
        const createdBy = req.user?.id || null;

        const entry = await service.cashOut({
            branch_id: branchId,
            amount: amt,
            cash_date: cash_date || todayISO(),
            note: note || "Admin pul oldi",
            created_by: createdBy,
        });

        res.json(entry);
    } catch (err) {
        console.error("cash.cashOut error:", err);
        res.status(500).json({ message: "Pul olishni saqlashda xatolik" });
    }
}

async function cashIn(req, res) {
    try {
        const { branch_id, amount, cash_date, note } = req.body || {};
        const branchId = Number(branch_id);
        const amt = Number(amount);

        if (!branchId || !(amt > 0)) {
            return res.status(400).json({ message: "branch_id va amount (0 dan katta) shart" });
        }

        const createdBy = req.user?.id || null;

        const entry = await service.cashIn({
            branch_id: branchId,
            amount: amt,
            cash_date: cash_date || todayISO(),
            note: note || "Kassa kirim",
            created_by: createdBy,
        });

        res.json(entry);
    } catch (err) {
        console.error("cash.cashIn error:", err);
        res.status(500).json({ message: "Pul qo‘shishni saqlashda xatolik" });
    }
}

async function remove(req, res) {
    try {
        const id = Number(req.params.id);
        if (!id) return res.status(400).json({ message: "id noto‘g‘ri" });

        await service.remove(id);
        res.json({ ok: true });
    } catch (err) {
        console.error("cash.remove error:", err);
        res.status(500).json({ message: "O‘chirishda xatolik" });
    }
}

module.exports = {
    list,
    summary,
    cashOut,
    cashIn,
    remove,
};
