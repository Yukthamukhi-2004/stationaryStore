const express = require("express");
const router = express.Router();

const { verifyAdmin, setAdminRole } = require("../controllers/adminAuthController");

router.post("/verify", verifyAdmin);
router.post("/set-role", setAdminRole);

module.exports = router;
