import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { useApp } from "../context/useApp";
import { api, type Order } from "../lib/api";
import PageTransition from "../components/PageTransition";

type TabType = "cart" | "orders";

const PAYMENT_METHODS = [
  { value: "credit_card", label: "💳 Credit Card" },
  { value: "debit_card", label: "💳 Debit Card" },
  { value: "upi", label: "📱 UPI (GPay / PhonePe)" },
  { value: "net_banking", label: "🏦 Net Banking" },
  { value: "cod", label: "💵 Cash on Delivery" },
];

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
  const { user, isLoaded: userLoaded } = useUser();
  const {
    cart,
    cartTotal,
    cartCount,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useApp();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("cart");

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Checkout state
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<{
    success: boolean;
    message: string;
    details: Array<{ name: string; ok: boolean; detail?: string }>;
  } | null>(null);

  // Fetch orders (filtered to current user)
  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const data = await api.getOrders();
      const filtered = user ? data.filter((o) => o.user_id === user.id) : data;
      setOrders(filtered);
    } catch (err) {
      setOrdersError(
        err instanceof Error ? err.message : "Failed to load orders",
      );
    } finally {
      setLoadingOrders(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    }
  }, [activeTab, fetchOrders]);

  // Handle checkout
  const handleCheckout = async () => {
    if (!user) {
      return;
    }
    setCheckingOut(true);
    setCheckoutResult(null);

    const details: Array<{ name: string; ok: boolean; detail?: string }> = [];
    let allOk = true;

    for (const item of cart) {
      try {
        const result = await api.checkout({
          user_id: user.id,
          product_id: item.productId,
          quantity: item.quantity,
          payment_method: paymentMethod,
        });
        details.push({
          name: item.name,
          ok: true,
          detail: `Order #${result.order.id} — ₹${result.order.total_amount.toFixed(2)}`,
        });
      } catch (err) {
        allOk = false;
        details.push({
          name: item.name,
          ok: false,
          detail: err instanceof Error ? err.message : "Checkout failed",
        });
      }
    }

    setCheckingOut(false);

    if (allOk) {
      setCheckoutResult({
        success: true,
        message: "All items checked out successfully!",
        details,
      });
      clearCart();
    } else {
      setCheckoutResult({
        success: false,
        message: "Some items failed to checkout. See details below.",
        details,
      });
    }
  };

  // Dismiss checkout result
  const dismissResult = () => {
    setCheckoutResult(null);
    setShowCheckout(false);
  };

  return (
    <PageTransition>
      <motion.div
        className="orders-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Tabs */}
        <div className="orders-tabs" role="tablist">
          <motion.button
            className={`orders-tab ${activeTab === "cart" ? "active" : ""}`}
            onClick={() => setActiveTab("cart")}
            whileTap={{ scale: 0.95 }}
            role="tab"
            aria-selected={activeTab === "cart"}
          >
            🛒 Cart
            {cartCount > 0 && (
              <span className="orders-tab-badge">{cartCount}</span>
            )}
          </motion.button>
          <motion.button
            className={`orders-tab ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
            whileTap={{ scale: 0.95 }}
            role="tab"
            aria-selected={activeTab === "orders"}
          >
            📦 Orders
            {orders.length > 0 && (
              <span className="orders-tab-badge">{orders.length}</span>
            )}
          </motion.button>
          <motion.div
            className="orders-tab-indicator"
            layout
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{ left: activeTab === "cart" ? "0%" : "50%" }}
          />
        </div>

        <AnimatePresence mode="wait">
          {/* ========== CART TAB ========== */}
          {activeTab === "cart" && (
            <motion.div
              key="cart-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="category-header"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <h1 className="category-title">Your Cart</h1>
                <p className="category-desc">
                  {cartCount > 0
                    ? `You have ${cartCount} item${cartCount > 1 ? "s" : ""} in your cart`
                    : "Your cart is empty"}
                </p>
              </motion.div>

              {cart.length === 0 && !showCheckout ? (
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
                  {/* Cart Items */}
                  <motion.div
                    className="cart-items"
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {cart.map((item) => (
                      <motion.div
                        key={item.id}
                        className="cart-item"
                        variants={itemVariants}
                      >
                        <div className="cart-item-image">
                          <img src={item.image} alt={item.name} />
                        </div>
                        <div className="cart-item-info">
                          <h4>{item.name}</h4>
                          <p className="cart-item-price">
                            ₹{item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="cart-item-qty">
                          <button
                            className="qty-btn"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            −
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button
                            className="qty-btn"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
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

                  {/* Checkout Result */}
                  {checkoutResult && (
                    <motion.div
                      className={`checkout-result ${checkoutResult.success ? "checkout-result--success" : "checkout-result--error"}`}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      <div className="checkout-result-icon">
                        {checkoutResult.success ? "✅" : "⚠️"}
                      </div>
                      <h3>{checkoutResult.message}</h3>
                      <ul className="checkout-result-details">
                        {checkoutResult.details.map((d, i) => (
                          <li
                            key={i}
                            className={d.ok ? "text-success" : "text-error"}
                          >
                            <span>{d.ok ? "✓" : "✗"}</span> {d.name}: {d.detail}
                          </li>
                        ))}
                      </ul>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={dismissResult}
                      >
                        Continue Shopping
                      </button>
                    </motion.div>
                  )}

                  {/* Checkout Form */}
                  {showCheckout && !checkoutResult && (
                    <motion.div
                      className="checkout-form"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      <h2>Payment Method</h2>
                      {!userLoaded || !user ? (
                        <p className="checkout-login-warning">
                          <Link to="/auth">Sign in</Link> to proceed with
                          checkout.
                        </p>
                      ) : (
                        <>
                          <div className="payment-methods">
                            {PAYMENT_METHODS.map((pm) => (
                              <label
                                key={pm.value}
                                className={`payment-method-option ${paymentMethod === pm.value ? "selected" : ""}`}
                              >
                                <input
                                  type="radio"
                                  name="payment_method"
                                  value={pm.value}
                                  checked={paymentMethod === pm.value}
                                  onChange={() => setPaymentMethod(pm.value)}
                                />
                                <span>{pm.label}</span>
                              </label>
                            ))}
                          </div>

                          <motion.button
                            className="btn btn-primary btn-full"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            disabled={checkingOut || cart.length === 0}
                            onClick={handleCheckout}
                          >
                            {checkingOut ? (
                              <motion.span
                                className="btn-spinner"
                                animate={{ rotate: 360 }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 0.8,
                                  ease: "linear",
                                }}
                              >
                                ⟳
                              </motion.span>
                            ) : (
                              `Pay ₹${cartTotal.toFixed(2)}`
                            )}
                          </motion.button>

                          <button
                            className="btn btn-link"
                            onClick={() => setShowCheckout(false)}
                            style={{ marginTop: "0.5rem" }}
                          >
                            ← Back to cart
                          </button>
                        </>
                      )}
                    </motion.div>
                  )}

                  {/* Cart Summary Actions */}
                  {!showCheckout && !checkoutResult && cart.length > 0 && (
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
                          onClick={() => setShowCheckout(true)}
                        >
                          Proceed to Checkout
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
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* ========== ORDERS TAB ========== */}
          {activeTab === "orders" && (
            <motion.div
              key="orders-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="category-header"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <h1 className="category-title">Order History</h1>
                <p className="category-desc">
                  {orders.length > 0
                    ? `You have placed ${orders.length} order${orders.length > 1 ? "s" : ""}`
                    : "Your past orders will appear here"}
                </p>
              </motion.div>

              {loadingOrders ? (
                <div className="loading-state">Loading orders...</div>
              ) : ordersError ? (
                <div className="error-state">
                  Failed to load orders: {ordersError}
                </div>
              ) : orders.length === 0 ? (
                <motion.div
                  className="empty-cart"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                >
                  <div className="empty-cart-icon">📦</div>
                  <p>No orders yet</p>
                  <Link to="/" className="btn btn-primary">
                    Start Shopping
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  className="order-list"
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {orders.map((order) => (
                    <motion.div
                      key={order.id}
                      className="order-card"
                      variants={itemVariants}
                      whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    >
                      <div className="order-card-header">
                        <span className="order-id">Order #{order.id}</span>
                        <span
                          className={`order-status status-${order.status.toLowerCase()}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="order-card-body">
                        <div className="order-detail">
                          <span className="order-detail-label">Amount</span>
                          <span className="order-detail-value">
                            ₹{order.total_amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="order-detail">
                          <span className="order-detail-label">Date</span>
                          <span className="order-detail-value">
                            {new Date(order.created_at).toLocaleDateString(
                              "en-IN",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </PageTransition>
  );
}
