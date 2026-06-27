import { useState, useEffect, useCallback } from "react";

const API = process.env.REACT_APP_BACKEND_URL;

const COST_COLS = [
  { key: "spend",   label: "Spend",    prefix: "₹" },
  { key: "cpl",     label: "CPL",      prefix: "₹" },
  { key: "cp_sched",label: "CP Sched", prefix: "₹" },
  { key: "cp_demo", label: "CP Demo",  prefix: "₹" },
  { key: "cp_win",  label: "CP Win",   prefix: "₹" },
];

function PctBadge({ value }) {
  if (value == null) return <span className="text-slate-300">—</span>;
  const color = value >= 10 ? "text-emerald-600 bg-emerald-50"
              : value >= 5  ? "text-amber-600 bg-amber-50"
              :               "text-slate-500 bg-slate-100";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
      {value}%
    </span>
  );
}

function SourceDot({ label }) {
  const color = label === "Google"  ? "bg-blue-500"
              : label === "Meta"    ? "bg-indigo-500"
              : label === "Mixed"   ? "bg-amber-400"
              :                       "bg-slate-400";
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
      <span className="text-xs text-slate-600">{label}</span>
    </span>
  );
}

function SkeletonRows({ cols }) {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} className="border-b border-slate-100">
      {Array.from({ length: cols }).map((__, j) => (
        <td key={j} className="px-4 py-3">
          <div className="h-3 rounded bg-slate-100 animate-pulse" style={{ width: `${60 + (j * 13) % 40}%` }} />
        </td>
      ))}
    </tr>
  ));
}

function EmptyState({ dimension }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-200 rounded-lg">
      <svg className="w-8 h-8 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-sm font-medium text-slate-500">No {dimension === "keyword" ? "keyword" : "ad set"} data yet</p>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">
        {dimension === "keyword"
          ? "Add &utm_term={keyword} to your Google Ads URLs to start tracking keyword performance."
          : "Add &utm_content={adset.name} to your ad URLs to start tracking ad set performance."}
      </p>
    </div>
  );
}

