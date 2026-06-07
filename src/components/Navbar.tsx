import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

export default function Navbar() {
  const { pathname } = useLocation();

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
          <Link
            to="/"
            className={`nav-link ${isActive("/") ? "active" : ""}`}
          >
            Home
          </Link>
          <Link
            to="/profile"
            className={`nav-link ${isActive("/profile") ? "active" : ""}`}
          >
            Profile
          </Link>
          <Link to="/auth" className="btn btn-primary btn-sm">
            Get Started
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
