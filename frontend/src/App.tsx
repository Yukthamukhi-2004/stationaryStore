import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// ── Shopping (User) Layout & Pages ──
import ShoppingLayout from "./components/ShoppingLayout";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import NotebooksPage from "./pages/NotebooksPage";
import AccessoriesPage from "./pages/AccessoriesPage";
import BooksPage from "./pages/BooksPage";
import ArtMaterialsPage from "./pages/ArtMaterialsPage";
import OrdersPage from "./pages/OrdersPage";
import ContactPage from "./pages/ContactPage";
import ProductDetailPage from "./pages/ProductDetailPage";

// ── Admin Layout & Pages ──
import AdminRoute from "./components/AdminRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminLowStock from "./pages/admin/AdminLowStock";
import AdminReorder from "./pages/admin/AdminReorder";
import AdminPurchases from "./pages/admin/AdminPurchases";

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* ═══════════════════════════════════════════════
           PUBLIC — Landing page (default entry point)
           ═══════════════════════════════════════════════ */}
        <Route path="/" element={<Navigate to="/shopping/home" replace />} />
        <Route
          path="/landing"
          element={<Navigate to="/shopping/home" replace />}
        />

        {/* ═══════════════════════════════════════════════
           🛍️ SHOPPING — User-facing store experience
           ═══════════════════════════════════════════════ */}
        <Route path="/shopping" element={<ShoppingLayout />}>
          {/* Redirect /shopping to /shopping/home */}
          <Route index element={<Navigate to="/shopping/home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="products/:productId" element={<ProductDetailPage />} />
          <Route path="notebooks" element={<NotebooksPage />} />
          <Route path="accessories" element={<AccessoriesPage />} />
          <Route path="books" element={<BooksPage />} />
          <Route path="art-materials" element={<ArtMaterialsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="auth" element={<AuthPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* ═══════════════════════════════════════════════
           🔐 ADMIN — Admin management panel
           ═══════════════════════════════════════════════ */}
        <Route path="/admin" element={<AdminRoute />}>
          {/* Redirect /admin to /admin/dashboard */}
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="low-stock" element={<AdminLowStock />} />
          <Route path="reorder" element={<AdminReorder />} />
          <Route path="purchases" element={<AdminPurchases />} />
        </Route>

        {/* ═══════════════════════════════════════════════
           ❌ Catch-all — redirect to landing
           ═══════════════════════════════════════════════ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
