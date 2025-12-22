import { useState, useMemo, useEffect } from "react";
import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import WalletPopover from "../components/wallet/WalletPopover";

export default function AppLayout() {
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

    // Sidebar collapse state
    // Desktop: false = Expanded, true = Mini
    // Mobile:  true = Hidden, false = Visible
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        return window.innerWidth < 768;
    });

    // ✅ Keep sidebar state sane on resize (especially when rotating / resizing devtools)
    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth < 768) {
                // mobile => default closed
                setSidebarCollapsed(true);
            }
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const toggleSidebar = () => {
        setSidebarCollapsed((prev) => !prev);
    };

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    const userInitials = useMemo(() => {
        if (!user?.full_name) return "U";
        const parts = user.full_name.trim().split(" ");
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }, [user]);

    // ✅ Mobile drawer state
    const isMobile = window.innerWidth < 768;
    const isDrawerOpen = isMobile && !sidebarCollapsed;

    // ✅ Scroll lock + ESC close when drawer open
    useEffect(() => {
        if (isDrawerOpen) {
            document.body.classList.add("rt-no-scroll");
        } else {
            document.body.classList.remove("rt-no-scroll");
        }

        const onKeyDown = (e) => {
            if (e.key === "Escape" && isDrawerOpen) {
                setSidebarCollapsed(true);
            }
        };
        window.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.classList.remove("rt-no-scroll");
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [isDrawerOpen]);

    // If not logged in, redirect to login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If platform user, redirect to platform
    if (user.role === "PLATFORM_OWNER") {
        return <Navigate to="/platform/tenants" replace />;
    }

    // FEATURE FLAGS
    const hasFeature = (key) => {
        if (!user.features || Object.keys(user.features).length === 0) {
            return true;
        }
        return !!user.features[key];
    };

    const isActive = (path) => (location.pathname === path ? "active" : "");
    const isAdmin = user?.role === "admin" || user?.role === "TENANT_ADMIN";
    const isBranch = user?.role === "branch";
    const isProduction = user?.role === "production";

    return (
        <div className={`app-container theme-${theme}`}>
            <div className={`app-shell ${sidebarCollapsed ? "is-collapsed" : ""}`}>
                {/* ✅ REAL overlay (click => close) */}
                {isDrawerOpen && (
                    <div
                        className="app-overlay"
                        onClick={() => setSidebarCollapsed(true)}
                    />
                )}

                <aside
                    className={`app-sidebar ${sidebarCollapsed ? "app-sidebar--collapsed" : ""
                        }`}
                >
                    <div className="app-sidebar-header">
                        <div className="app-logo">R</div>
                        {!sidebarCollapsed && (
                            <div className="app-brand">
                                <span className="app-brand-title">
                                    {user.tenantName || "Ruxshona Tort"}
                                </span>
                                <span className="app-brand-subtitle">
                                    {user.branch_id ? `Filial #${user.branch_id}` : "Boshqaruv"}
                                </span>
                            </div>
                        )}
                    </div>

                    <nav
                        className="app-nav-vertical"
                        onClick={() => {
                            // Mobilda menyudan link bosilganda drawer yopilsin
                            if (window.innerWidth < 768) {
                                setSidebarCollapsed(true);
                            }
                        }}
                    >
                        {/* ADMIN MENYU */}
                        {isAdmin && (
                            <>
                                {hasFeature("accounting") && (
                                    <>
                                        <Link className={isActive("/reports")} to="/reports">
                                            <span className="app-nav-icon">📊</span>
                                            {!sidebarCollapsed && (
                                                <span className="app-nav-label">Hisobotlar</span>
                                            )}
                                        </Link>
                                        <Link className={isActive("/cash")} to="/cash">
                                            <span className="app-nav-icon">💰</span>
                                            {!sidebarCollapsed && (
                                                <span className="app-nav-label">Kassa</span>
                                            )}
                                        </Link>
                                    </>
                                )}

                                {hasFeature("sales") && (
                                    <Link className={isActive("/branches")} to="/branches">
                                        <span className="app-nav-icon">🏬</span>
                                        {!sidebarCollapsed && (
                                            <span className="app-nav-label">Filiallar</span>
                                        )}
                                    </Link>
                                )}

                                <Link className={isActive("/users")} to="/users">
                                    <span className="app-nav-icon">👥</span>
                                    {!sidebarCollapsed && (
                                        <span className="app-nav-label">Foydalanuvchilar</span>
                                    )}
                                </Link>

                                {hasFeature("accounting") && (
                                    <Link className={isActive("/expenses")} to="/expenses">
                                        <span className="app-nav-icon">💸</span>
                                        {!sidebarCollapsed && (
                                            <span className="app-nav-label">Xarajatlar</span>
                                        )}
                                    </Link>
                                )}

                                {hasFeature("warehouse") && (
                                    <Link className={isActive("/warehouse")} to="/warehouse">
                                        <span className="app-nav-icon">📦</span>
                                        {!sidebarCollapsed && (
                                            <span className="app-nav-label">Omborxona</span>
                                        )}
                                    </Link>
                                )}

                                <Link className={isActive("/products")} to="/products">
                                    <span className="app-nav-icon">🍰</span>
                                    {!sidebarCollapsed && (
                                        <span className="app-nav-label">Asosiy Catalog</span>
                                    )}
                                </Link>

                                {hasFeature("warehouse") && (
                                    <Link className={isActive("/transfers")} to="/transfers">
                                        <span className="app-nav-icon">🚚</span>
                                        {!sidebarCollapsed && (
                                            <span className="app-nav-label">Transferlar</span>
                                        )}
                                    </Link>
                                )}

                                {hasFeature("sales") && (
                                    <Link className={isActive("/returns")} to="/returns">
                                        <span className="app-nav-icon">↩️</span>
                                        {!sidebarCollapsed && (
                                            <span className="app-nav-label">Vazvratlar</span>
                                        )}
                                    </Link>
                                )}

                                <Link className={isActive("/history")} to="/history">
                                    <span className="app-nav-icon">🕒</span>
                                    {!sidebarCollapsed && (
                                        <span className="app-nav-label">Tarix</span>
                                    )}
                                </Link>
                            </>
                        )}

                        {/* BRANCH MENYU */}
                        {isBranch && (
                            <>
                                {hasFeature("accounting") && (
                                    <Link className={isActive("/cash")} to="/cash">
                                        <span className="app-nav-icon">💰</span>
                                        {!sidebarCollapsed && (
                                            <span className="app-nav-label">Kassa</span>
                                        )}
                                    </Link>
                                )}

                                {hasFeature("warehouse") && (
                                    <Link className={isActive("/warehouse")} to="/warehouse">
                                        <span className="app-nav-icon">📦</span>
                                        {!sidebarCollapsed && (
                                            <span className="app-nav-label">Omborxona</span>
                                        )}
                                    </Link>
                                )}

                                {hasFeature("sales") && (
                                    <Link className={isActive("/sales")} to="/sales">
                                        <span className="app-nav-icon">💵</span>
                                        {!sidebarCollapsed && (
                                            <span className="app-nav-label">Sotuv</span>
                                        )}
                                    </Link>
                                )}

                                {hasFeature("warehouse") && (
                                    <Link className={isActive("/receiving")} to="/receiving">
                                        <span className="app-nav-icon">🚚</span>
                                        {!sidebarCollapsed && (
                                            <span className="app-nav-label">Qabul qilish</span>
                                        )}
                                    </Link>
                                )}

                                {hasFeature("sales") && (
                                    <Link className={isActive("/returns")} to="/returns">
                                        <span className="app-nav-icon">↩️</span>
                                        {!sidebarCollapsed && (
                                            <span className="app-nav-label">Vazvratlar</span>
                                        )}
                                    </Link>
                                )}

                                <Link className={isActive("/history")} to="/history">
                                    <span className="app-nav-icon">🕒</span>
                                    {!sidebarCollapsed && (
                                        <span className="app-nav-label">Sotuv tarixi</span>
                                    )}
                                </Link>
                            </>
                        )}

                        {/* PRODUCTION MENYU */}
                        {isProduction && (
                            <>
                                {hasFeature("warehouse") && (
                                    <Link className={isActive("/warehouse")} to="/warehouse">
                                        <span className="app-nav-icon">📦</span>
                                        {!sidebarCollapsed && (
                                            <span className="app-nav-label">Omborxona</span>
                                        )}
                                    </Link>
                                )}

                                {hasFeature("production") && (
                                    <Link className={isActive("/production")} to="/production">
                                        <span className="app-nav-icon">🏭</span>
                                        {!sidebarCollapsed && (
                                            <span className="app-nav-label">Production kiritish</span>
                                        )}
                                    </Link>
                                )}

                                <Link className={isActive("/history")} to="/history">
                                    <span className="app-nav-icon">🕒</span>
                                    {!sidebarCollapsed && (
                                        <span className="app-nav-label">Production tarixi</span>
                                    )}
                                </Link>
                            </>
                        )}
                    </nav>

                    <button
                        type="button"
                        className="app-sidebar-toggle-desktop"
                        onClick={toggleSidebar}
                    >
                        {sidebarCollapsed ? "⮞" : "⮜"}
                    </button>
                </aside>

                <main className="app-main">
                    <header className="app-topbar">
                        <div className="app-topbar-left">
                            <button className="app-hamburger" onClick={toggleSidebar} type="button">
                                ☰
                            </button>
                        </div>

                        <div className="app-topbar-right">
                            <WalletPopover />

                            <button
                                type="button"
                                className="app-theme-toggle"
                                onClick={toggleTheme}
                            >
                                {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
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
                                onClick={async () => {
                                    try {
                                        await logout();
                                    } finally {
                                        window.location.href = "/login";
                                    }
                                }}
                                type="button"
                            >
                                Chiqish
                            </button>
                        </div>
                    </header>

                    <div className="app-content">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
