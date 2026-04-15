const FeeRecord = require("../models/FeeRecord");

const getClassWiseReport = async (_req, res) => {
  const report = await FeeRecord.aggregate([
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "student"
      }
    },
    { $unwind: "$student" },
    {
      $group: {
        _id: "$student.class",
        totalStudents: { $sum: 1 },
        totalFee: { $sum: "$finalPayableAmount" },
        paidAmount: { $sum: "$paidAmount" },
        pendingAmount: { $sum: "$pendingAmount" }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json({ success: true, data: report });
};

const getDateWiseReport = async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date("2000-01-01");
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  const report = await FeeRecord.aggregate([
    { $unwind: "$paymentHistory" },
    {
      $match: {
        "paymentHistory.date": {
          $gte: start,
          $lte: end
        }
      }
    },
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "student"
      }
    },
    { $unwind: "$student" },
    {
      $project: {
        studentName: "$student.name",
        class: "$student.class",
        section: "$student.section",
        amount: "$paymentHistory.amount",
        mode: "$paymentHistory.mode",
        date: "$paymentHistory.date",
        receiptNumber: "$paymentHistory.receiptNumber",
        discountAmount: "$paymentHistory.discountAmount",
        remainingBalance: "$paymentHistory.remainingBalance",
        month: "$paymentHistory.month",
        year: "$paymentHistory.year"
      }
    },
    { $sort: { date: -1 } }
  ]);

  res.json({ success: true, data: report });
};

const getPendingReport = async (_req, res) => {
  const report = await FeeRecord.aggregate([
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "student"
      }
    },
    { $unwind: "$student" },
    {
      $match: {
        pendingAmount: { $gt: 0 }
      }
    },
    {
      $project: {
        studentName: "$student.name",
        class: "$student.class",
        section: "$student.section",
        fatherContactNumber: "$student.fatherContactNumber",
        motherContactNumber: "$student.motherContactNumber",
        totalFee: 1,
        finalPayableAmount: 1,
        discountAmount: 1,
        paidAmount: 1,
        pendingAmount: 1,
        dueDate: 1,
        siblingLabel: "$student.siblingLabel",
        monthlyRecords: 1,
        overdue: {
          $lt: ["$dueDate", new Date()]
        }
      }
    },
    { $sort: { dueDate: 1 } }
  ]);

  res.json({ success: true, data: report });
};

module.exports = {
  getClassWiseReport,
  getDateWiseReport,
  getPendingReport
};
