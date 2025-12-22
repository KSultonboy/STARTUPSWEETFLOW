import { useState } from "react";
import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

export default function PlatformLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth < 768);

    const toggleSidebar = () => setSidebarCollapsed(prev => !prev);
    const [theme] = useState("dark");

    if (!user) {
        return <Navigate to="/platform/login" replace />;
    }

    if (user.role !== 'PLATFORM_OWNER') {
        return <Navigate to="/" replace />;
    }

    const isActive = (path) => (location.pathname === path ? "active" : "");

    return (
        <div className={`app-container theme-${theme}`}>
            <div className={`app-shell ${sidebarCollapsed ? "is-collapsed" : ""}`}>
                <aside className={`app-sidebar ${sidebarCollapsed ? "app-sidebar--collapsed" : ""}`}>
                    <div className="app-sidebar-header">
                        <div className="app-logo">SF</div>
                        {!sidebarCollapsed && (
                            <div className="app-brand">
                                <span className="app-brand-title">Sweetflow</span>
                                <span className="app-brand-subtitle">Platform Admin</span>
                            </div>
                        )}
                    </div>

                    <nav className="app-nav-vertical">
                        <Link className={isActive("/platform/tenants")} to="/platform/tenants">
                            <span className="app-nav-icon">🏢</span>
                            {!sidebarCollapsed && <span className="app-nav-label">Tizim foydalanuvchilari</span>}
                        </Link>
                        <Link className={isActive("/platform/plans")} to="/platform/plans">
                            <span className="app-nav-icon">📋</span>
                            {!sidebarCollapsed && <span className="app-nav-label">Tariflar (Plans)</span>}
                        </Link>
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
                            <button className="app-hamburger" onClick={toggleSidebar}>
                                ☰
                            </button>
                            <span className="page-title" style={{ fontSize: 18, marginLeft: 10 }}>Platform Boshqaruvi</span>
                        </div>
                        <div className="app-topbar-right">
                            <div className="platform-owner">
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user.email}</span>
                                <button onClick={logout} className="button-primary" style={{ backgroundColor: '#ef4444', height: 32, padding: '0 12px' }}>
                                    Chiqish
                                </button>
                            </div>
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
