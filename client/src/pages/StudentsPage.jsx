import { Check, Download, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import PageHeader from "../components/ui/PageHeader";
import { exportToExcel } from "../utils/format";

const emptyStudentRow = () => ({
  _id: `draft-${Date.now()}-${Math.random()}`,
  name: "",
  class: "",
  section: "",
  rollNumber: "Auto",
  fatherName: "",
  fatherAadhaarNumber: "",
  fatherContactNumber: "",
  motherName: "",
  motherAadhaarNumber: "",
  motherContactNumber: "",
  address: "",
  usesTransport: false,
  isSibling: false,
  siblingLabel: "",
  __isNew: true
});

const columns = [
  { key: "name", label: "Student Name" },
  { key: "class", label: "Class" },
  { key: "section", label: "Section" },
  { key: "rollNumber", label: "Roll No." },
  { key: "fatherName", label: "Father Name" },
  { key: "fatherAadhaarNumber", label: "Father Aadhaar" },
  { key: "fatherContactNumber", label: "Father Contact" },
  { key: "motherName", label: "Mother Name" },
  { key: "motherAadhaarNumber", label: "Mother Aadhaar" },
  { key: "motherContactNumber", label: "Mother Contact" },
  { key: "usesTransport", label: "Transport" },
  { key: "address", label: "Address" }
];

function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/students?search=${search}`);
      setStudents(response.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search]);

  const rows = useMemo(() => students, [students]);

  const updateCell = (id, key, value) => {
    setStudents((current) =>
      current.map((student) =>
        student._id === id
          ? {
              ...student,
              [key]: value
            }
          : student
      )
    );
  };

  const addRow = () => {
    setStudents((current) => [emptyStudentRow(), ...current]);
  };

  const cancelRow = (row) => {
    if (row.__isNew) {
      setStudents((current) => current.filter((item) => item._id !== row._id));
      return;
    }

    fetchStudents();
  };

  const saveRow = async (row) => {
    setSavingId(row._id);
    const payload = {
      name: row.name,
      class: row.class,
      section: row.section,
      fatherName: row.fatherName,
      fatherAadhaarNumber: row.fatherAadhaarNumber,
      fatherContactNumber: row.fatherContactNumber,
      motherName: row.motherName,
      motherAadhaarNumber: row.motherAadhaarNumber,
      motherContactNumber: row.motherContactNumber,
      address: row.address,
      usesTransport: Boolean(row.usesTransport)
    };

    try {
      if (row.__isNew) {
        await api.post("/students", payload);
      } else {
        await api.put(`/students/${row._id}`, payload);
      }

      await fetchStudents();
    } finally {
      setSavingId("");
    }
  };

  const deleteRow = async (row) => {
    if (row.__isNew) {
      setStudents((current) => current.filter((item) => item._id !== row._id));
      return;
    }

    const shouldDelete = window.confirm(`Delete ${row.name}?`);
    if (!shouldDelete) {
      return;
    }

    await api.delete(`/students/${row._id}`);
    fetchStudents();
  };

  const handleExport = () => {
    exportToExcel(
      rows.map((student) => ({
        "Student Name": student.name,
        Class: student.class,
        Section: student.section,
        "Roll Number": student.rollNumber,
        "Father Name": student.fatherName,
        "Father Aadhaar": student.fatherAadhaarNumber,
        "Father Contact": student.fatherContactNumber,
        "Mother Name": student.motherName,
        "Mother Aadhaar": student.motherAadhaarNumber,
        "Mother Contact": student.motherContactNumber,
        Transport: student.usesTransport ? "Yes" : "No",
        Address: student.address,
        Sibling: student.isSibling ? student.siblingLabel || "Yes" : "No"
      })),
      "Students",
      "advanced-student-register"
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        subtitle="Inline editable student register with Aadhaar-based sibling detection."
        title="Student Management"
        action={
          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
              onClick={handleExport}
              type="button"
            >
              <Download size={16} />
              Export Excel
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-4 py-3 text-sm font-medium text-white"
              onClick={addRow}
              type="button"
            >
              <Plus size={16} />
              Add Row
            </button>
          </div>
        }
      />

      <div className="flex max-w-lg items-center gap-3 rounded-2xl border border-white/60 bg-white px-4 py-3 shadow-soft">
        <Search size={18} className="text-slate-400" />
        <input
          className="w-full border-none bg-transparent outline-none"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, roll number, father/mother name or contact"
          value={search}
        />
      </div>

      <div className="rounded-3xl border border-white/60 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-[1600px] text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="px-4 py-4 font-semibold text-slate-700">
                    {column.label}
                  </th>
                ))}
                <th className="px-4 py-4 font-semibold text-slate-700">Sibling Tag</th>
                <th className="px-4 py-4 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={columns.length + 2}>
                    Loading students...
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((row) => (
                  <tr key={row._id} className="border-t border-slate-100 align-top">
                    {columns.map((column) => (
                      <td key={column.key} className="px-3 py-3">
                        {column.key === "rollNumber" ? (
                          <div className="min-w-[110px] rounded-xl bg-slate-50 px-3 py-2 text-slate-500">
                            {row.rollNumber || "Auto"}
                          </div>
                        ) : (
                          column.key === "usesTransport" ? (
                            <select
                              className="min-w-[120px] rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-brand-500"
                              onChange={(event) => updateCell(row._id, column.key, event.target.value === "true")}
                              value={String(Boolean(row[column.key]))}
                            >
                              <option value="false">No</option>
                              <option value="true">Yes</option>
                            </select>
                          ) : (
                            <input
                              className="min-w-[160px] rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-brand-500"
                              onChange={(event) => updateCell(row._id, column.key, event.target.value)}
                              value={row[column.key] || ""}
                            />
                          )
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-3">
                      {row.isSibling ? (
                        <span className="inline-flex min-w-[140px] rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                          {row.siblingLabel || "Sibling linked"}
                        </span>
                      ) : (
                        <span className="inline-flex min-w-[90px] rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
                          Single
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button
                          className="rounded-xl bg-emerald-50 p-2 text-emerald-600"
                          disabled={savingId === row._id}
                          onClick={() => saveRow(row)}
                          type="button"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          className="rounded-xl bg-slate-100 p-2 text-slate-600"
                          onClick={() => cancelRow(row)}
                          type="button"
                        >
                          <X size={16} />
                        </button>
                        <button
                          className="rounded-xl bg-rose-50 p-2 text-rose-600"
                          onClick={() => deleteRow(row)}
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={columns.length + 2}>
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StudentsPage;
