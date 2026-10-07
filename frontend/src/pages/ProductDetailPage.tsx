import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/useApp";
import { api, mapBackendProduct, type Product } from "../lib/api";
import PageTransition from "../components/PageTransition";

export default function ProductDetailPage() {
  const { productId } = useParams();
  const { cart, addToCart, pendingProductIds } = useApp();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const id = Number(productId);

    async function loadProduct() {
      setLoading(true);
      setLoadError(false);
      if (!Number.isSafeInteger(id) || id < 1) {
        setProduct(null);
        setLoadError(true);
        setLoading(false);
        return;
      }

      try {
        const result = await api.getProduct(id);
        if (!cancelled) setProduct(result);
      } catch {
        if (!cancelled) {
          setProduct(null);
          setLoadError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    setQuantity(1);
    void loadProduct();
    return () => {
      cancelled = true;
    };
  }, [productId, retryCount]);

  const quantityInCart =
    cart.find((item) => item.productId === product?.id)?.quantity ?? 0;
  const isPending = product ? pendingProductIds.has(product.id) : false;
  const stock = product?.stock_quantity ?? null;
  const hasStock = stock === null || stock > quantityInCart;
  const maxQuantity = stock === null ? 99 : Math.max(1, stock - quantityInCart);

  const handleAddToCart = () => {
    if (!product || !hasStock || quantity > maxQuantity || isPending) return;

    const displayProduct = mapBackendProduct(product, "");
    addToCart({
      id: String(product.id),
      productId: product.id,
      name: product.product_name,
      price: product.price,
      quantity,
      image: displayProduct.image,
      category: "",
    });
  };

  return (
    <PageTransition>
      <main className="product-detail-page">
        <Link to="/shopping/home" className="back-link-top">
          &larr; Back to store
        </Link>

        {loading ? (
          <p className="loading-state" role="status">
            Loading product...
          </p>
        ) : loadError || !product ? (
          <div className="error-state" role="alert">
            <p>Could not load this product.</p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setRetryCount((count) => count + 1)}
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="product-detail-layout">
            <div className="product-detail-image">
              <img
                src={mapBackendProduct(product, "").image}
                alt={product.product_name}
              />
            </div>
            <section className="product-detail-info">
              <h1>{product.product_name}</h1>
              <p className="product-detail-description">
                {product.description?.trim() || "No description provided."}
              </p>
              <p className="product-detail-price">
                ₹{product.price.toFixed(2)}
              </p>
              <p
                className={`product-detail-stock ${hasStock ? "available" : "unavailable"}`}
                role="status"
              >
                {stock === null
                  ? "Stock availability not listed"
                  : stock > 0
                    ? `${stock} in stock`
                    : "Out of stock"}
              </p>

              <div className="product-detail-quantity">
                <span>Quantity</span>
                <div className="product-qty-controls">
                  <button
                    className="qty-btn"
                    aria-label={`Decrease ${product.product_name} quantity`}
                    disabled={quantity <= 1 || isPending}
                    onClick={() =>
                      setQuantity((value) => Math.max(1, value - 1))
                    }
                  >
                    −
                  </button>
                  <span className="qty-value" aria-live="polite">
                    {quantity}
                  </span>
                  <button
                    className="qty-btn"
                    aria-label={`Increase ${product.product_name} quantity`}
                    disabled={!hasStock || quantity >= maxQuantity || isPending}
                    onClick={() =>
                      setQuantity((value) => Math.min(maxQuantity, value + 1))
                    }
                  >
                    +
                  </button>
                </div>
              </div>

              <motion.button
                className="btn btn-primary product-detail-add"
                whileTap={{ scale: 0.98 }}
                disabled={!hasStock || quantity > maxQuantity || isPending}
                onClick={handleAddToCart}
              >
                {isPending ? "Adding..." : "Add to Cart"}
              </motion.button>
            </section>
          </div>
        )}
      </main>
    </PageTransition>
  );
}
