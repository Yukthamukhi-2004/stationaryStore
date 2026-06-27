import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useUser } from "../context/useUser";
import { useApp } from "../context/useApp";
import { api, type Order, type Payment } from "../lib/api";
import PageTransition from "../components/PageTransition";
import UpiQrCode from "../components/UpiQrCode";

type TabType = "cart" | "orders";
type CheckoutStep = "address" | "payment";

type DeliveryAddress = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
};

const EMPTY_ADDRESS: DeliveryAddress = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
};

const SHOP_UPI_ID = "sarada@artsup"; // Replace with your actual UPI ID

const PAYMENT_METHODS = [
  {
    value: "upi",
    label: "📱 UPI (GPay / PhonePe / Paytm)",
    description: "Pay instantly using any UPI app",
  },
  {
    value: "cod",
    label: "💵 Cash on Delivery",
    description: "Pay when your order is delivered",
  },
  {
    value: "credit_card",
    label: "💳 Credit Card",
    description: "Visa, Mastercard, Rupay",
  },
  {
    value: "debit_card",
    label: "💳 Debit Card",
    description: "Any bank debit card",
  },
  {
    value: "net_banking",
    label: "🏦 Net Banking",
    description: "All major banks supported",
  },
];

// Payment method display helpers
const PAYMENT_LABELS: Record<string, { icon: string; label: string }> = {
  upi: { icon: "📱", label: "UPI" },
  cod: { icon: "💵", label: "Cash on Delivery" },
  credit_card: { icon: "💳", label: "Credit Card" },
  debit_card: { icon: "💳", label: "Debit Card" },
  net_banking: { icon: "🏦", label: "Net Banking" },
};

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
  const { user, isLoaded } = useUser();
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
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("address");
  const [deliveryAddress, setDeliveryAddress] =
    useState<DeliveryAddress>(EMPTY_ADDRESS);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [upiReferenceId, setUpiReferenceId] = useState("");
  const [codConfirmed, setCodConfirmed] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<{
    success: boolean;
    message: string;
    details: Array<{ name: string; ok: boolean; detail?: string }>;
  } | null>(null);

  // Validate address — all required fields must be non-empty with proper format
  const isAddressValid = useCallback(() => {
    const { fullName, phone, addressLine1, city, state, pincode } =
      deliveryAddress;
    return (
      fullName.trim() !== "" &&
      phone.trim().length >= 10 &&
      addressLine1.trim() !== "" &&
      city.trim() !== "" &&
      state.trim() !== "" &&
      pincode.trim().length === 6
    );
  }, [deliveryAddress]);

  // Update a single address field
  const updateAddressField = useCallback(
    (field: keyof DeliveryAddress, value: string) => {
      setDeliveryAddress((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // Go to payment step
  const goToPayment = useCallback(() => {
    if (isAddressValid()) {
      setCheckoutStep("payment");
    }
  }, [isAddressValid]);

  // Go back to address step
  const goToAddress = useCallback(() => {
    setCheckoutStep("address");
  }, []);

  // Reset checkout when dismissed
  const resetCheckout = useCallback(() => {
    setCheckoutStep("address");
    setDeliveryAddress(EMPTY_ADDRESS);
    setPaymentMethod("upi");
    setUpiReferenceId("");
    setCodConfirmed(false);
    setCheckoutResult(null);
    setShowCheckout(false);
  }, []);

  // Payment data for orders
  const [payments, setPayments] = useState<Payment[]>([]);

  // Get payment info for a given order
  const getPaymentForOrder = useCallback(
    (orderId: number): Payment | undefined => {
      return payments.find((p) => p.order_id === orderId);
    },
    [payments],
  );

  // Fetch orders (filtered to current user)
  const fetchOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setPayments([]);
      return;
    }

    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const [ordersData, paymentsData] = await Promise.all([
        api.getOrders(),
        api.getPayments(),
      ]);
      setOrders(ordersData.filter((o) => o.user_id === user.id));
      setPayments(paymentsData);
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

  // When payment method changes, reset related fields
  useEffect(() => {
    setUpiReferenceId("");
    setCodConfirmed(false);
  }, [paymentMethod]);

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
      const pmLabel = PAYMENT_LABELS[paymentMethod]?.label ?? paymentMethod;
      setCheckoutResult({
        success: true,
        message: `All items checked out successfully via ${pmLabel}!`,
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
    resetCheckout();
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
                  <Link to="/home" className="btn btn-primary">
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

                      {/* Delivery Address on success */}
                      {checkoutResult.success && (
                        <div className="checkout-address-result">
                          <div className="checkout-address-result-header">
                            📍 Delivering to
                          </div>
                          <p className="checkout-address-result-name">
                            {deliveryAddress.fullName} — {deliveryAddress.phone}
                          </p>
                          <p className="checkout-address-result-text">
                            {deliveryAddress.addressLine1}
                            {deliveryAddress.addressLine2 &&
                              `, ${deliveryAddress.addressLine2}`}
                          </p>
                          <p className="checkout-address-result-text">
                            {deliveryAddress.city}, {deliveryAddress.state} —{" "}
                            {deliveryAddress.pincode}
                          </p>
                        </div>
                      )}

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

                  {/* Checkout Form — multi-step */}
                  {showCheckout && !checkoutResult && (
                    <motion.div
                      className="checkout-form"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      {!isLoaded || !user ? (
                        <p className="checkout-login-warning">
                          <Link to="/auth">Sign in</Link> to proceed with
                          checkout.
                        </p>
                      ) : (
                        <>
                          {/* Step Indicator */}
                          <div className="checkout-steps">
                            <div
                              className={`checkout-step ${checkoutStep === "address" ? "active" : "completed"}`}
                            >
                              <span className="checkout-step-number">
                                {checkoutStep === "address" ? "1" : "✓"}
                              </span>
                              <span className="checkout-step-label">
                                Address
                              </span>
                            </div>
                            <div className="checkout-step-line" />
                            <div
                              className={`checkout-step ${checkoutStep === "payment" ? "active" : ""}`}
                            >
                              <span className="checkout-step-number">2</span>
                              <span className="checkout-step-label">
                                Payment
                              </span>
                            </div>
                          </div>

                          {/* ===== STEP 1: ADDRESS ===== */}
                          {checkoutStep === "address" && (
                            <motion.div
                              key="address-step"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <h2>Delivery Address</h2>

                              <div className="address-form">
                                <div className="address-form-row">
                                  <div className="address-form-group flex-1">
                                    <label htmlFor="addr-fullName">
                                      Full Name *
                                    </label>
                                    <input
                                      id="addr-fullName"
                                      className="form-input"
                                      type="text"
                                      placeholder="John Doe"
                                      value={deliveryAddress.fullName}
                                      onChange={(e) =>
                                        updateAddressField(
                                          "fullName",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="address-form-group flex-1">
                                    <label htmlFor="addr-phone">
                                      Phone Number *
                                    </label>
                                    <input
                                      id="addr-phone"
                                      className="form-input"
                                      type="tel"
                                      placeholder="9876543210"
                                      maxLength={10}
                                      value={deliveryAddress.phone}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(
                                          /\D/g,
                                          "",
                                        );
                                        updateAddressField("phone", val);
                                      }}
                                    />
                                  </div>
                                </div>

                                <div className="address-form-group">
                                  <label htmlFor="addr-line1">
                                    Address Line 1 *
                                  </label>{" "}
                                  <input
                                    id="addr-line1"
                                    className="form-input"
                                    type="text"
                                    placeholder="House / Flat / Door No., Street"
                                    value={deliveryAddress.addressLine1}
                                    onChange={(e) =>
                                      updateAddressField(
                                        "addressLine1",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>

                                <div className="address-form-group">
                                  <label htmlFor="addr-line2">
                                    Address Line 2 (Optional)
                                  </label>
                                  <input
                                    id="addr-line2"
                                    className="form-input"
                                    type="text"
                                    placeholder="Area, Colony, Locality"
                                    value={deliveryAddress.addressLine2}
                                    onChange={(e) =>
                                      updateAddressField(
                                        "addressLine2",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>

                                <div className="address-form-group">
                                  <label htmlFor="addr-landmark">
                                    Landmark (Optional)
                                  </label>
                                  <input
                                    id="addr-landmark"
                                    className="form-input"
                                    type="text"
                                    placeholder="Near school / hospital / park"
                                    value={deliveryAddress.landmark}
                                    onChange={(e) =>
                                      updateAddressField(
                                        "landmark",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>

                                <div className="address-form-row three-col">
                                  <div className="address-form-group">
                                    <label htmlFor="addr-city">City *</label>
                                    <input
                                      id="addr-city"
                                      className="form-input"
                                      type="text"
                                      placeholder="City"
                                      value={deliveryAddress.city}
                                      onChange={(e) =>
                                        updateAddressField(
                                          "city",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="address-form-group">
                                    <label htmlFor="addr-state">State *</label>
                                    <input
                                      id="addr-state"
                                      className="form-input"
                                      type="text"
                                      placeholder="State"
                                      value={deliveryAddress.state}
                                      onChange={(e) =>
                                        updateAddressField(
                                          "state",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="address-form-group">
                                    <label htmlFor="addr-pincode">
                                      Pincode *
                                    </label>
                                    <input
                                      id="addr-pincode"
                                      className="form-input"
                                      type="text"
                                      placeholder="500001"
                                      maxLength={6}
                                      value={deliveryAddress.pincode}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(
                                          /\D/g,
                                          "",
                                        );
                                        updateAddressField("pincode", val);
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="checkout-nav">
                                <button
                                  className="btn btn-link"
                                  onClick={() => setShowCheckout(false)}
                                >
                                  ← Back to cart
                                </button>
                                <motion.button
                                  className="btn btn-primary"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.97 }}
                                  disabled={!isAddressValid()}
                                  onClick={goToPayment}
                                >
                                  Continue to Payment →
                                </motion.button>
                              </div>
                            </motion.div>
                          )}

                          {/* ===== STEP 2: PAYMENT ===== */}
                          {checkoutStep === "payment" && (
                            <motion.div
                              key="payment-step"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              {/* Address Summary */}
                              <div className="address-summary">
                                <div className="address-summary-header">
                                  <span className="address-summary-icon">
                                    📍
                                  </span>
                                  <span className="address-summary-title">
                                    Delivering to
                                  </span>
                                  <button
                                    className="btn-edit-address"
                                    onClick={goToAddress}
                                  >
                                    Edit
                                  </button>
                                </div>
                                <div className="address-summary-body">
                                  <p className="address-summary-name">
                                    {deliveryAddress.fullName} —{" "}
                                    {deliveryAddress.phone}
                                  </p>
                                  <p className="address-summary-text">
                                    {deliveryAddress.addressLine1}
                                    {deliveryAddress.addressLine2 &&
                                      `, ${deliveryAddress.addressLine2}`}
                                    {deliveryAddress.landmark &&
                                      ` (${deliveryAddress.landmark})`}
                                  </p>
                                  <p className="address-summary-text">
                                    {deliveryAddress.city},{" "}
                                    {deliveryAddress.state} —{" "}
                                    {deliveryAddress.pincode}
                                  </p>
                                </div>
                              </div>

                              <h2>Select Payment Method</h2>

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
                                      onChange={() =>
                                        setPaymentMethod(pm.value)
                                      }
                                    />
                                    <span className="payment-option-label">
                                      {pm.label}
                                    </span>
                                    <span className="payment-option-desc">
                                      {pm.description}
                                    </span>
                                  </label>
                                ))}
                              </div>

                              {/* ── UPI PAYMENT DETAILS ── */}
                              {paymentMethod === "upi" && (
                                <motion.div
                                  className="payment-detail-section"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <div className="upi-payment-info">
                                    <div className="upi-header">
                                      <span className="upi-icon">📱</span>
                                      <span className="upi-title">
                                        Pay via UPI
                                      </span>
                                    </div>

                                    <div className="upi-layout">
                                      <div className="upi-details-section">
                                        <div className="upi-id-box">
                                          <span className="upi-id-label">
                                            Our UPI ID
                                          </span>
                                          <div className="upi-id-value">
                                            <code>{SHOP_UPI_ID}</code>
                                            <button
                                              className="btn-copy"
                                              onClick={() => {
                                                navigator.clipboard.writeText(
                                                  SHOP_UPI_ID,
                                                );
                                              }}
                                              title="Copy UPI ID"
                                            >
                                              📋
                                            </button>
                                          </div>
                                        </div>

                                        <div className="upi-steps">
                                          <p className="upi-steps-title">
                                            How to pay:
                                          </p>
                                          <ol className="upi-steps-list">
                                            <li>
                                              Open GPay / PhonePe / Paytm / any
                                              UPI app
                                            </li>
                                            <li>
                                              Scan the QR code or pay to UPI ID:{" "}
                                              <strong>{SHOP_UPI_ID}</strong>
                                            </li>
                                            <li>
                                              Amount{" "}
                                              <strong>
                                                ₹{cartTotal.toFixed(2)}
                                              </strong>{" "}
                                              will be auto-filled
                                            </li>
                                            <li>
                                              After payment, enter the
                                              transaction reference below
                                            </li>
                                          </ol>
                                        </div>
                                      </div>

                                      <UpiQrCode
                                        upiId={SHOP_UPI_ID}
                                        name="Stationery Store"
                                        amount={cartTotal}
                                        transactionNote={`Order from Sarada Stationeries`}
                                      />
                                    </div>

                                    <div className="upi-reference-input">
                                      <label htmlFor="upi-ref">
                                        UPI Transaction Reference (UPI Ref No.)
                                      </label>
                                      <input
                                        id="upi-ref"
                                        className="form-input"
                                        type="text"
                                        placeholder="e.g. GPay123ABC456"
                                        value={upiReferenceId}
                                        onChange={(e) =>
                                          setUpiReferenceId(e.target.value)
                                        }
                                      />
                                      <p className="upi-ref-hint">
                                        Optional: This helps us verify your
                                        payment faster
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              )}

                              {/* ── COD PAYMENT DETAILS ── */}
                              {paymentMethod === "cod" && (
                                <motion.div
                                  className="payment-detail-section"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <div className="cod-payment-info">
                                    <div className="cod-header">
                                      <span className="cod-icon">💵</span>
                                      <span className="cod-title">
                                        Cash on Delivery
                                      </span>
                                    </div>

                                    <div className="cod-details">
                                      <div className="cod-detail-item">
                                        <span className="cod-detail-icon">
                                          💰
                                        </span>
                                        <span>
                                          Pay{" "}
                                          <strong>
                                            ₹{cartTotal.toFixed(2)}
                                          </strong>{" "}
                                          in cash when your order arrives
                                        </span>
                                      </div>
                                      <div className="cod-detail-item">
                                        <span className="cod-detail-icon">
                                          📍
                                        </span>
                                        <span>
                                          Our delivery partner will collect the
                                          payment at your doorstep
                                        </span>
                                      </div>
                                      <div className="cod-detail-item">
                                        <span className="cod-detail-icon">
                                          ⏰
                                        </span>
                                        <span>
                                          Please keep the exact change ready —
                                          delivery partners may not carry change
                                        </span>
                                      </div>
                                    </div>

                                    <label className="cod-confirm-checkbox">
                                      <input
                                        type="checkbox"
                                        checked={codConfirmed}
                                        onChange={(e) =>
                                          setCodConfirmed(e.target.checked)
                                        }
                                      />
                                      <span>
                                        I understand that I will pay{" "}
                                        <strong>₹{cartTotal.toFixed(2)}</strong>{" "}
                                        in cash upon delivery
                                      </span>
                                    </label>
                                  </div>
                                </motion.div>
                              )}

                              <motion.button
                                className="btn btn-primary btn-full"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                disabled={
                                  checkingOut ||
                                  cart.length === 0 ||
                                  (paymentMethod === "cod" && !codConfirmed)
                                }
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
                                ) : paymentMethod === "cod" ? (
                                  `Place Order • ₹${cartTotal.toFixed(2)}`
                                ) : paymentMethod === "upi" ? (
                                  `Pay ₹${cartTotal.toFixed(2)} via UPI`
                                ) : (
                                  `Pay ₹${cartTotal.toFixed(2)}`
                                )}
                              </motion.button>

                              <button
                                className="btn btn-link"
                                onClick={goToAddress}
                                style={{ marginTop: "0.5rem" }}
                              >
                                ← Back to address
                              </button>
                            </motion.div>
                          )}
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
                      {/* Payment Method Preview */}
                      <div className="cart-summary-section">
                        <div className="cart-summary-section-header">
                          <span className="cart-summary-section-icon">💳</span>
                          <span className="cart-summary-section-title">
                            Payment Method
                          </span>
                        </div>
                        <div className="cart-payment-preview">
                          {PAYMENT_METHODS.map((pm) => {
                            const isSelected = paymentMethod === pm.value;
                            const pmInfo = PAYMENT_LABELS[pm.value];
                            return (
                              <button
                                key={pm.value}
                                className={`cart-payment-chip ${isSelected ? "selected" : ""}`}
                                onClick={() => setPaymentMethod(pm.value)}
                                title={pm.description}
                              >
                                <span>{pmInfo?.icon}</span>
                                <span>{pmInfo?.label}</span>
                                {isSelected && (
                                  <span className="cart-payment-check">✓</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

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
                  <Link to="/home" className="btn btn-primary">
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
                  {orders.map((order) => {
                    const payment = getPaymentForOrder(order.id);
                    const pmInfo = payment
                      ? (PAYMENT_LABELS[payment.payment_method] ?? {
                          icon: "💳",
                          label: payment.payment_method,
                        })
                      : null;

                    return (
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
                          {payment && (
                            <div className="order-detail">
                              <span className="order-detail-label">
                                Payment
                              </span>
                              <span className="order-detail-value order-detail-value--payment">
                                <span
                                  className={`payment-badge payment-badge--${payment.payment_method}`}
                                >
                                  {pmInfo?.icon}{" "}
                                  {pmInfo?.label ?? payment.payment_method}
                                </span>
                                <span
                                  className={`payment-status-dot payment-status-dot--${payment.payment_status.toLowerCase()}`}
                                >
                                  {payment.payment_status}
                                </span>
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </PageTransition>
  );
}
