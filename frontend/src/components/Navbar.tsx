import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/useApp";

const shopCategories = [
  { name: "Notebooks", emoji: "📔", path: "/notebooks" },
  { name: "Books", emoji: "📚", path: "/books" },
  { name: "Art Materials", emoji: "🎨", path: "/art-materials" },
  { name: "Accessories", emoji: "✏", path: "/accessories" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { cartCount, cartTotal } = useApp();
  const [shopOpen, setShopOpen] = useState(false);

  const isActive = (path: string) => pathname === path;
  const isShopPage = pathname.startsWith("/notebooks") || pathname.startsWith("/books") || pathname.startsWith("/art-materials") || pathname.startsWith("/accessories");

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
            whileHover={{ rotate: -10, scale: 1.1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            ✎
          </motion.span>
          <span className="brand-text">Stationery</span>
        </Link>

        <div className="navbar-links">
          {/* Shop Dropdown */}
          <div
            className="nav-shop-dropdown"
            onMouseEnter={() => setShopOpen(true)}
            onMouseLeave={() => setShopOpen(false)}
          >
            <motion.span
              className={`nav-shop-trigger ${isShopPage ? "active" : ""}`}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShopOpen(!shopOpen)}
            >
              <motion.span
                className="pencil-icon"
                animate={shopOpen ? { rotate: -20 } : { rotate: 0 }}
              >
                ✏
              </motion.span>
              <span className="nav-label">Shop</span>
            </motion.span>

            <AnimatePresence>
              {shopOpen && (
                <motion.div
                  className="shop-dropdown-menu"
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  {shopCategories.map((cat) => (
                    <Link
                      key={cat.path}
                      to={cat.path}
                      className={`shop-dropdown-item ${isActive(cat.path) ? "active" : ""}`}
                      onClick={() => setShopOpen(false)}
                    >
                      <span className="dd-emoji">{cat.emoji}</span>
                      {cat.name}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
            Home
          </Link>
          <Link
            to="/contact"
            className={`nav-link ${isActive("/contact") ? "active" : ""}`}
          >
            Contact
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
