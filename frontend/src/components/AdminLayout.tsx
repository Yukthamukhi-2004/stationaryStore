import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import BrandLogo from "./BrandLogo";
import "./admin-ref.css";

const adminNavItems = [
  { path: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { path: "/admin/products", label: "Products", icon: "📦" },
  { path: "/admin/orders", label: "Orders", icon: "📋" },
  { path: "/admin/analytics", label: "Analytics", icon: "📈" },
  { path: "/admin/inventory", label: "Inventory", icon: "📉" },
  { path: "/admin/low-stock", label: "Low Stock", icon: "⚠️" },
  { path: "/admin/reorder", label: "Reorder", icon: "🔄" },
  { path: "/admin/purchases", label: "Purchases", icon: "📄" },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <div className="admin-layout">
      {/* ─── Sidebar ─── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            className="admin-sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 250, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="admin-sidebar-header">
              <Link to="/admin/dashboard" className="admin-sidebar-brand">
                <BrandLogo size={28} className="admin-logo" />
                <div className="admin-brand-text">
                  <span className="admin-brand-main">Sarada</span>
                  <span className="admin-brand-sub">Admin Panel</span>
                </div>
              </Link>
            </div>

            <nav className="admin-sidebar-nav">
              {adminNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`admin-nav-item ${isActive(item.path) ? "active" : ""}`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <span className="admin-nav-icon">{item.icon}</span>
                  <span className="admin-nav-label">{item.label}</span>
                  {isActive(item.path) && (
                    <motion.div
                      className="admin-nav-indicator"
                      layoutId="admin-nav-indicator"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ─── Main Content Area ─── */}
      <div className="admin-main-area">
        {/* ─── Top Bar ─── */}
        <header className="admin-topbar">
          <button
            className="admin-topbar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>

          <div className="admin-topbar-right">
            <button
              className="admin-mobile-menu-btn"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Menu"
            >
              ☰
            </button>
            <Link to="/shopping/home" className="admin-view-store-btn">
              🏪 View Store
            </Link>
          </div>
        </header>

        {/* ─── Mobile Menu ─── */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              className="admin-mobile-menu"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {adminNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`admin-mobile-nav-item ${isActive(item.path) ? "active" : ""}`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <span className="admin-nav-icon">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              <Link
                to="/shopping/home"
                className="admin-mobile-nav-item"
                onClick={() => setShowMobileMenu(false)}
              >
                🏪 View Store
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Page Content ─── */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
