const STATUS_BADGE = {
  ACTIVE:   "bg-emerald-100 text-emerald-700 border border-emerald-200",
  PAUSED:   "bg-slate-100 text-slate-500 border border-slate-200",
  ARCHIVED: "bg-red-50 text-red-400 border border-red-100",
  UNKNOWN:  "bg-slate-100 text-slate-400 border border-slate-200",
};

const fmt = v => v != null ? `₹${Number(v).toLocaleString("en-IN")}` : "—";
const num = v => v != null && v !== 0 ? Number(v).toLocaleString("en-IN") : "—";

export default function CampaignTable({ campaigns = [], attribution = [] }) {
  if (!campaigns.length) return null;

  const metaCount   = campaigns.filter(c => c.source === "meta_api").length;
  const googleCount = campaigns.filter(c => c.source === "google").length;

  // Build attribution lookup by campaign name + campaign_id
  const attrMap = {};
  attribution.forEach(a => {
    if (a.campaign) attrMap[a.campaign] = a;
    if (a.campaign_id) attrMap[a.campaign_id] = a;
  });

  return (
    <section data-testid="campaign-table">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Campaign Intelligence
        </h2>
        <div className="flex items-center gap-2">
          {metaCount   > 0 && <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 rounded px-2 py-0.5 font-medium">{metaCount} Meta</span>}
          {googleCount > 0 && <span className="text-xs bg-orange-50 text-orange-600 border border-orange-100 rounded px-2 py-0.5 font-medium">{googleCount} Google</span>}
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-3 text-left font-semibold uppercase tracking-wide text-slate-500 min-w-[220px]">Campaign</th>
              <th className="px-3 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-3 py-3 text-right font-semibold uppercase tracking-wide text-slate-500">Spend</th>
              <th className="px-3 py-3 text-right font-semibold uppercase tracking-wide text-slate-500">Impr.</th>
              <th className="px-3 py-3 text-right font-semibold uppercase tracking-wide text-slate-500">Clicks</th>
              <th className="px-3 py-3 text-right font-semibold uppercase tracking-wide text-slate-500">CPC</th>
              <th className="px-3 py-3 text-right font-semibold uppercase tracking-wide text-slate-500 bg-blue-50">Book Demo</th>
              <th className="px-3 py-3 text-right font-semibold uppercase tracking-wide text-slate-500 bg-blue-50">CP Book Demo</th>
              <th className="px-3 py-3 text-right font-semibold uppercase tracking-wide text-slate-500 bg-violet-50">Schedule</th>
              <th className="px-3 py-3 text-right font-semibold uppercase tracking-wide text-slate-500 bg-violet-50">CP Schedule</th>
              <th className="px-3 py-3 text-right font-semibold uppercase tracking-wide text-slate-500 bg-amber-50">Demo Given</th>
              <th className="px-3 py-3 text-right font-semibold uppercase tracking-wide text-slate-500 bg-amber-50">CP Demo</th>
              <th className="px-3 py-3 text-right font-semibold uppercase tracking-wide text-slate-500 bg-emerald-50">Purchase</th>
              <th className="px-3 py-3 text-right font-semibold uppercase tracking-wide text-slate-500 bg-emerald-50">CP Purchase</th>
              <th className="px-3 py-3 text-right font-semibold uppercase tracking-wide text-teal-600 bg-teal-50 border-l-2 border-teal-200">CRM Leads</th>
              <th className="px-3 py-3 text-right font-semibold uppercase tracking-wide text-teal-600 bg-teal-50">Demo Sched.</th>
              <th className="px-3 py-3 text-right font-semibold uppercase tracking-wide text-teal-600 bg-teal-50">Demo Given</th>
              <th className="px-3 py-3 text-right font-semibold uppercase tracking-wide text-teal-600 bg-teal-50">Won</th>
              <th className="px-3 py-3 text-right font-semibold uppercase tracking-wide text-teal-600 bg-teal-50">CPL(CRM)</th>
              <th className="px-3 py-3 text-right font-semibold uppercase tracking-wide text-teal-600 bg-teal-50">CP Won</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campaigns.map((c, i) => {
              const statusKey   = (c.status || "ACTIVE").toUpperCase();
              const isActive    = statusKey === "ACTIVE";
              const isGoogle    = c.source === "google";
              const crm = attrMap[c.name] || attrMap[c.campaign_id] || {};
              return (
                <tr key={i}
                  data-testid={`campaign-row-${i}`}
                  className={`hover:bg-slate-50 ${isActive ? "" : "opacity-60"}`}
                >
                  <td className="px-3 py-3 font-medium text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className="line-clamp-2" title={c.name}>{c.name}</span>
                      {isGoogle && (
                        <span className="text-[10px] bg-orange-50 text-orange-600 border border-orange-100 rounded px-1 py-0.5 font-semibold shrink-0">G</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span data-testid={`campaign-status-${i}`}
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${STATUS_BADGE[statusKey] || STATUS_BADGE.UNKNOWN}`}>
                      {isActive ? "LIVE" : statusKey === "PAUSED" ? "PAUSED" : statusKey}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-amber-700">{fmt(c.spend)}</td>
                  <td className="px-3 py-3 text-right text-slate-600">{num(c.impressions)}</td>
                  <td className="px-3 py-3 text-right text-slate-600">{num(c.clicks)}</td>
                  <td className="px-3 py-3 text-right">{fmt(c.cpc)}</td>
                  {/* Book Demo */}
                  <td className="px-3 py-3 text-right font-semibold text-blue-700 bg-blue-50/40">{num(c.book_demo_count)}</td>
                  <td className="px-3 py-3 text-right text-blue-600 bg-blue-50/40">{fmt(c.cost_per_book_demo)}</td>
                  {/* Schedule */}
                  <td className="px-3 py-3 text-right font-semibold text-violet-700 bg-violet-50/40">{num(c.schedule_count)}</td>
                  <td className="px-3 py-3 text-right text-violet-600 bg-violet-50/40">{fmt(c.cost_per_schedule)}</td>
                  {/* Demo Given */}
                  <td className="px-3 py-3 text-right font-semibold text-amber-700 bg-amber-50/40">{num(c.demo_given_count)}</td>
                  <td className="px-3 py-3 text-right text-amber-600 bg-amber-50/40">{fmt(c.cost_per_demo_given)}</td>
                  {/* Purchase */}
                  <td className="px-3 py-3 text-right font-semibold text-emerald-700 bg-emerald-50/40">{num(c.purchase_count)}</td>
                  <td className="px-3 py-3 text-right text-emerald-600 bg-emerald-50/40">{fmt(c.cost_per_purchase)}</td>
                  {/* CRM Attribution (CR-27) */}
                  <td className="px-3 py-3 text-right font-semibold text-teal-700 bg-teal-50/40 border-l-2 border-teal-100">{crm.crm_leads || "—"}</td>
                  <td className="px-3 py-3 text-right text-teal-600 bg-teal-50/40">{crm.crm_demo_scheduled || "—"}</td>
                  <td className="px-3 py-3 text-right text-teal-600 bg-teal-50/40">{crm.crm_demo_given || "—"}</td>
                  <td className="px-3 py-3 text-right font-semibold text-emerald-700 bg-teal-50/40">{crm.crm_won ? <span className="bg-emerald-100 px-1.5 py-0.5 rounded">{crm.crm_won}</span> : "—"}</td>
                  <td className="px-3 py-3 text-right text-teal-600 bg-teal-50/40">{fmt(crm.crm_cpl)}</td>
                  <td className="px-3 py-3 text-right text-teal-600 bg-teal-50/40">{fmt(crm.crm_cp_won)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[10px] text-slate-400">
        Pixel events from Meta &amp; Google APIs. Teal columns = CRM-matched leads from Freshsales (attribution by campaign name).
      </p>
    </section>
  );
}
