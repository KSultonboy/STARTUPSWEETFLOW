// server/src/modules/cash/cash.routes.js
const express = require("express");
const router = express.Router();
const controller = require("./cash.controller");

// GET /api/cash?date=YYYY-MM-DD&mode=day|week|month|year&branchType=BRANCH|OUTLET&branchId=?
router.get("/", controller.list);

// GET /api/cash/summary?date=...&mode=...&branchType=...&branchId=?
router.get("/summary", controller.summary);

// ADMIN: pul oldim (branch kassasidan kamayadi)
// POST /api/cash/out  body: { branch_id, amount, cash_date?, note? }
router.post("/out", controller.cashOut);

// (ixtiyoriy) qo‘lda pul qo‘shish (masalan OUTLET o‘zi kiritadi yoki admin correction)
// POST /api/cash/in body: { branch_id, amount, cash_date?, note? }
router.post("/in", controller.cashIn);

// (ixtiyoriy) entry o‘chirish
router.delete("/:id", controller.remove);

module.exports = router;
