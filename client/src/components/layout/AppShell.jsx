import {
  Bell,
  CreditCard,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Menu,
  School,
  Users
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const navigation = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Students", icon: Users },
  { to: "/fee-collection", label: "Fees Collection", icon: CreditCard },
  { to: "/fee-discount", label: "Fee Discount", icon: IndianRupee },
  { to: "/fee-structures", label: "Fee Structure", icon: CreditCard },
  { to: "/reports", label: "Reports", icon: Bell }
];

function AppShell() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 transform bg-brand-500 px-5 py-6 text-white shadow-soft transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/10 p-3">
              <School size={24} />
            </div>
            <div>
              <p className="text-lg font-bold">JK Global Academy</p>
              <p className="text-xs uppercase tracking-[0.25em] text-accent-300">Excellence in Education</p>
            </div>
          </div>
          <button className="rounded-lg p-2 lg:hidden" onClick={() => setSidebarOpen(false)} type="button">
            <Menu size={20} />
          </button>
        </div>

        <div className="mb-6 rounded-3xl bg-white/10 p-4">
          <p className="text-sm text-blue-100">Academic Session</p>
          <p className="mt-2 text-2xl font-bold">2026-27</p>
          <p className="mt-2 text-sm text-blue-100">Modern fee administration for Indian schools</p>
        </div>

        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive ? "bg-accent-400 text-slate-900" : "text-blue-50 hover:bg-white/10"
                  }`
                }
                onClick={() => setSidebarOpen(false)}
                to={item.to}
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-8 rounded-3xl bg-white p-4 text-slate-900">
          <p className="text-sm text-slate-500">Logged in as</p>
          <p className="mt-1 font-semibold">{user?.username}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{user?.role}</p>
          <button
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-4 py-2 text-sm font-medium text-white"
            onClick={logout}
            type="button"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-4 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                className="rounded-xl border border-slate-200 bg-white p-2 lg:hidden"
                onClick={() => setSidebarOpen(true)}
                type="button"
              >
                <Menu size={20} />
              </button>
              <div>
                <p className="text-sm font-medium text-brand-500">JK Global Academy</p>
                <h2 className="text-lg font-semibold text-slate-900">School Fee Management ERP</h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-2xl bg-slate-100 px-4 py-2 text-right sm:block">
                <p className="text-xs uppercase tracking-wide text-slate-400">Today</p>
                <p className="font-semibold text-slate-900">
                  {new Date().toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                  })}
                </p>
              </div>
              <div className="rounded-2xl bg-accent-100 px-4 py-2 text-sm font-semibold text-brand-500">
                Excellence in Education
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppShell;
