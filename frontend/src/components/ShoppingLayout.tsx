import { Outlet, Link } from "react-router-dom";
import { useApp } from "../context/useApp";
import Navbar from "./Navbar";

export default function ShoppingLayout() {
  const { cartError, retryCartAction } = useApp();

  return (
    <div className="app-layout">
      <Navbar />
      {cartError && (
        <div className="cart-sync-error" role="alert">
          <span>{cartError}</span>
          <button type="button" onClick={retryCartAction}>
            Retry
          </button>
        </div>
      )}
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer-container">
          <p>
            &copy; {new Date().getFullYear()} Sarada Stationeries Arts &amp;
            Crafts &mdash; Crafted with Care for Creative Souls
          </p>
          <p style={{ marginTop: "0.35rem", fontSize: "0.8rem" }}>
            <Link to="/shopping/home" style={{ color: "var(--coral-400)" }}>
              Home
            </Link>
            {" · "}
            <Link to="/shopping/contact" style={{ color: "var(--coral-400)" }}>
              Contact
            </Link>
            {" · "}
            <Link to="/shopping/orders" style={{ color: "var(--coral-400)" }}>
              Orders
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
