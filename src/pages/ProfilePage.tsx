import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";

const userProfile = {
  firstName: "Alex",
  lastName: "Morgan",
  email: "alex.morgan@example.com",
  role: "customer" as const,
  memberSince: "January 2025",
  bio: "Design enthusiast and stationery collector. Always on the lookout for beautifully crafted paper goods.",
  stats: {
    orders: 12,
    reviews: 8,
    wishlist: 24,
  },
};

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const statVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function ProfilePage() {
  const initials = `${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}`;

  return (
    <motion.div
      className="profile-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Profile Header */}
      <motion.div className="profile-header" variants={itemVariants}>
        <motion.div
          className="profile-avatar"
          whileHover={{ scale: 1.05, boxShadow: "0 6px 24px rgba(93, 130, 93, 0.3)" }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          <div className="avatar-initials">{initials}</div>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          {userProfile.firstName} {userProfile.lastName}
        </motion.h1>
        <motion.p
          className="profile-email"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.3 }}
        >
          {userProfile.email}
        </motion.p>
        <motion.p
          className="profile-bio"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          {userProfile.bio}
        </motion.p>
        <motion.div
          className="profile-badge"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.3, ease: "easeOut" }}
        >
          <span className="badge">{userProfile.role}</span>
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="stats-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[
          { label: "Orders", value: userProfile.stats.orders },
          { label: "Reviews", value: userProfile.stats.reviews },
          { label: "Wishlist", value: userProfile.stats.wishlist },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="stat-card"
            variants={statVariants}
            whileHover={{ y: -3, boxShadow: "var(--shadow-md)" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.span
              className="stat-number"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
            >
              {stat.value}
            </motion.span>
            <span className="stat-label">{stat.label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Account Details */}
      <motion.div className="profile-details" variants={itemVariants}>
        <h2>Account Details</h2>
        <div className="details-grid">
          <motion.div
            className="detail-item"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <span className="detail-label">Name</span>
            <span className="detail-value">
              {userProfile.firstName} {userProfile.lastName}
            </span>
          </motion.div>
          <motion.div
            className="detail-item"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="detail-label">Email</span>
            <span className="detail-value">{userProfile.email}</span>
          </motion.div>
          <motion.div
            className="detail-item"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <span className="detail-label">Role</span>
            <span className="detail-value">
              <span className="badge">{userProfile.role}</span>
            </span>
          </motion.div>
          <motion.div
            className="detail-item"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="detail-label">Member Since</span>
            <span className="detail-value">{userProfile.memberSince}</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div className="profile-details" variants={itemVariants}>
        <h2>Recent Activity</h2>
        <div className="activity-list">
          {[
            { text: 'Added "Artisan Notebook Set" to wishlist', time: "2 days ago" },
            { text: 'Reviewed "Premium Fountain Pen"', time: "1 week ago" },
            { text: "Order #1042 delivered successfully", time: "2 weeks ago" },
          ].map((activity, i) => (
            <motion.div
              key={activity.text}
              className="activity-item"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.3 }}
            >
              <motion.span
                className="activity-dot"
                whileHover={{ scale: 1.5, backgroundColor: "var(--sage-500)" }}
              />
              <div className="activity-content">
                <p className="activity-text">{activity.text}</p>
                <span className="activity-time">{activity.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        whileHover={{ x: 3 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <Link to="/" className="btn btn-link back-link">
          &larr; Back to Home
        </Link>
      </motion.div>
    </motion.div>
  );
}
