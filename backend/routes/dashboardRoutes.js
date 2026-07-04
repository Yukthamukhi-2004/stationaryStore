const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getRevenueAnalytics,
  getOrderAnalytics,
  getInventoryAnalytics,
} = require("../controllers/dashboardController");

router.get("/stats", getDashboardStats);
router.get("/revenue-analytics", getRevenueAnalytics);
router.get("/order-analytics", getOrderAnalytics);
router.get("/inventory-analytics", getInventoryAnalytics);

module.exports = router;
