const express = require("express");

const router = express.Router();
console.log("Dashboard Routes Loaded");

const {
  getDashboardStats,
  getRevenueAnalytics,
  getOrderAnalytics
  
} = require("../controllers/dashboardController");

router.get("/stats", getDashboardStats);
router.get("/revenue", getRevenueAnalytics);
console.log("Orders Route Registered");
router.get("/orders", getOrderAnalytics);
module.exports = router;