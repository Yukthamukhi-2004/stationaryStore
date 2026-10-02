const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/requireAdmin");

const {
  getReorderSuggestions,
  bulkRestock,
} = require("../controllers/reorderController");

router.use(requireAdmin);

router.get("/suggestions", getReorderSuggestions);
router.post("/bulk-restock", bulkRestock);

module.exports = router;
