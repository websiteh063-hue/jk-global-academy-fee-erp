const Student = require("../models/Student");
const FeeStructure = require("../models/FeeStructure");
const FeeRecord = require("../models/FeeRecord");
const { calculateFeeSummary, getNextDueDate, buildReceiptNumber } = require("../utils/fee");
const { createReceiptPdf } = require("../utils/receiptPdf");

const MONTH_SEQUENCE = [
  { month: "April", yearOffset: 0 },
  { month: "May", yearOffset: 0 },
  { month: "June", yearOffset: 0 },
  { month: "July", yearOffset: 0 },
  { month: "August", yearOffset: 0 },
  { month: "September", yearOffset: 0 },
  { month: "October", yearOffset: 0 },
  { month: "November", yearOffset: 0 },
  { month: "December", yearOffset: 0 },
  { month: "January", yearOffset: 1 },
  { month: "February", yearOffset: 1 },
  { month: "March", yearOffset: 1 }
];

const getAcademicStartYear = () => {
  const current = new Date();
  const monthIndex = current.getMonth();
  return monthIndex >= 3 ? current.getFullYear() : current.getFullYear() - 1;
};

const calculateStatus = ({ pendingAmount, paidAmount }) => {
  if (pendingAmount <= 0) {
    return "Paid";
  }
  if (paidAmount > 0) {
    return "Partial";
  }
  return "Unpaid";
};

const buildMonthlyFeeBreakdown = ({ structure, includeTransport }) => ({
  tuitionFee: Number(structure?.tuitionFee || 0),
  transportFee: includeTransport ? Number(structure?.transportFee || 0) : 0,
  examFee: Number(structure?.examFee || 0)
});

const buildMonthlyRecords = ({
  feeBreakdown,
  existingMonthlyRecords = [],
  defaultDiscountType = "fixed",
  defaultDiscountValue = 0,
  siblingDiscountEnabled = false
}) => {
  const academicStartYear = getAcademicStartYear();

  return MONTH_SEQUENCE.map(({ month, yearOffset }) => {
    const year = academicStartYear + yearOffset;
    const existingRecord = existingMonthlyRecords.find((item) => item.month === month && Number(item.year) === year);
    const discountType = existingRecord?.discountType || defaultDiscountType;
    const discountValue = Number(existingRecord?.discountValue ?? defaultDiscountValue ?? 0);
    const summary = calculateFeeSummary({
      structure: feeBreakdown,
      discountType,
      discountValue,
      paidAmount: existingRecord?.paidAmount || 0,
      includeTransport: true
    });

    return {
      month,
      year,
      totalFee: summary.totalFee,
      discountType,
      discountValue,
      discount: summary.discountAmount,
      paidAmount: Number(existingRecord?.paidAmount || 0),
      pendingAmount: summary.pendingAmount,
      status: calculateStatus({
        pendingAmount: summary.pendingAmount,
        paidAmount: existingRecord?.paidAmount || 0
      }),
      paymentDate: existingRecord?.paymentDate || null,
      applySiblingDiscount: Boolean(existingRecord?.applySiblingDiscount ?? siblingDiscountEnabled)
    };
  });
};

const enrichStudentSiblings = async (student) => {
  if (!student?.siblingStudentIds?.length) {
    return [];
  }

  const siblings = await Student.find({ _id: { $in: student.siblingStudentIds } }).select("name class section rollNumber").lean();
  return siblings;
};

const buildRecordSummary = (feeRecord) => {
  const paidAmount = feeRecord.monthlyRecords.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0);
  const pendingAmount = feeRecord.monthlyRecords.reduce((sum, item) => sum + Number(item.pendingAmount || 0), 0);
  const totalFee = feeRecord.monthlyRecords.reduce((sum, item) => sum + Number(item.totalFee || 0), 0);
  const discountAmount = feeRecord.monthlyRecords.reduce((sum, item) => sum + Number(item.discount || 0), 0);

  return {
    totalFee,
    baseFee: totalFee,
    paidAmount,
    pendingAmount,
    discountAmount,
    finalPayableAmount: Math.max(totalFee - discountAmount, 0)
  };
};

