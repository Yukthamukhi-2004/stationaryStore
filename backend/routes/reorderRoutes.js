const express = require("express");
const router = express.Router();

const {
  getReorderSuggestions,
  bulkRestock,
} = require("../controllers/reorderController");

router.get("/suggestions", getReorderSuggestions);
router.post("/bulk-restock", bulkRestock);

module.exports = router;
