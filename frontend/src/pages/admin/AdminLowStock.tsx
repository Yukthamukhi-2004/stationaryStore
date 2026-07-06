import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTransition from "../../components/PageTransition";
import { api, type LowStockResponse } from "../../lib/api";

export default function AdminLowStock() {
  const [data, setData] = useState<LowStockResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(10);
  const [restocking, setRestocking] = useState<number | null>(null);

  async function fetchLowStock(t: number) {
    try {
      setLoading(true);
      const result = await api.getLowStockProducts(t);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLowStock(threshold);
  }, [threshold]);

  const handleRestock = async (id: number) => {
    setRestocking(id);
    try {
      await api.restockProduct(id, 20);
      await fetchLowStock(threshold);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to restock");
    } finally {
      setRestocking(null);
    }
  };

  if (loading && !data) {
    return (
      <PageTransition>
        <div className="admin-loading">Checking inventory...</div>
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
              <h1>⚠️ Low Stock Alerts</h1>
              <p>Products running low on inventory — {data?.count ?? 0} items below threshold</p>
            </div>
          </div>
        </div>

        {/* ═══ Threshold Control & Summary ═══ */}
        <div className="ref-summary-bar">
          <div className="ref-threshold-control">
            <label htmlFor="threshold">Alert threshold:</label>
            <select
              id="threshold"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
            >
              <option value={5}>5 units</option>
              <option value={10}>10 units</option>
              <option value={15}>15 units</option>
              <option value={20}>20 units</option>
              <option value={30}>30 units</option>
            </select>
          </div>

          <div className="ref-summary-totals">
            <div className="ref-summary-item">
              <span className="ref-summary-label">Items Below Threshold</span>
              <span className="ref-summary-value" style={{ color: "var(--rose-400)" }}>{data?.count ?? 0}</span>
            </div>
          </div>
        </div>

        {data && data.products.length === 0 ? (
          <div className="ref-section-card">
            <div className="ref-empty-state">
              <span className="ref-empty-icon">✅</span>
              All products have sufficient stock. Great job!
            </div>
          </div>
        ) : (
          <div className="ref-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Current Stock</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.products.map((product, index) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <td className="admin-td-id">#{product.id}</td>
                    <td className="admin-td-name">{product.product_name}</td>
                    <td>
                      <span className={`admin-stock-badge ${product.stock_quantity === 0 ? "out" : "low"}`}>
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="admin-td-price">₹{product.price.toFixed(2)}</td>
                    <td>
                      <motion.button
                        className="btn btn-sm btn-primary"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={restocking === product.id}
                        onClick={() => handleRestock(product.id)}
                      >
                        {restocking === product.id ? "Restocking..." : "Restock (+20)"}
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.products.length > 0 && (
          <div className="ref-section-card">
            <p className="ref-empty-state">
              💡 Tip: Click "Restock" to add 20 units to any low stock item. Use the{" "}
              <a href="/admin/reorder" style={{ color: "var(--coral-400)", textDecoration: "underline" }}>
                Reorder page
              </a>{" "}
              for bulk restocking suggestions.
            </p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
