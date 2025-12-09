// server/src/modules/history/history.routes.js
const express = require('express');
const router = express.Router();

const controller = require('./history.controller');
const { requireAuth } = require('../../middleware/auth');

router.get('/activities', requireAuth, controller.getActivities);

module.exports = router;
