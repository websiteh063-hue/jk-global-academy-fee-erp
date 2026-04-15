const dotenv = require("dotenv");
const connectDB = require("../config/db");
const User = require("../models/User");
const Student = require("../models/Student");
const FeeStructure = require("../models/FeeStructure");
const FeeRecord = require("../models/FeeRecord");
const { buildReceiptNumber } = require("../utils/fee");

dotenv.config();

const MONTH_SEQUENCE = [
  { month: "April", year: 2026 },
  { month: "May", year: 2026 },
  { month: "June", year: 2026 },
  { month: "July", year: 2026 },
  { month: "August", year: 2026 },
  { month: "September", year: 2026 },
  { month: "October", year: 2026 },
  { month: "November", year: 2026 },
  { month: "December", year: 2026 },
  { month: "January", year: 2027 },
  { month: "February", year: 2027 },
  { month: "March", year: 2027 }
];

const createMonthlyRecords = ({ monthlyFee, aprilDiscount = 0, mayDiscount = 0 }) =>
  MONTH_SEQUENCE.map((entry, index) => {
    const discount = index === 0 ? aprilDiscount : index === 1 ? mayDiscount : 0;
    const paidAmount = index === 0 ? monthlyFee - discount : index === 1 ? Math.round((monthlyFee - mayDiscount) / 2) : 0;
    const pendingAmount = Math.max(monthlyFee - discount - paidAmount, 0);

    return {
      month: entry.month,
      year: entry.year,
      totalFee: monthlyFee,
      discountType: "fixed",
      discountValue: discount,
      discount,
      paidAmount,
      pendingAmount,
      status: pendingAmount === 0 ? "Paid" : paidAmount > 0 ? "Partial" : "Unpaid",
      paymentDate: paidAmount ? new Date(`${entry.year}-${String(index + 4).padStart(2, "0")}-10`) : null,
      applySiblingDiscount: discount > 0
    };
  });

