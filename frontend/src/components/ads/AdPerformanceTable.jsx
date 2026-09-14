import { useEffect, useState, useCallback } from "react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

const ROI_STYLE = {
  "HIGH ROI": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "GOOD":     "bg-blue-50 text-blue-700 border border-blue-200",
  "REVIEW":   "bg-amber-50 text-amber-700 border border-amber-200",
  "LOW ROI":  "bg-red-50 text-red-600 border border-red-200",
  "MONITOR":  "bg-slate-100 text-slate-500 border border-slate-200",
};

const fmt   = (n) => n == null ? "—" : `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const fmtN  = (n) => n == null ? "—" : Number(n).toLocaleString("en-IN");
const fmtPct = (n) => n == null ? "—" : `${n}%`;
const fmtF  = (n) => n == null ? "—" : Number(n).toFixed(2);

export function AdPerformanceTable({ token, dateFrom, dateTo, syncVersion, attribution = [], liveOnly = false }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo)   params.date_to   = dateTo;
      if (liveOnly) params.status    = "active";
      const res = await axios.get(`${API}/api/cms/ads/ad-performance`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setData(res.data.ads || []);
    } catch (e) {
      setError("Failed to load ad performance data");
    } finally {
      setLoading(false);
    }
  }, [token, dateFrom, dateTo, syncVersion, liveOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center py-12 text-slate-400 text-sm">Loading individual ads…</div>
  );
  if (error) return (
    <div className="text-red-500 text-sm py-4">{error}</div>
  );
  if (!data.length) return (
    <div className="text-slate-400 text-sm py-4 text-center">No individual ad data. Sync Meta or Google Ads data first.</div>
  );

  const metaCount   = data.filter(r => r.source_platform === "Meta").length;
  const googleCount = data.filter(r => r.source_platform === "Google").length;

  return (
    <section data-testid="ad-performance-section">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Individual Ad Performance
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Which specific creative is working?</p>
        </div>
        <div className="flex items-center gap-2">
          {metaCount > 0   && <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 rounded px-2 py-0.5 font-medium">{metaCount} Meta</span>}
          {googleCount > 0 && <span className="text-xs bg-orange-50 text-orange-600 border border-orange-100 rounded px-2 py-0.5 font-medium">{googleCount} Google</span>}
          <span className="text-xs text-slate-400">{data.length} ads</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="ad-perf-table">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Ad Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Ad Set</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Spend</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Impr.</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Clicks</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">CTR</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">CPC</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Freq.</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-blue-600 whitespace-nowrap bg-blue-50/50">Book Demo</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-violet-600 whitespace-nowrap bg-violet-50/50">Schedule</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">ROI Signal</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-teal-600 whitespace-nowrap bg-teal-50/50 border-l-2 border-teal-200">CRM Leads</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-teal-600 whitespace-nowrap bg-teal-50/50">Won</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const crm = attribution.find(a => a.ad_name === row.ad_name || (a.ad_id && a.ad_id === row.ad_id)) || {};
                return (
                <tr
                  key={row.ad_id || i}
                  data-testid={`ad-row-${i}`}
                  className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="font-medium text-slate-800 text-sm max-w-[220px] truncate" title={row.ad_name}>
                        {row.ad_name}
                      </div>
                      {row.source_platform === "Google" && (
                        <span className="text-[10px] bg-orange-50 text-orange-600 border border-orange-100 rounded px-1 py-0.5 font-semibold shrink-0">G</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-400 max-w-[160px] truncate" title={row.adset_name}>
                      {row.adset_name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-amber-700">{fmt(row.spend)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{fmtN(row.impressions)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{fmtN(row.clicks)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{fmtPct(row.ctr)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{fmt(row.cpc)}</td>
                  <td className={`px-4 py-3 text-right text-sm ${row.frequency > 3 ? "text-amber-600 font-semibold" : "text-slate-500"}`}>
                    {fmtF(row.frequency)}
                    {row.frequency > 3 && <span className="ml-1 text-xs text-amber-500" title="Frequency above 3 — possible ad fatigue">!</span>}
                  </td>
                  <td className="px-4 py-3 text-right bg-blue-50/30">
                    <span className={`font-semibold ${row.book_demo_count > 0 ? "text-blue-700" : "text-slate-300"}`}>
                      {row.book_demo_count > 0 ? row.book_demo_count : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right bg-violet-50/30">
                    <span className={`font-semibold ${row.schedule_count > 0 ? "text-violet-700" : "text-slate-300"}`}>
                      {row.schedule_count > 0 ? row.schedule_count : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${ROI_STYLE[row.roi_signal] || ROI_STYLE.MONITOR}`}>
                      {row.roi_signal}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right bg-teal-50/30 border-l-2 border-teal-100 font-semibold text-teal-700">{crm.crm_leads || "—"}</td>
                  <td className="px-4 py-3 text-right bg-teal-50/30">{crm.crm_won ? <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-xs font-semibold">{crm.crm_won}</span> : "—"}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-400">
            ROI Signal: <span className="text-emerald-600 font-medium">HIGH ROI</span> = spend ≤ ₹500 + ≥1 conversion &nbsp;·&nbsp;
            <span className="text-red-500 font-medium">LOW ROI</span> = spend ≥ ₹1,000 + 0 conversions
          </p>
        </div>
      </div>
    </section>
  );
}
