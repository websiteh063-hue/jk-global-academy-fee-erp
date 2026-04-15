const FeeStructure = require("../models/FeeStructure");
const FeeRecord = require("../models/FeeRecord");
const Student = require("../models/Student");
const { calculateFeeSummary, getNextDueDate } = require("../utils/fee");

const listFeeStructures = async (_req, res) => {
  const structures = await FeeStructure.find().sort({ class: 1 }).lean();
  res.json({ success: true, data: structures });
};

const createFeeStructure = async (req, res) => {
  const { class: className, frequency, tuitionFee, transportFee, examFee } = req.body;

  if (!className || tuitionFee === undefined) {
    return res.status(400).json({ success: false, message: "Class and tuition fee are required" });
  }

  const structure = await FeeStructure.create({
    class: className,
    frequency,
    tuitionFee,
    transportFee,
    examFee
  });

  const students = await Student.find({ class: className }).lean();

  await Promise.all(
    students.map(async (student) => {
      const existingRecord = await FeeRecord.findOne({ studentId: student._id });
      const summary = calculateFeeSummary({
        structure,
        discountType: existingRecord?.discountType,
        discountValue: existingRecord?.discountValue,
        paidAmount: existingRecord?.paidAmount,
        includeTransport: student.usesTransport
      });

      if (!existingRecord) {
        return FeeRecord.create({
          studentId: student._id,
          feeStructureId: structure._id,
          totalFee: summary.totalFee,
          baseFee: summary.baseFee,
          discountAmount: summary.discountAmount,
          finalPayableAmount: summary.finalPayableAmount,
          paidAmount: 0,
          pendingAmount: summary.pendingAmount,
          dueDate: getNextDueDate(structure.frequency)
        });
      }

      existingRecord.feeStructureId = structure._id;
      existingRecord.baseFee = summary.baseFee;
      existingRecord.totalFee = summary.totalFee;
      existingRecord.discountAmount = summary.discountAmount;
      existingRecord.finalPayableAmount = summary.finalPayableAmount;
      existingRecord.pendingAmount = summary.pendingAmount;
      existingRecord.dueDate = getNextDueDate(structure.frequency);
      return existingRecord.save();
    })
  );

  res.status(201).json({ success: true, message: "Fee structure created successfully", data: structure });
};

const updateFeeStructure = async (req, res) => {
  const { id } = req.params;
  const structure = await FeeStructure.findById(id);

  if (!structure) {
    return res.status(404).json({ success: false, message: "Fee structure not found" });
  }

  Object.assign(structure, req.body);
  await structure.save();

  const students = await Student.find({ class: structure.class }).lean();

  await Promise.all(
    students.map(async (student) => {
      const feeRecord = await FeeRecord.findOne({ studentId: student._id });
      const summary = calculateFeeSummary({
        structure,
        discountType: feeRecord?.discountType,
        discountValue: feeRecord?.discountValue,
        paidAmount: feeRecord?.paidAmount,
        includeTransport: student.usesTransport
      });
      if (!feeRecord) {
        return FeeRecord.create({
          studentId: student._id,
          feeStructureId: structure._id,
          totalFee: summary.totalFee,
          baseFee: summary.baseFee,
          discountAmount: summary.discountAmount,
          finalPayableAmount: summary.finalPayableAmount,
          paidAmount: 0,
          pendingAmount: summary.pendingAmount,
          dueDate: getNextDueDate(structure.frequency)
        });
      }

      feeRecord.feeStructureId = structure._id;
      feeRecord.baseFee = summary.baseFee;
      feeRecord.totalFee = summary.totalFee;
      feeRecord.discountAmount = summary.discountAmount;
      feeRecord.finalPayableAmount = summary.finalPayableAmount;
      feeRecord.pendingAmount = summary.pendingAmount;
      feeRecord.dueDate = getNextDueDate(structure.frequency);
      return feeRecord.save();
    })
  );

  res.json({ success: true, message: "Fee structure updated successfully", data: structure });
};

const deleteFeeStructure = async (req, res) => {
  const { id } = req.params;
  const structure = await FeeStructure.findById(id);

  if (!structure) {
    return res.status(404).json({ success: false, message: "Fee structure not found" });
  }

  const assignedStudents = await Student.countDocuments({ class: structure.class });
  if (assignedStudents > 0) {
    return res.status(400).json({
      success: false,
      message: "Cannot delete fee structure while students are assigned to this class"
    });
  }

  await structure.deleteOne();
  res.json({ success: true, message: "Fee structure deleted successfully" });
};

module.exports = {
  listFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure
};
