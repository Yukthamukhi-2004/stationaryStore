import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { api, mapBackendProduct, type Product, type Category } from "../lib/api";
import type { ProductItem } from "../data/products";
import ProductCard from "../components/ProductCard";

const features = [
  {
    icon: "✧",
    title: "Premium Quality",
    description:
      "Curated selection of the finest stationery from around the world.",
  },
  {
    icon: "✦",
    title: "Thoughtful Design",
    description:
      "Every piece is crafted with care, blending tradition with modern aesthetics.",
  },
  {
    icon: "◈",
    title: "Free Shipping",
    description: "Enjoy free shipping on all orders over $50, delivered with care.",
  },
];

// Map Supabase category names to frontend routes
const categoryRouteMap: Record<string, { path: string; emoji: string; color: string }> = {
  "Notebooks": { path: "/notebooks", emoji: "📔", color: "#8B7355" },
  "Pens": { path: "/accessories", emoji: "🖊️", color: "#6B8E6B" },
  "Art Supplies": { path: "/art-materials", emoji: "🎨", color: "#C77D6E" },
  "Office Supplies": { path: "/accessories", emoji: "📎", color: "#C4A882" },
  "School Essentials": { path: "/accessories", emoji: "🎒", color: "#7D9B7D" },
};

// Static categories for pages that don't have DB equivalents
const staticCategories = [
  { name: "Books", emoji: "📚", color: "#C4A882", path: "/books" },
];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function HomePage() {
  const navigate = useNavigate();
  const [dbProducts, setDbProducts] = useState<ProductItem[]>([]);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [products, categories] = await Promise.all([
          api.getProducts(),
          api.getCategories(),
        ]);
        setDbProducts(products.map((p: Product) => mapBackendProduct(p, p.category_id?.toString() ?? "general")));
        setDbCategories(categories);
      } catch {
        // Backend unavailable — home page shows static content only
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Build category cards from DB categories + static ones
  const allCategories = [
    ...dbCategories
      .filter((c) => categoryRouteMap[c.name])
      .map((c) => ({
        name: c.name,
        emoji: categoryRouteMap[c.name].emoji,
        color: categoryRouteMap[c.name].color,
        path: categoryRouteMap[c.name].path,
      })),
    ...staticCategories,
  ];

  return (
    <motion.div
      className="home-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section */}
      <motion.section className="hero-section" variants={itemVariants}>
        <div className="hero-content">
          <motion.span
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
          >
            Welcome to
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          >
            Stationery
          </motion.h1>
          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
          >
            Premium stationery supplies for creative minds and productive
            professionals. Discover thoughtfully crafted tools that inspire.
          </motion.p>
          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4, ease: "easeOut" }}
          >
            <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link to="/auth" className="btn btn-primary btn-lg">
                Explore Collection
              </Link>
            </motion.span>
            <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link to="/auth" className="btn btn-outline btn-lg">
                Sign In
              </Link>
            </motion.span>
          </motion.div>
        </div>
      </motion.section>

      {/* Featured Products - from Database */}
      {!loading && dbProducts.length > 0 && (
        <motion.section className="featured-section" variants={itemVariants}>
          <motion.h2
            className="section-title"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4 }}
          >
            Featured Products
          </motion.h2>
          <motion.div
            className="products-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {dbProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>
        </motion.section>
      )}

      {/* Categories Section */}
      <motion.section className="categories-section" variants={itemVariants}>
        <motion.h2
          className="section-title"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4 }}
        >
          Shop by Category
        </motion.h2>
        <motion.div
          className="categories-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {allCategories.map((cat) => (
            <motion.div
              key={cat.name}
              className="category-card"
              variants={itemVariants}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              whileTap={{ scale: 0.97 }}
              style={{ "--accent": cat.color } as React.CSSProperties}
              onClick={() => navigate(cat.path)}
            >
              <motion.span
                className="category-emoji"
                whileHover={{ scale: 1.15, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {cat.emoji}
              </motion.span>
              <h3>{cat.name}</h3>
              <span className="category-link">Explore &rarr;</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section className="features-section" variants={itemVariants}>
        <motion.h2
          className="section-title"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4 }}
        >
          Why Choose Us
        </motion.h2>
        <motion.div
          className="features-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              className="feature-card"
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.25 } }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className="feature-icon"
                whileHover={{ scale: 1.2, rotate: 10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {feature.icon}
              </motion.div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>
    </motion.div>
  );
}
