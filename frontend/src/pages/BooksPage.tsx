import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { getProductsByCategoryNames, mapBackendProduct } from "../lib/api";
import ProductCard from "../components/ProductCard";
import PageTransition from "../components/PageTransition";
import LoadingScribble from "../components/LoadingScribble";
import type { ProductItem } from "../data/products";

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const headerVariants: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const CATEGORY_NAMES = ["Books"];

export default function BooksPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(false);
      try {
        const backendProducts =
          await getProductsByCategoryNames(CATEGORY_NAMES);
        const filtered = backendProducts.map((p) =>
          mapBackendProduct(p, "books"),
        );
        if (!cancelled) setProducts(filtered);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  return (
    <PageTransition>
      <div className="category-page">
        <motion.div
          className="category-header"
          variants={headerVariants}
          initial="hidden"
          animate="visible"
        >
          <Link to="/shopping/home" className="back-link-top">
            &larr; Home
          </Link>
          <h1 className="category-title">Books</h1>
          <p className="category-desc">
            Novels, textbooks, journals, diaries and more to fuel your
            imagination.
          </p>
        </motion.div>

        {loading ? (
          <LoadingScribble text="Turning the pages..." />
        ) : loadError ? (
          <div className="error-state" role="alert">
            <p>Could not load books.</p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setRetryCount((count) => count + 1)}
            >
              Retry
            </button>
          </div>
        ) : products.length === 0 ? (
          <p className="loading-state" role="status">
            No books are available right now.
          </p>
        ) : (
          <motion.div
            className="products-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
