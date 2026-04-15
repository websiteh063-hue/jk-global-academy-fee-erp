const mongoose = require("mongoose");

const paymentHistorySchema = new mongoose.Schema(
  {
    month: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    mode: {
      type: String,
      enum: ["Cash", "UPI", "Bank Transfer"],
      required: true
    },
    receiptNumber: {
      type: String,
      required: true
    },
    remarks: {
      type: String,
      default: ""
    },
    transactionId: {
      type: String,
      default: ""
    },
    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
      default: "fixed"
    },
    discountValue: {
      type: Number,
      default: 0
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    remainingBalance: {
      type: Number,
      default: 0
    },
    siblingDiscountApplied: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["Paid", "Partial", "Unpaid"],
      default: "Unpaid"
    }
  },
  { _id: false }
);

const monthlyRecordSchema = new mongoose.Schema(
  {
    month: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    totalFee: {
      type: Number,
      required: true,
      min: 0
    },
    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
      default: "fixed"
    },
    discountValue: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    pendingAmount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["Paid", "Partial", "Unpaid"],
      default: "Unpaid"
    },
    paymentDate: {
      type: Date,
      default: null
    },
    applySiblingDiscount: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const feeRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      unique: true
    },
    feeStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeStructure",
      required: true
    },
    totalFee: {
      type: Number,
      required: true,
      min: 0
    },
    baseFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
      default: "fixed"
    },
    discountValue: {
      type: Number,
      default: 0
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    finalPayableAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    pendingAmount: {
      type: Number,
      required: true,
      min: 0
    },
    dueDate: {
      type: Date,
      required: true
    },
    monthlyRecords: {
      type: [monthlyRecordSchema],
      default: []
    },
    paymentHistory: [paymentHistorySchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeeRecord", feeRecordSchema);
