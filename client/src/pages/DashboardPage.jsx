import { AlertCircle, IndianRupee, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../api/axios";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { formatCurrency } from "../utils/format";

function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [pendingAlerts, setPendingAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardResponse, pendingResponse] = await Promise.all([
          api.get("/dashboard"),
          api.get("/reports/pending")
        ]);

        setDashboard(dashboardResponse.data.data);
        setPendingAlerts(pendingResponse.data.data.slice(0, 5));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-slate-500">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        subtitle="Welcome to JK Global Academy fee operations dashboard."
        title="Dashboard"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Users} title="Total Students" tone="blue" value={dashboard?.totalStudents || 0} />
        <StatCard
          icon={IndianRupee}
          title="Fees Collected"
          tone="amber"
          value={formatCurrency(dashboard?.income)}
        />
        <StatCard icon={AlertCircle} title="Fee Due" tone="red" value={formatCurrency(dashboard?.feeDue)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Monthly Collection</h3>
              <p className="text-sm text-slate-500">Income overview for recent collection cycles</p>
            </div>
            <div className="rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold text-brand-500">Monthly</div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard?.monthlyCollection || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#1E3A8A" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Pending Fee Alerts</h3>
              <p className="text-sm text-slate-500">Students who need follow-up</p>
            </div>
            <div className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
              {dashboard?.overdueStudents || 0} overdue
            </div>
          </div>

          <div className="space-y-3">
            {pendingAlerts.length ? (
              pendingAlerts.map((alert) => (
                <div
                  key={`${alert.studentName}-${alert.class}-${alert.section}`}
                  className={`rounded-2xl border px-4 py-4 ${
                    alert.overdue ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{alert.studentName}</p>
                      <p className="text-sm text-slate-500">
                        Class {alert.class}-{alert.section} | {alert.fatherContactNumber || alert.motherContactNumber}
                      </p>
                      {alert.siblingLabel ? (
                        <p className="mt-1 text-xs font-semibold text-emerald-700">{alert.siblingLabel}</p>
                      ) : null}
                    </div>
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(alert.pendingAmount)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-slate-500">No pending students.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
