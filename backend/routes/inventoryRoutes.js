const express = require("express");

const router = express.Router();

const {
  getInventorySummary,
  getLowStockProducts,
  getReorderProducts
} = require("../controllers/inventoryController");

router.get("/summary", getInventorySummary);
router.get("/low-stock", getLowStockProducts);
router.get("/reorder", getReorderProducts);

module.exports = router;