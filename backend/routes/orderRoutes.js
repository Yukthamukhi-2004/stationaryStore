const express = require("express");

const router = express.Router();

const {
  getOrders,
  createOrder,
  getOrderById,
  updateOrder
} = require("../controllers/orderController");

router.get("/", getOrders);

router.get("/:id", getOrderById);

router.post("/", createOrder);

router.put("/:id", updateOrder);

module.exports = router;