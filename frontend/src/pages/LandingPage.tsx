import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, type Variants } from "framer-motion";

/* ── Floating jewel icons ── */
const JEWELS = ["✦", "◆", "♦", "✧", "⬟", "◇", "✨", "★"];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  return (
    <div className="landing-page">
      {/* ─── Decorative floating jewels ─── */}
      <div className="landing-jewels" aria-hidden="true">
        {JEWELS.map((jewel, i) => (
          <motion.span
            key={`${jewel}-${i}`}
            className="landing-jewel"
            style={{
              top: `${5 + ((i * 13) % 90)}%`,
              left: `${3 + ((i * 17) % 94)}%`,
              fontSize: `${1.2 + (i % 5) * 0.5}rem`,
            }}
            animate={{
              opacity: [0.12, 0.3, 0.12],
              y: [0, -12, 0],
              rotate: [0, 15, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 4 + i * 0.6,
              ease: "easeInOut",
              delay: i * 0.4,
            }}
          >
            {jewel}
          </motion.span>
        ))}
      </div>

      {/* ─── Gradient glow orbs ─── */}
      <div className="landing-glow" aria-hidden="true">
        <div className="landing-glow-orb landing-glow-orb--amethyst" />
        <div className="landing-glow-orb landing-glow-orb--gold" />
        <div className="landing-glow-orb landing-glow-orb--ruby" />
      </div>

      {/* ─── Subtle grid pattern overlay ─── */}
      <div className="landing-grid-overlay" aria-hidden="true" />

      {/* ─── Top bar ─── */}
      <nav className="landing-topbar">
        <div className="landing-topbar-links">
          <button
            className="landing-topbar-btn"
            onClick={() => navigate("/auth")}
          >
            Sign In
          </button>
          <button
            className="landing-topbar-btn landing-topbar-btn--primary"
            onClick={() => navigate("/home")}
          >
            Enter Store
          </button>
        </div>
      </nav>

      {/* ─── Main content ─── */}
      <motion.div
        className="landing-main"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Mascot */}
        <motion.div
          className="landing-mascot-wrap"
          variants={itemVariants}
          whileHover={{ scale: 1.06 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <div className="landing-mascot-circle">
            {imgError ? (
              <img
                src="/logo.png"
                alt="Sarada Stationeries"
                className="landing-mascot-fallback"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  borderRadius: "50%",
                }}
              />
            ) : (
              <img
                src="https://giri.in/cdn/shop/products/525098_PL_Saraswati_5Inch_0_550_Kgs_1_600x600.jpg?v=1709019452"
                alt="Sarada Stationeries"
                className="landing-mascot-img"
                onError={() => setImgError(true)}
              />
            )}
          </div>
        </motion.div>

        {/* Brand text */}
        <motion.div className="landing-brand" variants={itemVariants}>
          <span className="landing-brand-label">Sarada</span>
          <motion.h1
            className="landing-brand-title"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            Stationeries
          </motion.h1>
          <span className="landing-brand-sub">Arts &amp; Crafts</span>
        </motion.div>

        {/* Tagline */}
        <motion.p className="landing-tagline" variants={itemVariants}>
          Your Premium Destination for{" "}
          <span className="landing-highlight">Premium Stationery</span>,
          <br />
          <span className="landing-highlight">Books</span> &amp;{" "}
          <span className="landing-highlight">Art Supplies</span>
        </motion.p>

        {/* Feature pills */}
        <motion.div className="landing-pills" variants={itemVariants}>
          {[
            "✧ Quality Craftsmanship",
            "✦ Free Shipping ₹500+",
            "◆ Easy Returns",
          ].map((pill) => (
            <span key={pill} className="landing-pill">
              {pill}
            </span>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div className="landing-actions" variants={itemVariants}>
          <motion.button
            className="landing-cta"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/home")}
          >
            <span>Enter the Store</span>
            <span className="landing-cta-arrow">→</span>
          </motion.button>
          <motion.button
            className="landing-cta-secondary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/contact")}
          >
            Get in Touch
          </motion.button>
        </motion.div>
      </motion.div>

      {/* ─── Footer ─── */}
      <footer className="landing-footer">
        <p>
          &copy; {new Date().getFullYear()} Sarada Stationeries Arts &amp;
          Crafts. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
