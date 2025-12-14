import { Link, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useEffect, useMemo, useState } from "react";

import LoginPage from "./pages/LoginPage";
import ProductsPage from "./pages/ProductsPage";
import BranchesPage from "./pages/BranchesPage";
import UsersPage from "./pages/UsersPage";
import ReportsPage from "./pages/ReportsPage";
import WarehousePage from "./pages/WarehousePage";
import HistoryPage from "./pages/HistoryPage";
import SalesPage from "./pages/SalesPage";
import ProductionPage from "./pages/ProductionPage";
import PrivateRoute from "./components/PrivateRoute";
import ExpensesPage from "./pages/ExpensesPage";
import TransfersPage from "./pages/TransfersPage";
import ReceivingPage from "./pages/ReceivingPage";
import ReturnsPage from "./pages/ReturnsPage";
import CashPage from "./pages/CashPage";

function App() {
  const { user, logout } = useAuth();
  const location = useLocation();

  // THEME: dark / light
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("rt_theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("rt_theme", theme);
  }, [theme]);

  // Sidebar collapse
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isActive = (path) => (location.pathname === path ? "active" : "");

  const isAdmin = user?.role === "admin";
  const isBranch = user?.role === "branch";
  const isProduction = user?.role === "production";

  // Har bir role uchun default sahifa
  const getDefaultPathForUser = () => {
    if (!user) return "/login";
    if (isAdmin) return "/reports"; // admin uchun Hisobotlar
    if (isBranch) return "/sales"; // filial kassir uchun Sotuv
    if (isProduction) return "/production"; // production user uchun Production
    return "/reports";
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Profil avatari uchun bosh harflar
  const userInitials = useMemo(() => {
    if (!user?.full_name) return "U";
    const parts = user.full_name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }, [user]);

  return (
    <div className={`app-container theme-${theme}`}>
      <div className={`app-shell ${sidebarCollapsed ? "is-collapsed" : ""}`}>
        {/* CHAP SIDEBAR – faqat login bo‘lsa */}
        {user && (
          <aside
            className={`app-sidebar ${sidebarCollapsed ? "app-sidebar--collapsed" : ""
              }`}
          >
            <div className="app-sidebar-header">
              <div className="app-logo">R</div>
              {!sidebarCollapsed && (
                <div className="app-brand">
                  <span className="app-brand-title">Ruxshona Tort</span>
                  <span className="app-brand-subtitle">
                    Ichki boshqaruv paneli
                  </span>
                </div>
              )}
            </div>

            <nav className="app-nav-vertical">
              {/* ADMIN MENYU */}
              {isAdmin && (
                <>
                  <Link className={isActive("/reports")} to="/reports">
                    <span className="app-nav-icon">📊</span>
                    {!sidebarCollapsed && (
                      <span className="app-nav-label">Hisobotlar</span>
                    )}
                  </Link>

                  <Link className={isActive("/cash")} to="/cash">
                    <span className="app-nav-icon">💰</span>
                    {!sidebarCollapsed && <span className="app-nav-label">Kassa</span>}
                  </Link>

                  <Link className={isActive("/branches")} to="/branches">
                    <span className="app-nav-icon">🏬</span>
                    {!sidebarCollapsed && (
                      <span className="app-nav-label">Filiallar</span>
                    )}
                  </Link>

                  <Link className={isActive("/users")} to="/users">
                    <span className="app-nav-icon">👥</span>
                    {!sidebarCollapsed && (
                      <span className="app-nav-label">Foydalanuvchilar</span>
                    )}
                  </Link>

                  <Link className={isActive("/expenses")} to="/expenses">
                    <span className="app-nav-icon">💸</span>
                    {!sidebarCollapsed && (
                      <span className="app-nav-label">Xarajatlar</span>
                    )}
                  </Link>

                  <Link className={isActive("/warehouse")} to="/warehouse">
                    <span className="app-nav-icon">📦</span>
                    {!sidebarCollapsed && (
                      <span className="app-nav-label">Omborxona</span>
                    )}
                  </Link>

                  <Link className={isActive("/products")} to="/products">
                    <span className="app-nav-icon">🍰</span>
                    {!sidebarCollapsed && (
                      <span className="app-nav-label">Asosiy Catalog</span>
                    )}
                  </Link>

                  <Link className={isActive("/transfers")} to="/transfers">
                    <span className="app-nav-icon">🚚</span>
                    {!sidebarCollapsed && (
                      <span className="app-nav-label">Transferlar</span>
                    )}
                  </Link>

                  {/* ✅ Admin uchun Vazvratlar */}
                  <Link className={isActive("/returns")} to="/returns">
                    <span className="app-nav-icon">↩️</span>
                    {!sidebarCollapsed && (
                      <span className="app-nav-label">Vazvratlar</span>
                    )}
                  </Link>

                  <Link className={isActive("/history")} to="/history">
                    <span className="app-nav-icon">🕒</span>
                    {!sidebarCollapsed && (
                      <span className="app-nav-label">Tarix</span>
                    )}
                  </Link>
                </>
              )}

              {/* BRANCH MENYU – filial kassirlar */}
              {isBranch && (
                <>
                  <Link className={isActive("/cash")} to="/cash">
                    <span className="app-nav-icon">💰</span>
                    {!sidebarCollapsed && <span className="app-nav-label">Kassa</span>}
                  </Link>

                  <Link className={isActive("/warehouse")} to="/warehouse">
                    <span className="app-nav-icon">📦</span>
                    {!sidebarCollapsed && (
                      <span className="app-nav-label">Omborxona</span>
                    )}
                  </Link>

                  <Link className={isActive("/sales")} to="/sales">
                    <span className="app-nav-icon">💵</span>
                    {!sidebarCollapsed && (
                      <span className="app-nav-label">Sotuv</span>
                    )}
                  </Link>

                  <Link className={isActive("/receiving")} to="/receiving">
                    <span className="app-nav-icon">🚚</span>
                    {!sidebarCollapsed && (
                      <span className="app-nav-label">Qabul qilish</span>
                    )}
                  </Link>

                  {/* ✅ Branch userlar uchun Vazvrat – TRANSFER/QABUL yonida */}
                  <Link className={isActive("/returns")} to="/returns">
                    <span className="app-nav-icon">↩️</span>
                    {!sidebarCollapsed && (
                      <span className="app-nav-label">Vazvratlar</span>
                    )}
                  </Link>

                  <Link className={isActive("/history")} to="/history">
                    <span className="app-nav-icon">🕒</span>
                    {!sidebarCollapsed && (
                      <span className="app-nav-label">Sotuv tarixi</span>
                    )}
                  </Link>
                </>
              )}

              {/* PRODUCTION MENYU – ishlab chiqarish bo‘limi */}
              {isProduction && (
                <>
                  <Link className={isActive("/warehouse")} to="/warehouse">
                    <span className="app-nav-icon">📦</span>
                    {!sidebarCollapsed && (
                      <span className="app-nav-label">Omborxona</span>
                    )}
                  </Link>

                  <Link className={isActive("/production")} to="/production">
                    <span className="app-nav-icon">🏭</span>
                    {!sidebarCollapsed && (
                      <span className="app-nav-label">
                        Production kiritish
                      </span>
                    )}
                  </Link>

                  <Link className={isActive("/history")} to="/history">
                    <span className="app-nav-icon">🕒</span>
                    {!sidebarCollapsed && (
                      <span className="app-nav-label">
                        Production tarixi
                      </span>
                    )}
                  </Link>
                </>
              )}
            </nav>

            <button
              type="button"
              className="app-sidebar-toggle"
              onClick={toggleSidebar}
            >
              {sidebarCollapsed ? "⮞" : "⮜"}
            </button>
          </aside>
        )}

        {/* O‘NG TOMON – topbar + content */}
        <main className="app-main">
          {user && (
            <header className="app-topbar">
              <div className="app-topbar-left" />
              <div className="app-topbar-right">
                <button
                  type="button"
                  className="app-theme-toggle"
                  onClick={toggleTheme}
                >
                  {theme === "dark" ? (
                    <>
                      ☀️ <span>Light</span>
                    </>
                  ) : (
                    <>
                      🌙 <span>Dark</span>
                    </>
                  )}
                </button>

                <div className="app-user">
                  <div className="app-user-avatar">{userInitials}</div>
                  <div className="app-user-text">
                    <span className="app-user-name">{user.full_name}</span>
                    <span className="app-user-role">{user.role}</span>
                  </div>
                </div>

                <button
                  className="button-primary"
                  style={{ padding: "4px 10px", fontSize: 12 }}
                  onClick={logout}
                >
                  Chiqish
                </button>
              </div>
            </header>
          )}

          <div className="app-content">
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              {/* Admin uchun sahifalar */}
              <Route
                path="/reports"
                element={
                  <PrivateRoute>
                    <ReportsPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/branches"
                element={
                  <PrivateRoute>
                    <BranchesPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <PrivateRoute>
                    <UsersPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/expenses"
                element={
                  <PrivateRoute>
                    <ExpensesPage />
                  </PrivateRoute>
                }
              />

              {/* Umumiy sahifalar */}
              <Route
                path="/warehouse"
                element={
                  <PrivateRoute>
                    <WarehousePage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <PrivateRoute>
                    <ProductsPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <PrivateRoute>
                    <HistoryPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/sales"
                element={
                  <PrivateRoute>
                    <SalesPage />
                  </PrivateRoute>
                }
              />

              {/* Production route */}
              <Route
                path="/production"
                element={
                  <PrivateRoute>
                    <ProductionPage />
                  </PrivateRoute>
                }
              />

              <Route
                path="/transfers"
                element={
                  <PrivateRoute>
                    <TransfersPage />
                  </PrivateRoute>
                }
              />

              <Route
                path="/receiving"
                element={
                  <PrivateRoute>
                    <ReceivingPage />
                  </PrivateRoute>
                }
              />

              {/* ✅ Vazvratlar – admin va branch */}
              <Route
                path="/returns"
                element={
                  <PrivateRoute roles={["admin", "branch"]}>
                    <ReturnsPage />
                  </PrivateRoute>
                }
              />

              <Route
                path="/cash"
                element={
                  <PrivateRoute roles={["admin", "branch"]}>
                    <CashPage />
                  </PrivateRoute>
                }
              />


              {/* Default redirect – foydalanuvchi role bo‘yicha */}
              <Route
                path="*"
                element={<Navigate to={getDefaultPathForUser()} replace />}
              />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
