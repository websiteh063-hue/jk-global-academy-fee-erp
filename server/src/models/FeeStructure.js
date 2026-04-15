const mongoose = require("mongoose");

const feeStructureSchema = new mongoose.Schema(
  {
    class: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    frequency: {
      type: String,
      enum: ["Monthly", "Quarterly", "Yearly"],
      default: "Monthly"
    },
    tuitionFee: {
      type: Number,
      required: true,
      min: 0
    },
    transportFee: {
      type: Number,
      default: 0,
      min: 0
    },
    examFee: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeeStructure", feeStructureSchema);
