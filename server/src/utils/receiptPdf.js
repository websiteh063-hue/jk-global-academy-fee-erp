const PDFDocument = require("pdfkit");

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const createReceiptPdf = ({ student, feeRecord, payment, schoolName = "School Fee Management ERP" }) => {
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  doc.fontSize(20).fillColor("#0f172a").text(schoolName, { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor("#475569").text("Fee Payment Receipt", { align: "center" });
  doc.moveDown(1.5);

  doc.fontSize(12).fillColor("#0f172a");
  doc.text(`Receipt No: ${payment.receiptNumber}`);
  doc.text(`Date: ${new Date(payment.date).toLocaleDateString("en-IN")}`);
  doc.text(`Student: ${student.name}`);
  doc.text(`Class: ${student.class} - ${student.section}`);
  doc.text(`Roll Number: ${student.rollNumber}`);
  doc.text(`Father Name: ${student.fatherName}`);
  doc.text(`Month: ${payment.month} ${payment.year}`);
  doc.text(`Mother Name: ${student.motherName}`);
  doc.text(`Payment Status: ${payment.status || "Paid"}`);
  doc.moveDown();

  doc.fontSize(13).text("Fee Summary", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  doc.text(`Base Fee: ${currency(feeRecord.baseFee)}`);
  doc.text(`Previous Due: ${currency((payment.remainingBalance || 0) + (payment.amount || 0))}`);
  doc.text(`Discount: ${currency(payment.discountAmount || feeRecord.discountAmount)}`);
  doc.text(`Final Payable: ${currency(feeRecord.finalPayableAmount)}`);
  doc.text(`Paid Amount: ${currency(payment.amount)}`);
  doc.text(`Remaining Balance: ${currency(payment.remainingBalance)}`);
  doc.text(`Payment Mode: ${payment.mode}`);
  if (payment.transactionId) {
    doc.text(`Transaction ID: ${payment.transactionId}`);
  }
  doc.text(`Remarks: ${payment.remarks || "N/A"}`);
  doc.moveDown(2);

  doc.fillColor("#64748b").fontSize(10).text("This is a computer generated receipt.", { align: "center" });
  doc.end();

  return doc;
};

module.exports = { createReceiptPdf };
