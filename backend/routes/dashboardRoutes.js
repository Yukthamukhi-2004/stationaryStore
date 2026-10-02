const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/requireAdmin");

const {
  getDashboardStats,
  getRevenueAnalytics,
  getOrderAnalytics,
  getInventoryAnalytics,
} = require("../controllers/dashboardController");

router.use(requireAdmin);

// Dashboard Statistics
router.get("/stats", getDashboardStats);

// Revenue Analytics
router.get("/revenue", getRevenueAnalytics);

// Order Analytics
router.get("/orders", getOrderAnalytics);

// Inventory Analytics
router.get("/inventory", getInventoryAnalytics);

module.exports = router;
