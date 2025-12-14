// server/src/modules/reports/reports.routes.js
const express = require('express');
const router = express.Router();
const controller = require('./reports.controller');

// GET /api/reports/overview?date=2025-12-05&mode=day|week|month|year
router.get('/overview', controller.getOverview);

module.exports = router;