const ensureFeeRecord = async (student) => {
  let feeRecord = await FeeRecord.findOne({ studentId: student._id }).populate("feeStructureId");
  const structure = await FeeStructure.findOne({ class: student.class });

  if (!structure) {
    return null;
  }

  const feeBreakdown = buildMonthlyFeeBreakdown({
    structure,
    includeTransport: student.usesTransport
  });
  const baseSummary = calculateFeeSummary({
    structure: feeBreakdown,
    includeTransport: true
  });
  const siblingDiscountEnabled = Boolean(student.isSibling);
  const monthlyRecords = buildMonthlyRecords({
    feeBreakdown,
    existingMonthlyRecords: feeRecord?.monthlyRecords || [],
    defaultDiscountType: feeRecord?.discountType,
    defaultDiscountValue: feeRecord?.discountValue,
    siblingDiscountEnabled
  });
  const summary = buildRecordSummary({ monthlyRecords });

  if (!feeRecord) {
    feeRecord = await FeeRecord.create({
      studentId: student._id,
      feeStructureId: structure._id,
      totalFee: summary.totalFee,
      baseFee: summary.baseFee,
      discountAmount: summary.discountAmount,
      finalPayableAmount: summary.finalPayableAmount,
      paidAmount: summary.paidAmount,
      pendingAmount: summary.pendingAmount,
      dueDate: getNextDueDate(structure.frequency),
      monthlyRecords
    });
    return FeeRecord.findById(feeRecord._id).populate("feeStructureId");
  }

  feeRecord.feeStructureId = structure._id;
  feeRecord.monthlyRecords = monthlyRecords;
  feeRecord.totalFee = summary.totalFee;
  feeRecord.baseFee = summary.baseFee;
  feeRecord.discountAmount = summary.discountAmount;
  feeRecord.finalPayableAmount = summary.finalPayableAmount;
  feeRecord.paidAmount = summary.paidAmount;
  feeRecord.pendingAmount = summary.pendingAmount;
  if (!feeRecord.dueDate) {
    feeRecord.dueDate = getNextDueDate(structure.frequency);
  }
  await feeRecord.save();

  return FeeRecord.findById(feeRecord._id).populate("feeStructureId");
};

const listFeeRecords = async (req, res) => {
  const { search = "" } = req.query;
  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { rollNumber: { $regex: search, $options: "i" } },
          { fatherName: { $regex: search, $options: "i" } }
        ]
      }
    : {};

  const students = await Student.find(query).sort({ class: 1, name: 1 }).lean();
  const records = await Promise.all(
    students.map(async (student) => {
      const feeRecord = await ensureFeeRecord(student);
      const siblings = await enrichStudentSiblings(student);
      return {
        student: {
          ...student,
          siblings
        },
        feeRecord
      };
    })
  );

  res.json({ success: true, data: records.filter((item) => item.feeRecord) });
};

const getStudentFeeRecord = async (req, res) => {
  const student = await Student.findById(req.params.studentId).lean();
  if (!student) {
    return res.status(404).json({ success: false, message: "Student not found" });
  }

  const feeRecord = await ensureFeeRecord(student);
  const siblings = await enrichStudentSiblings(student);
  if (!feeRecord) {
    return res.status(404).json({ success: false, message: "Fee structure not found for this class" });
  }

  res.json({
    success: true,
    data: {
      student: {
        ...student,
        siblings
      },
      feeRecord
    }
  });
};

