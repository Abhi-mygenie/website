import React from "react";

export default function LostPanel({ data, loading }) {
  if (loading || !data) {
    return (
      <div data-testid="lost-panel-loading"
        className="md:col-span-3 h-32 rounded-lg border border-slate-200 bg-slate-100 animate-pulse" />
    );
  }

  const { total_lost = 0, avg_days_to_lost, reasons = [] } = data;
  const maxCount = reasons.length ? Math.max(...reasons.map(r => r.count)) : 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total card */}
      <div data-testid="lost-total-card"
        className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-red-400 mb-2">Total Lost</div>
        <div className="text-4xl font-bold text-red-700">{total_lost}</div>
        <div className="mt-3 pt-3 border-t border-red-200 text-xs text-red-400">
          {avg_days_to_lost != null
            ? <>Avg. time to lost: <span className="font-semibold text-red-600">{avg_days_to_lost} days</span></>
            : "No time data yet"}
        </div>
      </div>

      {/* Reasons */}
      <div data-testid="lost-reasons-panel"
        className="md:col-span-2 bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Lost Reasons</div>
        {reasons.length === 0 ? (
          <p className="text-xs text-slate-400">No lost reason data yet.</p>
        ) : (
          <div className="space-y-2">
            {reasons.slice(0, 6).map((r, i) => (
              <div key={i} data-testid={`lost-reason-bar-${i}`} className="flex items-center gap-3">
                <span className="w-36 text-xs text-slate-600 truncate" title={r.reason}>{r.reason}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div className="bg-red-400 h-2 rounded-full transition-all"
                    style={{ width: `${Math.round(r.count / maxCount * 100)}%` }} />
                </div>
                <span className="text-xs font-semibold text-slate-700 w-6 text-right">{r.count}</span>
                <span className="text-[10px] text-slate-400 w-8">{r.pct}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
