const express = require("express");

const router = express.Router();

const {
  getCarts,
  createCart,
  getCartById
} = require("../controllers/cartController");

router.get("/", getCarts);

router.get("/:id", getCartById);

router.post("/", createCart);

module.exports = router;