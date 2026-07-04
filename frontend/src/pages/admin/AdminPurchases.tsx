import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "../../components/PageTransition";
import { api, type Purchase, type PurchaseInput, type PaginationMeta } from "../../lib/api";

const PURCHASE_TYPES = [
  { value: "dealer_invoice" as const, label: "Dealer Invoice", icon: "📄" },
  { value: "stock_purchase" as const, label: "Stock Purchase", icon: "📦" },
];

const PER_PAGE = 15;

export default function AdminPurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<string>("");
  const [filterDealerName, setFilterDealerName] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Form state
  const [formType, setFormType] = useState<"dealer_invoice" | "stock_purchase">("dealer_invoice");
  const [formDealerName, setFormDealerName] = useState("");
  const [formInvoiceNumber, setFormInvoiceNumber] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadPurchases = useCallback(async () => {
    try {
      setTableLoading(true);
      const response = await api.getPurchases({
        type: filterType || undefined,
        dealer_name: filterDealerName || undefined,
        date_from: filterDateFrom || undefined,
        date_to: filterDateTo || undefined,
        page,
        per_page: PER_PAGE,
      });
      setPurchases(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load purchases");
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  }, [filterType, filterDealerName, filterDateFrom, filterDateTo, page]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  // Reset to page 1 when any filter changes
  const changeFilterType = (newType: string) => {
    setFilterType(newType);
    setPage(1);
  };

  const changeFilterDealerName = (value: string) => {
    setFilterDealerName(value);
    setPage(1);
  };

  const changeFilterDateFrom = (value: string) => {
    setFilterDateFrom(value);
    setPage(1);
  };

  const changeFilterDateTo = (value: string) => {
    setFilterDateTo(value);
    setPage(1);
  };

  // Collect unique dealer names from loaded purchases for the datalist
  const uniqueDealerNames = [...new Set(purchases.map((p) => p.dealer_name).filter(Boolean))] as string[];

  const clearFilters = () => {
    setFilterType("");
    setFilterDealerName("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setPage(1);
  };

  const hasActiveFilters = filterType || filterDealerName || filterDateFrom || filterDateTo;

  const resetForm = () => {
    setFormType("dealer_invoice");
    setFormDealerName("");
    setFormInvoiceNumber("");
    setFormDescription("");
    setFormAmount("");
    setFormError(null);
    setEditingPurchase(null);
  };

  const openEditForm = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setFormType(purchase.type);
    setFormDealerName(purchase.dealer_name ?? "");
    setFormInvoiceNumber(purchase.invoice_number ?? "");
    setFormDescription(purchase.description ?? "");
    setFormAmount(String(purchase.amount));
    setShowForm(true);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      const amount = parseFloat(formAmount);
      if (isNaN(amount) || amount < 0) {
        throw new Error("Valid amount is required");
      }

      const purchaseData: PurchaseInput = {
        type: formType,
        dealer_name: formDealerName || null,
        invoice_number: formInvoiceNumber || null,
        description: formDescription || null,
        amount,
      };

      if (editingPurchase) {
        await api.updatePurchase(editingPurchase.id, purchaseData);
      } else {
        await api.createPurchase(purchaseData);
      }

      await loadPurchases();
      setShowForm(false);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save purchase");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await api.deletePurchase(id);
      await loadPurchases();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete purchase");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTypeBadge = (type: string) => {
    if (type === "dealer_invoice") {
      return <span className="admin-purchase-type dealer">📄 Dealer Invoice</span>;
    }
    return <span className="admin-purchase-type stock">📦 Stock Purchase</span>;
  };

  const [exporting, setExporting] = useState(false);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const data = await api.getAllPurchasesForExport({
        type: filterType || undefined,
        dealer_name: filterDealerName || undefined,
        date_from: filterDateFrom || undefined,
        date_to: filterDateTo || undefined,
      });

      if (data.length === 0) {
        alert("No records to export.");
        return;
      }

      // Build CSV content
      const headers = ["ID", "Type", "Dealer / Supplier", "Invoice No.", "Description", "Amount", "Date"];
      const rows = data.map((p) => [
        p.id,
        p.type === "dealer_invoice" ? "Dealer Invoice" : "Stock Purchase",
        `"${(p.dealer_name || "").replace(/"/g, '""')}"`,
        `"${(p.invoice_number || "").replace(/"/g, '""')}"`,
        `"${(p.description || "").replace(/"/g, '""')}"`,
        p.amount.toFixed(2),
        new Date(p.created_at).toLocaleDateString("en-IN"),
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      // Trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const timestamp = new Date().toISOString().slice(0, 10);
      const typeLabel = filterType ? filterType.replace("_", "-") : "all";
      a.download = `purchases-${typeLabel}-${timestamp}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to export");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="admin-loading">Loading purchases...</div>
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

  const totalPages = pagination?.total_pages ?? 1;

  // Build page numbers to display
  const getPageNumbers = () => {
    const maxVisible = 5;
    const pages: (number | "...")[] = [];
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);
      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <PageTransition>
      <div className="admin-page">
        {/* ═══ Gradient Header Banner ═══ */}
        <div className="ref-header">
          <div className="ref-header-content">
            <div className="ref-header-text">
              <h1>📄 Purchases</h1>
              <p>
                Manage dealer invoices &amp; stock purchases
                {pagination && pagination.total > 0 && (
                  <span className="ref-header-total">
                    {' '}·{' '}
                    <strong>₹{purchases.reduce((sum, p) => sum + p.amount, 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                    {' '}shown · {pagination.total} total records
                  </span>
                )}
              </p>
            </div>
            <div className="ref-header-actions">
              <motion.button
                className="btn btn-outline"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleExportCSV}
                disabled={exporting}
                title="Export filtered records as CSV"
              >
                {exporting ? "⏳ Exporting..." : "📥 Export CSV"}
              </motion.button>
              <motion.button
                className="btn btn-primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={openAddForm}
              >
                + Add Record
              </motion.button>
            </div>
          </div>
        </div>

        {/* ═══ Filter Tabs ═══ */}
        <div className="ref-filter-tabs">
          <button
            className={`ref-filter-tab ${filterType === "" ? "active" : ""}`}
            onClick={() => changeFilterType("")}
          >
            All
          </button>
          {PURCHASE_TYPES.map((pt) => (
            <button
              key={pt.value}
              className={`ref-filter-tab ${filterType === pt.value ? "active" : ""}`}
              onClick={() => changeFilterType(pt.value)}
            >
              {pt.icon} {pt.label}
            </button>
          ))}
        </div>

        {/* ═══ Advanced Filters ═══ */}
        <div className="ref-filter-bar">
          <div className="ref-filter-group">
            <label className="ref-filter-label">Dealer / Supplier</label>
            <input
              className="ref-filter-input"
              list="dealer-name-list"
              placeholder="Type dealer name..."
              value={filterDealerName}
              onChange={(e) => changeFilterDealerName(e.target.value)}
            />
            <datalist id="dealer-name-list">
              {uniqueDealerNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
          <div className="ref-filter-group">
            <label className="ref-filter-label">From Date</label>
            <input
              className="ref-filter-input"
              type="date"
              value={filterDateFrom}
              onChange={(e) => changeFilterDateFrom(e.target.value)}
            />
          </div>
          <div className="ref-filter-group">
            <label className="ref-filter-label">To Date</label>
            <input
              className="ref-filter-input"
              type="date"
              value={filterDateTo}
              onChange={(e) => changeFilterDateTo(e.target.value)}
            />
          </div>
          {hasActiveFilters && (
            <motion.button
              className="ref-filter-clear-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={clearFilters}
            >
              ✕ Clear Filters
            </motion.button>
          )}
        </div>

        {/* ═══ Purchase Form Modal ═══ */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              className="admin-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
            >
              <motion.div
                className="admin-modal"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="admin-modal-title">
                  {editingPurchase ? "Edit Record" : "Add New Record"}
                </h2>
                <form onSubmit={handleSubmit} className="admin-product-form">
                  {formError && <div className="admin-form-error">{formError}</div>}

                  <div className="form-group">
                    <label>Type *</label>
                    <div className="admin-purchase-type-selector">
                      {PURCHASE_TYPES.map((pt) => (
                        <button
                          key={pt.value}
                          type="button"
                          className={`admin-type-option ${formType === pt.value ? "active" : ""}`}
                          onClick={() => setFormType(pt.value)}
                        >
                          {pt.icon} {pt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="admin-form-row">
                    <div className="form-group">
                      <label>{formType === "dealer_invoice" ? "Dealer Name" : "Supplier Name"}</label>
                      <input
                        className="form-input"
                        placeholder={formType === "dealer_invoice" ? "e.g. Krishna Traders" : "e.g. ABC Supplies"}
                        value={formDealerName}
                        onChange={(e) => setFormDealerName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Invoice / Reference No.</label>
                      <input
                        className="form-input"
                        placeholder="e.g. INV-001"
                        value={formInvoiceNumber}
                        onChange={(e) => setFormInvoiceNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Amount (₹) *</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 15000"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Description / Notes</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder={formType === "dealer_invoice" ? "Items purchased from dealer..." : "Stock purchase details..."}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                    />
                  </div>

                  <div className="admin-modal-actions">
                    <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? "Saving..." : editingPurchase ? "Update" : "Create"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ Purchases Table ═══ */}
        <div className="ref-table-wrapper">
          {tableLoading && <div className="ref-table-loading"><div className="ref-table-spinner" /> Loading...</div>}
          <table className={`admin-table ${tableLoading ? "ref-table-dimmed" : ""}`}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Dealer / Supplier</th>
                <th>Invoice No.</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase, index) => (
                <motion.tr
                  key={purchase.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <td className="admin-td-id">#{purchase.id}</td>
                  <td>{getTypeBadge(purchase.type)}</td>
                  <td className="admin-td-name">
                    {purchase.dealer_name || <span className="admin-empty-val">—</span>}
                  </td>
                  <td>
                    {purchase.invoice_number ? (
                      <code className="admin-invoice-code">{purchase.invoice_number}</code>
                    ) : (
                      <span className="admin-empty-val">—</span>
                    )}
                  </td>
                  <td className="admin-td-price">₹{purchase.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="admin-td-date">{formatDate(purchase.created_at)}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button className="btn btn-sm btn-outline" onClick={() => openEditForm(purchase)}>Edit</button>
                      <button className="btn btn-sm" style={{ background: "var(--rose-400)", color: "white", border: "none" }} onClick={() => handleDelete(purchase.id)}>Delete</button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="ref-empty-state">
                      <span className="ref-empty-icon">📭</span>
                      No purchase records found. Add your first record!
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* ═══ Pagination ═══ */}
          {pagination && pagination.total > 0 && (
            <div className="ref-pagination">
              <div className="ref-pagination-info">
                Showing {((pagination.page - 1) * pagination.per_page) + 1}–
                {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total}
              </div>
              <div className="ref-pagination-controls">
                <button
                  className="ref-pagination-btn"
                  disabled={page === 1 || tableLoading}
                  onClick={() => setPage(1)}
                  title="First page"
                >
                  ◀◀
                </button>
                <button
                  className="ref-pagination-btn"
                  disabled={page === 1 || tableLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  title="Previous page"
                >
                  ◀
                </button>
                {getPageNumbers().map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="ref-pagination-ellipsis">…</span>
                  ) : (
                    <button
                      key={p}
                      className={`ref-pagination-btn ref-pagination-num ${page === p ? "active" : ""}`}
                      disabled={tableLoading}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  className="ref-pagination-btn"
                  disabled={page === totalPages || tableLoading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  title="Next page"
                >
                  ▶
                </button>
                <button
                  className="ref-pagination-btn"
                  disabled={page === totalPages || tableLoading}
                  onClick={() => setPage(totalPages)}
                  title="Last page"
                >
                  ▶▶
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
