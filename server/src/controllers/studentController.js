const Student = require("../models/Student");
const FeeStructure = require("../models/FeeStructure");
const FeeRecord = require("../models/FeeRecord");
const { calculateFeeSummary, getNextDueDate } = require("../utils/fee");

const sanitizeAadhaar = (value = "") => value.replace(/\D/g, "").trim();

const getNextRollNumber = async ({ studentClass, section }) => {
  const lastStudent = await Student.findOne({ class: studentClass, section })
    .sort({ createdByRollSequence: -1 })
    .lean();

  const nextSequence = (lastStudent?.createdByRollSequence || 0) + 1;

  return {
    sequence: nextSequence,
    rollNumber: `${String(studentClass).padStart(2, "0")}${String(section).toUpperCase()}${String(
      nextSequence
    ).padStart(3, "0")}`
  };
};

const syncSiblingGroups = async (student) => {
  const aadhaarSet = [sanitizeAadhaar(student.fatherAadhaarNumber), sanitizeAadhaar(student.motherAadhaarNumber)].filter(Boolean);

  if (!aadhaarSet.length) {
    student.siblingGroupId = null;
    student.isSibling = false;
    student.siblingLabel = "";
    student.guardianAadhaarNumbers = [];
    student.siblingStudentIds = [];
    await student.save();
    return student;
  }

  const relatedStudents = await Student.find({
    _id: { $ne: student._id },
    $or: [{ fatherAadhaarNumber: { $in: aadhaarSet } }, { motherAadhaarNumber: { $in: aadhaarSet } }]
  });

  if (!relatedStudents.length) {
    student.siblingGroupId = null;
    student.isSibling = false;
    student.siblingLabel = "";
    student.guardianAadhaarNumbers = aadhaarSet;
    student.siblingStudentIds = [];
    await student.save();
    return student;
  }

  const siblingGroupId = relatedStudents.find((item) => item.siblingGroupId)?.siblingGroupId || `SIB-${Date.now()}`;
  const allStudents = [...relatedStudents, student];
  const allIds = allStudents.map((item) => String(item._id));
  const siblingLabel = `${allStudents.length} siblings linked`;

  await Promise.all(
    allStudents.map(async (item) => {
      item.siblingGroupId = siblingGroupId;
      item.isSibling = true;
      item.siblingLabel = siblingLabel;
      item.guardianAadhaarNumbers = [sanitizeAadhaar(item.fatherAadhaarNumber), sanitizeAadhaar(item.motherAadhaarNumber)].filter(Boolean);
      item.siblingStudentIds = allIds.filter((id) => id !== String(item._id));
      await item.save();
    })
  );

  return Student.findById(student._id);
};

const toStudentPayload = (body) => ({
  name: body.name?.trim(),
  class: body.class?.trim(),
  section: body.section?.trim(),
  fatherName: body.fatherName?.trim(),
  fatherAadhaarNumber: sanitizeAadhaar(body.fatherAadhaarNumber),
  fatherContactNumber: body.fatherContactNumber?.trim(),
  motherName: body.motherName?.trim(),
  motherAadhaarNumber: sanitizeAadhaar(body.motherAadhaarNumber),
  motherContactNumber: body.motherContactNumber?.trim(),
  address: body.address?.trim(),
  usesTransport: Boolean(body.usesTransport),
  notes: body.notes?.trim() || "",
  status: body.status || "Active",
  primaryParentName: body.fatherName?.trim() || body.motherName?.trim() || "",
  primaryContactNumber: body.fatherContactNumber?.trim() || body.motherContactNumber?.trim() || ""
});

const listStudents = async (req, res) => {
  const { search = "", className = "" } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { rollNumber: { $regex: search, $options: "i" } },
      { fatherName: { $regex: search, $options: "i" } },
      { motherName: { $regex: search, $options: "i" } },
      { fatherContactNumber: { $regex: search, $options: "i" } },
      { motherContactNumber: { $regex: search, $options: "i" } }
    ];
  }

  if (className) {
    query.class = className;
  }

  const students = await Student.find(query).sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: students });
};

