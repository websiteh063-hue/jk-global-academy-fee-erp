const express = require("express");
const {
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent
} = require("../controllers/studentController");
const { protect } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

router.route("/").get(protect, asyncHandler(listStudents)).post(protect, asyncHandler(createStudent));
router.route("/:id").put(protect, asyncHandler(updateStudent)).delete(protect, asyncHandler(deleteStudent));

module.exports = router;
