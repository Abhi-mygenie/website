import { useState, useEffect, useCallback } from "react";

const API = process.env.REACT_APP_BACKEND_URL;

const SIGNAL_BADGE = {
  SCALE:  "bg-emerald-100 text-emerald-700 border border-emerald-200",
  BLOCK:  "bg-red-100 text-red-700 border border-red-200",
  REVIEW: "bg-amber-100 text-amber-700 border border-amber-200",
};

function computeSignal(row, medianCpWin) {
  const { spend = 0, schedule_rate = 100, won = 0, cp_win } = row;
  if (spend >= 1000 && schedule_rate < 20) return "BLOCK";
  if (cp_win != null && medianCpWin != null && cp_win < medianCpWin && won >= 2) return "SCALE";
  if (spend >= 5000 && schedule_rate < 10) return "REVIEW";
  return null;
}

export default function KeywordIntelTable({ token, dateFrom, dateTo }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ dimension: "keyword" });
      if (dateFrom) p.set("date_from", dateFrom);
      if (dateTo)   p.set("date_to", dateTo);
      p.set("source", "google_paid");
      const r = await fetch(`${API}/api/cms/funnel/by-attribution?${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, [token, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const rows = data?.rows || [];
  const cpWins = rows.map(r => r.cp_win).filter(v => v != null).sort((a, b) => a - b);
  const medianCpWin = cpWins.length ? cpWins[Math.floor(cpWins.length / 2)] : null;

  return (
    <section data-testid="keyword-intel-table">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
        Google Keyword Intelligence
      </h2>
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Keyword", "Signal", "Leads", "Demo %", "Won", "CPL", "CP Win", "Spend"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                No keyword data yet. Add utm_term to your Google Ads URLs.
              </td></tr>
            )}
            {!loading && rows.map((r, i) => {
              const signal = computeSignal(r, medianCpWin);
              const bStyle = signal ? SIGNAL_BADGE[signal] : null;
              return (
                <tr key={i} data-testid={`keyword-row-${i}`}
                  className={`hover:bg-slate-50 ${signal === "BLOCK" ? "bg-red-50/30" : signal === "SCALE" ? "bg-emerald-50/30" : ""}`}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700 max-w-[200px] truncate">{r.value}</td>
                  <td className="px-4 py-3">
                    {bStyle
                      ? <span data-testid={`signal-badge-${signal.toLowerCase()}`}
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${bStyle}`}>{signal}</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 font-semibold">{r.lead_in}</td>
                  <td className="px-4 py-3 text-slate-600">{r.schedule_rate}%</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">{r.won || 0}</td>
                  <td className="px-4 py-3">{r.cpl ? `₹${Number(r.cpl).toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-4 py-3 font-semibold">{r.cp_win ? `₹${Number(r.cp_win).toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-4 py-3 text-amber-700">{r.spend ? `₹${Number(r.spend).toLocaleString("en-IN")}` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