const previewFee = async (req, res) => {
  const {
    month,
    year,
    amount = 0,
    mode = "Cash",
    remarks = "",
    transactionId = "",
    discountType,
    discountValue = 0,
    applySiblingDiscount = false
  } = req.body;
  const student = await Student.findById(req.params.studentId).lean();

  if (!student) {
    return res.status(404).json({ success: false, message: "Student not found" });
  }

  const feeRecord = await ensureFeeRecord(student);
  if (!feeRecord) {
    return res.status(400).json({ success: false, message: "No fee structure assigned to student's class" });
  }

  const targetRecord = feeRecord.monthlyRecords.find(
    (item) => item.month === month && Number(item.year) === Number(year)
  );

  if (!targetRecord) {
    return res.status(404).json({ success: false, message: "Monthly fee record not found" });
  }

  const effectiveDiscountValue = Number(discountValue || 0);
  const summary = calculateFeeSummary({
    structure: {
      tuitionFee: targetRecord.totalFee,
      transportFee: 0,
      examFee: 0
    },
    discountType,
    discountValue: effectiveDiscountValue,
    paidAmount: targetRecord.paidAmount,
    includeTransport: true
  });
  const requestedAmount = Number(amount || 0);
  const remainingBalance = Math.max(summary.pendingAmount - requestedAmount, 0);
  const detectedStatus = calculateStatus({
    pendingAmount: remainingBalance,
    paidAmount: targetRecord.paidAmount + requestedAmount
  });

  res.json({
    success: true,
    data: {
      student: {
        ...student,
        siblings: await enrichStudentSiblings(student)
      },
      monthRecord: {
        ...targetRecord,
        discountType,
        discountValue: effectiveDiscountValue,
        discount: summary.discountAmount,
        pendingAmount: summary.pendingAmount,
        status: detectedStatus,
        applySiblingDiscount
      },
      paymentPreview: {
        amount: requestedAmount,
        mode,
        remarks,
        transactionId,
        remainingBalance,
        status: detectedStatus
      }
    }
  });
};

const applyMonthlyPayment = ({
  monthlyRecord,
  amount,
  discountType,
  discountValue,
  applySiblingDiscount
}) => {
  const summary = calculateFeeSummary({
    structure: {
      tuitionFee: monthlyRecord.totalFee,
      transportFee: 0,
      examFee: 0
    },
    discountType,
    discountValue,
    paidAmount: monthlyRecord.paidAmount,
    includeTransport: true
  });

  const remainingBalance = Math.max(summary.pendingAmount - amount, 0);
  monthlyRecord.discountType = discountType;
  monthlyRecord.discountValue = Number(discountValue || 0);
  monthlyRecord.discount = summary.discountAmount;
  monthlyRecord.paidAmount += amount;
  monthlyRecord.pendingAmount = remainingBalance;
  monthlyRecord.status = calculateStatus({
    pendingAmount: remainingBalance,
    paidAmount: monthlyRecord.paidAmount
  });
  monthlyRecord.paymentDate = new Date();
  monthlyRecord.applySiblingDiscount = Boolean(applySiblingDiscount);

  return {
    discountAmount: summary.discountAmount,
    remainingBalance
  };
};

const recalculateLedgerTotals = (feeRecord) => {
  const summary = buildRecordSummary(feeRecord);
  feeRecord.totalFee = summary.totalFee;
  feeRecord.baseFee = summary.baseFee;
  feeRecord.discountAmount = summary.discountAmount;
  feeRecord.finalPayableAmount = summary.finalPayableAmount;
  feeRecord.paidAmount = summary.paidAmount;
  feeRecord.pendingAmount = summary.pendingAmount;
};

