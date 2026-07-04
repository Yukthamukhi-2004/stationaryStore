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
    detail: "hello@saradastationaries.com",
    href: "mailto:hello@saradastationaries.com",
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
    detail: "123 Art Street, Creative District, Arts City",
    href: "#",
  },
  {
    icon: "📱",
    title: "Social",
    detail: "@sarada_arts_crafts",
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
            Let's Be Pen Pals <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" style={{ width: 24, height: 24, objectFit: "contain", verticalAlign: "middle", display: "inline" }} />
          </motion.h1>
          <motion.p className="contact-subtitle" variants={itemVariants}>
            Drop us a note! Whether it's a question, a doodle, or just to say hey
            — we'd love to hear from you at Sarada Stationeries Arts &amp; Crafts.
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
              background: "var(--gray-50)",
              border: "1px dashed var(--gray-250)",
            }}
          >
            <div
              className="contact-method-icon"
              style={{ background: "var(--gray-100)" }}
            >
              🕐
            </div>
            <div className="contact-method-text">
              <h4>Open Hours</h4>
              <p>Mon–Sat: 9:00 AM – 7:00 PM &nbsp;·&nbsp; Sun: Closed</p>
            </div>
          </motion.div>

          <motion.div
            className="contact-handwritten-note"
            variants={itemVariants}
          >
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" style={{ width: 20, height: 20, objectFit: "contain", verticalAlign: "middle", display: "inline", marginRight: 4 }} /> Handwritten with love — just for you.
          </motion.div>
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}
