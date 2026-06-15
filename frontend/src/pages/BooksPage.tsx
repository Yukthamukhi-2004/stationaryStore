import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { api, mapBackendProduct } from "../lib/api";
import { booksProducts as fallbackProducts } from "../data/products";
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

const BACKEND_CATEGORY_IDS: number[] = [];

export default function BooksPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const backendProducts = await api.getProducts();
        const filtered = backendProducts
          .filter((p) => p.category_id && BACKEND_CATEGORY_IDS.includes(p.category_id))
          .map((p) => mapBackendProduct(p, "books"));
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
    <PageTransition>
      <div className="category-page">
        <motion.div
          className="category-header"
          variants={headerVariants}
          initial="hidden"
          animate="visible"
        >
          <Link to="/" className="back-link-top">&larr; Home</Link>
          <h1 className="category-title">Books</h1>
          <p className="category-desc">
            Novels, textbooks, journals, diaries and more to fuel your imagination.
          </p>
        </motion.div>

        {loading ? (
          <LoadingScribble text="Turning the pages..." />
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
