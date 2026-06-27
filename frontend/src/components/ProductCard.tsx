import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "../context/useApp";
import CartSparkles, { useSparkles } from "./CartSparkles";
import type { ProductItem } from "../data/products";

/** Category-specific fallback SVG icons */
function FallbackIcon({ category }: { category: string }) {
  switch (category) {
    case "notebooks":
      return (
        <svg viewBox="0 0 64 64" fill="none" className="fallback-svg">
          {/* Notebook */}
          <rect x="12" y="8" width="40" height="50" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
          <line x1="18" y1="20" x2="46" y2="20" stroke="currentColor" strokeWidth="1.5" />
          <line x1="18" y1="28" x2="46" y2="28" stroke="currentColor" strokeWidth="1.5" />
          <line x1="18" y1="36" x2="38" y2="36" stroke="currentColor" strokeWidth="1.5" />
          <path d="M44 52 L56 40 L50 46" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "accessories":
      return (
        <svg viewBox="0 0 64 64" fill="none" className="fallback-svg">
          {/* Pen */}
          <rect x="28" y="14" width="8" height="40" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
          <polygon points="28,14 36,14 32,6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
          <line x1="28" y1="48" x2="36" y2="48" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "books":
      return (
        <svg viewBox="0 0 64 64" fill="none" className="fallback-svg">
          {/* Book stack */}
          <rect x="14" y="30" width="36" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="16" y="23" width="32" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="18" y="16" width="28" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" fill="none" />
          <line x1="22" y1="26" x2="42" y2="26" stroke="currentColor" strokeWidth="1.2" />
          <line x1="24" y1="33" x2="40" y2="33" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
    case "art-materials":
      return (
        <svg viewBox="0 0 64 64" fill="none" className="fallback-svg">
          {/* Palette */}
          <ellipse cx="32" cy="32" rx="20" ry="16" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="24" cy="28" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="34" cy="24" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="42" cy="30" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="38" cy="40" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="24" cy="38" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
          {/* Paintbrush */}
          <line x1="48" y1="44" x2="55" y2="55" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="48" x2="56" y2="50" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 64 64" fill="none" className="fallback-svg">
          {/* Generic stationery */}
          <rect x="16" y="10" width="32" height="44" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
          <line x1="22" y1="22" x2="42" y2="22" stroke="currentColor" strokeWidth="1.5" />
          <line x1="22" y1="30" x2="42" y2="30" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
  }
}

export default function ProductCard({ product }: { product: ProductItem }) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const { addToCart, cart, updateQuantity, toggleFavorite, isFavorite } =
    useApp();
  const { trigger, fire: fireSparkles } = useSparkles();
  const favored = isFavorite(product.id);

  const cartItem = cart.find(
    (i) => i.productId === product.id && i.category === product.category,
  );

  const quantity = cartItem?.quantity ?? 0;

  const handleAdd = () => {
    addToCart({
      id: `${product.category}-${product.id}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
      category: product.category,
    });
    fireSparkles();
  };

  return (
    <motion.div
      className="product-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -6, rotate: 0, transition: { duration: 0.2 } }}
      layout
    >
      {/* Heart toggle */}
      <button
        className={`product-fav ${favored ? "active" : ""}`}
        onClick={() => toggleFavorite(product.id)}
        aria-label={favored ? "Remove from favorites" : "Add to favorites"}
      >
        <motion.span
          animate={favored ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          {favored ? "♥" : "♡"}
        </motion.span>
      </button>

      {/* Image */}
      <div className="product-image-wrap">
        {imgError ? (
          <div className="product-image-fallback" aria-label={product.name}>
            <FallbackIcon category={product.category} />
          </div>
        ) : (
          <>
            {/* Shimmer skeleton shown while image is loading */}
            {!imgLoaded && (
              <div className="product-image-skeleton" aria-hidden="true" />
            )}
            <img
              src={product.image}
              alt={product.name}
              className={`product-image${imgLoaded ? " loaded" : ""}`}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </>
        )}
      </div>

      {/* Name */}
      <h3 className="product-name">{product.name}</h3>

      {/* Price */}
      <p className="product-price">₹{product.price.toFixed(2)}</p>

      {/* Quantity + Select */}
      <div className="product-actions">
        {quantity === 0 ? (
          <motion.button
            className="btn btn-primary btn-sm btn-select"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleAdd}
          >
            Select
          </motion.button>
        ) : (
          <div className="product-qty-controls">
            <motion.button
              className="qty-btn"
              whileTap={{ scale: 0.9 }}
              onClick={() =>
                updateQuantity(`${product.category}-${product.id}`, -1)
              }
            >
              −
            </motion.button>
            <span className="qty-value">{quantity}</span>
            <motion.button
              className="qty-btn"
              whileTap={{ scale: 0.9 }}
              onClick={() =>
                updateQuantity(`${product.category}-${product.id}`, 1)
              }
            >
              +
            </motion.button>
          </div>
        )}
      </div>


      {/* Sparkle burst on add to cart */}
      <CartSparkles trigger={trigger} />
    </motion.div>
  );
}
