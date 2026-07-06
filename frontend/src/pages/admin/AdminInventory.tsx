import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTransition from "../../components/PageTransition";
import { api, type Product } from "../../lib/api";

export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newStock, setNewStock] = useState("");

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const handleUpdateStock = async (id: number) => {
    if (!newStock || parseInt(newStock, 10) < 0) return;
    try {
      await api.updateProduct(id, {
        stock_quantity: parseInt(newStock, 10),
      });
      await loadProducts();
      setEditingId(null);
      setNewStock("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update stock");
    }
  };

  const totalStock = products.reduce((sum, p) => sum + (p.stock_quantity ?? 0), 0);
  const lowStockCount = products.filter((p) => p.stock_quantity !== null && p.stock_quantity <= 10).length;
  const outOfStockCount = products.filter((p) => p.stock_quantity === null || p.stock_quantity === 0).length;

  if (loading) {
    return (
      <PageTransition>
        <div className="admin-loading">Loading inventory...</div>
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
              <h1>📦 Inventory</h1>
              <p>Track and manage product stock levels</p>
            </div>
          </div>
        </div>

        {/* ═══ Summary Stats ═══ */}
        <div className="ref-metrics-grid">
          <div className="ref-metric-card coral">
            <div className="ref-metric-header">
              <div className="ref-metric-icon coral-bg" style={{ color: "var(--coral-400)" }}>📦</div>
            </div>
            <div className="ref-metric-value">{products.length}</div>
            <div className="ref-metric-label">Products</div>
          </div>
          <div className="ref-metric-card teal">
            <div className="ref-metric-header">
              <div className="ref-metric-icon teal-bg" style={{ color: "var(--teal-400)" }}>📊</div>
            </div>
            <div className="ref-metric-value">{totalStock}</div>
            <div className="ref-metric-label">Total Stock</div>
          </div>
          <div className="ref-metric-card rose">
            <div className="ref-metric-header">
              <div className="ref-metric-icon rose-bg" style={{ color: "var(--rose-400)" }}>⚠️</div>
            </div>
            <div className="ref-metric-value" style={{ color: lowStockCount > 0 ? "var(--rose-400)" : "var(--teal-400)" }}>
              {lowStockCount}
            </div>
            <div className="ref-metric-label">Low Stock</div>
          </div>
          <div className="ref-metric-card rose">
            <div className="ref-metric-header">
              <div className="ref-metric-icon rose-bg" style={{ color: "var(--rose-400)" }}>🚫</div>
            </div>
            <div className="ref-metric-value" style={{ color: outOfStockCount > 0 ? "var(--rose-400)" : "var(--teal-400)" }}>
              {outOfStockCount}
            </div>
            <div className="ref-metric-label">Out of Stock</div>
          </div>
        </div>

        {/* ═══ Inventory Table ═══ */}
        <div className="ref-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Price</th>
                <th>Current Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const stock = product.stock_quantity ?? 0;
                const stockStatus = stock === 0 ? "out" : stock <= 10 ? "low" : stock <= 20 ? "medium" : "ok";

                return (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td className="admin-td-id">#{product.id}</td>
                    <td className="admin-td-name">{product.product_name}</td>
                    <td className="admin-td-price">₹{product.price.toFixed(2)}</td>
                    <td>
                      {editingId === product.id ? (
                        <div className="admin-inline-edit">
                          <input
                            className="form-input"
                            type="number"
                            min="0"
                            value={newStock}
                            onChange={(e) => setNewStock(e.target.value)}
                            style={{ width: "80px", padding: "0.3rem 0.5rem" }}
                            autoFocus
                          />
                          <button className="btn btn-sm btn-primary" onClick={() => handleUpdateStock(product.id)}>Save</button>
                          <button className="btn btn-sm btn-outline" onClick={() => { setEditingId(null); setNewStock(""); }}>Cancel</button>
                        </div>
                      ) : (
                        <span className={`admin-stock-badge ${stockStatus}`}>{stock}</span>
                      )}
                    </td>
                    <td>
                      <span className={`admin-stock-label ${stockStatus}`}>
                        {stockStatus === "out" ? "Out of Stock" : stockStatus === "low" ? "Low Stock" : stockStatus === "medium" ? "Medium" : "In Stock"}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => { setEditingId(product.id); setNewStock(String(stock)); }}>
                        Update Stock
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageTransition>
  );
}
