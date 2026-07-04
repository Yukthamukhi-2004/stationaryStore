import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { api, type Category } from "../lib/api";
import DoodleIllustrations from "../components/DoodleIllustrations";
import PageTransition from "../components/PageTransition";
import BrandLogo from "../components/BrandLogo";

const features = [
  {
    icon: `${import.meta.env.BASE_URL}logo.png`,
    title: "Premium Quality",
    description:
      "Handpicked collection of the finest stationery, crafted with care for every creative soul.",
  },
  {
    icon: "✦",
    title: "Thoughtful Design",
    description:
      "Every piece is chosen with love and an eye for detail, blending tradition with modern aesthetics.",
  },
  {
    icon: "✧",
    title: "Free Shipping",
    description:
      "Free shipping on all orders over ₹500, delivered right to your doorstep with a smile.",
  },
];

const categoryRouteMap: Record<string, { path: string; emoji: string }> = {
  Notebooks: { path: "/shopping/notebooks", emoji: "📔" },
  Pens: { path: "/shopping/accessories", emoji: "🖊" },
  "Art Supplies": { path: "/shopping/art-materials", emoji: "🎨" },
  "Office Supplies": { path: "/shopping/accessories", emoji: "📎" },
  "School Essentials": { path: "/shopping/accessories", emoji: "🎒" },
};

const staticCategories = [{ name: "Books", emoji: "📚", path: "/shopping/books" }];

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
  const [dbCategories, setDbCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const categories = await api.getCategories();
        setDbCategories(categories);
      } catch {
        // Backend unavailable — home page shows static content only
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
        {/* ─── Full-Screen Hero Banner ─── */}
        <motion.section
          className="hero-section-fullscreen"
          variants={heroItemVariants}
        >
          {/* Decorative floating doodles */}
          <div className="hero-fullscreen-doodles" aria-hidden="true">
            {["✦", "✧", "♥", "☆", "✿", "○", "△", "♢"].map((char, i) => (
              <motion.span
                key={char}
                className="hero-fullscreen-doodle"
                style={{
                  top: `${8 + ((i * 11) % 85)}%`,
                  left: `${5 + ((i * 13) % 90)}%`,
                  fontSize: `${1 + (i % 4) * 0.4}rem`,
                }}
                animate={{
                  opacity: [0.06, 0.15, 0.06],
                  y: [0, -8, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3 + i * 0.5,
                  ease: "easeInOut",
                  delay: i * 0.3,
                }}
              >
                {char}
              </motion.span>
            ))}
            {/* Floating logo */}
            <motion.img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt=""
              className="hero-fullscreen-doodle"
              style={{
                position: "absolute",
                top: "15%",
                left: "12%",
                width: 15,
                height: 15,
                objectFit: "contain",
                opacity: 0.12,
              }}
              animate={{
                opacity: [0.06, 0.15, 0.06],
                y: [0, -8, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 3.5,
                ease: "easeInOut",
                delay: 0,
              }}
            />
          </div>

          {/* Color glow orbs */}
          <div className="hero-fullscreen-glow" aria-hidden="true">
            <div className="glow-orb glow-orb--coral" />
            <div className="glow-orb glow-orb--teal" />
            <div className="glow-orb glow-orb--amber" />
          </div>

          <div className="hero-fullscreen-content">
            {/* Mascot + Brand row */}
            <motion.div
              className="hero-fullscreen-brand-row"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            >
              <BrandLogo size={45} className="brand-logo" />
            </motion.div>

            {/* Tagline */}
            <motion.p
              className="hero-fullscreen-tagline"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
            >
              Your One-Stop Shop for Premium Stationery, Books &amp; Art
              Supplies
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="hero-fullscreen-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.4, ease: "easeOut" }}
            >
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
              >
                <button
                  className="btn btn-hero-primary"
                  onClick={() =>
                    document
                      .getElementById("shop-by-category")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Explore Categories
                </button>
              </motion.span>
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
              >
                <button
                  className="btn btn-hero-outline"
                  onClick={() => navigate("/shopping/contact")}
                >
                  Contact Us
                </button>
              </motion.span>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            className="hero-scroll-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            <motion.span
              animate={{ y: [0, 6, 0] }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "easeInOut",
              }}
            >
              ↓
            </motion.span>
            <span className="hero-scroll-text">Scroll to explore</span>
          </motion.div>
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

        {/* Categories Section — Sketch Style */}
        <motion.section
          id="shop-by-category"
          className="categories-section"
          variants={itemVariants}
        >
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
                  {feature.icon.startsWith("/") ? (
                    <img
                      src={feature.icon}
                      alt=""
                      style={{ width: 28, height: 28, objectFit: "contain" }}
                    />
                  ) : (
                    feature.icon
                  )}
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
