const express = require("express");

const router = express.Router();
console.log("Dashboard Routes Loaded");

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