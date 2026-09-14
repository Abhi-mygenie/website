import { useEffect, useState, useCallback } from "react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

const PLATFORM_LABEL = {
  facebook:         "Facebook",
  instagram:        "Instagram",
  audience_network: "Audience Network",
  messenger:        "Messenger",
};

const PLATFORM_COLOR = {
  facebook:         { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", bar: "bg-blue-400" },
  instagram:        { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200", bar: "bg-pink-400" },
  audience_network: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", bar: "bg-purple-400" },
  messenger:        { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", bar: "bg-sky-400" },
};

const POSITION_LABEL = {
  feed:                    "Feed",
  reels:                   "Reels",
  story:                   "Stories",
  facebook_reels:          "Reels",
  facebook_stories:        "Stories",
  instagram_stories:       "Stories",
  instagram_reels:         "Reels",
  instagram_explore:       "Explore",
  instagram_explore_grid_home: "Explore Grid",
  marketplace:             "Marketplace",
  video_feeds:             "Video Feeds",
  profile_feed:            "Profile Feed",
  instream_video:          "In-Stream Video",
  rewarded_video:          "Rewarded Video",
  an_interstitial:         "Interstitial",
  an_classic:              "Classic",
  biz_disco_feed:          "Business Discover",
};

const fmt    = (n) => n == null ? "—" : `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const fmtN   = (n) => n == null ? "—" : Number(n).toLocaleString("en-IN");
const fmtPct = (n) => n == null ? "—" : `${n}%`;

export function PlacementPanel({ token, dateFrom, dateTo, syncVersion, liveOnly = false }) {
  const [data, setData]       = useState(null);
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
      const res = await axios.get(`${API}/api/cms/ads/placement-breakdown`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setData(res.data);
    } catch (e) {
      setError("Failed to load placement data");
    } finally {
      setLoading(false);
    }
  }, [token, dateFrom, dateTo, syncVersion, liveOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center py-12 text-slate-400 text-sm">Loading placement data…</div>
  );
  if (error) return <div className="text-red-500 text-sm py-4">{error}</div>;
  if (!data || !data.placements?.length) return (
    <div className="text-slate-400 text-sm py-4 text-center">
      No placement data. Use a specific date range and run "Sync from Meta".
    </div>
  );

  const { placements, platforms, total_spend } = data;

  return (
    <section data-testid="placement-section">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Placement Breakdown — Meta
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Where your ads are showing and spending</p>
        </div>
        <span className="text-xs text-slate-400">Total {fmt(total_spend)}</span>
      </div>

      {/* Platform summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {platforms.map((plat) => {
          const style = PLATFORM_COLOR[plat.platform] || PLATFORM_COLOR.facebook;
          const pct   = total_spend ? Math.round(plat.spend / total_spend * 100) : 0;
          return (
            <div
              key={plat.platform}
              data-testid={`platform-card-${plat.platform}`}
              className={`bg-white rounded-xl border ${style.border} p-4 shadow-sm`}
            >
              <div className={`text-xs font-semibold uppercase tracking-wide ${style.text} mb-2`}>
                {PLATFORM_LABEL[plat.platform] || plat.platform}
              </div>
              <div className={`text-2xl font-bold ${style.text}`}>{fmt(plat.spend)}</div>
              <div className="text-xs text-slate-400 mt-1">{plat.count} placements · {pct}% of budget</div>
              <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${style.bar} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed placement table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="placement-table">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Platform</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Placement</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Spend</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Impressions</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Clicks</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">CTR</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">CPC</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">% of Budget</th>
              </tr>
            </thead>
            <tbody>
              {placements.map((row, i) => {
                const style = PLATFORM_COLOR[row.platform] || PLATFORM_COLOR.facebook;
                const posLabel = POSITION_LABEL[row.placement_position] || row.placement_position;
                return (
                  <tr
                    key={i}
                    data-testid={`placement-row-${i}`}
                    className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text} ${style.border} border`}>
                        {PLATFORM_LABEL[row.platform] || row.platform}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{posLabel}</td>
                    <td className="px-4 py-3 text-right font-semibold text-amber-700">{fmt(row.spend)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{fmtN(row.impressions)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{fmtN(row.clicks)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{fmtPct(row.ctr)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{fmt(row.cpc)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 text-xs w-10 text-right">{row.pct_of_budget}%</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden min-w-[60px]">
                          <div
                            className={`h-full rounded-full ${style.bar}`}
                            style={{ width: `${Math.min(row.pct_of_budget, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
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
