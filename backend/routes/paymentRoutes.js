const express = require("express");

const router = express.Router();

const {
  getPayments,
  createPayment,
  getPaymentById,
  updatePayment,
  deletePayment
} = require("../controllers/paymentController");

router.get("/", getPayments);

router.get("/:id", getPaymentById);

router.post("/", createPayment);

router.put("/:id", updatePayment);

router.delete("/:id", deletePayment);

module.exports = router;