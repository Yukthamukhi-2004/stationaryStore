const express = require("express");
const { requireAdmin } = require("../middleware/requireAdmin");

const router = express.Router();
router.use(requireAdmin);

const {
  getInventorySummary,
  getLowStockProducts,
  getReorderProducts,
} = require("../controllers/inventoryController");

router.get("/summary", getInventorySummary);
router.get("/low-stock", getLowStockProducts);
router.get("/reorder", getReorderProducts);

module.exports = router;
