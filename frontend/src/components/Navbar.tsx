import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/useApp";
import BrandLogo from "../components/BrandLogo";
import GlobalSearch from "./GlobalSearch";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const shopDropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => pathname === path;
  const isShopPage =
    pathname.startsWith("/shopping/notebooks") ||
    pathname.startsWith("/shopping/books") ||
    pathname.startsWith("/shopping/art-materials") ||
    pathname.startsWith("/shopping/accessories");

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setShopOpen(false);
  }, [pathname]);

  // Close mobile menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  // Close shop dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (shopDropdownRef.current && !shopDropdownRef.current.contains(e.target as Node)) {
        setShopOpen(false);
      }
    }
    if (shopOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [shopOpen]);

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

        <GlobalSearch />

        {/* Hamburger Toggle — visible on mobile */}
        <button
          className="navbar-hamburger"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          <motion.span
            animate={mobileMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
            className="hamburger-line"
          />
          <motion.span
            animate={mobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
            className="hamburger-line"
          />
          <motion.span
            animate={mobileMenuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
            className="hamburger-line"
          />
        </button>

        {/* Desktop links */}
        <div className="navbar-links">
          {/* Shop Dropdown — styled as a nav-link, opens on click */}
          <div className="nav-shop-dropdown" ref={shopDropdownRef}>
            <button
              type="button"
              className={`nav-link nav-link-shop ${isShopPage ? "active" : ""}`}
              onClick={() => setShopOpen(!shopOpen)}
              aria-expanded={shopOpen}
              aria-haspopup="true"
            >
              Shop
              <motion.span
                className="shop-chevron"
                animate={{ rotate: shopOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                ▾
              </motion.span>
            </button>

            <AnimatePresence>
              {shopOpen && (
                <motion.div
                  className="shop-dropdown-menu"
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <div className="shop-dropdown-arrow" />
                  {shopCategories.map((cat) => (
                    <Link
                      key={cat.path}
                      to={cat.path}
                      className={`shop-dropdown-item ${isActive(cat.path) ? "active" : ""}`}
                      onClick={() => setShopOpen(false)}
                    >
                      <span className="dd-emoji">{cat.emoji}</span>
                      <span className="dd-label">{cat.name}</span>
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

      {/* ── Mobile Menu Panel ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            className="navbar-mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="navbar-mobile-links">
              <Link
                to="/shopping/home"
                className={`navbar-mobile-link ${isActive("/shopping/home") ? "active" : ""}`}
              >
                🏠 Home
              </Link>
              <div className="navbar-mobile-section">
                <span className="navbar-mobile-section-title">📂 Shop</span>
                {shopCategories.map((cat) => (
                  <Link
                    key={cat.path}
                    to={cat.path}
                    className={`navbar-mobile-sublink ${isActive(cat.path) ? "active" : ""}`}
                  >
                    {cat.emoji} {cat.name}
                  </Link>
                ))}
              </div>
              <Link
                to="/shopping/orders"
                className={`navbar-mobile-link ${isActive("/shopping/orders") ? "active" : ""}`}
              >
                📦 Orders {cartCount > 0 && <span className="mobile-badge">{cartCount}</span>}
              </Link>
              <Link
                to="/shopping/profile"
                className={`navbar-mobile-link ${isActive("/shopping/profile") ? "active" : ""}`}
              >
                👤 Profile
              </Link>
              <Link
                to="/shopping/contact"
                className={`navbar-mobile-link ${isActive("/shopping/contact") ? "active" : ""}`}
              >
                ✉ Contact
              </Link>
              {cartCount > 0 && (
                <div className="navbar-mobile-cart-total">
                  <span>Cart Total:</span>
                  <span className="mobile-cart-amount">₹{cartTotal.toFixed(2)}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
