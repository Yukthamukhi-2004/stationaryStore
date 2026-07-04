import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "../../components/PageTransition";
import { api, type Product } from "../../lib/api";
import { uploadProductImage } from "../../lib/storage";

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formImage, setFormImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const resetForm = () => {
    setFormName("");
    setFormPrice("");
    setFormStock("");
    setFormDesc("");
    setFormCategory("");
    setFormImage("");
    setUploading(false);
    setFormError(null);
    setEditingProduct(null);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.product_name);
    setFormPrice(String(product.price));
    setFormStock(String(product.stock_quantity ?? ""));
    setFormDesc(product.description ?? "");
    setFormCategory(String(product.category_id ?? ""));
    setFormImage(product.image_url ?? "");
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
      const price = parseFloat(formPrice);
      if (isNaN(price) || price <= 0) {
        throw new Error("Valid price is required");
      }

      const productData = {
        product_name: formName,
        price,
        stock_quantity: formStock ? parseInt(formStock, 10) : null,
        description: formDesc || null,
        category_id: formCategory ? parseInt(formCategory, 10) : null,
        image_url: formImage || null,
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productData);
      } else {
        await api.createProduct(productData);
      }

      await loadProducts();
      setShowForm(false);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Image must be under 5MB");
      return;
    }

    setUploading(true);
    setFormError(null);

    try {
      const url = await uploadProductImage(file, editingProduct?.id);
      setFormImage(url);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.deleteProduct(id);
      await loadProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete product");
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="admin-loading">Loading products...</div>
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
              <h1>📦 Products</h1>
              <p>Manage your product catalog ({products.length} products)</p>
            </div>
            <div className="ref-header-actions">
              <motion.button
                className="btn btn-primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={openAddForm}
              >
                + Add Product
              </motion.button>
            </div>
          </div>
        </div>

        {/* ═══ Product Form Modal ═══ */}
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
                  {editingProduct ? "Edit Product" : "Add Product"}
                </h2>
                <form onSubmit={handleSubmit} className="admin-product-form">
                  {formError && <div className="admin-form-error">{formError}</div>}

                  <div className="form-group">
                    <label>Product Name *</label>
                    <input className="form-input" value={formName} onChange={(e) => setFormName(e.target.value)} required />
                  </div>

                  <div className="admin-form-row">
                    <div className="form-group">
                      <label>Price (₹) *</label>
                      <input className="form-input" type="number" step="0.01" min="0" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Stock Quantity</label>
                      <input className="form-input" type="number" min="0" value={formStock} onChange={(e) => setFormStock(e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea className="form-input" rows={3} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
                  </div>

                  <div className="admin-form-row">
                    <div className="form-group">
                      <label>Category ID</label>
                      <input className="form-input" type="number" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Product Image</label>
                      <div className="admin-image-upload">
                        {formImage ? (
                          <div className="admin-image-preview">
                            <img src={formImage} alt="Product preview" className="admin-upload-thumb" />
                            <button type="button" className="admin-image-remove" onClick={() => setFormImage("")} title="Remove image">✕</button>
                          </div>
                        ) : (
                          <div className="admin-image-placeholder">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <polyline points="21 15 16 10 5 21" />
                            </svg>
                            <span>Click to upload</span>
                          </div>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" className="admin-image-input" onChange={handleImageUpload} disabled={uploading} />
                      </div>
                      {uploading && <div className="admin-upload-status">Uploading...</div>}
                    </div>
                  </div>

                  <div className="admin-modal-actions">
                    <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? "Saving..." : editingProduct ? "Update" : "Create"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ Products Table ═══ */}
        <div className="ref-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <motion.tr key={product.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout>
                  <td className="admin-td-id">#{product.id}</td>
                  <td>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.product_name} className="admin-product-thumb" />
                    ) : (
                      <span className="admin-no-image">—</span>
                    )}
                  </td>
                  <td className="admin-td-name">{product.product_name}</td>
                  <td className="admin-td-price">₹{product.price.toFixed(2)}</td>
                  <td>
                    <span className={`admin-stock-badge ${(product.stock_quantity ?? 0) <= 10 ? "low" : (product.stock_quantity ?? 0) <= 20 ? "medium" : "ok"}`}>
                      {product.stock_quantity ?? "N/A"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <button className="btn btn-sm btn-outline" onClick={() => openEditForm(product)}>Edit</button>
                      <button className="btn btn-sm" style={{ background: "var(--rose-400)", color: "white", border: "none" }} onClick={() => handleDelete(product.id)}>Delete</button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="ref-empty-state">
                      <span className="ref-empty-icon">📭</span>
                      No products found. Add your first product!
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageTransition>
  );
}
