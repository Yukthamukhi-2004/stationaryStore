const express = require("express");

const router = express.Router();

const {
  getCartItems,
  createCartItem,
  getCartItemById
} = require("../controllers/cartItemController");

router.get("/", getCartItems);

router.get("/:id", getCartItemById);

router.post("/", createCartItem);

module.exports = router;