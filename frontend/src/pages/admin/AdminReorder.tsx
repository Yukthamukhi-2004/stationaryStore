import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTransition from "../../components/PageTransition";
import { api, type ReorderResponse } from "../../lib/api";

export default function AdminReorder() {
  const [data, setData] = useState<ReorderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(20);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [processing, setProcessing] = useState(false);

  async function fetchSuggestions(t: number) {
    try {
      setLoading(true);
      const result = await api.getReorderSuggestions(t);
      setData(result);
      setSelectedIds(new Set(result.suggestions.map((s) => s.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSuggestions(threshold);
  }, [threshold]);

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!data) return;
    if (selectedIds.size === data.suggestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.suggestions.map((s) => s.id)));
    }
  };

  const handleBulkRestock = async () => {
    if (!data || selectedIds.size === 0) return;
    setProcessing(true);
    try {
      const items = data.suggestions
        .filter((s) => selectedIds.has(s.id))
        .map((s) => ({
          product_id: s.id,
          quantity: s.suggested_reorder_qty,
        }));

      const result = await api.bulkRestock(items);
      console.log("Bulk restock result:", result);

      await fetchSuggestions(threshold);
      alert(`✅ Successfully restocked ${items.length} products!`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Bulk restock failed");
    } finally {
      setProcessing(false);
    }
  };

  if (loading && !data) {
    return (
      <PageTransition>
        <div className="admin-loading">Generating reorder suggestions...</div>
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

  const selectedCost =
    data?.suggestions
      .filter((s) => selectedIds.has(s.id))
      .reduce((sum, s) => sum + s.estimated_cost, 0) ?? 0;

  return (
    <PageTransition>
      <div className="admin-page">
        {/* ═══ Gradient Header Banner ═══ */}
        <div className="ref-header">
          <div className="ref-header-content">
            <div className="ref-header-text">
              <h1>🔄 Reorder Suggestions</h1>
              <p>Products that need restocking — reorder in bulk</p>
            </div>
          </div>
        </div>

        {/* ═══ Threshold + Summary ═══ */}
        <div className="ref-summary-bar">
          <div className="ref-threshold-control">
            <label htmlFor="reorder-threshold">Reorder threshold:</label>
            <select
              id="reorder-threshold"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
            >
              <option value={10}>10 units</option>
              <option value={20}>20 units</option>
              <option value={30}>30 units</option>
              <option value={50}>50 units</option>
            </select>
          </div>

          {data && (
            <div className="ref-summary-totals">
              <div className="ref-summary-item">
                <span className="ref-summary-label">Items to reorder</span>
                <span className="ref-summary-value">{data.count}</span>
              </div>
              <div className="ref-summary-item">
                <span className="ref-summary-label">Selected</span>
                <span className="ref-summary-value">{selectedIds.size}</span>
              </div>
              <div className="ref-summary-item">
                <span className="ref-summary-label">Est. Cost</span>
                <span className="ref-summary-value">₹{selectedCost.toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}
        </div>

        {data && data.suggestions.length === 0 ? (
          <div className="ref-section-card">
            <div className="ref-empty-state">
              <span className="ref-empty-icon">✅</span>
              All products have sufficient stock. No reorder needed!
            </div>
          </div>
        ) : (
          <>
            <div className="ref-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={data !== null && data.suggestions.length > 0 && selectedIds.size === data.suggestions.length}
                        onChange={toggleSelectAll}
                        style={{ accentColor: "var(--coral-400)" }}
                      />
                    </th>
                    <th>ID</th>
                    <th>Product</th>
                    <th>Current Stock</th>
                    <th>Suggested Qty</th>
                    <th>Est. Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.suggestions.map((suggestion, index) => (
                    <motion.tr
                      key={suggestion.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={selectedIds.has(suggestion.id) ? "selected" : ""}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(suggestion.id)}
                          onChange={() => toggleSelection(suggestion.id)}
                          style={{ accentColor: "var(--coral-400)" }}
                        />
                      </td>
                      <td className="admin-td-id">#{suggestion.id}</td>
                      <td className="admin-td-name">{suggestion.product_name}</td>
                      <td>
                        <span className={`admin-stock-badge ${suggestion.current_stock === 0 ? "out" : "low"}`}>
                          {suggestion.current_stock}
                        </span>
                      </td>
                      <td>{suggestion.suggested_reorder_qty}</td>
                      <td className="admin-td-price">₹{suggestion.estimated_cost.toFixed(2)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-reorder-actions">
              <motion.button
                className="btn btn-primary btn-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={selectedIds.size === 0 || processing}
                onClick={handleBulkRestock}
              >
                {processing
                  ? "Processing..."
                  : `Restock ${selectedIds.size} Product${selectedIds.size !== 1 ? "s" : ""}`}
              </motion.button>
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
