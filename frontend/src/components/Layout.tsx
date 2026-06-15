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
            &copy; {new Date().getFullYear()} Stationery &mdash; Mindfully
            Crafted for Creative Souls
          </p>
          <p style={{ marginTop: "0.35rem", fontSize: "0.8rem" }}>
            <Link
              to="/"
              style={{ color: "var(--pastel-blue-400)" }}
            >
              Home
            </Link>
            {" · "}
            <Link
              to="/contact"
              style={{ color: "var(--pastel-blue-400)" }}
            >
              Contact
            </Link>
            {" · "}
            <Link
              to="/orders"
              style={{ color: "var(--pastel-blue-400)" }}
            >
              Orders
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
