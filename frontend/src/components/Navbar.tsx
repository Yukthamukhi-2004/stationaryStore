import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/useApp";

export default function Navbar() {
  const { pathname } = useLocation();
  const { cartCount, cartTotal } = useApp();

  const isActive = (path: string) => pathname === path;

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <motion.span
            className="brand-icon"
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            ✦
          </motion.span>
          <span className="brand-text">Stationery</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
            Home
          </Link>
          <Link
            to="/orders"
            className={`nav-link nav-orders ${isActive("/orders") ? "active" : ""}`}
          >
            Orders
            {cartCount > 0 && <span className="order-badge">{cartCount}</span>}
          </Link>
          <Link
            to="/profile"
            className={`nav-link ${isActive("/profile") ? "active" : ""}`}
          >
            Profile
          </Link>
          {cartCount > 0 && (
            <div className="nav-cart-total">
              <span className="nav-total-label">Cart:</span>
              <span className="nav-total-amount">₹{cartTotal.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
