// server/src/modules/auth/auth.controller.js
const service = require('./auth.service');

async function login(req, res) {
    try {
        const result = await service.login(req.body);
        res.json(result);
    } catch (err) {
        console.error('login error:', err);
        res.status(400).json({ message: err.message || 'Login xatosi' });
    }
}

async function refresh(req, res) {
    try {
        const { refreshToken } = req.body || {};
        const result = await service.refreshTokens({ refreshToken });
        res.json(result);
    } catch (err) {
        console.error('refresh error:', err);
        res.status(401).json({ message: err.message || 'Tokenni yangilashda xatolik' });
    }
}

async function logout(req, res) {
    try {
        await service.logout();
        res.json({ success: true });
    } catch (err) {
        console.error('logout error:', err);
        res.status(400).json({ message: 'Logout xatoligi' });
    }
}

module.exports = {
    login,
    refresh,
    logout,
};
