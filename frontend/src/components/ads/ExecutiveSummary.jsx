export default function ExecutiveSummary({ data, loading }) {
  if (loading) {
    return (
      <div data-testid="exec-summary-loading"
        className="h-28 rounded-xl border border-slate-200 bg-slate-100 animate-pulse" />
    );
  }
  if (!data) return null;

  const fmt = v => v ? `₹${Number(v).toLocaleString("en-IN")}` : "—";

  const cards = [
    { label: "Total Spend",  value: fmt(data.total_spend),       color: "text-amber-600" },
    { label: "Total Leads",  value: data.total_leads ?? "—",     color: "text-slate-800" },
    { label: "Blended CPL",  value: fmt(data.blended_cpl),       color: "text-blue-600"  },
    { label: "CP Demo",      value: fmt(data.blended_cp_demo),   color: "text-violet-600"},
    { label: "CP Win",       value: fmt(data.blended_cp_win),    color: "text-emerald-600"},
    { label: "Won",          value: data.won ?? "—",             color: "text-emerald-700"},
  ];

  return (
    <section data-testid="executive-summary">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
        Executive Summary
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(c => (
          <div key={c.label}
            data-testid={`exec-card-${c.label.toLowerCase().replace(/\s+/g, "-")}`}
            className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
            <div className="text-[10px] uppercase tracking-widest text-slate-400">{c.label}</div>
            <div className={`mt-1 text-xl font-bold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {data.source_split?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {data.source_split.map(s => (
            <div key={s.source}
              data-testid={`source-split-${s.source}`}
              className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${
                s.source === "google_paid" ? "bg-blue-500"
                : s.source === "meta"      ? "bg-indigo-500"
                : "bg-slate-400"
              }`} />
              <span className="font-semibold text-slate-700">{s.label}</span>
              <span className="text-slate-500">{s.leads} leads</span>
              {s.spend && (
                <span className="text-amber-600">₹{Number(s.spend).toLocaleString("en-IN")}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
