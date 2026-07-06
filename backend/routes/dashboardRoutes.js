const express = require("express");

const router = express.Router();
console.log("Dashboard Routes Loaded");
const router = express.Router();

const {
  getDashboardStats,
  getRevenueAnalytics,
  getOrderAnalytics,
  getInventoryAnalytics
  
} = require("../controllers/dashboardController");

router.get("/stats", getDashboardStats);
router.get("/revenue", getRevenueAnalytics);
router.get("/orders", getOrderAnalytics);
router.get("/inventory", getInventoryAnalytics);
module.exports = router;
  getInventoryAnalytics,
} = require("../controllers/dashboardController");

router.get("/stats", getDashboardStats);
router.get("/revenue-analytics", getRevenueAnalytics);
router.get("/order-analytics", getOrderAnalytics);
router.get("/inventory-analytics", getInventoryAnalytics);

module.exports = router;
