const express = require("express");

const router = express.Router();

const {
  getCarts,
  createCart,
  getCartById,
  getCartByUserId
} = require("../controllers/cartController");

router.get("/", getCarts);
router.get("/user/:user_id", getCartByUserId);
router.get("/:id", getCartById);

router.post("/", createCart);

module.exports = router;