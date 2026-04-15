const express = require("express");
const { getDashboardSummary } = require("../controllers/dashboardController");
const { protect } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

router.get("/", protect, asyncHandler(getDashboardSummary));

module.exports = router;
