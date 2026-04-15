const express = require("express");
const {
  getClassWiseReport,
  getDateWiseReport,
  getPendingReport
} = require("../controllers/reportController");
const { protect } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

router.get("/class-wise", protect, asyncHandler(getClassWiseReport));
router.get("/date-wise", protect, asyncHandler(getDateWiseReport));
router.get("/pending", protect, asyncHandler(getPendingReport));

module.exports = router;
