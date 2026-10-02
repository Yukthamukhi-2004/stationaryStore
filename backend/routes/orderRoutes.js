const express = require("express");
const { requireAdmin, requireAuth } = require("../middleware/requireAdmin");

const router = express.Router();

const {
  getOrders,
  createOrder,
  getOrderById,
  updateOrder,
  getOrderItems,
} = require("../controllers/orderController");

router.get("/", requireAuth, getOrders);

router.get("/:id", requireAuth, getOrderById);

router.get("/:id/items", requireAuth, getOrderItems);

router.post("/", requireAuth, createOrder);

router.put("/:id", requireAdmin, updateOrder);

module.exports = router;
