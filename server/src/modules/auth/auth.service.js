// server/src/modules/auth/auth.service.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtRefreshSecret } = require('../../config/env');
const repo = require('./auth.repository');
const { get } = require('../../db/connection');
const featuresService = require('../platform/features.service'); // Load features

const ACCESS_SECRET = jwtSecret;
const REFRESH_SECRET = jwtRefreshSecret || jwtSecret;

function signAccessToken(payload) {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
}

function signRefreshToken(payload) {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '30d' });
}

function mapUserForClient(user, features = {}) {
    if (!user) return null;
    return {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        role: user.role,
        tenantId: user.tenant_id,
        branch_id: user.branch_id,
        features: features
    };
}

async function login({ username, password, tenantSlug }) {
    if (!username || !password) {
        throw new Error('username va password majburiy');
    }

    let tenantId = 1;
    if (tenantSlug) {
        const tenant = await get('SELECT id, plan_id FROM tenants WHERE slug = ?', [tenantSlug]);
        if (tenant) {
            tenantId = tenant.id;
            // Agar tenantda plan belgilanmagan bo'lsa, kirishni taqiqlash (Platform Owner bundan mustasno bo'lishi mumkin, lekin slug bilan kirayotgan bo'lsa check qilamiz)
            if (!tenant.plan_id) {
                throw new Error('Ushbu do\'kon uchun tarif rejasi belgilanmagan. Iltimos, administratorga murojaat qiling.');
            }

            // If tenant is suspended due to unpaid billing, block login
            if (tenant.status === 'SUSPENDED') {
                throw new Error('To\'lov amalga oshirilmagan. Xizmat bloklangan. Iltimos, balansni to\'ldiring.');
            }
        } else {
            throw new Error('Tenant topilmadi');
        }
    }

    const user = await repo.getUserWithPasswordByUsername(username, tenantId);

    if (user && user.tenant_id !== tenantId) {
        throw new Error('Foydalanuvchi topilmadi');
    }

    if (!user) {
        throw new Error('Foydalanuvchi topilmadi yoki parol noto‘g‘ri');
    }

    if (!user.is_active) {
        throw new Error('Foydalanuvchi bloklangan');
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
        throw new Error('Foydalanuvchi topilmadi yoki parol noto‘g‘ri');
    }

    const payload = {
        id: user.id,
        role: user.role,
        tenantId: user.tenant_id,
        branchId: user.branch_id || null,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Get features
    const features = await featuresService.getTenantFeatures(user.tenant_id);

    // Get Tenant Info (Name & Expiry)
    const tenantInfo = await get('SELECT name, contract_end_date, status FROM tenants WHERE id = ?', [user.tenant_id]);
    const tenantName = tenantInfo ? tenantInfo.name : 'Unknown Tenant';
    const contractEndDate = tenantInfo ? tenantInfo.contract_end_date : null;

    if (tenantInfo && tenantInfo.status === 'SUSPENDED') {
        throw new Error('To\'lov amalga oshirilmagan. Xizmat bloklangan.');
    }

    return {
        accessToken,
        refreshToken,
        user: { ...mapUserForClient(user, features), tenantName, contractEndDate },
    };
}

async function refreshTokens({ refreshToken }) {
    if (!refreshToken) {
        throw new Error('Refresh token majburiy');
    }

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch (err) {
        throw new Error('Refresh token yaroqsiz yoki muddati tugagan');
    }

    const user = await repo.getUserById(decoded.id);
    if (!user || !user.is_active) {
        throw new Error('Foydalanuvchi topilmadi yoki bloklangan');
    }

    const payload = {
        id: user.id,
        role: user.role,
        tenantId: user.tenant_id,
        branchId: user.branch_id || null,
    };

    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    // Get features on refresh too
    const features = await featuresService.getTenantFeatures(user.tenant_id);
    // Get Tenant Info (Name & Expiry)
    const tenantInfo = await get('SELECT name, contract_end_date FROM tenants WHERE id = ?', [user.tenant_id]);
    const tenantName = tenantInfo ? tenantInfo.name : 'Unknown Tenant';
    const contractEndDate = tenantInfo ? tenantInfo.contract_end_date : null;

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: { ...mapUserForClient(user, features), tenantName, contractEndDate },
    };
}

async function logout() {
    return { success: true };
}

module.exports = {
    login,
    refreshTokens,
    logout,
};
