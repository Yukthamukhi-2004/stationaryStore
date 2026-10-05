import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "../../components/PageTransition";
import { api, type Category, type Product } from "../../lib/api";
import { uploadProductImage } from "../../lib/storage";

const PRODUCT_PAGE_SIZE = 10;
type ProductFormField = "name" | "price" | "stock" | "category";
type ProductFormErrors = Partial<Record<ProductFormField, string>>;

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [productSort, setProductSort] = useState("name-asc");
  const [productPage, setProductPage] = useState(1);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("0");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formImage, setFormImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ProductFormErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveInFlightRef = useRef(false);
  const uploadInFlightRef = useRef(false);

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

  async function loadCategories() {
    try {
      setCategories(await api.getCategories());
    } catch (err) {
      setCategoriesError(
        err instanceof Error ? err.message : "Failed to load categories",
      );
    } finally {
      setCategoriesLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const categoryRequired =
    categories.length > 0 &&
    (!editingProduct || editingProduct.category_id !== null);

  const resetForm = () => {
    setFormName("");
    setFormPrice("");
    setFormStock("0");
    setFormDesc("");
    setFormCategory("");
    setFormImage("");
    setUploading(false);
    setFormError(null);
    setFieldErrors({});
    setEditingProduct(null);
  };

  const openEditForm = (product: Product) => {
    setFieldErrors({});
    setFormError(null);
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
    if (saveInFlightRef.current || uploadInFlightRef.current) return;
    setFormError(null);
    const validationErrors: ProductFormErrors = {};
    const productName = formName.trim();
    const priceText = formPrice.trim();
    const price = Number(priceText);
    const stockText = formStock.trim();
    const stockQuantity = stockText === "" ? 0 : Number(stockText);
    if (!productName) {
      validationErrors.name = "Enter a product name.";
    }
    if (
      !/^\d+(?:\.\d{1,2})?$/.test(priceText) ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      validationErrors.price =
        "Enter a price greater than zero with up to two decimal places.";
    }
    if (
      stockText !== "" &&
      (!/^\d+$/.test(stockText) ||
        !Number.isSafeInteger(stockQuantity) ||
        stockQuantity < 0)
    ) {
      validationErrors.stock = "Enter a whole number of 0 or greater.";
    }
    if (
      categoryRequired &&
      (!formCategory ||
        !categories.some((category) => category.id === Number(formCategory)))
    ) {
      validationErrors.category = "Choose a category.";
    }

    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    saveInFlightRef.current = true;
    setSaving(true);

    try {
      const productData = {
        product_name: productName,
        price,
        stock_quantity: stockQuantity,
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
      setFormError(
        err instanceof Error ? err.message : "Failed to save product",
      );
    } finally {
      saveInFlightRef.current = false;
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || saveInFlightRef.current || uploadInFlightRef.current) return;
    if (!file.type.startsWith("image/")) {
      setFormError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Image must be under 5MB");
      return;
    }

    uploadInFlightRef.current = true;
    setUploading(true);
    setFormError(null);

    try {
      const url = await uploadProductImage(file, editingProduct?.id);
      setFormImage(url);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to upload image",
      );
    } finally {
      uploadInFlightRef.current = false;
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const clearFieldError = (field: ProductFormField) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setFormError(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    try {
      await api.deleteProduct(id);
      await loadProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete product");
    }
  };

  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name]),
  );
  const searchTerm = productSearch.trim().toLocaleLowerCase();
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        !searchTerm ||
        [
          product.product_name,
          product.description ?? "",
          String(product.id),
          categoryNames.get(product.category_id ?? -1) ?? "",
        ].some((value) => value.toLocaleLowerCase().includes(searchTerm));
      const matchesCategory =
        !categoryFilter || product.category_id === Number(categoryFilter);
      const stock = product.stock_quantity;
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in-stock" && stock !== null && stock > 0) ||
        (stockFilter === "low" && stock !== null && stock > 0 && stock <= 10) ||
        (stockFilter === "out" && stock === 0) ||
        (stockFilter === "unknown" && stock === null);
      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((left, right) => {
      switch (productSort) {
        case "name-desc":
          return right.product_name.localeCompare(left.product_name);
        case "price-asc":
          return left.price - right.price;
        case "price-desc":
          return right.price - left.price;
        case "stock-asc":
        case "stock-desc": {
          if (left.stock_quantity === null) {
            return right.stock_quantity === null ? 0 : 1;
          }
          if (right.stock_quantity === null) return -1;
          return productSort === "stock-asc"
            ? left.stock_quantity - right.stock_quantity
            : right.stock_quantity - left.stock_quantity;
        }
        default:
          return left.product_name.localeCompare(right.product_name);
      }
    });
  const productPageCount = Math.max(
    1,
    Math.ceil(filteredProducts.length / PRODUCT_PAGE_SIZE),
  );
  const currentProductPage = Math.min(productPage, productPageCount);
  const visibleProducts = filteredProducts.slice(
    (currentProductPage - 1) * PRODUCT_PAGE_SIZE,
    currentProductPage * PRODUCT_PAGE_SIZE,
  );

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
              <p>Manage your product catalog ({products.length} loaded)</p>
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

        <div className="ref-filter-bar">
          <div className="ref-filter-group">
            <label className="ref-filter-label" htmlFor="product-search">
              Search products
            </label>
            <input
              id="product-search"
              className="ref-filter-input"
              type="search"
              placeholder="Name, description, ID"
              value={productSearch}
              onChange={(event) => {
                setProductSearch(event.target.value);
                setProductPage(1);
              }}
            />
          </div>
          <div className="ref-filter-group">
            <label
              className="ref-filter-label"
              htmlFor="product-category-filter"
            >
              Category
            </label>
            <select
              id="product-category-filter"
              className="ref-filter-input"
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setProductPage(1);
              }}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="ref-filter-group">
            <label className="ref-filter-label" htmlFor="product-stock-filter">
              Stock
            </label>
            <select
              id="product-stock-filter"
              className="ref-filter-input"
              value={stockFilter}
              onChange={(event) => {
                setStockFilter(event.target.value);
                setProductPage(1);
              }}
            >
              <option value="all">All stock levels</option>
              <option value="in-stock">In stock</option>
              <option value="low">Low stock (1-10)</option>
              <option value="out">Out of stock</option>
              <option value="unknown">Stock unknown</option>
            </select>
          </div>
          <div className="ref-filter-group">
            <label className="ref-filter-label" htmlFor="product-sort">
              Sort by
            </label>
            <select
              id="product-sort"
              className="ref-filter-input"
              value={productSort}
              onChange={(event) => {
                setProductSort(event.target.value);
                setProductPage(1);
              }}
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="stock-asc">Stock: low to high</option>
              <option value="stock-desc">Stock: high to low</option>
            </select>
          </div>
          {(productSearch || categoryFilter || stockFilter !== "all") && (
            <button
              className="ref-filter-clear-btn"
              type="button"
              onClick={() => {
                setProductSearch("");
                setCategoryFilter("");
                setStockFilter("all");
                setProductPage(1);
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* ═══ Product Form Modal ═══ */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              className="admin-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!saving && !uploading) setShowForm(false);
              }}
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
                <form
                  onSubmit={handleSubmit}
                  className="admin-product-form"
                  noValidate
                  aria-label={`${editingProduct ? "Edit" : "Add"} product form`}
                >
                  {formError && (
                    <div className="admin-form-error" role="alert">
                      {formError}
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="product-name">Product Name *</label>
                    <input
                      id="product-name"
                      className="form-input"
                      value={formName}
                      onChange={(e) => {
                        setFormName(e.target.value);
                        clearFieldError("name");
                      }}
                      required
                      aria-invalid={Boolean(fieldErrors.name)}
                      aria-describedby={
                        fieldErrors.name ? "product-name-error" : undefined
                      }
                    />
                    {fieldErrors.name && (
                      <div
                        id="product-name-error"
                        className="admin-form-error"
                        role="alert"
                      >
                        {fieldErrors.name}
                      </div>
                    )}
                  </div>

                  <div className="admin-form-row">
                    <div className="form-group">
                      <label htmlFor="product-price">Price (₹) *</label>
                      <input
                        id="product-price"
                        className="form-input"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formPrice}
                        onChange={(e) => {
                          setFormPrice(e.target.value);
                          clearFieldError("price");
                        }}
                        required
                        aria-invalid={Boolean(fieldErrors.price)}
                        aria-describedby={
                          fieldErrors.price ? "product-price-error" : undefined
                        }
                      />
                      {fieldErrors.price && (
                        <div
                          id="product-price-error"
                          className="admin-form-error"
                          role="alert"
                        >
                          {fieldErrors.price}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="product-stock">Stock Quantity</label>
                      <input
                        id="product-stock"
                        className="form-input"
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={formStock}
                        onChange={(e) => {
                          setFormStock(e.target.value);
                          clearFieldError("stock");
                        }}
                        aria-invalid={Boolean(fieldErrors.stock)}
                        aria-describedby={
                          fieldErrors.stock ? "product-stock-error" : undefined
                        }
                      />
                      {fieldErrors.stock && (
                        <div
                          id="product-stock-error"
                          className="admin-form-error"
                          role="alert"
                        >
                          {fieldErrors.stock}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                    />
                  </div>

                  <div className="admin-form-row">
                    <div className="form-group">
                      <label htmlFor="product-category">
                        Category{categoryRequired ? " *" : ""}
                      </label>
                      <select
                        id="product-category"
                        className="form-input"
                        value={formCategory}
                        onChange={(e) => {
                          setFormCategory(e.target.value);
                          clearFieldError("category");
                        }}
                        disabled={categoriesLoading}
                        required={categoryRequired}
                        aria-invalid={Boolean(fieldErrors.category)}
                        aria-describedby={
                          fieldErrors.category
                            ? "product-category-error"
                            : undefined
                        }
                      >
                        <option value="">
                          {categoryRequired
                            ? "Select a category"
                            : "Uncategorized"}
                        </option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.category && (
                        <div
                          id="product-category-error"
                          className="admin-form-error"
                          role="alert"
                        >
                          {fieldErrors.category}
                        </div>
                      )}
                      {categoriesLoading && (
                        <div role="status">Loading categories...</div>
                      )}
                      {categoriesError && (
                        <div className="admin-form-error" role="alert">
                          Could not load categories: {categoriesError}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="product-image">Product Image</label>
                      <div className="admin-image-upload">
                        {formImage ? (
                          <div className="admin-image-preview">
                            <img
                              src={formImage}
                              alt="Product image preview"
                              className="admin-upload-thumb"
                            />
                            <span className="admin-image-ready" role="status">
                              Image ready to save
                            </span>
                            <button
                              type="button"
                              className="admin-image-remove"
                              onClick={() => setFormImage("")}
                              disabled={uploading || saving}
                              title="Remove image"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="admin-image-placeholder">
                            <svg
                              width="40"
                              height="40"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect
                                x="3"
                                y="3"
                                width="18"
                                height="18"
                                rx="2"
                                ry="2"
                              />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <polyline points="21 15 16 10 5 21" />
                            </svg>
                            <span>Click to upload</span>
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          id="product-image"
                          type="file"
                          accept="image/*"
                          className="admin-image-input"
                          onChange={handleImageUpload}
                          disabled={uploading || saving}
                        />
                      </div>
                      {uploading && (
                        <div
                          className="admin-upload-status"
                          role="status"
                          aria-live="polite"
                        >
                          <progress aria-label="Uploading product image" />
                          Uploading image. Keep this form open.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="admin-modal-actions">
                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={saving || uploading}
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={saving || uploading}
                    >
                      {saving || uploading
                        ? saving
                          ? "Saving..."
                          : "Uploading image..."
                        : editingProduct
                          ? "Update"
                          : "Create"}
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
              {visibleProducts.map((product) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  layout
                >
                  <td className="admin-td-id">#{product.id}</td>
                  <td>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.product_name}
                        className="admin-product-thumb"
                      />
                    ) : (
                      <span className="admin-no-image">—</span>
                    )}
                  </td>
                  <td className="admin-td-name">{product.product_name}</td>
                  <td className="admin-td-price">
                    ₹{product.price.toFixed(2)}
                  </td>
                  <td>
                    <span
                      className={`admin-stock-badge ${(product.stock_quantity ?? 0) <= 10 ? "low" : (product.stock_quantity ?? 0) <= 20 ? "medium" : "ok"}`}
                    >
                      {product.stock_quantity ?? "N/A"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => openEditForm(product)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{
                          background: "var(--rose-400)",
                          color: "white",
                          border: "none",
                        }}
                        onClick={() => handleDelete(product.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {visibleProducts.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="ref-empty-state">
                      <span className="ref-empty-icon">📭</span>
                      {products.length === 0
                        ? "No products found. Add your first product!"
                        : "No products match these filters."}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="ref-pagination">
            <div className="ref-pagination-info" role="status">
              Showing{" "}
              {filteredProducts.length === 0
                ? 0
                : (currentProductPage - 1) * PRODUCT_PAGE_SIZE + 1}
              –
              {Math.min(
                currentProductPage * PRODUCT_PAGE_SIZE,
                filteredProducts.length,
              )}{" "}
              of {filteredProducts.length} matching; {products.length} loaded
            </div>
            <div className="ref-pagination-controls">
              <button
                className="ref-pagination-btn"
                type="button"
                aria-label="Previous products page"
                disabled={currentProductPage <= 1}
                onClick={() => setProductPage(currentProductPage - 1)}
              >
                Previous
              </button>
              <span className="ref-pagination-info">
                Page {currentProductPage} of {productPageCount}
              </span>
              <button
                className="ref-pagination-btn"
                type="button"
                aria-label="Next products page"
                disabled={currentProductPage >= productPageCount}
                onClick={() => setProductPage(currentProductPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
