const express = require("express");
const { login, getProfile } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

router.post("/login", asyncHandler(login));
router.get("/me", protect, asyncHandler(getProfile));

module.exports = router;
