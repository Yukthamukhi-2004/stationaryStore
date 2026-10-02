const express = require("express");
const { requireAdmin } = require("../middleware/requireAdmin");

const router = express.Router();

const {
  getProducts,
  searchProducts,
  getProductsByCategory,
  sortProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

router.get("/", getProducts);

router.get("/search", searchProducts);

router.get("/category/:categoryId", getProductsByCategory);

router.get("/sort/price", sortProducts);

router.get("/:id", getProductById);

router.post("/", requireAdmin, createProduct);

router.put("/:id", requireAdmin, updateProduct);

router.delete("/:id", requireAdmin, deleteProduct);

module.exports = router;
