// server/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token berilmagan' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, jwtSecret);
        req.user = {
            id: payload.id,
            role: payload.role,
            tenantId: payload.tenantId, // Tenant ID
            branchId: payload.branchId || null,
        };
        next();
    } catch (err) {
        console.error('JWT verify error:', err.message);

        // ❗ MUHIM: refresh interceptorga to‘g‘ri chiqishi uchun aynan shu text bo‘lishi kerak
        if (err.message.includes("jwt expired")) {
            return res.status(401).json({ message: "JWT expired" });
        }

        return res.status(401).json({ message: 'Token noto‘g‘ri yoki eskirgan' });
    }
}

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Ruxsat etilmagan' });
        }
        next();
    };
}

module.exports = {
    requireAuth,
    requireRole,
};
