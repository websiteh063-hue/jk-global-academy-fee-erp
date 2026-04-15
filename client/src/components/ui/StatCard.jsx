function StatCard({ title, value, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-brand-50 text-brand-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-rose-50 text-rose-600"
  };

  return (
    <div className="rounded-3xl border border-white/60 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`rounded-2xl p-3 ${tones[tone]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default StatCard;
