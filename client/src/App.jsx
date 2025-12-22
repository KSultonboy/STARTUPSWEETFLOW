import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/authContext";

import LoginPage from "./pages/LoginPage";
import ProductsPage from "./pages/ProductsPage";
import BranchesPage from "./pages/BranchesPage";
import UsersPage from "./pages/UsersPage";
import ReportsPage from "./pages/ReportsPage";
import WarehousePage from "./pages/WarehousePage";
import HistoryPage from "./pages/HistoryPage";
import SalesPage from "./pages/SalesPage";
import ProductionPage from "./pages/ProductionPage";
import ExpensesPage from "./pages/ExpensesPage";
import TransfersPage from "./pages/TransfersPage";
import ReceivingPage from "./pages/ReceivingPage";
import ReturnsPage from "./pages/ReturnsPage";
import CashPage from "./pages/CashPage";

// Layouts
import AppLayout from "./layouts/AppLayout";
import PlatformLayout from "./layouts/PlatformLayout";

// Platform Pages
import TenantsPage from "./pages/platform/TenantsPage";
import PlansPage from "./pages/platform/PlansPage";
import PlatformLoginPage from "./pages/platform/PlatformLoginPage";

const hasFeature = (user, key) => {
  if (!user?.features || Object.keys(user.features).length === 0) {
    return true;
  }
  return !!user.features[key];
};

function TenantIndexRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "production") {
    return <Navigate to="/production" replace />;
  }

  if (user.role === "branch") {
    return <Navigate to="/sales" replace />;
  }

  if (user.role === "admin" || user.role === "TENANT_ADMIN") {
    if (hasFeature(user, "accounting")) {
      return <Navigate to="/reports" replace />;
    }
    if (hasFeature(user, "sales")) {
      return <Navigate to="/sales" replace />;
    }
    if (hasFeature(user, "warehouse")) {
      return <Navigate to="/warehouse" replace />;
    }
    return <Navigate to="/products" replace />;
  }

  return <Navigate to="/login" replace />;
}

function ReportsRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.role === "admin" || user.role === "TENANT_ADMIN";
  if (!isAdmin || !hasFeature(user, "accounting")) {
    return <Navigate to="/" replace />;
  }

  return <ReportsPage />;
}

function App() {
  const { loading } = useAuth();

  if (loading) return <div>Yuklanmoqda...</div>;

  return (
    <Routes>
      {/* Public / Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/platform/login" element={<PlatformLoginPage />} />

      {/* Platform App */}
      <Route path="/platform" element={<PlatformLayout />}>
        <Route path="tenants" element={<TenantsPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route index element={<Navigate to="tenants" />} />
      </Route>

      {/* Tenant App */}
      <Route path="/" element={<AppLayout />}>
        {/* Common Routes */}
        <Route path="warehouse" element={<WarehousePage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="cash" element={<CashPage />} />
        <Route path="returns" element={<ReturnsPage />} />

        {/* Role Based Routes mapped within AppLayout sidebar visibility, 
               but here we rely on the backend RBAC or simple component mounting. 
               Ideally strict Guard wrapper should be here too. */}

        <Route path="reports" element={<ReportsRoute />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="branches" element={<BranchesPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="transfers" element={<TransfersPage />} />

        <Route path="sales" element={<SalesPage />} />
        <Route path="receiving" element={<ReceivingPage />} />
        <Route path="production" element={<ProductionPage />} />

        {/* Default route logic is handled in AppLayout or here */}
        <Route index element={<TenantIndexRedirect />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
