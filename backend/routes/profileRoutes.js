const express = require("express");

const router = express.Router();

const {
  getProfile,
  updateProfile,
} = require("../controllers/profileController");

router.get("/:user_id", getProfile);
router.put("/:user_id", updateProfile);

module.exports = router;
