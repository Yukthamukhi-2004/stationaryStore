const express = require("express");

const router = express.Router();

const {
  getProfile,
  updateProfile,
  createProfile,
} = require("../controllers/profileController");

router.get("/:user_id", getProfile);
router.put("/:user_id", updateProfile);
router.post("/", createProfile);

module.exports = router;
