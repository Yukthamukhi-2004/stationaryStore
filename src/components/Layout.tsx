import { Outlet } from "react-router-dom";
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
          <p>&copy; {new Date().getFullYear()} Stationery. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
