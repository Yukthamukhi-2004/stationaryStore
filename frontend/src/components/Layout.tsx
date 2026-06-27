import { Outlet, Link } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer-container">
          <p>
            &copy; {new Date().getFullYear()} Sarada Stationeries Arts &amp; Crafts &mdash;
            Crafted with Care for Creative Souls
          </p>
          <p style={{ marginTop: "0.35rem", fontSize: "0.8rem" }}>
            <Link
              to="/home"
              style={{ color: "var(--coral-400)" }}
            >
              Home
            </Link>
            {" · "}
            <Link
              to="/contact"
              style={{ color: "var(--coral-400)" }}
            >
              Contact
            </Link>
            {" · "}
            <Link
              to="/orders"
              style={{ color: "var(--coral-400)" }}
            >
              Orders
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
