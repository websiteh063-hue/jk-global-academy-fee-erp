import { useState } from "react";
import { Navigate } from "react-router-dom";
import { LockKeyhole, School } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(form);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-soft lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden bg-brand-600 p-10 text-white lg:block">
          <div className="max-w-sm">
            <div className="inline-flex rounded-3xl bg-white/15 p-4">
              <School size={32} />
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-tight">School Fee Management ERP</h1>
            <p className="mt-4 text-sm leading-7 text-brand-100">
              Manage student records, fee structures, fee collection, dues and reports from one clean dashboard.
            </p>
            <div className="mt-8 rounded-3xl bg-white/10 p-5">
              <p className="text-sm font-medium">Demo login</p>
              <p className="mt-2 text-brand-100">Username: admin</p>
              <p className="text-brand-100">Password: admin123</p>
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mx-auto max-w-md">
            <div className="mb-8">
              <div className="inline-flex rounded-2xl bg-brand-50 p-3 text-brand-600">
                <LockKeyhole size={24} />
              </div>
              <h2 className="mt-5 text-3xl font-bold text-slate-900">Admin Login</h2>
              <p className="mt-2 text-sm text-slate-500">Use your ERP credentials to continue.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Username</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-500"
                  onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
                  placeholder="Enter username"
                  required
                  type="text"
                  value={form.username}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-500"
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="Enter password"
                  required
                  type="password"
                  value={form.password}
                />
              </div>

              {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}

              <button
                className="w-full rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
                disabled={loading}
                type="submit"
              >
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
