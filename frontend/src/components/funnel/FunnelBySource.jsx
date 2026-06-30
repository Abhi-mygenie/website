import React from "react";

const SOURCE_ORDER = ["google_paid", "meta", "website", "chat", "organic", "direct", "legacy", "other"];

function PctBadge({ pct, best, worst }) {
  const cls = best
    ? "bg-emerald-100 text-emerald-700 font-bold"
    : worst
    ? "bg-slate-100 text-slate-500 font-bold"
    : "text-slate-700 font-semibold";
  return <span className={`inline-block rounded px-1.5 py-0.5 text-xs ${cls}`}>{pct}%</span>;
}

function INR({ val }) {
  if (val == null) return <span className="text-slate-300">—</span>;
  const formatted = "₹" + Number(val).toLocaleString("en-IN", { maximumFractionDigits: 0 });
  return <span>{formatted}</span>;
}

export default function FunnelBySource({ data, loading }) {
  if (loading || !data) {
    return (
      <div data-testid="funnel-by-source-loading" className="h-32 rounded-lg border border-slate-200 bg-slate-100 animate-pulse" />
    );
  }

  const rows = (Array.isArray(data) ? [...data] : []).sort((a, b) => (b.lead_in || 0) - (a.lead_in || 0));
  if (!rows.length) return null;

  const maxWin = Math.max(...rows.map(r => r.lead_to_win_pct || 0));
  const minWin = Math.min(...rows.map(r => r.lead_to_win_pct || 0));

  const totals = rows.reduce((acc, r) => ({
    lead_in:        (acc.lead_in || 0)        + r.lead_in,
    otp_verified:   (acc.otp_verified || 0)   + r.otp_verified,
    demo_scheduled: (acc.demo_scheduled || 0) + r.demo_scheduled,
    demo_given:     (acc.demo_given || 0)     + r.demo_given,
    won:            (acc.won || 0)            + r.won,
    lost:           (acc.lost || 0)           + r.lost,
    spend:          (acc.spend || 0)          + (r.spend || 0),
  }), {});

  // Compute total cost metrics across paid sources
  const totalCpl    = totals.lead_in        ? Math.round(totals.spend / totals.lead_in)        : null;
  const totalSched  = totals.demo_scheduled ? Math.round(totals.spend / totals.demo_scheduled) : null;
  const totalDemo   = totals.demo_given     ? Math.round(totals.spend / totals.demo_given)     : null;
  const totalWin    = totals.won            ? Math.round(totals.spend / totals.won)             : null;

  // Spend period note from first row that has spend data
  const spendNote = rows.find(r => r.spend_period)?.spend_period;

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Performance by Source</h2>
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm" data-testid="funnel-by-source-table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left   text-xs font-semibold uppercase tracking-widest text-slate-400 w-28">Source</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">Lead In</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-indigo-400">Demo Sched.</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-violet-400">Demo Given</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-emerald-500">Won</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-red-400">Lost</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">Lead→Win</th>
              {/* Cost columns */}
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-amber-500 border-l border-slate-200">Spend</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-amber-500">CPL</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-amber-500">CP Sched</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-amber-500">CP Demo</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-amber-500">CP Win</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(r => (
              <tr key={r.source} data-testid={`funnel-source-row-${r.source}`} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                      r.source === "google_paid" ? "bg-blue-500" :
                      r.source === "meta"        ? "bg-blue-400" :
                      r.source === "website"     ? "bg-teal-500" :
                      r.source === "chat"        ? "bg-purple-400" :
                      r.source === "organic"     ? "bg-green-400" :
                      r.source === "legacy"      ? "bg-amber-400" :
                      "bg-slate-300"
                    }`} />
                    <span className="text-sm font-semibold text-slate-800">{r.label}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-semibold text-slate-800">{r.lead_in}</td>
                <td className="px-4 py-3 text-center">
                  <span className="font-semibold text-indigo-800">{r.demo_scheduled}</span>
                  <div className="text-[10px] text-indigo-400">{r.schedule_rate}%</div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-semibold text-violet-800">{r.demo_given}</span>
                  <div className="text-[10px] text-violet-400">{r.given_rate}%</div>
                </td>
                <td className="px-4 py-3 text-center bg-emerald-50">
                  <span className="font-bold text-emerald-700 text-base">{r.won}</span>
                  <div className="text-[10px] text-emerald-500">{r.won_rate}% of demo</div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-semibold text-red-600">{r.lost}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <PctBadge
                    pct={r.lead_to_win_pct}
                    best={r.lead_to_win_pct === maxWin && maxWin > 0}
                    worst={r.lead_to_win_pct === minWin && maxWin !== minWin}
                  />
                </td>
                {/* Cost columns */}
                <td className="px-4 py-3 text-center border-l border-slate-100">
                  <span className="font-semibold text-amber-700 text-xs"><INR val={r.spend} /></span>
                </td>
                <td className="px-4 py-3 text-center" data-testid={`cpl-${r.source}`}>
                  <span className="font-semibold text-slate-700 text-xs"><INR val={r.cpl} /></span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-semibold text-slate-700 text-xs"><INR val={r.cp_sched} /></span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-semibold text-slate-700 text-xs"><INR val={r.cp_demo} /></span>
                </td>
                <td className="px-4 py-3 text-center" data-testid={`cpwin-${r.source}`}>
                  <span className="font-semibold text-slate-700 text-xs"><INR val={r.cp_win} /></span>
                </td>
              </tr>
            ))}
            {/* Totals row */}
            <tr className="bg-slate-50 border-t-2 border-slate-200">
              <td className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Total</td>
              <td className="px-4 py-3 text-center font-bold text-slate-900">{totals.lead_in}</td>
              <td className="px-4 py-3 text-center font-bold text-indigo-900">{totals.demo_scheduled}</td>
              <td className="px-4 py-3 text-center font-bold text-violet-900">{totals.demo_given}</td>
              <td className="px-4 py-3 text-center font-bold text-emerald-700 bg-emerald-50">{totals.won}</td>
              <td className="px-4 py-3 text-center font-bold text-red-600">{totals.lost}</td>
              <td className="px-4 py-3 text-center">—</td>
              <td className="px-4 py-3 text-center border-l border-slate-100 font-bold text-amber-700 text-xs">
                <INR val={totals.spend || null} />
              </td>
              <td className="px-4 py-3 text-center font-bold text-slate-700 text-xs"><INR val={totalCpl} /></td>
              <td className="px-4 py-3 text-center font-bold text-slate-700 text-xs"><INR val={totalSched} /></td>
              <td className="px-4 py-3 text-center font-bold text-slate-700 text-xs"><INR val={totalDemo} /></td>
              <td className="px-4 py-3 text-center font-bold text-slate-700 text-xs"><INR val={totalWin} /></td>
            </tr>
          </tbody>
        </table>
        {spendNote && (
          <div className="px-4 py-2 text-xs text-slate-400 border-t border-slate-100">
            * Spend data period: {spendNote}
          </div>
        )}
      </div>
    </section>
  );
}
