// server/src/modules/branches/branches.service.js

const repo = require('./branches.repository');

/**
 * Yangi / yangilangan joy (filial/do‘kon) inputini tekshirish
 */
function validateBranchInput(data) {
    if (!data || typeof data !== 'object') {
        throw new Error('Filial/do‘kon ma’lumotlari kiritilmadi.');
    }

    if (!data.name || !String(data.name).trim()) {
        throw new Error('Nomi majburiy.');
    }

    if (
        data.use_central_stock != null &&
        ![0, 1, '0', '1', true, false].includes(data.use_central_stock)
    ) {
        throw new Error('use_central_stock noto‘g‘ri qiymat qabul qildi.');
    }

    if (data.branch_type != null) {
        const t = String(data.branch_type).toUpperCase();
        if (!['BRANCH', 'OUTLET'].includes(t)) {
            throw new Error('branch_type faqat BRANCH yoki OUTLET bo‘lishi mumkin.');
        }
    }
}

/**
 * Barcha joylar
 */
async function getBranches(tenantId) {
    const branches = await repo.getAllBranches(tenantId);
    return branches;
}

/**
 * Yangi joy yaratish
 */
async function createBranch(tenantId, data) {
    validateBranchInput(data);

    const branchType = (data.branch_type || 'BRANCH').toUpperCase();

    const payload = {
        name: String(data.name).trim(),
        is_active:
            data.is_active != null
                ? Number(data.is_active) ? 1 : 0
                : 1,
        use_central_stock:
            branchType === 'BRANCH'
                ? (data.use_central_stock != null
                    ? (Number(data.use_central_stock) ? 1 : 0)
                    : 0)
                : 0,
        branch_type: branchType,
    };

    const created = await repo.createBranch(tenantId, payload);
    return created;
}

/**
 * Joyni yangilash
 */
async function updateBranch(tenantId, id, data) {
    validateBranchInput({
        ...data,
        name: data.name ?? '',
    });

    const branchType = (data.branch_type || 'BRANCH').toUpperCase();

    const payload = {
        name: String(data.name).trim(),
        ...(data.is_active != null && {
            is_active: Number(data.is_active) ? 1 : 0,
        }),
        ...(branchType === 'BRANCH'
            ? {
                use_central_stock:
                    data.use_central_stock != null
                        ? (Number(data.use_central_stock) ? 1 : 0)
                        : 0,
            }
            : {
                use_central_stock: 0,
            }),
        branch_type: branchType,
    };

    const updated = await repo.updateBranch(tenantId, id, payload);
    return updated;
}

/**
 * Joyni o'chirish (soft delete)
 */
async function deleteBranch(tenantId, id) {
    const result = await repo.deleteBranch(tenantId, id);
    return result;
}

module.exports = {
    getBranches,
    createBranch,
    updateBranch,
    deleteBranch,
};
