const express = require("express");

const router = express.Router();

const {
  getInventorySummary
} = require("../controllers/inventoryController");

router.get("/summary", getInventorySummary);

module.exports = router;