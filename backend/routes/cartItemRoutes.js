const express = require("express");

const router = express.Router();

const {
  getCartItems,
  createCartItem,
  getCartItemById,
  getCartItemsByCartId,
  updateCartItem,
  deleteCartItem
} = require("../controllers/cartItemController");

router.get("/", getCartItems);
router.get("/cart/:cart_id", getCartItemsByCartId);
router.get("/:id", getCartItemById);

router.post("/", createCartItem);

router.put("/:id", updateCartItem);
router.delete("/:id", deleteCartItem);

module.exports = router;