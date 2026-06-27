import { useState, useEffect, useCallback } from "react";

const API = process.env.REACT_APP_BACKEND_URL;

export default function MetaCreativeTable({ token, dateFrom, dateTo }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [fatigued, setFatigued] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ dimension: "ad_set" });
      if (dateFrom) p.set("date_from", dateFrom);
      if (dateTo)   p.set("date_to", dateTo);
      const r = await fetch(`${API}/api/cms/funnel/by-attribution?${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, [token, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch(`${API}/api/cms/ads/recommendations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setFatigued(d.signals.filter(s => s.type === "FATIGUED").map(s => s.name));
      })
      .catch(() => {});
  }, [token]);

  const rows = data?.rows || [];

  return (
    <section data-testid="meta-creative-table">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
        Meta Ad Set Intelligence
      </h2>
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Ad Set", "Signal", "Leads", "Demo %", "Won", "CPL", "CP Win", "Spend"].map(h => (
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
                No Meta ad set data. Add utm_content to your Meta ad URLs.
              </td></tr>
            )}
            {!loading && rows.map((r, i) => {
              const isFatigued = fatigued.includes(r.value);
              return (
                <tr key={i} data-testid={`meta-row-${i}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700 max-w-[200px] truncate">{r.value}</td>
                  <td className="px-4 py-3">
                    {isFatigued
                      ? <span data-testid="signal-badge-fatigued"
                          className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                          FATIGUED
                        </span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 font-semibold">{r.lead_in}</td>
                  <td className="px-4 py-3">{r.schedule_rate}%</td>
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
