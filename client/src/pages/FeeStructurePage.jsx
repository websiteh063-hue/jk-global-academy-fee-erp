import { Check, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/axios";
import PageHeader from "../components/ui/PageHeader";
import { formatCurrency } from "../utils/format";

const blankStructure = () => ({
  _id: `draft-${Date.now()}-${Math.random()}`,
  class: "",
  frequency: "Monthly",
  tuitionFee: 0,
  transportFee: 0,
  examFee: 0,
  __isNew: true
});

function FeeStructurePage() {
  const [rows, setRows] = useState([]);

  const fetchData = async () => {
    const response = await api.get("/fee-structures");
    setRows(response.data.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateValue = (id, key, value) => {
    setRows((current) => current.map((row) => (row._id === id ? { ...row, [key]: value } : row)));
  };

  const saveRow = async (row) => {
    const payload = {
      class: row.class,
      frequency: row.frequency,
      tuitionFee: Number(row.tuitionFee || 0),
      transportFee: Number(row.transportFee || 0),
      examFee: Number(row.examFee || 0)
    };

    if (row.__isNew) {
      await api.post("/fee-structures", payload);
    } else {
      await api.put(`/fee-structures/${row._id}`, payload);
    }

    fetchData();
  };

  const deleteRow = async (row) => {
    if (row.__isNew) {
      setRows((current) => current.filter((item) => item._id !== row._id));
      return;
    }

    const shouldDelete = window.confirm(`Delete fee structure for class ${row.class}?`);
    if (!shouldDelete) {
      return;
    }

    await api.delete(`/fee-structures/${row._id}`);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        subtitle="Spreadsheet-style class-wise fee setup."
        title="Fee Structure"
        action={
          <button
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-4 py-3 text-sm font-medium text-white"
            onClick={() => setRows((current) => [blankStructure(), ...current])}
            type="button"
          >
            <Plus size={16} />
            Add Row
          </button>
        }
      />

      <div className="rounded-3xl border border-white/60 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-4 font-semibold text-slate-700">Class</th>
                <th className="px-4 py-4 font-semibold text-slate-700">Cycle</th>
                <th className="px-4 py-4 font-semibold text-slate-700">Tuition</th>
                <th className="px-4 py-4 font-semibold text-slate-700">Transport</th>
                <th className="px-4 py-4 font-semibold text-slate-700">Exam</th>
                <th className="px-4 py-4 font-semibold text-slate-700">Total</th>
                <th className="px-4 py-4 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const total =
                  Number(row.tuitionFee || 0) +
                  Number(row.transportFee || 0) +
                  Number(row.examFee || 0);

                return (
                  <tr key={row._id} className="border-t border-slate-100">
                    <td className="px-3 py-3">
                      <input
                        className="w-28 rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-brand-500"
                        onChange={(event) => updateValue(row._id, "class", event.target.value)}
                        value={row.class}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <select
                        className="w-36 rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-brand-500"
                        onChange={(event) => updateValue(row._id, "frequency", event.target.value)}
                        value={row.frequency}
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                    </td>
                    {["tuitionFee", "transportFee", "examFee"].map((field) => (
                      <td key={field} className="px-3 py-3">
                        <input
                          className="w-32 rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-brand-500"
                          onChange={(event) => updateValue(row._id, field, event.target.value)}
                          type="number"
                          value={row[field]}
                        />
                      </td>
                    ))}
                    <td className="px-4 py-3 font-semibold text-slate-700">{formatCurrency(total)}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button className="rounded-xl bg-emerald-50 p-2 text-emerald-600" onClick={() => saveRow(row)} type="button">
                          <Check size={16} />
                        </button>
                        <button className="rounded-xl bg-slate-100 p-2 text-slate-600" onClick={fetchData} type="button">
                          <X size={16} />
                        </button>
                        <button className="rounded-xl bg-rose-50 p-2 text-rose-600" onClick={() => deleteRow(row)} type="button">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
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

export default FeeStructurePage;
