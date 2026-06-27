import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import NotebooksPage from "./pages/NotebooksPage";
import AccessoriesPage from "./pages/AccessoriesPage";
import BooksPage from "./pages/BooksPage";
import ArtMaterialsPage from "./pages/ArtMaterialsPage";
import OrdersPage from "./pages/OrdersPage";
import ContactPage from "./pages/ContactPage";

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* 🌟 Landing page is the default entry point */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<Navigate to="/" replace />} />

        {/* Main app — wrapped in Layout with Navbar & Footer */}
        <Route element={<Layout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/notebooks" element={<NotebooksPage />} />
          <Route path="/accessories" element={<AccessoriesPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/art-materials" element={<ArtMaterialsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
