const bcrypt = require("bcryptjs");
const repo = require("./users.repository");

const SALT_ROUNDS = 10;

function validateUserInput(data = {}, { isUpdate = false } = {}) {
    const full_name = data.full_name ? String(data.full_name).trim() : "";
    const username = data.username ? String(data.username).trim() : "";
    const role = data.role ? String(data.role).trim() : "admin";
    const branch_id =
        data.role === "branch" && data.branch_id ? Number(data.branch_id) : null;

    if (!full_name) {
        throw new Error("To'liq ism majburiy");
    }
    if (!username) {
        throw new Error("Username majburiy");
    }

    const cleaned = {
        full_name,
        username,
        role,
        branch_id,
        is_active: true,
    };

    if (!isUpdate || data.password) {
        if (!data.password) {
            throw new Error("Parol majburiy");
        }
        cleaned.password = String(data.password);
    }

    return cleaned;
}

async function getUsers(tenantId) {
    return repo.findAll(tenantId);
}

/**
 * Check if the role is allowed based on enabled tenant features.
 * mapping:
 *   sales -> [ 'seller', 'cashier' ]
 *   production -> [ 'baker', 'decorator', 'technologist' ]
 *   warehouse -> [ 'warehouse_man' ]
 */
function checkRoleAccess(role, features = {}) {
    const r = role.toLowerCase();

    // Mapping definition
    const map = {
        seller: 'sales',
        cashier: 'sales',
        baker: 'production',
        decorator: 'production',
        technologist: 'production',
        warehouse_man: 'warehouse'
    };

    const requiredFeature = map[r];

    // Agar bu rol uchun feature talab qilinsa va u feature DISABLED bo'lsa
    if (requiredFeature && features[requiredFeature] === false) {
        throw new Error(`Ushbu rolni ('${role}') yaratish uchun '${requiredFeature}' moduli yoqilgan bo'lishi kerak.`);
    }
}

async function createUser(tenantId, data, tenantFeatures = {}) {
    const cleaned = validateUserInput(data, { isUpdate: false });

    // 🛡️ Access Control Check
    checkRoleAccess(cleaned.role, tenantFeatures);

    // Ensure username is unique WITHIN tenant
    const existing = await repo.findByUsername(cleaned.username, tenantId);
    if (existing) {
        throw new Error("Bu username ushbu do'konda band");
    }

    const password_hash = await bcrypt.hash(cleaned.password, SALT_ROUNDS);

    return repo.create(tenantId, {
        full_name: cleaned.full_name,
        username: cleaned.username,
        password_hash,
        role: cleaned.role,
        branch_id: cleaned.branch_id,
        is_active: true,
    });
}

async function updateUser(tenantId, id, data, tenantFeatures = {}) {
    // Agar rol o'zgarayotgan bo'lsa, uni ham tekshirish kerak
    if (data.role) {
        checkRoleAccess(data.role, tenantFeatures);
    }

    const existing = await repo.findById(tenantId, id);
    if (!existing) {
        throw new Error("User topilmadi");
    }

    const cleaned = validateUserInput(data, { isUpdate: true });

    let password_hash = null;
    if (cleaned.password) {
        password_hash = await bcrypt.hash(cleaned.password, SALT_ROUNDS);
    }

    return repo.update(tenantId, id, {
        full_name: cleaned.full_name,
        username: cleaned.username,
        password_hash,
        role: cleaned.role,
        branch_id: cleaned.branch_id,
        is_active: true,
    });
}

async function deleteUser(tenantId, id) {
    const existing = await repo.findById(tenantId, id);
    if (!existing) {
        throw new Error("User topilmadi");
    }
    await repo.remove(tenantId, id);
}

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
};