const createStudent = async (req, res) => {
  const payload = toStudentPayload(req.body);
  const studentClass = payload.class;
  const section = payload.section;

  if (
    !payload.name ||
    !studentClass ||
    !section ||
    !payload.fatherName ||
    !payload.fatherAadhaarNumber ||
    !payload.fatherContactNumber ||
    !payload.motherName ||
    !payload.motherAadhaarNumber ||
    !payload.motherContactNumber ||
    !payload.address
  ) {
    return res.status(400).json({ success: false, message: "All student fields are required" });
  }

  const rollConfig = await getNextRollNumber({ studentClass, section });
  const student = await Student.create({
    ...payload,
    rollNumber: rollConfig.rollNumber,
    createdByRollSequence: rollConfig.sequence
  });
  await syncSiblingGroups(student);

  const feeStructure = await FeeStructure.findOne({ class: studentClass });
  if (feeStructure) {
    const summary = calculateFeeSummary({
      structure: feeStructure,
      includeTransport: student.usesTransport
    });
    await FeeRecord.create({
      studentId: student._id,
      feeStructureId: feeStructure._id,
      totalFee: summary.totalFee,
      baseFee: summary.baseFee,
      discountAmount: summary.discountAmount,
      finalPayableAmount: summary.finalPayableAmount,
      paidAmount: 0,
      pendingAmount: summary.pendingAmount,
      dueDate: getNextDueDate(feeStructure.frequency)
    });
  }

  const savedStudent = await Student.findById(student._id).lean();
  res.status(201).json({ success: true, message: "Student created successfully", data: savedStudent });
};

const updateStudent = async (req, res) => {
  const { id } = req.params;
  const payload = toStudentPayload(req.body);

  const student = await Student.findById(id);
  if (!student) {
    return res.status(404).json({ success: false, message: "Student not found" });
  }

  const classChanged = payload.class && payload.class !== student.class;
  const sectionChanged = payload.section && payload.section !== student.section;

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      student[key] = value;
    }
  });

  if (classChanged || sectionChanged) {
    const rollConfig = await getNextRollNumber({ studentClass: student.class, section: student.section });
    student.rollNumber = rollConfig.rollNumber;
    student.createdByRollSequence = rollConfig.sequence;
  }

  await student.save();
  await syncSiblingGroups(student);

  const feeStructure = await FeeStructure.findOne({ class: student.class });
  const feeRecord = await FeeRecord.findOne({ studentId: student._id });
  if (feeStructure && feeRecord) {
    const summary = calculateFeeSummary({
      structure: feeStructure,
      discountType: feeRecord.discountType,
      discountValue: feeRecord.discountValue,
      paidAmount: feeRecord.paidAmount,
      includeTransport: student.usesTransport
    });
    feeRecord.feeStructureId = feeStructure._id;
    feeRecord.baseFee = summary.baseFee;
    feeRecord.totalFee = summary.totalFee;
    feeRecord.discountAmount = summary.discountAmount;
    feeRecord.finalPayableAmount = summary.finalPayableAmount;
    feeRecord.pendingAmount = summary.pendingAmount;
    feeRecord.dueDate = feeRecord.dueDate || getNextDueDate(feeStructure.frequency);
    await feeRecord.save();
  }

  const savedStudent = await Student.findById(student._id).lean();
  res.json({ success: true, message: "Student updated successfully", data: savedStudent });
};

const deleteStudent = async (req, res) => {
  const { id } = req.params;
  const student = await Student.findById(id);

  if (!student) {
    return res.status(404).json({ success: false, message: "Student not found" });
  }

  const siblingGroupId = student.siblingGroupId;
  await FeeRecord.deleteOne({ studentId: student._id });
  await student.deleteOne();

  if (siblingGroupId) {
    const remainingStudents = await Student.find({ siblingGroupId });

    if (remainingStudents.length <= 1) {
      await Promise.all(
        remainingStudents.map(async (item) => {
          item.siblingGroupId = null;
          item.isSibling = false;
          item.siblingLabel = "";
          item.siblingStudentIds = [];
          await item.save();
        })
      );
    } else {
      const label = `${remainingStudents.length} siblings linked`;
      await Promise.all(
        remainingStudents.map(async (item) => {
          item.isSibling = true;
          item.siblingLabel = label;
          item.siblingStudentIds = remainingStudents
            .map((entry) => String(entry._id))
            .filter((entryId) => entryId !== String(item._id));
          await item.save();
        })
      );
    }
  }

  res.json({ success: true, message: "Student deleted successfully" });
};

module.exports = {
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent
};
