const FREQUENCY_LABELS = ["Monthly", "Quarterly", "Yearly"];

const calculateTotalFee = (structure, options = {}) => {
  if (!structure) {
    return 0;
  }

  const includeTransport = Boolean(options.includeTransport);

  return (
    Number(structure.tuitionFee || 0) +
    Number(includeTransport ? structure.transportFee || 0 : 0) +
    Number(structure.examFee || 0)
  );
};

const getNextDueDate = (frequency) => {
  const date = new Date();

  if (frequency === "Quarterly") {
    date.setMonth(date.getMonth() + 3);
  } else if (frequency === "Yearly") {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }

  return date;
};

const buildReceiptNumber = () => {
  return `RCPT-${Date.now()}`;
};

const calculateDiscountAmount = ({ totalFee, discountType, discountValue }) => {
  const numericTotal = Number(totalFee || 0);
  const numericValue = Number(discountValue || 0);

  if (!numericValue) {
    return 0;
  }

  if (discountType === "percentage") {
    return Math.min(Math.round((numericTotal * numericValue) / 100), numericTotal);
  }

  return Math.min(numericValue, numericTotal);
};

const calculateFeeSummary = ({
  structure,
  discountType = "fixed",
  discountValue = 0,
  paidAmount = 0,
  includeTransport = false
}) => {
  const baseFee = calculateTotalFee(structure, { includeTransport });
  const discountAmount = calculateDiscountAmount({
    totalFee: baseFee,
    discountType,
    discountValue
  });
  const finalPayableAmount = Math.max(baseFee - discountAmount, 0);
  const pendingAmount = Math.max(finalPayableAmount - Number(paidAmount || 0), 0);

  return {
    baseFee,
    totalFee: baseFee,
    discountAmount,
    finalPayableAmount,
    pendingAmount
  };
};

module.exports = {
  FREQUENCY_LABELS,
  calculateTotalFee,
  getNextDueDate,
  buildReceiptNumber,
  calculateDiscountAmount,
  calculateFeeSummary
};