export function AttributionBreakdown({ token, dateFrom, dateTo, leadType }) {
  const [dimension, setDimension] = useState("keyword");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState("lead_in");
  const [sortAsc, setSortAsc] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const p = new URLSearchParams({ dimension });
      if (dateFrom) p.set("date_from", dateFrom);
      if (dateTo)   p.set("date_to", dateTo);
      if (leadType) p.set("lead_type", leadType);
      const r = await fetch(`${API}/api/cms/funnel/by-attribution?${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setData(await r.json());
    } catch (_) {}
    finally { setLoading(false); }
  }, [token, dimension, dateFrom, dateTo, leadType]);

  useEffect(() => { load(); }, [load]);

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  };

  const rows = Array.isArray(data?.rows) ? [...data.rows].sort((a, b) => {
    const av = a[sortKey] ?? -1, bv = b[sortKey] ?? -1;
    return sortAsc ? av - bv : bv - av;
  }) : [];

  const showCost = true;  // Both keyword and ad_set tabs show cost columns

  const SortTh = ({ col, label, right }) => (
    <th
      className={`px-4 py-3 cursor-pointer select-none whitespace-nowrap hover:bg-slate-100 transition-colors ${right ? "text-right" : ""}`}
      onClick={() => handleSort(col)}
    >
      <span className="flex items-center gap-1 text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {label}
        {sortKey === col && <span className="text-slate-400">{sortAsc ? "↑" : "↓"}</span>}
      </span>
    </th>
  );

  const colCount = showCost ? 13 : 8;

  return (
    <div className="mt-6" data-testid="attribution-breakdown">
      {/* Header + tab toggle */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Attribution Performance</h3>
          <p className="text-xs text-slate-400 mt-0.5">New leads only — requires UTM tracking on ad URLs</p>
        </div>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
          <button
            data-testid="tab-keyword"
            onClick={() => setDimension("keyword")}
            className={`px-4 py-1.5 transition-colors ${dimension === "keyword"
              ? "bg-slate-800 text-white"
              : "bg-white text-slate-500 hover:bg-slate-50"}`}
          >
            By Keyword
          </button>
          <button
            data-testid="tab-adset"
            onClick={() => setDimension("ad_set")}
            className={`px-4 py-1.5 transition-colors border-l border-slate-200 ${dimension === "ad_set"
              ? "bg-slate-800 text-white"
              : "bg-white text-slate-500 hover:bg-slate-50"}`}
          >
            By Ad Set
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <SortTh col="value"          label={dimension === "keyword" ? "Keyword" : "Ad Set"} />
              <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Source</th>
              <SortTh col="lead_in"        label="Leads" />
              <SortTh col="demo_scheduled" label="Demo Sched." />
              <SortTh col="schedule_rate"  label="Sched. %" />
              <SortTh col="demo_given"     label="Demo Given" />
              <SortTh col="given_rate"     label="Given %" />
              <SortTh col="won"            label="Won" />
              <SortTh col="lead_to_win_pct" label="Lead→Win %" />
              {showCost && <>
                <th className="px-4 py-3 text-xs font-semibold text-amber-600 uppercase tracking-wide bg-amber-50/40">Spend</th>
                <th className="px-4 py-3 text-xs font-semibold text-amber-600 uppercase tracking-wide bg-amber-50/40">CPL</th>
                <th className="px-4 py-3 text-xs font-semibold text-amber-600 uppercase tracking-wide bg-amber-50/40">CP Demo</th>
                <th className="px-4 py-3 text-xs font-semibold text-amber-600 uppercase tracking-wide bg-amber-50/40">CP Win</th>
              </>}
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows cols={colCount} />}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={colCount} className="px-4 py-2">
                  <EmptyState dimension={dimension} />
                </td>
              </tr>
            )}

            {!loading && rows.map((r, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3 max-w-[200px]">
                  <span
                    className="inline-block font-mono text-xs bg-slate-100 text-slate-700 rounded px-1.5 py-0.5 truncate max-w-full"
                    title={r.value}
                  >
                    {r.value}
                  </span>
                </td>
                <td className="px-4 py-3"><SourceDot label={r.source} /></td>
                <td className="px-4 py-3 font-semibold text-slate-800">{r.lead_in}</td>
                <td className="px-4 py-3 text-slate-600">{r.demo_scheduled}</td>
                <td className="px-4 py-3"><PctBadge value={r.schedule_rate} /></td>
                <td className="px-4 py-3 text-slate-600">{r.demo_given}</td>
                <td className="px-4 py-3"><PctBadge value={r.given_rate} /></td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${r.won > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                    {r.won}
                  </span>
                </td>
                <td className="px-4 py-3"><PctBadge value={r.lead_to_win_pct} /></td>
                {showCost && <>
                  <td className="px-4 py-3 bg-amber-50/20 text-slate-700">
                    {r.spend != null ? `₹${r.spend.toLocaleString("en-IN")}` : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 bg-amber-50/20 text-slate-700">
                    {r.cpl != null ? `₹${r.cpl.toLocaleString("en-IN")}` : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 bg-amber-50/20 text-slate-700">
                    {r.cp_demo != null ? `₹${r.cp_demo.toLocaleString("en-IN")}` : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 bg-amber-50/20 text-slate-700">
                    {r.cp_win != null ? `₹${r.cp_win.toLocaleString("en-IN")}` : <span className="text-slate-300">—</span>}
                  </td>
                </>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && rows.length > 0 && (
        <p className="text-xs text-slate-400 mt-2">
          {data.total_new_leads} leads with {dimension === "keyword" ? "keyword" : "ad set"} attribution · sorted by {sortKey.replace(/_/g, " ")}
        </p>
      )}
    </div>
  );
}
