const express = require("express");
const {
  listFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure
} = require("../controllers/feeStructureController");
const { protect } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

router.route("/").get(protect, asyncHandler(listFeeStructures)).post(protect, asyncHandler(createFeeStructure));
router.route("/:id").put(protect, asyncHandler(updateFeeStructure)).delete(protect, asyncHandler(deleteFeeStructure));

module.exports = router;
