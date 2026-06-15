import { motion, type Variants } from "framer-motion";
import PageTransition from "../components/PageTransition";

const staggerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const contactMethods = [
  {
    icon: "✉",
    title: "Email Us",
    detail: "hello@stationery.com",
    href: "mailto:hello@stationery.com",
  },
  {
    icon: "☎",
    title: "Call Us",
    detail: "+91 98765 43210",
    href: "tel:+919876543210",
  },
  {
    icon: "📍",
    title: "Visit Us",
    detail: "123 Sketch Street, Art District, Creative City",
    href: "#",
  },
  {
    icon: "📱",
    title: "Social",
    detail: "@stationery_store",
    href: "#",
  },
];

export default function ContactPage() {
  return (
    <PageTransition>
      <motion.div
        className="contact-page"
        initial="hidden"
        animate="visible"
        variants={staggerVariants}
      >
        <motion.div className="contact-card" variants={itemVariants}>
          <motion.h1 className="contact-title" variants={itemVariants}>
            Let's Be Pen Pals ✎
          </motion.h1>
          <motion.p className="contact-subtitle" variants={itemVariants}>
            Drop us a note! Whether it's a question, a doodle, or just to say hey
            — we'd love to hear from you.
          </motion.p>

          <motion.div className="contact-methods" variants={staggerVariants}>
            {contactMethods.map((method) => (
              <motion.a
                key={method.title}
                href={method.href}
                className="contact-method"
                variants={itemVariants}
                whileHover={{ x: 6, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="contact-method-icon">{method.icon}</div>
                <div className="contact-method-text">
                  <h4>{method.title}</h4>
                  <p>{method.detail}</p>
                </div>
              </motion.a>
            ))}
          </motion.div>

          <motion.div
            className="contact-method"
            variants={itemVariants}
            style={{
              background: "var(--soft-yellow-100)",
              border: "1px dashed var(--soft-yellow-300)",
            }}
          >
            <div
              className="contact-method-icon"
              style={{ background: "var(--soft-yellow-200)" }}
            >
              🕐
            </div>
            <div className="contact-method-text">
              <h4>Open Hours</h4>
              <p>Mon–Sat: 9:00 AM – 7:00 PM &nbsp;·&nbsp; Sun: Closed</p>
            </div>
          </motion.div>

          <motion.div
            style={{
              marginTop: "1.5rem",
              padding: "1rem",
              background: "var(--cream)",
              borderRadius: "var(--radius-md)",
              textAlign: "center",
              fontFamily: "var(--font-doodle)",
              fontSize: "0.9rem",
              color: "var(--pencil-400)",
              border: "1px dashed var(--pencil-200)",
            }}
            variants={itemVariants}
          >
            ✎ Handwritten with love — just for you.
          </motion.div>
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}
