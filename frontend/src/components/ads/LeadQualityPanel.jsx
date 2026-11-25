import { useEffect, useState } from "react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

const BUCKET_COLOR = {
  "Won":         { bg: "bg-emerald-500", text: "text-emerald-700", light: "bg-emerald-50 border-emerald-200" },
  "High Intent": { bg: "bg-blue-500",    text: "text-blue-700",    light: "bg-blue-50 border-blue-200" },
  "Qualified":   { bg: "bg-amber-400",   text: "text-amber-700",   light: "bg-amber-50 border-amber-200" },
  "Unqualified": { bg: "bg-slate-300",   text: "text-slate-500",   light: "bg-slate-50 border-slate-200" },
};

const SOURCE_LABEL = {
  google_paid:  "Google",
  meta:         "Meta",
  website:      "Website",
  direct:       "Direct",
  chat:         "Chat",
  organic:      "Organic",
};

export function LeadQualityPanel({ token }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/cms/leads/quality-summary`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="flex items-center justify-center py-10 text-slate-400 text-sm">Loading lead quality data…</div>
  );
  if (!data) return null;

  const { total_leads, buckets, quality_rate, sources } = data;
  const bucketOrder = ["Won", "High Intent", "Qualified", "Unqualified"];
  const totalForBar = total_leads || 1;

  return (
    <section data-testid="lead-quality-section">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Lead Quality Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">How qualified are your leads by source?</p>
        </div>
        <span className="text-xs text-slate-400">{total_leads} total leads · {quality_rate}% high quality</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Bucket summary cards */}
        <div className="lg:col-span-1 grid grid-cols-2 gap-3">
          {bucketOrder.map(bucket => {
            const count  = buckets[bucket] || 0;
            const pct    = Math.round(count / totalForBar * 100);
            const colors = BUCKET_COLOR[bucket];
            return (
              <div key={bucket} data-testid={`quality-bucket-${bucket.replace(" ", "-")}`}
                className={`bg-white rounded-xl border p-4 shadow-sm ${colors.light}`}>
                <div className={`text-2xl font-bold ${colors.text}`}>{count}</div>
                <div className="text-xs text-slate-500 mt-0.5 font-medium">{bucket}</div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${colors.bg}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="text-xs text-slate-400 mt-1">{pct}% of total</div>
              </div>
            );
          })}
        </div>

        {/* Source breakdown table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quality by Source</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="quality-source-table">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Source</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Leads</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Unqualified</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-amber-600">Qualified</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-blue-600">High Intent</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-emerald-600">Won</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Avg Score</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Quality %</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s, i) => (
                  <tr key={s.source} data-testid={`quality-source-${s.source}`}
                    className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {SOURCE_LABEL[s.source] || s.source}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-700">{s.total}</td>
                    <td className="px-3 py-3 text-right text-slate-400">{s["Unqualified"] || 0}</td>
                    <td className="px-3 py-3 text-right text-amber-600">{s["Qualified"] || 0}</td>
                    <td className="px-3 py-3 text-right text-blue-600 font-medium">{s["High Intent"] || 0}</td>
                    <td className="px-3 py-3 text-right text-emerald-600 font-semibold">{s["Won"] || 0}</td>
                    <td className="px-3 py-3 text-right text-slate-500">{s.avg_score}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        s.quality_pct >= 20 ? "bg-emerald-50 text-emerald-700" :
                        s.quality_pct >= 10 ? "bg-blue-50 text-blue-700" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {s.quality_pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-400">
              Score: OTP verified +3 · Demo scheduled +2 · Demo attended +3 · Won +5 · Has city/business +1 each
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
