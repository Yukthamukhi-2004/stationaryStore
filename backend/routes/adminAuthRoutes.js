const express = require("express");
const router = express.Router();

const {
  verifyAdmin,
  setAdminRole,
} = require("../controllers/adminAuthController");
const { requireAdmin } = require("../middleware/requireAdmin");

router.post("/verify", verifyAdmin);
router.post("/set-role", requireAdmin, setAdminRole);

module.exports = router;
