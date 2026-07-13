const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getRevenueAnalytics,
  getOrderAnalytics,
  getInventoryAnalytics
  
} = require("../controllers/dashboardController");

// Dashboard Statistics
router.get("/stats", getDashboardStats);

// Revenue Analytics
router.get("/revenue", getRevenueAnalytics);

// Order Analytics
router.get("/orders", getOrderAnalytics);

// Inventory Analytics
router.get("/inventory", getInventoryAnalytics);

module.exports = router;