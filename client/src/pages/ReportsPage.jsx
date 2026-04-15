import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/axios";
import DataTable from "../components/ui/DataTable";
import PageHeader from "../components/ui/PageHeader";
import { useSortableData } from "../hooks/useSortableData";
import { exportToExcel, formatCurrency, formatDate } from "../utils/format";

function ReportsPage() {
  const [classWise, setClassWise] = useState([]);
  const [dateWise, setDateWise] = useState([]);
  const [pending, setPending] = useState([]);
  const [filters, setFilters] = useState({ startDate: "", endDate: "" });

  const fetchReports = async () => {
    const [classResponse, dateResponse, pendingResponse] = await Promise.all([
      api.get("/reports/class-wise"),
      api.get(`/reports/date-wise?startDate=${filters.startDate}&endDate=${filters.endDate}`),
      api.get("/reports/pending")
    ]);

    setClassWise(classResponse.data.data);
    setDateWise(dateResponse.data.data);
    setPending(pendingResponse.data.data);
  };

  useEffect(() => {
    fetchReports();
  }, [filters.startDate, filters.endDate]);

  const classReport = useSortableData(classWise, "_id");
  const dateReport = useSortableData(dateWise, "date");
  const pendingReport = useSortableData(pending, "studentName");

  return (
    <div className="space-y-8">
      <PageHeader subtitle="Review collections, pending dues and export reports." title="Reports & Analytics" />

      <section className="space-y-4">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/60 bg-white p-5 shadow-soft lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Date-wise Collection Report</h2>
            <p className="text-sm text-slate-500">Filter fee collection payments by date range.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3"
              onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))}
              type="date"
              value={filters.startDate}
            />
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3"
              onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))}
              type="date"
              value={filters.endDate}
            />
            <button
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
              onClick={() =>
                exportToExcel(
                  dateWise.map((item) => ({
                    Student: item.studentName,
                    Class: item.class,
                    Section: item.section,
                    Amount: item.amount,
                    Mode: item.mode,
                    Date: formatDate(item.date),
                    Receipt: item.receiptNumber,
                    Discount: item.discountAmount,
                    "Remaining Balance": item.remainingBalance
                  })),
                  "Date Wise Collection",
                  "date-wise-collection"
                )
              }
              type="button"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        <DataTable
          columns={[
            { key: "studentName", label: "Student", sortable: true },
            { key: "class", label: "Class", sortable: true },
            { key: "section", label: "Section", sortable: true },
            { key: "amount", label: "Amount", sortable: true, render: (row) => formatCurrency(row.amount) },
            { key: "mode", label: "Mode", sortable: true },
            { key: "date", label: "Date", sortable: true, render: (row) => formatDate(row.date) },
            { key: "discountAmount", label: "Discount", sortable: true, render: (row) => formatCurrency(row.discountAmount) },
            { key: "remainingBalance", label: "Balance", sortable: true, render: (row) => formatCurrency(row.remainingBalance) },
            { key: "receiptNumber", label: "Receipt No." }
          ]}
          data={dateReport.sortedItems}
          onSort={dateReport.requestSort}
          sortConfig={dateReport.sortConfig}
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Class-wise Collection Report</h2>
            <p className="text-sm text-slate-500">Class summary of fee, paid and pending values.</p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
            onClick={() =>
              exportToExcel(
                classWise.map((item) => ({
                  Class: item._id,
                  "Total Students": item.totalStudents,
                  "Total Fee": item.totalFee,
                  "Paid Amount": item.paidAmount,
                  "Pending Amount": item.pendingAmount
                })),
                "Class Wise Report",
                "class-wise-report"
              )
            }
            type="button"
          >
            <Download size={16} />
            Export
          </button>
        </div>

        <DataTable
          columns={[
            { key: "_id", label: "Class", sortable: true },
            { key: "totalStudents", label: "Students", sortable: true },
            { key: "totalFee", label: "Total Fee", sortable: true, render: (row) => formatCurrency(row.totalFee) },
            { key: "paidAmount", label: "Paid", sortable: true, render: (row) => formatCurrency(row.paidAmount) },
            { key: "pendingAmount", label: "Pending", sortable: true, render: (row) => formatCurrency(row.pendingAmount) }
          ]}
          data={classReport.sortedItems}
          onSort={classReport.requestSort}
          sortConfig={classReport.sortConfig}
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Pending Fees Report</h2>
            <p className="text-sm text-slate-500">Monitor dues and overdue follow-ups.</p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
            onClick={() =>
              exportToExcel(
                pending.map((item) => ({
                  Student: item.studentName,
                  Class: item.class,
                  Section: item.section,
                  "Father Contact": item.fatherContactNumber,
                  "Mother Contact": item.motherContactNumber,
                  "Total Fee": item.totalFee,
                  "Final Payable": item.finalPayableAmount,
                  Discount: item.discountAmount,
                  "Paid Amount": item.paidAmount,
                  "Pending Amount": item.pendingAmount,
                  "Due Date": formatDate(item.dueDate),
                  Sibling: item.siblingLabel || "Single",
                  Status: item.overdue ? "Overdue" : "Pending"
                })),
                "Pending Fees",
                "pending-fees-report"
              )
            }
            type="button"
          >
            <Download size={16} />
            Export
          </button>
        </div>

        <DataTable
          columns={[
            { key: "studentName", label: "Student", sortable: true },
            { key: "class", label: "Class", sortable: true },
            { key: "section", label: "Section", sortable: true },
            { key: "fatherContactNumber", label: "Father Contact" },
            { key: "discountAmount", label: "Discount", sortable: true, render: (row) => formatCurrency(row.discountAmount) },
            { key: "pendingAmount", label: "Pending", sortable: true, render: (row) => formatCurrency(row.pendingAmount) },
            { key: "dueDate", label: "Due Date", sortable: true, render: (row) => formatDate(row.dueDate) },
            {
              key: "status",
              label: "Status",
              render: (row) => (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${row.overdue ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
                  {row.overdue ? "Overdue" : "Pending"}
                </span>
              )
            }
          ]}
          data={pendingReport.sortedItems}
          onSort={pendingReport.requestSort}
          sortConfig={pendingReport.sortConfig}
        />
      </section>
    </div>
  );
}

export default ReportsPage;
