import { Download, Printer, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios";
import PageHeader from "../components/ui/PageHeader";
import { exportToExcel, formatCurrency, formatDate } from "../utils/format";

const getPreferredMonthRecord = (monthlyRecords = []) =>
  monthlyRecords.find((record) => record.status !== "Paid") || monthlyRecords[0] || null;

function FeeCollectionPage() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [form, setForm] = useState({
    amount: "",
    mode: "Cash",
    transactionId: "",
    discountType: "fixed",
    discountValue: 0,
    remarks: "",
    applySiblingDiscount: false
  });
  const [preview, setPreview] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState("");
  const paymentPanelRef = useRef(null);

  const fetchRecords = async () => {
    const response = await api.get(`/fees?search=${search}`);
    const nextRecords = response.data.data;
    setRecords(nextRecords);

    if (!nextRecords.length) {
      setSelectedRecord(null);
      setSelectedMonth(null);
      return;
    }

    const activeRecord =
      nextRecords.find((item) => item.student._id === selectedRecord?.student?._id) || nextRecords[0];
    const activeMonth =
      activeRecord.feeRecord.monthlyRecords.find(
        (item) => item.month === selectedMonth?.month && item.year === selectedMonth?.year
      ) || getPreferredMonthRecord(activeRecord.feeRecord.monthlyRecords);

    setSelectedRecord(activeRecord);
    setSelectedMonth(activeMonth);
  };

  useEffect(() => {
    fetchRecords();
  }, [search]);

  useEffect(() => {
    if (!selectedRecord || !selectedMonth) {
      return;
    }

    setForm((current) => ({
      ...current,
      amount: selectedMonth.pendingAmount,
      transactionId: "",
      discountType: selectedMonth.discountType || "fixed",
      discountValue: selectedMonth.discountValue || 0,
      applySiblingDiscount: selectedMonth.applySiblingDiscount || false
    }));
  }, [selectedRecord, selectedMonth]);

  useEffect(() => {
    if (!selectedRecord || !selectedMonth) {
      setPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setPreviewLoading(true);
        setError("");
        const response = await api.post(`/fees/preview/${selectedRecord.student._id}`, {
          ...form,
          month: selectedMonth.month,
          year: selectedMonth.year,
          amount: Number(form.amount || 0),
          discountValue: Number(form.discountValue || 0)
        });
        setPreview(response.data.data);
      } catch (previewError) {
        setPreview(null);
        setError(previewError.response?.data?.message || "Unable to preview this payment.");
      } finally {
        setPreviewLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [selectedRecord, selectedMonth, form]);

  useEffect(() => {
    if (!selectedMonth || !paymentPanelRef.current) {
      return;
    }

    paymentPanelRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, [selectedMonth]);

  const sortedRecords = useMemo(
    () =>
      [...records].sort((a, b) => {
        if (a.student.class === b.student.class) {
          return a.student.name.localeCompare(b.student.name);
        }
        return String(a.student.class).localeCompare(String(b.student.class));
      }),
    [records]
  );

  const currentMonthRecord = preview?.monthRecord || selectedMonth;
  const enteredAmount = Number(form.amount || 0);
  const remainingBalance = preview?.paymentPreview?.remainingBalance ?? currentMonthRecord?.pendingAmount ?? 0;
  const paymentOutcome = preview?.paymentPreview?.status ||
    (
    enteredAmount <= 0
      ? "Unpaid"
      : remainingBalance <= 0
        ? "Paid"
        : "Partial"
    );

  const applySuggestedAmount = (ratio) => {
    const pending = Number(selectedMonth?.pendingAmount || 0);
    const nextAmount = ratio === 1 ? pending : Math.max(Math.round(pending * ratio), 1);
    setForm((current) => ({
      ...current,
      amount: nextAmount
    }));
  };

  const openReceiptSlip = (receipt) => {
    const printWindow = window.open("", "_blank", "width=720,height=900");
    if (!printWindow) {
      return;
    }

    const slipHtml = `
      <html>
        <head>
          <title>${receipt.payment.receiptNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            .card { border: 1px solid #cbd5e1; border-radius: 16px; padding: 24px; }
            h1 { margin: 0 0 4px; font-size: 26px; color: #1E3A8A; }
            h2 { margin: 0 0 24px; font-size: 18px; color: #475569; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }
            .row { padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
            .label { font-size: 12px; text-transform: uppercase; color: #64748b; }
            .value { font-size: 15px; font-weight: 600; margin-top: 4px; }
            .status { display: inline-block; background: #fef3c7; color: #92400e; padding: 6px 12px; border-radius: 999px; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>JK Global Academy</h1>
            <h2>Payment Receipt Slip</h2>
            <div class="grid">
              <div class="row"><div class="label">Receipt No</div><div class="value">${receipt.payment.receiptNumber}</div></div>
              <div class="row"><div class="label">Date</div><div class="value">${formatDate(receipt.payment.date)}</div></div>
              <div class="row"><div class="label">Student Name</div><div class="value">${receipt.student.name}</div></div>
              <div class="row"><div class="label">Father Name</div><div class="value">${receipt.student.fatherName}</div></div>
              <div class="row"><div class="label">Class</div><div class="value">${receipt.student.class}-${receipt.student.section}</div></div>
              <div class="row"><div class="label">Roll No</div><div class="value">${receipt.student.rollNumber}</div></div>
              <div class="row"><div class="label">Month</div><div class="value">${receipt.payment.month} ${receipt.payment.year}</div></div>
              <div class="row"><div class="label">Payment Mode</div><div class="value">${receipt.payment.mode}</div></div>
              <div class="row"><div class="label">Amount Paid</div><div class="value">${formatCurrency(receipt.payment.amount)}</div></div>
              <div class="row"><div class="label">Remaining Balance</div><div class="value">${formatCurrency(receipt.payment.remainingBalance)}</div></div>
              <div class="row"><div class="label">Payment Status</div><div class="value"><span class="status">${receipt.payment.status}</span></div></div>
              <div class="row"><div class="label">Transaction ID</div><div class="value">${receipt.payment.transactionId || "N/A"}</div></div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(slipHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const collectFee = async () => {
    if (!selectedRecord || !selectedMonth || Number(form.amount || 0) <= 0) {
      setError("Enter a valid payment amount before saving.");
      return;
    }

    if (form.mode !== "Cash" && !String(form.transactionId || "").trim()) {
      setError("Transaction ID is required for UPI or online payments.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const response = await api.post(`/fees/collect/${selectedRecord.student._id}`, {
        ...form,
        month: selectedMonth.month,
        year: selectedMonth.year,
        amount: Number(form.amount || 0),
        discountValue: Number(form.discountValue || 0)
      });

      setReceiptData(response.data.data);
      openReceiptSlip(response.data.data);
      await fetchRecords();
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Payment could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const updateSiblingDiscount = async () => {
    if (!selectedRecord || !selectedMonth) {
      return;
    }

    try {
      setError("");
      await api.patch(`/fees/sibling-discount/${selectedRecord.student._id}`, {
        month: selectedMonth.month,
        year: selectedMonth.year,
        discountType: form.discountType,
        discountValue: Number(form.discountValue || 0),
        enabled: form.applySiblingDiscount
      });

      await fetchRecords();
    } catch (discountError) {
      setError(discountError.response?.data?.message || "Sibling discount could not be updated.");
    }
  };

  const downloadReceiptPdf = async () => {
    if (!receiptData) {
      return;
    }

    const response = await api.get(
      `/fees/receipt/${receiptData.student._id}/${receiptData.payment.receiptNumber}`,
      { responseType: "blob" }
    );
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${receiptData.payment.receiptNumber}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    const rows = sortedRecords.flatMap((item) =>
      item.feeRecord.monthlyRecords.map((monthRow) => ({
        Student: item.student.name,
        Class: item.student.class,
        Section: item.student.section,
        Month: `${monthRow.month} ${monthRow.year}`,
        "Total Fee": monthRow.totalFee,
        Discount: monthRow.discount,
        "Paid Amount": monthRow.paidAmount,
        Pending: monthRow.pendingAmount,
        Status: monthRow.status
      }))
    );

    exportToExcel(rows, "Monthly Fees", "monthly-fee-ledger");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        subtitle="Monthly fee tracking with sibling-aware discounts and editable receipt preview."
        title="Fees Collection"
        action={
          <button
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
            onClick={handleExport}
            type="button"
          >
            <Download size={16} />
            Export Excel
          </button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-soft">
            <Search size={18} className="text-slate-400" />
            <input
              className="w-full border-none bg-transparent outline-none"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student, class, roll number"
              value={search}
            />
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white shadow-soft">
            <div className="max-h-[640px] overflow-y-auto">
              {sortedRecords.map((item) => (
                <button
                  key={item.student._id}
                  className={`w-full border-b border-slate-100 px-5 py-4 text-left transition ${
                    selectedRecord?.student?._id === item.student._id ? "bg-blue-50" : "hover:bg-slate-50"
                  }`}
                  onClick={() => {
                    setSelectedRecord(item);
                    setSelectedMonth(getPreferredMonthRecord(item.feeRecord.monthlyRecords));
                    setPreview(null);
                    setReceiptData(null);
                    setError("");
                  }}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{item.student.name}</p>
                      <p className="text-sm text-slate-500">
                        {item.student.class}-{item.student.section} | Roll {item.student.rollNumber}
                      </p>
                      {item.student.siblings?.length ? (
                        <p className="mt-1 text-xs font-semibold text-emerald-700">
                          Siblings: {item.student.siblings.map((sibling) => sibling.name).join(", ")}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Pending</p>
                      <p className="font-semibold text-rose-600">{formatCurrency(item.feeRecord.pendingAmount)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {selectedRecord ? (
            <>
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-brand-500">Student Ledger</p>
                    <h3 className="text-2xl font-bold text-slate-900">{selectedRecord.student.name}</h3>
                    <p className="text-sm text-slate-500">
                      Father: {selectedRecord.student.fatherName} | Roll {selectedRecord.student.rollNumber}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-accent-100 px-4 py-3 text-sm font-semibold text-brand-500">
                      {selectedRecord.student.siblings?.length
                      ? `Siblings: ${selectedRecord.student.siblings.map((item) => item.name).join(", ")}`
                      : "No siblings detected"}
                  </div>
                </div>

                {selectedMonth ? (
                  <div className="mb-4 rounded-2xl border border-brand-100 bg-blue-50 px-4 py-3 text-sm font-medium text-brand-500">
                    Editing payment for {selectedMonth.month} {selectedMonth.year}. Scroll below to enter amount and save.
                  </div>
                ) : null}

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-700">Month</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Total Fee</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Discount</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Paid</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Pending</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecord.feeRecord.monthlyRecords.map((monthRow) => {
                        const isSelected =
                          selectedMonth?.month === monthRow.month && selectedMonth?.year === monthRow.year;

                        return (
                        <tr
                          key={`${monthRow.month}-${monthRow.year}`}
                          className={`border-t border-slate-100 ${isSelected ? "bg-blue-50/80" : ""}`}
                        >
                          <td className="px-4 py-3">{monthRow.month} {monthRow.year}</td>
                          <td className="px-4 py-3">{formatCurrency(monthRow.totalFee)}</td>
                          <td className="px-4 py-3">{formatCurrency(monthRow.discount)}</td>
                          <td className="px-4 py-3">{formatCurrency(monthRow.paidAmount)}</td>
                          <td className="px-4 py-3">{formatCurrency(monthRow.pendingAmount)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                monthRow.status === "Paid"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : monthRow.status === "Partial"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {monthRow.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              className={`rounded-2xl px-3 py-2 text-xs font-semibold text-white ${
                                isSelected ? "bg-accent-500 text-slate-900" : "bg-brand-500"
                              }`}
                              onClick={() => {
                                setSelectedMonth(monthRow);
                                setPreview(null);
                                setReceiptData(null);
                                setError("");
                              }}
                              type="button"
                            >
                              {isSelected ? "Selected" : "Pay"}
                            </button>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedMonth ? (
                <div
                  ref={paymentPanelRef}
                  className="rounded-[28px] border-2 border-brand-100 bg-white p-6 shadow-soft"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Collect Fee for {selectedMonth.month} {selectedMonth.year}
                      </h3>
                      <p className="text-sm text-slate-500">Editable preview before final save.</p>
                    </div>
                  </div>

                  {error ? (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {error}
                    </div>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Discount Type</span>
                      <select
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
                        onChange={(event) => setForm((current) => ({ ...current, discountType: event.target.value }))}
                        value={form.discountType}
                      >
                        <option value="fixed">Fixed Amount</option>
                        <option value="percentage">Percentage</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Discount Value</span>
                      <input
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
                        onChange={(event) => setForm((current) => ({ ...current, discountValue: event.target.value }))}
                        type="number"
                        value={form.discountValue}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Amount to Collect</span>
                      <input
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
                        onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                        type="number"
                        value={form.amount}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Payment Mode</span>
                      <select
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            mode: event.target.value,
                            transactionId: event.target.value === "Cash" ? "" : current.transactionId
                          }))
                        }
                        value={form.mode}
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </label>

                    {form.mode !== "Cash" ? (
                      <label className="block sm:col-span-2">
                        <span className="mb-2 block text-sm font-medium text-slate-700">
                          Transaction ID
                        </span>
                        <input
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
                          onChange={(event) =>
                            setForm((current) => ({ ...current, transactionId: event.target.value }))
                          }
                          placeholder="Enter UPI / online transaction ID"
                          value={form.transactionId}
                        />
                      </label>
                    ) : null}

                    <div className="sm:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Quick Amounts</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                          onClick={() => applySuggestedAmount(0.25)}
                          type="button"
                        >
                          25% Partial
                        </button>
                        <button
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                          onClick={() => applySuggestedAmount(0.5)}
                          type="button"
                        >
                          50% Partial
                        </button>
                        <button
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                          onClick={() => applySuggestedAmount(1)}
                          type="button"
                        >
                          Full Balance
                        </button>
                      </div>
                    </div>

                    <label className="block sm:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Receipt Remarks</span>
                      <textarea
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
                        onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))}
                        rows="3"
                        value={form.remarks}
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <input
                      checked={form.applySiblingDiscount}
                      id="applySiblingDiscount"
                      onChange={(event) => setForm((current) => ({ ...current, applySiblingDiscount: event.target.checked }))}
                      type="checkbox"
                    />
                    <label className="text-sm font-medium text-slate-700" htmlFor="applySiblingDiscount">
                      Apply Sibling Discount
                    </label>
                    <button
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                      onClick={updateSiblingDiscount}
                      type="button"
                    >
                      Save Sibling Discount
                    </button>
                  </div>

                  <div className="mt-6 grid gap-3 rounded-3xl bg-slate-50 p-5 sm:grid-cols-2">
                    <p className="text-sm text-slate-600"><strong>Total Fee:</strong> {formatCurrency(currentMonthRecord?.totalFee)}</p>
                    <p className="text-sm text-slate-600"><strong>Discount:</strong> {formatCurrency(currentMonthRecord?.discount)}</p>
                    <p className="text-sm text-slate-600"><strong>Paid:</strong> {formatCurrency(currentMonthRecord?.paidAmount)}</p>
                    <p className="text-sm text-slate-600"><strong>Entered Amount:</strong> {formatCurrency(enteredAmount)}</p>
                    <p className="text-sm text-slate-600"><strong>Balance After Save:</strong> {formatCurrency(remainingBalance)}</p>
                    <p className="text-sm text-slate-600"><strong>Auto Status:</strong> {paymentOutcome}</p>
                    <p className="text-sm text-slate-600"><strong>Current Status:</strong> {currentMonthRecord?.status || "Unpaid"}</p>
                    <p className="text-sm text-slate-600"><strong>Transaction ID:</strong> {form.transactionId || "Not required"}</p>
                    <p className="text-sm text-slate-600"><strong>Preview:</strong> {previewLoading ? "Calculating..." : "Ready"}</p>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      className="rounded-2xl bg-brand-500 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                      disabled={saving || currentMonthRecord?.pendingAmount <= 0}
                      onClick={collectFee}
                      type="button"
                    >
                      {currentMonthRecord?.pendingAmount <= 0 ? "Already Paid" : saving ? "Saving..." : "Save Payment"}
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-soft">
              Select a student to view monthly fee records.
            </div>
          )}
        </div>
      </div>

      {receiptData ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Payment Receipt</h3>
              <p className="text-sm text-slate-500">Editable receipt summary before print or PDF download.</p>
            </div>
            <div className="flex gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
              onClick={downloadReceiptPdf}
                type="button"
              >
                <Download size={16} />
                Download PDF
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-4 py-2 text-sm font-medium text-white"
                onClick={() => window.print()}
                type="button"
              >
                <Printer size={16} />
                Print
              </button>
            </div>
          </div>

          <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
            <p><strong>Receipt No:</strong> {receiptData.payment.receiptNumber}</p>
            <p><strong>Student:</strong> {receiptData.student.name}</p>
            <p><strong>Father Name:</strong> {receiptData.student.fatherName}</p>
            <p><strong>Class:</strong> {receiptData.student.class}-{receiptData.student.section}</p>
            <p><strong>Roll No:</strong> {receiptData.student.rollNumber}</p>
            <p><strong>Month:</strong> {receiptData.payment.month} {receiptData.payment.year}</p>
            <p><strong>Amount Paid:</strong> {formatCurrency(receiptData.payment.amount)}</p>
            <p><strong>Remaining Balance:</strong> {formatCurrency(receiptData.payment.remainingBalance)}</p>
            <p><strong>Payment Mode:</strong> {receiptData.payment.mode}</p>
            <p><strong>Transaction ID:</strong> {receiptData.payment.transactionId || "N/A"}</p>
            <p><strong>Status:</strong> {receiptData.payment.status}</p>
            <p><strong>Date:</strong> {formatDate(receiptData.payment.date)}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default FeeCollectionPage;
