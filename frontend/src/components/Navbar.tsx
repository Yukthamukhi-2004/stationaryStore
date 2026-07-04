import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/useApp";
import BrandLogo from "../components/BrandLogo";

const shopCategories = [
  { name: "Notebooks", emoji: "📔", path: "/shopping/notebooks" },
  { name: "Books", emoji: "📚", path: "/shopping/books" },
  { name: "Art Materials", emoji: "🎨", path: "/shopping/art-materials" },
  { name: "Accessories", emoji: "✏", path: "/shopping/accessories" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { cartCount, cartTotal } = useApp();
  const [shopOpen, setShopOpen] = useState(false);

  const isActive = (path: string) => pathname === path;
  const isShopPage =
    pathname.startsWith("/shopping/notebooks") ||
    pathname.startsWith("/shopping/books") ||
    pathname.startsWith("/shopping/art-materials") ||
    pathname.startsWith("/shopping/accessories");

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="navbar-container">
        <Link to="/shopping/home" className="navbar-brand">
          <motion.div
            className="brand-logo-wrapper"
            whileHover={{ rotate: -1, scale: 1.06 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <BrandLogo size={36} className="brand-logo" />
          </motion.div>
          <div className="navbar-brand-stacked">
            <span className="brand-label">Sarada</span>
            <span className="brand-main">Stationeries</span>
            <span className="brand-sub">Arts &amp; Crafts</span>
          </div>
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

          <Link
            to="/shopping/home"
            className={`nav-link ${isActive("/shopping/home") ? "active" : ""}`}
          >
            Home
          </Link>
          <Link
            to="/shopping/contact"
            className={`nav-link ${isActive("/shopping/contact") ? "active" : ""}`}
          >
            Contact
          </Link>
          <Link
            to="/shopping/orders"
            className={`nav-link nav-orders ${isActive("/shopping/orders") ? "active" : ""}`}
          >
            Orders
            {cartCount > 0 && <span className="order-badge">{cartCount}</span>}
          </Link>
          <Link
            to="/shopping/profile"
            className={`nav-link ${isActive("/shopping/profile") ? "active" : ""}`}
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