const collectFee = async (req, res) => {
  const {
    month,
    year,
    amount,
    mode,
    remarks = "",
    transactionId = "",
    discountType = "fixed",
    discountValue = 0,
    applySiblingDiscount = false
  } = req.body;
  const numericAmount = Number(amount);
  const numericDiscountValue = Number(discountValue || 0);
  const normalizedTransactionId = String(transactionId || "").trim();

  if (!numericAmount || numericAmount <= 0) {
    return res.status(400).json({ success: false, message: "Enter a valid payment amount" });
  }

  if (!["Cash", "UPI", "Bank Transfer"].includes(mode)) {
    return res.status(400).json({ success: false, message: "Select a valid payment mode" });
  }

  if (mode !== "Cash" && !normalizedTransactionId) {
    return res.status(400).json({ success: false, message: "Transaction ID is required for UPI or online payments" });
  }

  const student = await Student.findById(req.params.studentId);
  if (!student) {
    return res.status(404).json({ success: false, message: "Student not found" });
  }

  const feeRecord = await ensureFeeRecord(student.toObject());
  if (!feeRecord) {
    return res.status(400).json({ success: false, message: "No fee structure assigned to student's class" });
  }

  const targetRecord = feeRecord.monthlyRecords.find(
    (item) => item.month === month && Number(item.year) === Number(year)
  );

  if (!targetRecord) {
    return res.status(404).json({ success: false, message: "Monthly fee record not found" });
  }

  const previewSummary = calculateFeeSummary({
    structure: {
      tuitionFee: targetRecord.totalFee,
      transportFee: 0,
      examFee: 0
    },
    discountType,
    discountValue: numericDiscountValue,
    paidAmount: targetRecord.paidAmount,
    includeTransport: true
  });

  if (numericAmount > previewSummary.pendingAmount) {
    return res.status(400).json({ success: false, message: "Payment exceeds pending amount" });
  }

  const result = applyMonthlyPayment({
    monthlyRecord: targetRecord,
    amount: numericAmount,
    discountType,
    discountValue: numericDiscountValue,
    applySiblingDiscount
  });

  if (applySiblingDiscount && student.siblingStudentIds?.length) {
    const siblingRecords = await FeeRecord.find({ studentId: { $in: student.siblingStudentIds } });
    await Promise.all(
      siblingRecords.map(async (entry) => {
        const siblingMonthRecord = entry.monthlyRecords.find(
          (item) => item.month === month && Number(item.year) === Number(year)
        );
        if (!siblingMonthRecord) {
          return;
        }
        applyMonthlyPayment({
          monthlyRecord: siblingMonthRecord,
          amount: 0,
          discountType,
          discountValue: numericDiscountValue,
          applySiblingDiscount: true
        });
        recalculateLedgerTotals(entry);
        await entry.save();
      })
    );
  }

  const payment = {
    month,
    year: Number(year),
    date: new Date(),
    amount: numericAmount,
    mode,
    transactionId: normalizedTransactionId,
    receiptNumber: buildReceiptNumber(),
    remarks,
    discountType,
    discountValue: numericDiscountValue,
    discountAmount: result.discountAmount,
    remainingBalance: result.remainingBalance,
    siblingDiscountApplied: Boolean(applySiblingDiscount),
    status: targetRecord.status
  };

  feeRecord.paymentHistory.push(payment);
  recalculateLedgerTotals(feeRecord);

  if (feeRecord.pendingAmount === 0) {
    feeRecord.dueDate = getNextDueDate(feeRecord.feeStructureId.frequency);
  }

  await feeRecord.save();

  res.json({
    success: true,
    message: "Fee collected successfully",
    data: {
      payment,
      student,
      feeRecord
    }
  });
};

const updateSiblingDiscount = async (req, res) => {
  const { month, year, discountType = "fixed", discountValue = 0, enabled = false } = req.body;
  const student = await Student.findById(req.params.studentId);

  if (!student) {
    return res.status(404).json({ success: false, message: "Student not found" });
  }

  const targetIds = enabled && student.siblingStudentIds?.length ? [student._id, ...student.siblingStudentIds] : [student._id];
  const records = await FeeRecord.find({ studentId: { $in: targetIds } });

  await Promise.all(
    records.map(async (entry) => {
      const monthRecord = entry.monthlyRecords.find(
        (item) => item.month === month && Number(item.year) === Number(year)
      );
      if (!monthRecord) {
        return;
      }
      monthRecord.discountType = discountType;
      monthRecord.discountValue = Number(discountValue || 0);
      monthRecord.applySiblingDiscount = Boolean(enabled);
      applyMonthlyPayment({
        monthlyRecord: monthRecord,
        amount: 0,
        discountType,
        discountValue: Number(discountValue || 0),
        applySiblingDiscount: Boolean(enabled)
      });
      recalculateLedgerTotals(entry);
      await entry.save();
    })
  );

  res.json({ success: true, message: "Sibling discount updated successfully" });
};

const downloadReceiptPdf = async (req, res) => {
  const { studentId, receiptNumber } = req.params;
  const student = await Student.findById(studentId).lean();
  const feeRecord = await FeeRecord.findOne({ studentId }).lean();

  if (!student || !feeRecord) {
    return res.status(404).json({ success: false, message: "Receipt not found" });
  }

  const payment = feeRecord.paymentHistory.find((item) => item.receiptNumber === receiptNumber);
  if (!payment) {
    return res.status(404).json({ success: false, message: "Receipt not found" });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename=${receiptNumber}.pdf`);

  const doc = createReceiptPdf({ student, feeRecord, payment, schoolName: "JK Global Academy" });
  doc.pipe(res);
};

module.exports = {
  listFeeRecords,
  getStudentFeeRecord,
  previewFee,
  collectFee,
  updateSiblingDiscount,
  downloadReceiptPdf
};
