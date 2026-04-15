import { ArrowDownAZ, ArrowUpAZ } from "lucide-react";

function DataTable({ columns, data, sortConfig, onSort, emptyText = "No records found" }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/60 bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-5 py-4 font-semibold text-slate-700">
                  {column.sortable ? (
                    <button
                      className="inline-flex items-center gap-2"
                      onClick={() => onSort(column.key)}
                      type="button"
                    >
                      {column.label}
                      {sortConfig.key === column.key && sortConfig.direction === "asc" ? (
                        <ArrowUpAZ size={14} />
                      ) : (
                        <ArrowDownAZ size={14} />
                      )}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length ? (
              data.map((row, index) => (
                <tr key={row.id || row._id || index} className="border-t border-slate-100">
                  {columns.map((column) => (
                    <td key={column.key} className="px-5 py-4 text-slate-600">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-5 py-8 text-center text-slate-500" colSpan={columns.length}>
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
