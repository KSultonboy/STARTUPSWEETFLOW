// server/src/modules/auth/auth.routes.js
const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');

// Login
router.post('/login', controller.login);

// Access tokenni yangilash
router.post('/refresh', controller.refresh);

// Logout (hozircha faqat frontendda tokenlarni tozalash)
router.post('/logout', controller.logout);

module.exports = router;
