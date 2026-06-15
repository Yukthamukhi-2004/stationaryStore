import { motion } from "framer-motion";
import { useApp } from "../context/useApp";
import CartSparkles, { useSparkles } from "./CartSparkles";
import type { ProductItem } from "../data/products";

export default function ProductCard({ product }: { product: ProductItem }) {
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
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
          loading="lazy"
        />
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

      {/* Hand-drawn arrow decoration (visible on hover) */}
      <div className="hand-arrow-wrap">
        <svg
          className="hand-arrow-svg"
          viewBox="0 0 40 30"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 15 L30 15" />
          <path d="M22 5 L30 15 L22 25" />
          <path d="M25 12 L30 15 L25 18" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Sparkle burst on add to cart */}
      <CartSparkles trigger={trigger} />
    </motion.div>
  );
}
