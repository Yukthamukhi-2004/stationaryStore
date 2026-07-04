import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTransition from "../../components/PageTransition";
import { api, type RevenueAnalytics, type OrderAnalytics, type InventoryAnalytics } from "../../lib/api";

export default function AdminAnalytics() {
  const [revenue, setRevenue] = useState<RevenueAnalytics | null>(null);
  const [orders, setOrders] = useState<OrderAnalytics | null>(null);
  const [inventory, setInventory] = useState<InventoryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"revenue" | "orders" | "inventory">("revenue");

  useEffect(() => {
    async function fetchData() {
      try {
        const [rev, ord, inv] = await Promise.all([
          api.getRevenueAnalytics(),
          api.getOrderAnalytics(),
          api.getInventoryAnalytics(),
        ]);

        setRevenue(rev);
        setOrders(ord);
        setInventory(inv);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <PageTransition>
        <div className="admin-loading">Loading analytics...</div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="admin-error">⚠️ {error}</div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="admin-page">
        {/* ═══ Gradient Header Banner ═══ */}
        <div className="ref-header">
          <div className="ref-header-content">
            <div className="ref-header-text">
              <h1>📈 Analytics</h1>
              <p>Insights into your store performance</p>
            </div>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="ref-metrics-grid">
          <motion.div
            className="ref-metric-card amber"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="ref-metric-header">
              <div className="ref-metric-icon amber-bg" style={{ color: "var(--amber-500)" }}>💰</div>
            </div>
            <div className="ref-metric-value">₹{(revenue?.total_revenue ?? 0).toLocaleString("en-IN")}</div>
            <div className="ref-metric-label">Total Revenue</div>
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
            <div className="ref-metric-value">{orders?.total_orders ?? 0}</div>
            <div className="ref-metric-label">Total Orders</div>
          </motion.div>

          <motion.div
            className="ref-metric-card purple"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="ref-metric-header">
              <div className="ref-metric-icon purple-bg" style={{ color: "#7c3aed" }}>🎯</div>
            </div>
            <div className="ref-metric-value">₹{(orders?.average_order_value ?? 0).toFixed(2)}</div>
            <div className="ref-metric-label">Avg Order Value</div>
          </motion.div>
        </div>

        {/* Tab Switcher */}
        <div className="admin-tabs">
          {(["revenue", "orders", "inventory"] as const).map((tab) => (
            <button
              key={tab}
              className={`admin-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "revenue" && "💰 "}
              {tab === "orders" && "📋 "}
              {tab === "inventory" && "📦 "}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Revenue Tab */}
        {activeTab === "revenue" && revenue && (
          <motion.div
            className="ref-section-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2 className="ref-section-title">📊 Revenue Over Time</h2>
            {revenue.monthly.length > 0 ? (
              <div className="admin-bar-chart">
                {revenue.monthly.map((item) => {
                  const maxRevenue = Math.max(...revenue.monthly.map((m) => m.revenue));
                  const heightPct = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={item.month} className="admin-bar-item">
                      <span className="admin-bar-value">₹{(item.revenue / 1000).toFixed(1)}k</span>
                      <div className="admin-bar-track">
                        <motion.div
                          className="admin-bar-fill"
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                      <span className="admin-bar-label">{item.month.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="ref-empty-state">
                <span className="ref-empty-icon">📭</span>
                No revenue data available yet.
              </div>
            )}

            <h2 className="ref-section-title" style={{ marginTop: "1.5rem" }}>
              💳 Payment Methods
            </h2>
            <div className="admin-status-list">
              {Object.entries(revenue.payment_method_breakdown).map(
                ([method, count]) => (
                  <div key={method} className="admin-status-item">
                    <span className="admin-status-name">
                      {method.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                    <div className="admin-status-bar-track">
                      <motion.div
                        className="admin-status-bar-fill"
                        style={{ background: "var(--teal-400)" }}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(count / Math.max(...Object.values(revenue.payment_method_breakdown))) * 100}%`,
                        }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <span className="admin-status-count">{count}</span>
                  </div>
                )
              )}
            </div>
          </motion.div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && orders && (
          <motion.div
            className="ref-section-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2 className="ref-section-title">📊 Orders Over Time</h2>
            {orders.monthly.length > 0 ? (
              <div className="admin-bar-chart">
                {orders.monthly.map((item) => {
                  const maxCount = Math.max(...orders.monthly.map((m) => m.count));
                  const heightPct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                  return (
                    <div key={item.month} className="admin-bar-item">
                      <span className="admin-bar-value">{item.count}</span>
                      <div className="admin-bar-track">
                        <motion.div
                          className="admin-bar-fill"
                          style={{ background: "var(--teal-400)" }}
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                      <span className="admin-bar-label">{item.month.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="ref-empty-state">
                <span className="ref-empty-icon">📭</span>
                No order data available yet.
              </div>
            )}

            <h2 className="ref-section-title" style={{ marginTop: "1.5rem" }}>
              🔄 Status Distribution
            </h2>
            <div className="admin-status-list">
              {Object.entries(orders.status_distribution).map(
                ([status, count]) => (
                  <div key={status} className="admin-status-item">
                    <span className="admin-status-name">{status}</span>
                    <div className="admin-status-bar-track">
                      <motion.div
                        className="admin-status-bar-fill"
                        style={{
                          background:
                            status === "Delivered"
                              ? "var(--teal-400)"
                              : status === "Cancelled"
                                ? "var(--rose-400)"
                                : "var(--coral-400)",
                        }}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(count / Math.max(...Object.values(orders.status_distribution))) * 100}%`,
                        }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <span className="admin-status-count">{count}</span>
                  </div>
                )
              )}
            </div>
          </motion.div>
        )}

        {/* Inventory Tab */}
        {activeTab === "inventory" && inventory && (
          <motion.div
            className="ref-section-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="ref-metrics-grid" style={{ marginBottom: "1.5rem" }}>
              <div className="ref-metric-card coral">
                <div className="ref-metric-header">
                  <div className="ref-metric-icon coral-bg" style={{ color: "var(--coral-400)" }}>📦</div>
                </div>
                <div className="ref-metric-value">{inventory.total_products}</div>
                <div className="ref-metric-label">Products</div>
              </div>
              <div className="ref-metric-card teal">
                <div className="ref-metric-header">
                  <div className="ref-metric-icon teal-bg" style={{ color: "var(--teal-400)" }}>📊</div>
                </div>
                <div className="ref-metric-value">{inventory.total_stock}</div>
                <div className="ref-metric-label">Total Stock</div>
              </div>
              <div className="ref-metric-card rose">
                <div className="ref-metric-header">
                  <div className="ref-metric-icon rose-bg" style={{ color: "var(--rose-400)" }}>⚠️</div>
                </div>
                <div className="ref-metric-value" style={{ color: "var(--rose-400)" }}>{inventory.low_stock_count}</div>
                <div className="ref-metric-label">Low Stock Items</div>
              </div>
              <div className="ref-metric-card rose">
                <div className="ref-metric-header">
                  <div className="ref-metric-icon rose-bg" style={{ color: "var(--rose-400)" }}>🚫</div>
                </div>
                <div className="ref-metric-value" style={{ color: "var(--rose-400)" }}>{inventory.out_of_stock_count}</div>
                <div className="ref-metric-label">Out of Stock</div>
              </div>
            </div>

            {inventory.low_stock_items.length > 0 && (
              <>
                <h2 className="ref-section-title">⚠️ Low Stock Items</h2>
                <div className="ref-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Stock</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.low_stock_items.map((item) => (
                        <tr key={item.id}>
                          <td className="admin-td-id">#{item.id}</td>
                          <td className="admin-td-name">{item.product_name}</td>
                          <td>
                            <span className="admin-stock-badge low">{item.stock_quantity}</span>
                          </td>
                          <td className="admin-td-price">₹{item.price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
