import { useState, useEffect, useCallback } from "react";

const API = process.env.REACT_APP_BACKEND_URL;

export default function LandingPagePanel({ token, dateFrom, dateTo }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (dateFrom) p.set("date_from", dateFrom);
      if (dateTo)   p.set("date_to", dateTo);
      const r = await fetch(`${API}/api/cms/funnel/by-landing-page?${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, [token, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const rows = data?.rows || [];

  return (
    <section data-testid="landing-page-panel">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
        Landing Page Performance
      </h2>
      {loading && (
        <div className="h-24 rounded-xl border border-slate-200 bg-slate-100 animate-pulse" />
      )}
      {!loading && rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
          No landing page data yet. Data populates as new leads come in with UTM tracking.
        </div>
      )}
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.map((r, i) => (
            <div key={i}
              data-testid={`lp-card-${i}`}
              className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
              <p className="font-mono text-xs text-slate-700 truncate font-semibold mb-2"
                title={r.landing_page}>{r.landing_page === "/" ? "/ (Homepage)" : r.landing_page}</p>
              <div className="grid grid-cols-3 gap-1 text-center">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Leads</div>
                  <div className="font-bold text-slate-800">{r.lead_in}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Demo%</div>
                  <div className="font-bold text-blue-600">{r.schedule_rate}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Won</div>
                  <div className="font-bold text-emerald-600">{r.won}</div>
                </div>
              </div>
              <div className="mt-2 flex gap-2 text-[10px] text-slate-500">
                <span>Mobile {r.mobile_pct}%</span>
                <span>·</span>
                <span>Desktop {r.desktop_pct}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-2 text-[10px] text-slate-400">
        Based on website-submitted leads with UTM tracking. CRM-synced contacts do not carry landing page data.
      </p>
    </section>
  );
}
