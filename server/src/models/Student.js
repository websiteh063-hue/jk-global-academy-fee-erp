const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    class: {
      type: String,
      required: true,
      trim: true
    },
    section: {
      type: String,
      required: true,
      trim: true
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true
    },
    fatherName: {
      type: String,
      required: true,
      trim: true
    },
    fatherAadhaarNumber: {
      type: String,
      required: true,
      trim: true
    },
    fatherContactNumber: {
      type: String,
      required: true,
      trim: true
    },
    motherName: {
      type: String,
      required: true,
      trim: true
    },
    motherAadhaarNumber: {
      type: String,
      required: true,
      trim: true
    },
    motherContactNumber: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    usesTransport: {
      type: Boolean,
      default: false
    },
    siblingGroupId: {
      type: String,
      default: null
    },
    isSibling: {
      type: Boolean,
      default: false
    },
    siblingLabel: {
      type: String,
      default: ""
    },
    guardianAadhaarNumbers: {
      type: [String],
      default: []
    },
    siblingStudentIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student"
        }
      ],
      default: []
    },
    notes: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    },
    createdByRollSequence: {
      type: Number,
      default: 0
    },
    primaryParentName: {
      type: String,
      default: ""
    },
    primaryContactNumber: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

studentSchema.index({ class: 1, section: 1, rollNumber: 1 }, { unique: true });
studentSchema.index({ fatherAadhaarNumber: 1 });
studentSchema.index({ motherAadhaarNumber: 1 });

module.exports = mongoose.model("Student", studentSchema);
