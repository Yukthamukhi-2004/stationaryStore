import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTransition from "../../components/PageTransition";
import { api, type DashboardStats } from "../../lib/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <PageTransition>
        <div className="admin-loading">Loading dashboard...</div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="admin-error">
          <p>⚠️ {error}</p>
          <p style={{ fontSize: "0.85rem", marginTop: "0.5rem", color: "var(--gray-500)" }}>
            Make sure the backend server is running on port 5001.
          </p>
        </div>
      </PageTransition>
    );
  }

  const statusEntries = stats?.order_status_breakdown
    ? Object.entries(stats.order_status_breakdown)
    : [];

  return (
    <PageTransition>
      <div className="admin-page">
        {/* ═══ Gradient Header Banner ═══ */}
        <div className="ref-header">
          <div className="ref-header-content">
            <div className="ref-header-text">
              <h1>📊 Dashboard</h1>
              <p>Welcome back! Here's your store overview.</p>
            </div>
          </div>
        </div>

        {/* ═══ Metrics Grid ═══ */}
        <div className="ref-metrics-grid">
          <motion.div
            className="ref-metric-card coral"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="ref-metric-header">
              <div className="ref-metric-icon coral-bg" style={{ color: "var(--coral-400)" }}>📦</div>
            </div>
            <div className="ref-metric-value">{stats?.total_products ?? 0}</div>
            <div className="ref-metric-label">Total Products</div>
          </motion.div>

          <motion.div
            className="ref-metric-card teal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="ref-metric-header">
              <div className="ref-metric-icon teal-bg" style={{ color: "var(--teal-400)" }}>📋</div>
            </div>
            <div className="ref-metric-value">{stats?.total_orders ?? 0}</div>
            <div className="ref-metric-label">Total Orders</div>
          </motion.div>

          <motion.div
            className="ref-metric-card amber"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="ref-metric-header">
              <div className="ref-metric-icon amber-bg" style={{ color: "var(--amber-500)" }}>💰</div>
            </div>
            <div className="ref-metric-value">₹{(stats?.total_revenue ?? 0).toLocaleString("en-IN")}</div>
            <div className="ref-metric-label">Total Revenue</div>
          </motion.div>

          <motion.div
            className="ref-metric-card purple"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="ref-metric-header">
              <div className="ref-metric-icon purple-bg" style={{ color: "#7c3aed" }}>🏷️</div>
            </div>
            <div className="ref-metric-value">{stats?.total_categories ?? 0}</div>
            <div className="ref-metric-label">Categories</div>
          </motion.div>

          <motion.div
            className="ref-metric-card green"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="ref-metric-header">
              <div className="ref-metric-icon green-bg" style={{ color: "#059669" }}>📄</div>
            </div>
            <div className="ref-metric-value">{stats?.dealer_invoice_count ?? 0}</div>
            <div className="ref-metric-label">Dealer Invoices</div>
          </motion.div>

          <motion.div
            className="ref-metric-card blue"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="ref-metric-header">
              <div className="ref-metric-icon blue-bg" style={{ color: "#2563eb" }}>🧾</div>
            </div>
            <div className="ref-metric-value">{stats?.customer_invoice_count ?? 0}</div>
            <div className="ref-metric-label">Customer Invoices</div>
          </motion.div>

          <motion.div
            className="ref-metric-card orange"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="ref-metric-header">
              <div className="ref-metric-icon orange-bg" style={{ color: "#d97706" }}>📦</div>
            </div>
            <div className="ref-metric-value">{stats?.stock_purchase_count ?? 0}</div>
            <div className="ref-metric-label">Stock Purchases</div>
          </motion.div>

          <motion.div
            className="ref-metric-card amber"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="ref-metric-header">
              <div className="ref-metric-icon amber-bg" style={{ color: "var(--amber-500)" }}>💰</div>
            </div>
            <div className="ref-metric-value">₹{(stats?.stock_purchase_value ?? 0).toLocaleString("en-IN")}</div>
            <div className="ref-metric-label">Stock Purchase Value</div>
          </motion.div>
        </div>

        {/* ═══ Quick Actions ═══ */}
        <motion.div
          className="ref-section-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="ref-section-title">⚡ Quick Actions</h2>
          <div className="admin-quick-actions">
            <a href="/admin/products" className="admin-quick-action-card">
              <span className="admin-qa-icon">➕</span>
              <span className="admin-qa-label">Add Product</span>
            </a>
            <a href="/admin/orders" className="admin-quick-action-card">
              <span className="admin-qa-icon">📋</span>
              <span className="admin-qa-label">View Orders</span>
            </a>
            <a href="/admin/low-stock" className="admin-quick-action-card">
              <span className="admin-qa-icon">⚠️</span>
              <span className="admin-qa-label">Low Stock Alert</span>
            </a>
            <a href="/admin/reorder" className="admin-quick-action-card">
              <span className="admin-qa-icon">🔄</span>
              <span className="admin-qa-label">Reorder Stock</span>
            </a>
          </div>
        </motion.div>

        {/* ═══ Order Status Breakdown ═══ */}
        {statusEntries.length > 0 && (
          <motion.div
            className="ref-section-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="ref-section-title">📈 Order Status Breakdown</h2>
            <div className="admin-status-list">
              {statusEntries.map(([status, count]) => (
                <div key={status} className="admin-status-item">
                  <span className="admin-status-name">{status}</span>
                  <div className="admin-status-bar-track">
                    <motion.div
                      className="admin-status-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / Math.max(...statusEntries.map(([, c]) => c))) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  <span className="admin-status-count">{count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
