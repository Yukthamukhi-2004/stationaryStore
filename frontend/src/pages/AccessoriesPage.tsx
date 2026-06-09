import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { api, mapBackendProduct } from "../lib/api";
import { accessoriesProducts as fallbackProducts } from "../data/products";
import ProductCard from "../components/ProductCard";
import type { ProductItem } from "../data/products";

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

// Supabase category IDs: 1 = Pens, 4 = Office Supplies, 5 = School Essentials
// Run: SELECT id, name FROM categories;
const BACKEND_CATEGORY_IDS = [1, 4, 5];

export default function AccessoriesPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const backendProducts = await api.getProducts();
        const filtered = backendProducts
          .filter((p) => p.category_id && BACKEND_CATEGORY_IDS.includes(p.category_id))
          .map((p) => mapBackendProduct(p, "accessories"));
        setProducts(filtered.length > 0 ? filtered : fallbackProducts);
      } catch {
        setProducts(fallbackProducts);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <motion.div
      className="category-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="category-header"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Link to="/" className="back-link-top">&larr; Home</Link>
        <h1 className="category-title">Accessories</h1>
        <p className="category-desc">
          Pens, pencils, erasers, and all the essentials for your desk.
        </p>
      </motion.div>

      {loading ? (
        <div className="loading-state">Loading products...</div>
      ) : (
        <motion.div
          className="products-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
