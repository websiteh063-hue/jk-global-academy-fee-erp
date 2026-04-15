const express = require("express");
const {
  listFeeRecords,
  getStudentFeeRecord,
  previewFee,
  collectFee,
  updateSiblingDiscount,
  downloadReceiptPdf
} = require("../controllers/feeController");
const { protect } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

router.get("/", protect, asyncHandler(listFeeRecords));
router.post("/preview/:studentId", protect, asyncHandler(previewFee));
router.post("/collect/:studentId", protect, asyncHandler(collectFee));
router.patch("/sibling-discount/:studentId", protect, asyncHandler(updateSiblingDiscount));
router.get("/receipt/:studentId/:receiptNumber", protect, asyncHandler(downloadReceiptPdf));
router.get("/:studentId", protect, asyncHandler(getStudentFeeRecord));

module.exports = router;