const seed = async () => {
  await connectDB();

  await Promise.all([User.deleteMany(), Student.deleteMany(), FeeStructure.deleteMany(), FeeRecord.deleteMany()]);

  const admin = await User.create({
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "admin123",
    role: "admin"
  });

  const accountant = await User.create({
    username: "accountant",
    password: "account123",
    role: "accountant"
  });

  const structures = await FeeStructure.insertMany([
    { class: "Nursery", frequency: "Monthly", tuitionFee: 1800, transportFee: 400, examFee: 150 },
    { class: "5", frequency: "Monthly", tuitionFee: 2500, transportFee: 600, examFee: 250 },
    { class: "10", frequency: "Monthly", tuitionFee: 3200, transportFee: 800, examFee: 400 }
  ]);

  const students = await Student.insertMany([
    {
      name: "Rahul Sharma",
      class: "Nursery",
      section: "A",
      rollNumber: "NRA001",
      fatherName: "Rajesh Sharma",
      motherName: "Sunita Sharma",
      fatherAadhaarNumber: "123412341234",
      motherAadhaarNumber: "223412341234",
      fatherContactNumber: "9876543210",
      motherContactNumber: "9876500011",
      address: "Lucknow, Uttar Pradesh",
      usesTransport: true,
      siblingGroupId: "SIB-JK-1",
      isSibling: true,
      siblingLabel: "Siblings: Rahul Sharma, Riya Sharma",
      createdByRollSequence: 1,
      primaryParentName: "Rajesh Sharma",
      primaryContactNumber: "9876543210"
    },
    {
      name: "Riya Sharma",
      class: "Nursery",
      section: "A",
      rollNumber: "NRA002",
      fatherName: "Rajesh Sharma",
      motherName: "Sunita Sharma",
      fatherAadhaarNumber: "123412341234",
      motherAadhaarNumber: "223412341234",
      fatherContactNumber: "9876543210",
      motherContactNumber: "9876500011",
      address: "Lucknow, Uttar Pradesh",
      usesTransport: false,
      siblingGroupId: "SIB-JK-1",
      isSibling: true,
      siblingLabel: "Siblings: Rahul Sharma, Riya Sharma",
      createdByRollSequence: 2,
      primaryParentName: "Rajesh Sharma",
      primaryContactNumber: "9876543210"
    },
    {
      name: "Aarav Singh",
      class: "5",
      section: "B",
      rollNumber: "05B001",
      fatherName: "Anil Singh",
      motherName: "Meena Singh",
      fatherAadhaarNumber: "333344445555",
      motherAadhaarNumber: "666677778888",
      fatherContactNumber: "9123456780",
      motherContactNumber: "9123400012",
      address: "Kanpur, Uttar Pradesh",
      usesTransport: true,
      createdByRollSequence: 1,
      primaryParentName: "Anil Singh",
      primaryContactNumber: "9123456780"
    },
    {
      name: "Vivaan Gupta",
      class: "10",
      section: "A",
      rollNumber: "10A001",
      fatherName: "Sanjay Gupta",
      motherName: "Anita Gupta",
      fatherAadhaarNumber: "567856785678",
      motherAadhaarNumber: "667856785678",
      fatherContactNumber: "9988776655",
      motherContactNumber: "9988776600",
      address: "Noida, Uttar Pradesh",
      usesTransport: false,
      createdByRollSequence: 1,
      primaryParentName: "Sanjay Gupta",
      primaryContactNumber: "9988776655"
    }
  ]);

  await Student.findByIdAndUpdate(students[0]._id, { siblingStudentIds: [students[1]._id] });
  await Student.findByIdAndUpdate(students[1]._id, { siblingStudentIds: [students[0]._id] });

  const feeRecords = students.map((student, index) => {
    const structure = structures.find((item) => item.class === student.class);
    const monthlyFee =
      Number(structure.tuitionFee || 0) +
      Number(student.usesTransport ? structure.transportFee || 0 : 0) +
      Number(structure.examFee || 0);

    const monthlyRecords = createMonthlyRecords({
      monthlyFee,
      aprilDiscount: index < 2 ? 300 : index === 2 ? 200 : 0,
      mayDiscount: index < 2 ? 150 : 0
    });

    const paidAmount = monthlyRecords.reduce((sum, item) => sum + item.paidAmount, 0);
    const pendingAmount = monthlyRecords.reduce((sum, item) => sum + item.pendingAmount, 0);
    const discountAmount = monthlyRecords.reduce((sum, item) => sum + item.discount, 0);

    return {
      studentId: student._id,
      feeStructureId: structure._id,
      totalFee: monthlyRecords.reduce((sum, item) => sum + item.totalFee, 0),
      baseFee: monthlyRecords.reduce((sum, item) => sum + item.totalFee, 0),
      discountAmount,
      finalPayableAmount: monthlyRecords.reduce((sum, item) => sum + item.totalFee - item.discount, 0),
      paidAmount,
      pendingAmount,
      dueDate: new Date("2026-05-10"),
      monthlyRecords,
      paymentHistory: monthlyRecords
        .filter((item) => item.paidAmount > 0)
        .map((item) => ({
          month: item.month,
          year: item.year,
          date: item.paymentDate,
          amount: item.paidAmount,
          mode: item.status === "Paid" ? "UPI" : "Cash",
          receiptNumber: buildReceiptNumber(),
          remarks: "Seed payment",
          discountType: "fixed",
          discountValue: item.discount,
          discountAmount: item.discount,
          remainingBalance: item.pendingAmount,
          siblingDiscountApplied: item.applySiblingDiscount
        }))
    };
  });

  await FeeRecord.insertMany(feeRecords);

  console.log("Seed completed");
  console.log(`Admin username: ${admin.username}`);
  console.log(`Admin password: ${process.env.ADMIN_PASSWORD || "admin123"}`);
  console.log(`Accountant username: ${accountant.username}`);
  console.log("Accountant password: account123");
  process.exit(0);
};

seed().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
