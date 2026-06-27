import { useEffect, useState, useCallback } from "react";
import { TrendingUp, TrendingDown, Trophy } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

const fmt = (n) => n == null ? "—" : `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const fmtN = (n) => n == null ? "—" : Number(n).toLocaleString("en-IN");
const fmtPct = (n) => n == null ? "—" : `${n}%`;

const CHANNEL_STYLE = {
  Meta: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "bg-blue-100 text-blue-600" },
  Google: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", icon: "bg-orange-100 text-orange-600" },
  "CRM Only": { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600", icon: "bg-slate-100 text-slate-500" },
};

export function CrossChannelPanel({ token, dateFrom, dateTo, syncVersion }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (dateFrom) p.set("date_from", dateFrom);
      if (dateTo) p.set("date_to", dateTo);
      const r = await fetch(`${API}/api/cms/ads/cross-channel-summary?${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setData(await r.json());
    } catch (_) {}
    setLoading(false);
  }, [token, dateFrom, dateTo, syncVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  if (loading || !data) return null;
  const { channels = [], winners = {} } = data;
  if (channels.length < 2) return null;

  const metrics = [
    { key: "spend", label: "Total Spend", format: fmt, lower: true },
    { key: "crm_leads", label: "CRM Leads", format: fmtN },
    { key: "crm_cpl", label: "CPL (CRM)", format: fmt, lower: true },
    { key: "crm_demo_scheduled", label: "Demo Scheduled", format: fmtN },
    { key: "crm_demo_given", label: "Demo Given", format: fmtN },
    { key: "crm_won", label: "Won", format: fmtN },
    { key: "crm_cp_won", label: "Cost / Won", format: fmt, lower: true },
    { key: "ctr", label: "CTR", format: fmtPct },
    { key: "lead_to_won_pct", label: "Lead → Won %", format: fmtPct },
    { key: "campaigns", label: "Campaigns", format: fmtN },
  ];

  return (
    <section data-testid="cross-channel-panel" className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Meta vs Google — Cross-Channel Comparison
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Side-by-side performance from CRM attribution data</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm" data-testid="cross-channel-table">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 w-40">Metric</th>
              {channels.map((ch) => {
                const s = CHANNEL_STYLE[ch.channel] || CHANNEL_STYLE["CRM Only"];
                return (
                  <th key={ch.channel} className={`px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide ${s.text} ${s.bg}`}>
                    {ch.channel}
                  </th>
                );
              })}
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-amber-600 bg-amber-50 w-28">Winner</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => {
              const winner = winners[m.key];
              return (
                <tr key={m.key} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-xs font-medium text-slate-600">{m.label}</td>
                  {channels.map((ch) => {
                    const val = ch[m.key];
                    const isWinner = winner === ch.channel;
                    return (
                      <td key={ch.channel} className={`px-4 py-3 text-right font-medium ${isWinner ? "text-emerald-700 bg-emerald-50/50" : "text-slate-700"}`}>
                        <span className="inline-flex items-center gap-1">
                          {m.format(val)}
                          {isWinner && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center">
                    {winner ? (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        winner === "Meta" ? "bg-blue-100 text-blue-700" :
                        winner === "Google" ? "bg-orange-100 text-orange-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        <Trophy className="h-3 w-3" />
                        {winner}
                      </span>
                    ) : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
