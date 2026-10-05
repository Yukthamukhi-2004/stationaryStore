import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/useUser";
import BrandLogo from "./BrandLogo";
import "./admin-ref.css";

const adminNavItems = [
  { path: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { path: "/admin/products", label: "Products", icon: "📦" },
  { path: "/admin/orders", label: "Orders", icon: "📋" },
  { path: "/admin/analytics", label: "Analytics", icon: "📈" },
  { path: "/admin/purchases", label: "Purchases", icon: "📄" },
];

const inventoryNavItems = [
  { path: "/admin/inventory", label: "Inventory", icon: "📉" },
  { path: "/admin/low-stock", label: "Low Stock", icon: "⚠️" },
  { path: "/admin/reorder", label: "Reorder", icon: "🔄" },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const { user, signOut } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const adminName = user?.name.trim() || "Admin";
  const adminEmail = user?.email || "Email unavailable";

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
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              ))}
              <div
                className="admin-nav-section"
                role="group"
                aria-label="Stock management"
              >
                <span className="admin-nav-section-label">
                  Stock Management
                </span>
                {inventoryNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`admin-nav-item admin-nav-item-nested ${isActive(item.path) ? "active" : ""}`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <span className="admin-nav-icon">{item.icon}</span>
                    <span className="admin-nav-label">{item.label}</span>
                    {isActive(item.path) && (
                      <motion.div
                        className="admin-nav-indicator"
                        layoutId="admin-nav-indicator"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}
                  </Link>
                ))}
              </div>
            </nav>
            <div className="admin-sidebar-footer">
              <div className="admin-sidebar-user" aria-label="Verified admin">
                <div className="admin-sidebar-user-avatar" aria-hidden="true">
                  {adminName.charAt(0).toUpperCase()}
                </div>
                <div className="admin-sidebar-user-info">
                  <span className="admin-sidebar-user-name">{adminName}</span>
                  <span className="admin-sidebar-user-email">{adminEmail}</span>
                  <button
                    className="admin-sidebar-signout"
                    type="button"
                    onClick={signOut}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
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
              <div className="admin-mobile-user" aria-label="Verified admin">
                <strong>{adminName}</strong>
                <span>{adminEmail}</span>
                <button
                  className="admin-mobile-signout"
                  type="button"
                  onClick={() => {
                    setShowMobileMenu(false);
                    signOut();
                  }}
                >
                  Sign out
                </button>
              </div>
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
              <div
                className="admin-mobile-nav-section"
                role="group"
                aria-label="Stock management"
              >
                <span className="admin-mobile-nav-section-label">
                  Stock Management
                </span>
                {inventoryNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`admin-mobile-nav-item admin-mobile-nav-item-nested ${isActive(item.path) ? "active" : ""}`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <span className="admin-nav-icon">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
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
