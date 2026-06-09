import { motion, type Variants } from "framer-motion";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

const listVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

export default function OrdersPage() {
  const { cart, cartTotal, cartCount, updateQuantity, removeFromCart, clearCart } = useApp();

  return (
    <motion.div
      className="orders-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="category-header"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h1 className="category-title">Your Orders</h1>
        <p className="category-desc">
          {cartCount > 0
            ? `You have ${cartCount} item${cartCount > 1 ? "s" : ""} in your cart`
            : "Your cart is empty"}
        </p>
      </motion.div>

      {cart.length === 0 ? (
        <motion.div
          className="empty-cart"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <div className="empty-cart-icon">🛒</div>
          <p>Your cart is empty</p>
          <Link to="/" className="btn btn-primary">
            Browse Products
          </Link>
        </motion.div>
      ) : (
        <>
          <motion.div className="cart-items" variants={listVariants} initial="hidden" animate="visible">
            {cart.map((item) => (
              <motion.div key={item.id} className="cart-item" variants={itemVariants}>
                <div className="cart-item-image">
                  <img src={item.image} alt={item.name} />
                </div>
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  <p className="cart-item-price">₹{item.price.toFixed(2)}</p>
                </div>
                <div className="cart-item-qty">
                  <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}>
                    −
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}>
                    +
                  </button>
                </div>
                <div className="cart-item-total">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </div>
                <button
                  className="cart-item-remove"
                  onClick={() => removeFromCart(item.id)}
                  aria-label={`Remove ${item.name}`}
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="cart-summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            <div className="cart-summary-row">
              <span>Total Items</span>
              <span>{cartCount}</span>
            </div>
            <div className="cart-summary-row total">
              <span>Total Cost</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="cart-summary-actions">
              <motion.button
                className="btn btn-primary btn-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => alert("Proceeding to payment...")}
              >
                Proceed to Payment
              </motion.button>
              <motion.button
                className="btn btn-outline btn-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={clearCart}
              >
                Clear Cart
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
