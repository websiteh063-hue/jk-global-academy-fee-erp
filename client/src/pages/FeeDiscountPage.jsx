import { useEffect, useState } from "react";
import api from "../api/axios";
import PageHeader from "../components/ui/PageHeader";
import { formatCurrency } from "../utils/format";

function FeeDiscountPage() {
  const [records, setRecords] = useState([]);

  const fetchRecords = async () => {
    const response = await api.get("/fees");
    setRecords(response.data.data);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        subtitle="Review sibling discount settings and current month discount values."
        title="Fee Discount"
      />

      <div className="rounded-[28px] border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-4 font-semibold text-slate-700">Student</th>
                <th className="px-4 py-4 font-semibold text-slate-700">Siblings</th>
                <th className="px-4 py-4 font-semibold text-slate-700">Current Month</th>
                <th className="px-4 py-4 font-semibold text-slate-700">Discount</th>
                <th className="px-4 py-4 font-semibold text-slate-700">Sibling Discount</th>
                <th className="px-4 py-4 font-semibold text-slate-700">Pending</th>
              </tr>
            </thead>
            <tbody>
              {records.map((item) => {
                const currentMonth = item.feeRecord.monthlyRecords[0];
                return (
                  <tr key={item.student._id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{item.student.name}</p>
                      <p className="text-xs text-slate-500">{item.student.class}-{item.student.section}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.student.siblings?.length
                        ? item.student.siblings.map((sibling) => sibling.name).join(", ")
                        : "No siblings"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {currentMonth.month} {currentMonth.year}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(currentMonth.discount)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          currentMonth.applySiblingDiscount
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {currentMonth.applySiblingDiscount ? "Applied" : "Off"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(currentMonth.pendingAmount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default FeeDiscountPage;
