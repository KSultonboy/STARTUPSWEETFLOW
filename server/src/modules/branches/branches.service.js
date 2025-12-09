const repo = require("./branches.repository");

/**
 * Yangi / yangilangan filial/do'kon inputini tekshirish
 */
function validateBranchInput(data) {
    if (!data || typeof data !== "object") {
        throw new Error("Filial/do‘kon ma’lumotlari kiritilmadi.");
    }

    if (!data.name || !String(data.name).trim()) {
        throw new Error("Nomi majburiy.");
    }

    const type = (data.type || "BRANCH").toString().toUpperCase();
    if (!["BRANCH", "OUTLET"].includes(type)) {
        throw new Error("Turi noto‘g‘ri (BRANCH yoki OUTLET bo‘lishi kerak).");
    }

    // faqat filial uchun use_central_stock ni tekshiramiz
    if (
        type === "BRANCH" &&
        data.use_central_stock != null &&
        ![0, 1, "0", "1", true, false].includes(data.use_central_stock)
    ) {
        throw new Error("use_central_stock noto‘g‘ri qiymat qabul qildi.");
    }
}

/**
 * Barcha filiallar/do'konlar
 */
async function getBranches() {
    const branches = await repo.getAllBranches();
    return branches;
}

/**
 * Yangi filial/do'kon yaratish
 */
async function createBranch(data) {
    validateBranchInput(data);

    const type = (data.type || "BRANCH").toString().toUpperCase() === "OUTLET"
        ? "OUTLET"
        : "BRANCH";

    const baseName = String(data.name).trim();

    const isActive =
        data.is_active != null ? (Number(data.is_active) ? 1 : 0) : 1;

    let useCentralStock = 0;
    if (type === "BRANCH") {
        useCentralStock =
            data.use_central_stock != null
                ? Number(data.use_central_stock)
                    ? 1
                    : 0
                : 0;
    } else {
        // OUTLET – har doim markaziy ombor bilan bog‘liq emas, ombor yuritmaymiz
        useCentralStock = 0;
    }

    const payload = {
        name: baseName,
        is_active: isActive,
        use_central_stock: useCentralStock,
        type,
    };

    const created = await repo.createBranch(payload);
    return created;
}

/**
 * Filial/do'konni yangilash
 */
async function updateBranch(id, data) {
    // Avval mavjud yozuvni olib, type ni ham bilib olamiz
    const existing = await repo.getBranchById(id);
    if (!existing) {
        throw new Error("Filial/do‘kon topilmadi.");
    }

    const merged = {
        ...existing,
        ...data,
        name: data.name != null ? data.name : existing.name,
        type: data.type != null ? data.type : existing.type,
    };

    validateBranchInput(merged);

    const type =
        (merged.type || "BRANCH").toString().toUpperCase() === "OUTLET"
            ? "OUTLET"
            : "BRANCH";

    const name = String(merged.name).trim();

    const isActive =
        merged.is_active != null
            ? Number(merged.is_active)
                ? 1
                : 0
            : existing.is_active;

    let useCentralStock = existing.use_central_stock;
    if (type === "BRANCH") {
        if (merged.use_central_stock != null) {
            useCentralStock = Number(merged.use_central_stock) ? 1 : 0;
        }
    } else {
        // OUTLET – har doim 0
        useCentralStock = 0;
    }

    const payload = {
        name,
        is_active: isActive,
        use_central_stock: useCentralStock,
        type,
    };

    const updated = await repo.updateBranch(id, payload);
    return updated;
}

/**
 * Filial/do'konni o'chirish (soft delete)
 */
async function deleteBranch(id) {
    const result = await repo.deleteBranch(id);
    return result;
}

module.exports = {
    getBranches,
    createBranch,
    updateBranch,
    deleteBranch,
};
