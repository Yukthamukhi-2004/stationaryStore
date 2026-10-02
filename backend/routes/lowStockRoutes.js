const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/requireAdmin");

const {
  getLowStockProducts,
  restockProduct,
} = require("../controllers/lowStockController");

router.use(requireAdmin);

router.get("/", getLowStockProducts);
router.put("/:id/restock", restockProduct);

module.exports = router;
