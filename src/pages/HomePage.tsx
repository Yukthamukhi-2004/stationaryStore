import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";

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

const categories = [
  { name: "Notebooks", emoji: "📔", color: "#8B7355" },
  { name: "Pens", emoji: "🖊️", color: "#6B8E6B" },
  { name: "Paper", emoji: "📜", color: "#C4A882" },
  { name: "Art Supplies", emoji: "🎨", color: "#C77D6E" },
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
          {categories.map((cat) => (
            <motion.div
              key={cat.name}
              className="category-card"
              variants={itemVariants}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              whileTap={{ scale: 0.97 }}
              style={{ "--accent": cat.color } as React.CSSProperties}
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
