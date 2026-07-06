const express = require("express");

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
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
