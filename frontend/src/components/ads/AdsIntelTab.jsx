import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Zap, CheckCircle, AlertCircle, Link2, Link2Off, Filter } from "lucide-react";
import ExecutiveSummary from "./ExecutiveSummary";
import KeywordIntelTable from "./KeywordIntelTable";
import MetaCreativeTable from "./MetaCreativeTable";
import LandingPagePanel from "./LandingPagePanel";
import DeviceCityPanel from "./DeviceCityPanel";
import AiRecommendations from "./AiRecommendations";
import { StrategyLabPanel } from "./StrategyLabPanel";
import CampaignTable from "./CampaignTable";
import { AdSetTable } from "./AdSetTable";
import { AdPerformanceTable } from "./AdPerformanceTable";
import { PlacementPanel } from "./PlacementPanel";
import { LeadQualityPanel } from "./LeadQualityPanel";
import { CrossChannelPanel } from "./CrossChannelPanel";

const API = process.env.REACT_APP_BACKEND_URL;

export default function AdsIntelTab({ token }) {
  const [dateFrom,        setDateFrom]       = useState("");
  const [dateTo,          setDateTo]         = useState("");
  const [summary,         setSummary]        = useState(null);
  const [loading,         setLoading]        = useState(true);
  const [mcpStatus,       setMcpStatus]      = useState(null);
  const [syncing,         setSyncing]        = useState(false);
  const [syncResult,      setSyncResult]     = useState(null);
  const [syncVersion,     setSyncVersion]    = useState(0);
  const [liveOnly,        setLiveOnly]       = useState(false);
  const [gadsStatus,      setGadsStatus]     = useState(null);
  const [gadsConnecting,  setGadsConnecting] = useState(false);
  const [gadsBanner,      setGadsBanner]     = useState(null);
  const [attribution,     setAttribution]    = useState({ campaign: [], adset: [], ad: [] });

  const h = { Authorization: `Bearer ${token}` };

  const metaEnabled = mcpStatus?.meta?.enabled;

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (dateFrom) p.set("date_from", dateFrom);
      if (dateTo)   p.set("date_to", dateTo);
      if (liveOnly) p.set("status", "active");
      const [r, ac, aa, aad] = await Promise.all([
        fetch(`${API}/api/cms/ads/executive-summary?${p}`, { headers: h }),
        fetch(`${API}/api/cms/ads/attribution-by-campaign?${p}`, { headers: h }),
        fetch(`${API}/api/cms/ads/attribution-by-adset?${p}`, { headers: h }),
        fetch(`${API}/api/cms/ads/attribution-by-ad?${p}`, { headers: h }),
      ]);
      if (r.ok) setSummary(await r.json());
      const campAttr = ac.ok ? await ac.json() : { rows: [] };
      const adsetAttr = aa.ok ? await aa.json() : { rows: [] };
      const adAttr = aad.ok ? await aad.json() : { rows: [] };
      setAttribution({ campaign: campAttr.rows || [], adset: adsetAttr.rows || [], ad: adAttr.rows || [] });
    } finally {
      setLoading(false);
    }
  }, [token, dateFrom, dateTo, liveOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  // When dates are set + Meta is enabled, sync Meta for that period then reload
  const handleApply = useCallback(async () => {
    if (metaEnabled && dateFrom && dateTo) {
      setSyncing(true);
      setSyncResult(null);
      try {
        const p = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
        const r = await fetch(`${API}/api/cms/ads/mcp/meta/sync?${p}`, { method: "POST", headers: h });
        const data = await r.json();
        setSyncResult(data);
      } catch (e) {
        setSyncResult({ error: e.message });
      } finally {
        setSyncing(false);
      }
    }
    await loadSummary();
    setSyncVersion(v => v + 1);
  }, [token, dateFrom, dateTo, metaEnabled, loadSummary]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMcpStatus = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/cms/ads/mcp/status`, { headers: h });
      if (r.ok) setMcpStatus(await r.json());
    } catch (_) {}
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadGadsStatus = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/cms/google-ads/status`, { headers: h });
      if (r.ok) setGadsStatus(await r.json());
    } catch (_) {}
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnectGoogleAds = async () => {
    setGadsConnecting(true);
    try {
      const r = await fetch(`${API}/api/cms/google-ads/auth-url`, { headers: h });
      const data = await r.json();
      if (data.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (e) {
      setGadsConnecting(false);
    }
  };

  useEffect(() => {
    loadSummary();
    loadMcpStatus();
    loadGadsStatus();
    // Handle redirect-back from Google OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.get("google_ads") === "connected") {
      setGadsBanner({ ok: true, msg: "Google Ads connected successfully!" });
      window.history.replaceState({}, "", window.location.pathname);
      loadGadsStatus();
    } else if (params.get("google_ads_error")) {
      setGadsBanner({ ok: false, msg: `Google Ads connection failed: ${params.get("google_ads_error")}` });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [loadSummary, loadMcpStatus, loadGadsStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMetaSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const r = await fetch(`${API}/api/cms/ads/mcp/meta/sync`, {
        method: "POST",
        headers: h,
      });
      const data = await r.json();
      setSyncResult(data);
      if (data.synced > 0) {
        // Reload summary after sync and increment syncVersion to refresh all panels
        await loadSummary();
        setSyncVersion(v => v + 1);
      }
    } catch (e) {
      setSyncResult({ error: e.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleGoogleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const p = new URLSearchParams();
      if (dateFrom) p.set("date_from", dateFrom);
      if (dateTo)   p.set("date_to", dateTo);
      const r = await fetch(`${API}/api/cms/ads/mcp/google/sync?${p}`, { method: "POST", headers: h });
      const data = await r.json();
      setSyncResult({ ...data, source: "google" });
      if (data.synced > 0) {
        await loadSummary();
        setSyncVersion(v => v + 1);
      }
    } catch (e) {
      setSyncResult({ error: e.message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6" data-testid="ads-intel-tab">

      {/* ── Controls bar ── */}
      <section className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Period</span>
        <input type="date" data-testid="ads-filter-date-from"
          value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-700 outline-none" />
        <span className="text-slate-400">to</span>
        <input type="date" data-testid="ads-filter-date-to"
          value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-700 outline-none" />
        <button onClick={handleApply} data-testid="ads-filter-apply"
          disabled={syncing}
          className={`rounded px-3 py-1 text-xs font-semibold text-white transition-colors ${syncing ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-700"}`}>
          {syncing && metaEnabled && dateFrom && dateTo ? "Syncing…" : "Apply"}
        </button>

        {/* Live Only Toggle */}
        <button
          data-testid="ads-live-only-toggle"
          onClick={() => setLiveOnly(v => !v)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            liveOnly
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-white border border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50"
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          {liveOnly ? "Live Only" : "All Status"}
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Meta Sync button */}
        <div className="flex items-center gap-2">
          {metaEnabled ? (
            <button
              data-testid="meta-sync-btn"
              onClick={handleMetaSync}
              disabled={syncing}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                syncing
                  ? "bg-blue-100 text-blue-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing Meta…" : "Sync from Meta"}
            </button>
          ) : (
            <span data-testid="meta-sync-disabled"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-400">
              <Zap className="h-3.5 w-3.5" />
              Meta API — add token to .env
            </span>
          )}
        </div>

        {/* Google Ads connect button */}
        <div className="flex items-center gap-2">
          {gadsStatus?.connected ? (
            <>
              <button
                data-testid="google-ads-sync-btn"
                onClick={handleGoogleSync}
                disabled={syncing}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  syncing
                    ? "bg-orange-100 text-orange-400 cursor-not-allowed"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing Google…" : "Sync from Google Ads"}
              </button>
              <span data-testid="google-ads-connected"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <Link2 className="h-3.5 w-3.5" />
                Google Ads Connected
              </span>
            </>
          ) : (
            <button
              data-testid="google-ads-connect-btn"
              onClick={handleConnectGoogleAds}
              disabled={gadsConnecting}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                gadsConnecting
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-white border border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
              }`}
            >
              <Link2Off className="h-3.5 w-3.5" />
              {gadsConnecting ? "Redirecting…" : "Connect Google Ads"}
            </button>
          )}
        </div>
      </section>

      {/* Sync result banner */}
      {syncResult && (
        <div data-testid="sync-result-banner"
          className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${
            syncResult.error
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-emerald-50 border border-emerald-200 text-emerald-700"
          }`}>
          {syncResult.error
            ? <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            : <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />}
          <div>
            {syncResult.error
              ? <span>Sync failed: {syncResult.error}</span>
              : <span>
                  Synced <strong>{syncResult.synced}</strong> rows from {syncResult.source === "google" ? "Google Ads" : "Meta API"} —
                  {" "}{syncResult.campaigns} campaigns · {syncResult.adsets} ad sets · {syncResult.ads} ads
                  {syncResult.placements != null && ` · ${syncResult.placements} placements`}
                  {syncResult.period && <span className="ml-1 text-emerald-600">({syncResult.period})</span>}
                </span>
            }
          </div>
          <button onClick={() => setSyncResult(null)} className="ml-auto text-xs underline opacity-60 hover:opacity-100">
            dismiss
          </button>
        </div>
      )}

      {/* Google Ads OAuth banner */}
      {gadsBanner && (
        <div data-testid="google-ads-banner"
          className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${
            gadsBanner.ok
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
          {gadsBanner.ok
            ? <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
            : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
          <span>{gadsBanner.msg}</span>
          <button onClick={() => setGadsBanner(null)} className="ml-auto text-xs underline opacity-60 hover:opacity-100">
            dismiss
          </button>
        </div>
      )}

      <ExecutiveSummary data={summary} loading={loading} />
      <CrossChannelPanel token={token} dateFrom={dateFrom} dateTo={dateTo} syncVersion={syncVersion} />
      <CampaignTable campaigns={summary?.campaigns || []} attribution={attribution.campaign} liveOnly={liveOnly} />
      <AdSetTable token={token} dateFrom={dateFrom} dateTo={dateTo} syncVersion={syncVersion} attribution={attribution.adset} liveOnly={liveOnly} />
      <AdPerformanceTable token={token} dateFrom={dateFrom} dateTo={dateTo} syncVersion={syncVersion} attribution={attribution.ad} liveOnly={liveOnly} />
      <PlacementPanel token={token} dateFrom={dateFrom} dateTo={dateTo} syncVersion={syncVersion} liveOnly={liveOnly} />
      <LeadQualityPanel token={token} />
      <AiRecommendations token={token} />
      <StrategyLabPanel token={token} />
      <KeywordIntelTable token={token} dateFrom={dateFrom} dateTo={dateTo} />
      <MetaCreativeTable token={token} dateFrom={dateFrom} dateTo={dateTo} />
      <LandingPagePanel  token={token} dateFrom={dateFrom} dateTo={dateTo} />
      <DeviceCityPanel   token={token} dateFrom={dateFrom} dateTo={dateTo} />
    </div>
  );
}
