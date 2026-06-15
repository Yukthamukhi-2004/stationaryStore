import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { api, mapBackendProduct, type Product, type Category } from "../lib/api";
import type { ProductItem } from "../data/products";
import ProductCard from "../components/ProductCard";
import DoodleIllustrations from "../components/DoodleIllustrations";
import PageTransition from "../components/PageTransition";

const features = [
  {
    icon: "✎",
    title: "Premium Quality",
    description:
      "Curated selection of the finest stationery from around the world, chosen with care.",
  },
  {
    icon: "✦",
    title: "Thoughtful Design",
    description:
      "Every piece is crafted with love, blending tradition with modern aesthetics.",
  },
  {
    icon: "✧",
    title: "Free Shipping",
    description: "Free shipping on all orders over ₹500, delivered with a smile.",
  },
];

const categoryRouteMap: Record<string, { path: string; emoji: string; color: string }> = {
  "Notebooks": { path: "/notebooks", emoji: "📔", color: "#8B7355" },
  "Pens": { path: "/accessories", emoji: "🖊", color: "#6A9FB5" },
  "Art Supplies": { path: "/art-materials", emoji: "🎨", color: "#C77D6E" },
  "Office Supplies": { path: "/accessories", emoji: "📎", color: "#B5D5E0" },
  "School Essentials": { path: "/accessories", emoji: "🎒", color: "#8BAA8B" },
};

const staticCategories = [
  { name: "Books", emoji: "📚", color: "#C4A882", path: "/books" },
];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const heroItemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
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
        setDbProducts(
          products.map((p: Product) =>
            mapBackendProduct(p, p.category_id?.toString() ?? "general"),
          ),
        );
        setDbCategories(categories);
      } catch {
        // Backend unavailable — home page shows static content only
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
    <PageTransition>
      <motion.div
        className="home-page"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section with Doodle Decorations */}
        <motion.section className="hero-section" variants={heroItemVariants}>
          <div className="hero-doodles">
            <motion.span
              className="hero-doodle"
              animate={{ opacity: [0.1, 0.25, 0.1], rotate: [-15, -10, -15] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              ✎
            </motion.span>
            <motion.span
              className="hero-doodle"
              animate={{ opacity: [0.1, 0.25, 0.1], rotate: [10, 15, 10] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 }}
            >
              ✦
            </motion.span>
            <motion.span
              className="hero-doodle"
              animate={{ opacity: [0.1, 0.25, 0.1], rotate: [-5, 0, -5] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 1 }}
            >
              ✧
            </motion.span>
            <motion.span
              className="hero-doodle"
              animate={{ opacity: [0.1, 0.25, 0.1], rotate: [20, 25, 20] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.3 }}
            >
              ♥
            </motion.span>
            <motion.span
              className="hero-doodle"
              animate={{ opacity: [0.1, 0.25, 0.1], rotate: [-25, -20, -25] }}
              transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut", delay: 0.8 }}
            >
              ☆
            </motion.span>
            <motion.span
              className="hero-doodle"
              animate={{ opacity: [0.1, 0.25, 0.1], rotate: [15, 20, 15] }}
              transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut", delay: 1.2 }}
            >
              ✿
            </motion.span>
          </div>

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
              transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Stationery
            </motion.h1>
            <motion.p
              className="hero-subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
            >
              Mindfully crafted stationery for creative souls. Discover notebooks,
              art supplies, and everyday essentials that make your ideas come to
              life.
            </motion.p>
            <motion.div
              className="hero-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4, ease: "easeOut" }}
            >
              <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                <Link to="/notebooks" className="btn btn-primary btn-lg">
                  Explore Notebooks
                </Link>
              </motion.span>
              <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                <Link to="/contact" className="btn btn-outline btn-lg">
                  Say Hello ✎
                </Link>
              </motion.span>
            </motion.div>
          </div>
        </motion.section>

        {/* Doodle Illustrations */}
        <motion.section variants={itemVariants}>
          <motion.h2
            className="section-title"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4 }}
          >
            Doodle Corner
          </motion.h2>
          <DoodleIllustrations />
        </motion.section>

        {/* Featured Products */}
        {!loading && dbProducts.length > 0 && (
          <motion.section className="featured-section" variants={itemVariants}>
            <motion.h2
              className="section-title"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-80px" }}
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
              {dbProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* Categories Section — Sketch Style */}
        <motion.section className="categories-section" variants={itemVariants}>
          <motion.h2
            className="section-title"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4 }}
          >
            Shop by Category
          </motion.h2>
          <motion.div
            className="categories-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            {allCategories.map((cat) => (
              <motion.div
                key={cat.name}
                className="category-card"
                variants={itemVariants}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                whileTap={{ scale: 0.96 }}
                style={{ "--accent": cat.color } as React.CSSProperties}
                onClick={() => navigate(cat.path)}
              >
                <motion.span
                  className="category-emoji"
                  whileHover={{ scale: 1.15, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {cat.emoji}
                </motion.span>
                <h3>{cat.name}</h3>
                <span className="category-link">Explore →</span>
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
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4 }}
          >
            Why Choose Us
          </motion.h2>
          <motion.div
            className="features-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                className="feature-card"
                variants={itemVariants}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
                whileTap={{ scale: 0.97 }}
              >
                <motion.span
                  className="feature-icon"
                  whileHover={{ scale: 1.2, rotate: -10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {feature.icon}
                </motion.span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      </motion.div>
    </PageTransition>
  );
}
