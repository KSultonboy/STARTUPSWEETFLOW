const express = require('express');
const router = express.Router();
const controller = require('./wallet.controller');

// Tenant-scoped wallet endpoints (requireAuth + tenantScope applied in app.js)
router.get('/', controller.getMyWallet);
router.post('/topup', controller.topUpMyWallet);

module.exports = router;
