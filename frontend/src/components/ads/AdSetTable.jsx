import { useEffect, useState, useCallback } from "react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

const STATUS_STYLE = {
  ACTIVE:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  PAUSED:   "bg-slate-100 text-slate-500 border border-slate-200",
  UNKNOWN:  "bg-slate-100 text-slate-400 border border-slate-200",
};

const fmt = (n) => n == null ? "—" : `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const fmtN = (n) => n == null ? "—" : Number(n).toLocaleString("en-IN");
const fmtPct = (n) => n == null ? "—" : `${n}%`;

export function AdSetTable({ token, dateFrom, dateTo, syncVersion, attribution = [], liveOnly = false }) {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo)   params.date_to   = dateTo;
      if (liveOnly) params.status    = "active";
      const res = await axios.get(`${API}/api/cms/ads/adset-performance`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setData(res.data.adsets || []);
    } catch (e) {
      setError("Failed to load ad set data");
    } finally {
      setLoading(false);
    }
  }, [token, dateFrom, dateTo, syncVersion, liveOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center py-12 text-slate-400 text-sm">Loading ad sets…</div>
  );
  if (error) return (
    <div className="text-red-500 text-sm py-4">{error}</div>
  );
  if (!data.length) return (
    <div className="text-slate-400 text-sm py-4 text-center">No ad set data. Sync Meta or Google Ads data first.</div>
  );

  const totalSpend = data.reduce((s, r) => s + (r.spend || 0), 0);
  const metaCount   = data.filter(r => r.source_platform === "Meta").length;
  const googleCount = data.filter(r => r.source_platform === "Google").length;

  return (
    <section data-testid="adset-intel-section">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Ad Set Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Performance by ad set with audience targeting</p>
        </div>
        <div className="flex items-center gap-2">
          {metaCount > 0   && <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 rounded px-2 py-0.5 font-medium">{metaCount} Meta</span>}
          {googleCount > 0 && <span className="text-xs bg-orange-50 text-orange-600 border border-orange-100 rounded px-2 py-0.5 font-medium">{googleCount} Google</span>}
          <span className="text-xs text-slate-400">{data.length} ad sets · {fmt(totalSpend)} total</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="adset-table">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Ad Set</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Audience</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Spend</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Impr.</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Clicks</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">CPC</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-blue-600 whitespace-nowrap bg-blue-50/50">Book Demo</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-blue-600 whitespace-nowrap bg-blue-50/50">CP Demo</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-violet-600 whitespace-nowrap bg-violet-50/50">Schedule</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-violet-600 whitespace-nowrap bg-violet-50/50">CP Sched.</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-teal-600 whitespace-nowrap bg-teal-50/50 border-l-2 border-teal-200">CRM Leads</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-teal-600 whitespace-nowrap bg-teal-50/50">Won</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-teal-600 whitespace-nowrap bg-teal-50/50">CPL(CRM)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const isLowROI = row.spend >= 1000 && row.book_demo_count === 0 && row.schedule_count === 0;
                const crm = attribution.find(a => a.ad_set === row.ad_set || (a.adset_id && a.adset_id === row.adset_id)) || {};
                return (
                  <tr
                    key={row.adset_id || i}
                    data-testid={`adset-row-${i}`}
                    className={`border-b border-slate-50 transition-colors hover:bg-slate-50/70 ${
                      row.effective_status === "PAUSED" ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isLowROI && (
                          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="High spend, no conversions" />
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <div className="font-medium text-slate-800 text-sm max-w-[200px] truncate" title={row.adset_name}>
                              {row.adset_name}
                            </div>
                            {row.source_platform === "Google" && (
                              <span className="text-[10px] bg-orange-50 text-orange-600 border border-orange-100 rounded px-1 py-0.5 font-semibold shrink-0">G</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 truncate max-w-[200px]">{row.campaign}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[row.effective_status] || STATUS_STYLE.UNKNOWN}`}>
                        {row.effective_status === "ACTIVE" ? "Live" : row.effective_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600 whitespace-nowrap">{row.audience_label || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-amber-700">{fmt(row.spend)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{fmtN(row.impressions)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{fmtN(row.clicks)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{fmt(row.cpc)}</td>
                    <td className="px-4 py-3 text-right bg-blue-50/30">
                      <span className={`font-semibold ${row.book_demo_count > 0 ? "text-blue-700" : "text-slate-300"}`}>
                        {row.book_demo_count > 0 ? row.book_demo_count : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right bg-blue-50/30 text-xs text-slate-500">
                      {fmt(row.cost_per_book_demo)}
                    </td>
                    <td className="px-4 py-3 text-right bg-violet-50/30">
                      <span className={`font-semibold ${row.schedule_count > 0 ? "text-violet-700" : "text-slate-300"}`}>
                        {row.schedule_count > 0 ? row.schedule_count : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right bg-violet-50/30 text-xs text-slate-500">
                      {fmt(row.cost_per_schedule)}
                    </td>
                    <td className="px-4 py-3 text-right bg-teal-50/30 border-l-2 border-teal-100 font-semibold text-teal-700">{crm.crm_leads || "—"}</td>
                    <td className="px-4 py-3 text-right bg-teal-50/30">{crm.crm_won ? <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-xs font-semibold">{crm.crm_won}</span> : "—"}</td>
                    <td className="px-4 py-3 text-right bg-teal-50/30 text-xs text-teal-600">{fmt(crm.crm_cpl)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
