const Student = require("../models/Student");
const FeeRecord = require("../models/FeeRecord");

const getDashboardSummary = async (_req, res) => {
  const [totalStudents, feeRecords] = await Promise.all([
    Student.countDocuments(),
    FeeRecord.find().lean()
  ]);

  const totalFeesCollected = feeRecords.reduce((sum, record) => sum + (record.paidAmount || 0), 0);
  const totalPendingFees = feeRecords.reduce((sum, record) => sum + (record.pendingAmount || 0), 0);
  const overdueStudents = feeRecords.filter(
    (record) => record.pendingAmount > 0 && new Date(record.dueDate) < new Date()
  ).length;

  const monthlyBuckets = {};
  feeRecords.forEach((record) => {
    (record.paymentHistory || []).forEach((payment) => {
      const paymentDate = new Date(payment.date);
      const key = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, "0")}`;
      monthlyBuckets[key] = (monthlyBuckets[key] || 0) + payment.amount;
    });
  });

  const monthlyCollection = Object.entries(monthlyBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, amount]) => ({ month, amount }));

  res.json({
    success: true,
    data: {
      totalStudents,
      income: totalFeesCollected,
      feeDue: totalPendingFees,
      totalFeesCollected,
      totalPendingFees,
      overdueStudents,
      monthlyCollection
    }
  });
};

module.exports = { getDashboardSummary };
