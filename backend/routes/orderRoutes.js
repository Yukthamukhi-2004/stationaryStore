const express = require("express");

const router = express.Router();

const {
  getOrders,
  createOrder,
  getOrderById,
  updateOrder,
  getOrderItems
} = require("../controllers/orderController");

router.get("/", getOrders);

router.get("/:id", getOrderById);
router.get("/:id/items", getOrderItems);

router.post("/", createOrder);

router.put("/:id", updateOrder);

module.exports = router;