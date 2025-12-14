// server/src/modules/auth/auth.service.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtRefreshSecret } = require('../../config/env');
const repo = require('./auth.repository');

// Access va refresh uchun maxfiy kalitlar
const ACCESS_SECRET = jwtSecret;
const REFRESH_SECRET = jwtRefreshSecret || jwtSecret;

// Access token – qisqa muddat (masalan 15 daqiqa)
function signAccessToken(payload) {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
}

// Refresh token – uzun muddat (30 kun)
function signRefreshToken(payload) {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '30d' });
}

// Foydalanuvchi obyektini frontendga jo'natish uchun format
function mapUserForClient(user) {
    if (!user) return null;
    return {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        role: user.role,
        branch_id: user.branch_id,
    };
}

// LOGIN
async function login({ username, password }) {
    if (!username || !password) {
        throw new Error('username va password majburiy');
    }

    const user = await repo.getUserWithPasswordByUsername(username);
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
        branchId: user.branch_id || null,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    return {
        accessToken,
        refreshToken,
        user: mapUserForClient(user),
    };
}

// REFRESH – eskirgan access tokenni yangilash
async function refreshTokens({ refreshToken }) {
    if (!refreshToken) {
        throw new Error('Refresh token majburiy');
    }

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch (err) {
        console.error('refreshTokens verify error:', err);
        throw new Error('Refresh token yaroqsiz yoki muddati tugagan');
    }

    // Userni qayta tekshirib olamiz (bloklangan bo'lishi mumkin)
    const user = await repo.getUserById(decoded.id);
    if (!user || !user.is_active) {
        throw new Error('Foydalanuvchi topilmadi yoki bloklangan');
    }

    const payload = {
        id: user.id,
        role: user.role,
        branchId: user.branch_id || null,
    };

    const newAccessToken = signAccessToken(payload);
    // xohlasang refreshni ham har safar yangilash mumkin
    const newRefreshToken = signRefreshToken(payload);

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: mapUserForClient(user),
    };
}

// LOGOUT – biz hozircha server tomonda holat saqlamaymiz
async function logout() {
    // Agar refresh tokenlarni DB'da yuritishni boshlasak,
    // shu yerda ularni o'chiramiz. Hozircha bo'sh qoladi.
    return { success: true };
}

module.exports = {
    login,
    refreshTokens,
    logout,
};
