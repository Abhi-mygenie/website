import React from "react";

const STAGE_COLORS = {
  lead_in:        { card: "bg-white border-slate-200",   label: "text-slate-400", count: "text-slate-900", rate: "text-slate-500",   drop: "bg-red-100 text-red-600",     arrow: "#e2e8f0" },
  otp_verified:   { card: "bg-blue-50 border-blue-200",  label: "text-blue-400",  count: "text-blue-900",  rate: "text-blue-600",    drop: "bg-red-100 text-red-600",     arrow: "#bfdbfe" },
  demo_scheduled: { card: "bg-indigo-50 border-indigo-200", label: "text-indigo-400", count: "text-indigo-900", rate: "text-indigo-600", drop: "bg-red-100 text-red-600", arrow: "#c7d2fe" },
  demo_given:     { card: "bg-violet-50 border-violet-200", label: "text-violet-400", count: "text-violet-900", rate: "text-violet-600", drop: "bg-red-100 text-red-600", arrow: "#ddd6fe" },
  won:            { card: "bg-emerald-50 border-emerald-200", label: "text-emerald-500", count: "text-emerald-700", rate: "text-emerald-700", drop: "bg-emerald-100 text-emerald-700", arrow: "#a7f3d0" },
  lost:           { card: "bg-red-50 border-red-200",    label: "text-red-400",   count: "text-red-700",   rate: "text-red-600",     drop: "bg-red-200 text-red-700",     arrow: null },
};

function Arrow({ color }) {
  return (
    <div className="flex-shrink-0 self-center" style={{
      width: 0, height: 0,
      borderTop: "20px solid transparent",
      borderBottom: "20px solid transparent",
      borderLeft: `14px solid ${color}`,
    }} />
  );
}

function StageCard({ id, label, count, rateLabel, dropLabel, isLost = false, testId }) {
  const c = STAGE_COLORS[id] || STAGE_COLORS.lead_in;
  return (
    <div data-testid={testId}
      className={`flex-1 ${isLost ? "w-36 flex-none rounded-lg" : id === "lead_in" ? "rounded-l-lg" : id === "won" ? "rounded-r-lg" : ""} border ${c.card} p-4 shadow-sm`}>
      <div className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${c.label}`}>{label}</div>
      <div className={`text-3xl font-bold ${c.count}`}>{count ?? "—"}</div>
      {rateLabel && <div className={`mt-1 text-xs font-semibold ${c.rate}`}>{rateLabel}</div>}
      <div className="mt-3 pt-3 border-t border-slate-100">
        {dropLabel && (
          <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded ${c.drop}`}>{dropLabel}</span>
        )}
        {id === "lead_in" && <span className="text-[10px] uppercase tracking-wide text-slate-400">Base</span>}
      </div>
    </div>
  );
}

export default function FunnelPanel({ data, loading }) {
  if (loading || !data) {
    return (
      <div data-testid="funnel-panel-loading" className="flex gap-1 h-28">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex-1 rounded border border-slate-200 bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  const { lead_in, otp_verified, demo_scheduled, demo_given, won, lost, rates = {}, dropoff = {} } = data;

  const biggestDrop = (() => {
    const entries = [
      { label: "Lead → Demo Scheduled", val: dropoff.after_lead },
      { label: "Demo Sched. → Demo Given", val: dropoff.after_schedule },
      { label: "Demo Given → Won", val: dropoff.after_given },
    ];
    return entries.reduce((a, b) => ((b.val || 0) > (a.val || 0) ? b : a), entries[0]);
  })();

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Conversion Funnel</h2>
      </div>

      <div className="flex items-stretch gap-0">
        <StageCard testId="funnel-card-lead-in" id="lead_in" label="Lead In" count={lead_in} />
        <Arrow color={STAGE_COLORS.lead_in.arrow} />

        <StageCard testId="funnel-card-demo-scheduled" id="demo_scheduled" label="Demo Scheduled"
          count={demo_scheduled}
          rateLabel={`${rates.schedule_rate ?? 0}% of leads`}
          dropLabel={`↓ ${dropoff.after_lead ?? 0}% dropped`}
        />
        <Arrow color={STAGE_COLORS.demo_scheduled.arrow} />

        <StageCard testId="funnel-card-demo-given" id="demo_given" label="Demo Given"
          count={demo_given}
          rateLabel={`${rates.given_rate ?? 0}% of Sched.`}
          dropLabel={`↓ ${dropoff.after_schedule ?? 0}% dropped`}
        />
        <Arrow color={STAGE_COLORS.demo_given.arrow} />

        <StageCard testId="funnel-card-won" id="won" label="Won"
          count={won}
          rateLabel={`${rates.won_rate ?? 0}% of Demo`}
          dropLabel={`${rates.lead_to_win ?? 0}% lead→win`}
        />

        <div className="w-5 flex items-center justify-center text-slate-300 font-bold text-lg flex-shrink-0">|</div>

        <StageCard testId="funnel-card-lost" id="lost" label="Lost ⛔" isLost
          count={lost}
          rateLabel={`${rates.lost_rate ?? 0}% of leads`}
          dropLabel="Negative track"
        />
      </div>

      <div data-testid="funnel-summary-banner"
        className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 bg-white border border-slate-200 rounded-lg px-4 py-2.5 shadow-sm">
        <span className="text-xs text-slate-500">Lead → win: <span className="font-bold text-emerald-700">{rates.lead_to_win ?? 0}%</span></span>
        <span className="text-slate-300">|</span>
        <span className="text-xs text-slate-500">Lead → demo sched.: <span className="font-bold text-indigo-700">{rates.schedule_rate ?? 0}%</span></span>
        <span className="text-slate-300">|</span>
        <span className="text-xs text-slate-500">Demo → win: <span className="font-bold text-violet-700">{rates.won_rate ?? 0}%</span></span>
        <span className="text-slate-300">|</span>
        <span className="text-xs text-slate-500">Biggest drop-off: <span className="font-bold text-red-600">{biggestDrop.label} ({biggestDrop.val ?? 0}%)</span></span>
      </div>
    </section>
  );
}
