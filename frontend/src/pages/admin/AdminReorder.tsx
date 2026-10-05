import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTransition from "../../components/PageTransition";
import { api, type ReorderResponse } from "../../lib/api";

type BulkRestockSummary = {
  successCount: number;
  failureCount: number;
  outcomes: {
    productId: number;
    productName: string;
    quantity: number;
    status: "succeeded" | "failed";
    detail: string;
  }[];
};

export default function AdminReorder() {
  const [data, setData] = useState<ReorderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(20);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [processing, setProcessing] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bulkRestockSummary, setBulkRestockSummary] =
    useState<BulkRestockSummary | null>(null);

  async function fetchSuggestions(t: number) {
    try {
      setLoading(true);
      const result = await api.getReorderSuggestions(t);
      setData(result);
      setSelectedIds(new Set(result.suggestions.map((s) => s.id)));
      setQuantities(
        Object.fromEntries(
          result.suggestions.map((suggestion) => [
            suggestion.id,
            String(suggestion.suggested_reorder_qty),
          ]),
        ),
      );
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

  const selectedItems =
    data?.suggestions
      .filter((suggestion) => selectedIds.has(suggestion.id))
      .map((suggestion) => ({
        product_id: suggestion.id,
        product_name: suggestion.product_name,
        quantity: Number(quantities[suggestion.id] ?? ""),
        price: suggestion.price,
      })) ?? [];
  const hasInvalidQuantity = selectedItems.some(
    (item) => !Number.isSafeInteger(item.quantity) || item.quantity < 1,
  );
  const selectedUnitCount = selectedItems.reduce(
    (total, item) =>
      total + (Number.isSafeInteger(item.quantity) ? item.quantity : 0),
    0,
  );
  const selectedCost = selectedItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const handleBulkRestock = () => {
    if (!data || selectedItems.length === 0 || hasInvalidQuantity) return;
    setShowConfirmation(true);
  };

  const confirmBulkRestock = async () => {
    if (!data || selectedItems.length === 0 || hasInvalidQuantity) return;
    const submittedItems = selectedItems.map(({ product_id, quantity }) => ({
      product_id,
      quantity,
    }));
    setProcessing(true);
    setProcessingCount(submittedItems.length);
    setShowConfirmation(false);
    setBulkRestockSummary(null);
    try {
      const result = await api.bulkRestock(submittedItems);
      const successById = new Map(
        result.results.map((item) => [item.product_id, item]),
      );
      const errorById = new Map(
        (result.errors ?? []).map((item) => [item.product_id, item.error]),
      );
      const outcomes = selectedItems.map((item) => {
        const success = successById.get(item.product_id);
        const itemError = errorById.get(item.product_id);
        return {
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          status: success ? ("succeeded" as const) : ("failed" as const),
          detail: success
            ? `New stock: ${success.new_stock}`
            : (itemError ?? "No result returned for this product"),
        };
      });
      setBulkRestockSummary({
        successCount: result.results.length,
        failureCount: (result.errors ?? []).length,
        outcomes,
      });

      await fetchSuggestions(threshold);
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
              disabled={processing}
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
                <span className="ref-summary-value">
                  {selectedItems.length} products / {selectedUnitCount} units
                </span>
              </div>
              <div className="ref-summary-item">
                <span className="ref-summary-label">Est. Cost</span>
                <span className="ref-summary-value">
                  ₹{selectedCost.toLocaleString("en-IN")}
                </span>
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
                        checked={
                          data !== null &&
                          data.suggestions.length > 0 &&
                          selectedIds.size === data.suggestions.length
                        }
                        onChange={toggleSelectAll}
                        disabled={processing}
                        style={{ accentColor: "var(--coral-400)" }}
                      />
                    </th>
                    <th>ID</th>
                    <th>Product</th>
                    <th>Current Stock</th>
                    <th>Restock Qty</th>
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
                      className={
                        selectedIds.has(suggestion.id) ? "selected" : ""
                      }
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(suggestion.id)}
                          onChange={() => toggleSelection(suggestion.id)}
                          disabled={processing}
                          style={{ accentColor: "var(--coral-400)" }}
                        />
                      </td>
                      <td className="admin-td-id">#{suggestion.id}</td>
                      <td className="admin-td-name">
                        {suggestion.product_name}
                      </td>
                      <td>
                        <span
                          className={`admin-stock-badge ${suggestion.current_stock === 0 ? "out" : "low"}`}
                        >
                          {suggestion.current_stock}
                        </span>
                      </td>
                      <td>
                        <input
                          className="form-input admin-reorder-quantity"
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          aria-label={`Restock quantity for ${suggestion.product_name}`}
                          value={quantities[suggestion.id] ?? ""}
                          disabled={processing}
                          onChange={(event) =>
                            setQuantities((current) => ({
                              ...current,
                              [suggestion.id]: event.target.value,
                            }))
                          }
                        />
                      </td>
                      <td className="admin-td-price">
                        ₹
                        {(
                          suggestion.price *
                          (Number(quantities[suggestion.id]) || 0)
                        ).toFixed(2)}
                      </td>
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
                disabled={
                  selectedItems.length === 0 || hasInvalidQuantity || processing
                }
                onClick={handleBulkRestock}
              >
                {processing
                  ? `Restocking ${processingCount} product${processingCount === 1 ? "" : "s"}...`
                  : `Review ${selectedItems.length} Selected Product${selectedItems.length === 1 ? "" : "s"}`}
              </motion.button>
            </div>
            {processing && (
              <div
                className="admin-reorder-progress"
                role="status"
                aria-live="polite"
              >
                <progress aria-label="Bulk restock progress" />
                Restocking {processingCount} products. Waiting for individual
                results...
              </div>
            )}
            {showConfirmation && (
              <div
                className="admin-modal-overlay"
                onClick={() => setShowConfirmation(false)}
              >
                <section
                  className="admin-modal admin-reorder-confirmation"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="reorder-confirm-title"
                  onClick={(event) => event.stopPropagation()}
                >
                  <h2 className="admin-modal-title" id="reorder-confirm-title">
                    Confirm bulk restock
                  </h2>
                  <p>
                    Restock {selectedItems.length} products with a total of{" "}
                    {selectedUnitCount} units.
                  </p>
                  <ul className="admin-reorder-review-list">
                    {selectedItems.map((item) => (
                      <li key={item.product_id}>
                        <span>{item.product_name}</span>
                        <strong>{item.quantity} units</strong>
                      </li>
                    ))}
                  </ul>
                  <p>Estimated cost: ₹{selectedCost.toLocaleString("en-IN")}</p>
                  <div className="admin-modal-actions">
                    <button
                      className="btn btn-outline"
                      type="button"
                      onClick={() => setShowConfirmation(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => void confirmBulkRestock()}
                    >
                      Confirm restock
                    </button>
                  </div>
                </section>
              </div>
            )}
            {bulkRestockSummary && (
              <section
                className="ref-section-card admin-reorder-results"
                role={bulkRestockSummary.failureCount > 0 ? "alert" : "status"}
                aria-live="polite"
              >
                <p>
                  Bulk restock complete: {bulkRestockSummary.successCount}{" "}
                  succeeded, {bulkRestockSummary.failureCount} failed.
                </p>
                <ul className="admin-reorder-outcome-list">
                  {bulkRestockSummary.outcomes.map((outcome) => (
                    <li
                      key={outcome.productId}
                      className={`admin-reorder-outcome ${outcome.status}`}
                    >
                      <div>
                        <strong>
                          {outcome.productName} (#{outcome.productId})
                        </strong>
                        <span>
                          {outcome.quantity} units · {outcome.detail}
                        </span>
                      </div>
                      <strong>{outcome.status}</strong>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
