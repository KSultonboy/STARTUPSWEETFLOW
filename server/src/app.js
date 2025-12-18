// server/src/app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const productsRoutes = require("./modules/products/products.routes");
const authRoutes = require("./modules/auth/auth.routes");
const usersRoutes = require("./modules/users/users.routes");
const branchesRoutes = require("./modules/branches/branches.routes");
const platformRoutes = require("./modules/platform/platform.routes"); // [NEW]

const reportsRoutes = require("./modules/reports/reports.routes");
const warehouseRoutes = require("./modules/warehouse/warehouse.routes");
const historyRoutes = require("./modules/history/history.routes");
const salesRoutes = require("./modules/sales/sales.routes");
const productionRoutes = require("./modules/production/production.routes");
const expensesRoutes = require("./modules/expenses/expenses.routes");
const transfersRoutes = require("./modules/transfers/transfers.routes");
const returnsRoutes = require("./modules/returns/returns.routes");

// ✅ CASH
const cashRoutes = require("./modules/cash/cash.routes");
const tenantScope = require("./middleware/tenantScope"); // [NEW]

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Ruxshona Tort backend working" });
});

// Platform Owner Routes (No tenant scope needed, internal auth)
app.use("/api/platform", platformRoutes);

// Tenant Auth (Login doesn't need tenant scope usually, but depends on implementation)
app.use("/api/auth", authRoutes);

// TENANT SCOPED ROUTES
// Middleware that enforces req.tenantId to be present
// IMPORTANT: requireAuth must run first to populate req.user!
const { requireAuth } = require("./middleware/auth");
app.use(requireAuth);
app.use(tenantScope);

// Hozircha users va branches ni ham ochiq qoldiramiz
app.use("/api/users", usersRoutes);
app.use("/api/branches", branchesRoutes);

// Products
app.use("/api/products", productsRoutes);

app.use("/api/sales", salesRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/expenses", expensesRoutes);

// Reports / Warehouse / History / Transfers / Returns
app.use("/api/reports", reportsRoutes);
app.use("/api/warehouse", warehouseRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/transfers", transfersRoutes);
app.use("/api/returns", returnsRoutes);

// ✅ KASSA ROUTE
app.use("/api/cash", cashRoutes);

// Tenant wallet endpoints (tenant-scoped)
const walletRoutes = require('./modules/wallet/wallet.routes');
app.use('/api/wallet', walletRoutes);

module.exports = app;
