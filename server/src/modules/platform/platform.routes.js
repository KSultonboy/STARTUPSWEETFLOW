const express = require('express');
const router = express.Router();
const controller = require('./platform.controller');
const plansController = require('./plans.controller');
const featuresController = require('./features.controller'); // [NEW]
const { requireAuth, requireRole } = require('../../middleware/auth');

// Public
router.post('/auth/login', controller.login);

// Protected (Platform Owner Only)
router.use(requireAuth);
// TODO: When ready, enforce stricter role check
// router.use(requireRole('PLATFORM_OWNER'));

// TENANTS
router.get('/tenants', controller.getTenants);
router.post('/tenants', controller.createTenant);
router.post('/tenants/:tenantId/admin', controller.createTenantAdmin);
router.put('/tenants/:id', controller.updateTenant);
router.delete('/tenants/:id', controller.deleteTenant);
// Reset admin password (generate new temporary password and return it) - platform owner only
router.post('/tenants/:id/reset-admin-password', controller.resetAdminPassword);

// Wallet endpoints
router.get('/tenants/:id/wallet', controller.getTenantWallet);
router.post('/tenants/:id/wallet/topup', controller.topUpWallet);

// TENANT FEATURES [NEW]
router.get('/tenants/:tenantId/features', featuresController.getTenantFeatures);
router.post('/tenants/:tenantId/features', featuresController.updateTenantFeatures);

// PLANS
router.get('/plans', plansController.getPlans);
router.post('/plans', plansController.createPlan);
router.put('/plans/:id', plansController.updatePlan);
router.delete('/plans/:id', plansController.deletePlan);

module.exports = router;
