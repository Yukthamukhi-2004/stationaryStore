const express = require("express");
const router = express.Router();

const {
  getLowStockProducts,
  restockProduct,
} = require("../controllers/lowStockController");

router.get("/", getLowStockProducts);
router.put("/:id/restock", restockProduct);

module.exports = router;
