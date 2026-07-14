import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Search, Download, ExternalLink, ShieldCheck, Filter, RefreshCw,
  LogOut, ChevronLeft, ChevronRight, Smartphone, Monitor, Trash2,
} from "lucide-react";
import FunnelPanel from "../components/funnel/FunnelPanel";
import FunnelBySource from "../components/funnel/FunnelBySource";
import LostPanel from "../components/funnel/LostPanel";
import SyncStatus from "../components/funnel/SyncStatus";
import AdSpendUpload from "../components/funnel/AdSpendUpload";
import { AttributionBreakdown } from "../components/funnel/AttributionBreakdown";
import AdsIntelTab from "../components/ads/AdsIntelTab";

const API = process.env.REACT_APP_BACKEND_URL;
const TOKEN_KEY = "cms_token";

const SOURCE_BADGE = {
  google_paid: { label: "Google Paid", cls: "bg-blue-100 text-blue-700" },
  meta:        { label: "Meta",        cls: "bg-indigo-100 text-indigo-700" },
  organic:     { label: "Organic",     cls: "bg-green-100 text-green-700" },
  direct:      { label: "Direct",      cls: "bg-slate-100 text-slate-600" },
  website:     { label: "Website",     cls: "bg-teal-100 text-teal-700" },
  chat:        { label: "Chat",        cls: "bg-purple-100 text-purple-700" },
  legacy:      { label: "Legacy",      cls: "bg-amber-100 text-amber-700" },
};

function SourceBadge({ source }) {
  const s = source?.toLowerCase();
  const match = s?.includes("google") ? SOURCE_BADGE.google_paid
              : s?.includes("facebook") || s?.includes("fb") || s === "meta" ? SOURCE_BADGE.meta
              : SOURCE_BADGE[s] || { label: source || "Direct", cls: "bg-slate-100 text-slate-500" };
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${match.cls}`}>{match.label}</span>;
}

const TYPE_STYLE = {
  demo: "bg-sky-100 text-sky-700",
  quote: "bg-amber-100 text-amber-700",
  contact: "bg-violet-100 text-violet-700",
};

const STAGE_STYLE = {
  new:            "bg-sky-100 text-sky-700",
  demo_scheduled: "bg-indigo-100 text-indigo-700",
  demo_given:     "bg-violet-100 text-violet-700",
  won:            "bg-emerald-100 text-emerald-700",
  lost:           "bg-red-100 text-red-600",
};
const STAGE_LABEL = {
  new:            "New",
  demo_scheduled: "Demo Scheduled",
  demo_given:     "Demo Given",
  won:            "Won",
  lost:           "Lost",
};
function StageBadge({ status }) {
  if (!status) return <span className="text-slate-300 text-xs">—</span>;
  return (
    <span data-testid="lead-stage-badge"
      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${STAGE_STYLE[status] || "bg-slate-100 text-slate-500"}`}>
      {STAGE_LABEL[status] || status}
    </span>
  );
}

function Chip({ label, value, accent }) {
  return (
    <div
      data-testid={`leads-chip-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
      className="flex-1 min-w-[140px] rounded-xl border border-slate-200 bg-white px-4 py-3"
    >
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${accent || "text-slate-800"}`}>{value}</div>
    </div>
  );
}

function LoginGate({ onAuthed }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/cms/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error("Invalid username or password");
      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.token);
      onAuthed(data.token);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={submit}
        data-testid="leads-login-form"
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div className="flex items-center gap-2 text-slate-800">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <h1 className="text-lg font-semibold">Leads — Sign in</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">Internal sales triage. Authorised users only.</p>
        <input
          data-testid="leads-login-username"
          className="mt-5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />
        <input
          data-testid="leads-login-password"
          type="password"
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p data-testid="leads-login-error" className="mt-3 text-sm text-rose-600">{error}</p>}
        <button
          data-testid="leads-login-submit"
          disabled={busy}
          className="mt-5 w-full rounded-lg bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function LeadsView() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  const [filters, setFilters] = useState({
    type: "", verified: false, paid: false, city: "", date_from: "", date_to: "", q: "",
    stage: "",
  });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const searchTimer = useRef(null);

  // Funnel state
  const [funnelData, setFunnelData] = useState(null);
  const [funnelBySource, setFunnelBySource] = useState(null);
  const [lostData, setLostData] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [funnelFilters, setFunnelFilters] = useState({ date_from: "", date_to: "", source: "", type: "" });
  const [activeTab, setActiveTab] = useState("funnel"); // "funnel" | "ads"

  // Validate existing token on mount
  useEffect(() => {
    if (!token) { setChecking(false); return; }
    fetch(`${API}/api/cms/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => { if (r.ok) setAuthed(true); else { localStorage.removeItem(TOKEN_KEY); setToken(null); } })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [token]);

  const buildQuery = useCallback((overrides = {}) => {
    const f = { ...filters, ...overrides };
    const p = new URLSearchParams();
    if (f.type) p.set("type", f.type);
    if (f.verified) p.set("verified", "true");
    if (f.paid) p.set("paid", "true");
    if (f.city) p.set("city", f.city);
    if (f.date_from) p.set("date_from", f.date_from);
    if (f.date_to) p.set("date_to", `${f.date_to}T23:59:59`);
    if (f.q) p.set("q", f.q);
    if (f.stage) p.set("stage", f.stage);
    return p;
  }, [filters]);

  const load = useCallback(async (pageArg = 1, overrides = {}) => {
    if (!token || !authed) return;
    setLoading(true);
    try {
      const p = buildQuery(overrides);
      p.set("page", String(pageArg));
      p.set("page_size", "25");
      const res = await fetch(`${API}/api/cms/leads?${p.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { localStorage.removeItem(TOKEN_KEY); setToken(null); setAuthed(false); return; }
      const json = await res.json();
      setData(json);
      setPage(pageArg);
    } finally {
      setLoading(false);
    }
  }, [token, authed, buildQuery]);

  // Reload when filters (except free-text, which is debounced) change
  useEffect(() => {
    if (!authed) return;
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, filters.type, filters.verified, filters.paid, filters.city, filters.date_from, filters.date_to, filters.stage]);

  // Load funnel data
  const loadFunnel = useCallback(async () => {
    if (!token || !authed) return;
    const p = new URLSearchParams();
    if (funnelFilters.date_from) p.set("date_from", funnelFilters.date_from);
    if (funnelFilters.date_to) p.set("date_to", funnelFilters.date_to);
    if (funnelFilters.source) p.set("source", funnelFilters.source);
    if (funnelFilters.type) p.set("type", funnelFilters.type);
    const h = { Authorization: `Bearer ${token}` };
    const safeJson = (r) => r.ok ? r.json() : Promise.reject(r.status);
    const [s, b, l, sync] = await Promise.allSettled([
      fetch(`${API}/api/cms/funnel/summary?${p}`, { headers: h }).then(safeJson),
      fetch(`${API}/api/cms/funnel/by-source?${p}`, { headers: h }).then(safeJson),
      fetch(`${API}/api/cms/funnel/lost?${p}`, { headers: h }).then(safeJson),
      fetch(`${API}/api/cms/sync/status`, { headers: h }).then(safeJson),
    ]);
    if (s.status === "fulfilled") setFunnelData(s.value);
    if (b.status === "fulfilled") setFunnelBySource(b.value);
    if (l.status === "fulfilled") setLostData(l.value);
    if (sync.status === "fulfilled") setSyncStatus(sync.value);
  }, [token, authed, funnelFilters]);

  useEffect(() => { if (authed) loadFunnel(); }, [authed, funnelFilters]);

  const handleSyncNow = async () => {
    await fetch(`${API}/api/cms/sync/trigger`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success("Sync started");
    setTimeout(() => loadFunnel(), 5000);
  };

  const onSearch = (val) => {
    setFilters((f) => ({ ...f, q: val }));
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(1, { q: val }), 350);
  };

  const exportCsv = async () => {
    try {
      const p = buildQuery();
      p.set("page", "1");
      p.set("page_size", "1000");
      const res = await fetch(`${API}/api/cms/leads?${p.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("export failed");
      const json = await res.json();
      const cols = ["created_at", "type", "intent", "name", "phone", "email", "city",
        "otp_verified", "paid", "source", "medium", "campaign", "ad_set", "ad_name", "keyword",
        "summary", "freshsales_contact_id", "crm_status", "crm_lost_reason"];
      const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const lines = [cols.join(",")];
      (json.items || []).forEach((r) => lines.push(cols.map((c) => esc(r[c])).join(",")));
      const blob = new Blob([lines.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mygenie-leads-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${(json.items || []).length} leads`);
    } catch {
      toast.error("CSV export failed");
    }
  };

  const signOut = () => { localStorage.removeItem(TOKEN_KEY); setToken(null); setAuthed(false); };

  const [deleteTarget, setDeleteTarget] = useState(null);
  const handleDeleteLead = async () => {
    if (!deleteTarget) return;
    const { type, id, freshsales_contact_id } = deleteTarget;
    const delType = type === "demo" ? "demo" : type === "quote" ? "quote" : type === "contact" ? "contact" : "backfilled";
    const delId = delType === "backfilled" ? freshsales_contact_id : id;
    try {
      const res = await fetch(`${API}/api/cms/leads/${delType}/${delId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Lead deleted from dashboard");
      setDeleteTarget(null);
      load(page);
    } catch { toast.error("Failed to delete lead"); }
  };

  const summary = data?.summary;
  const verifiedPct = useMemo(() => {
    if (!summary?.demo_total) return "—";
    return `${Math.round((summary.verified / summary.demo_total) * 100)}%`;
  }, [summary]);

  if (checking) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>;
  if (!authed) return <LoginGate onAuthed={(t) => { setToken(t); setAuthed(true); }} />;

  const fmtDate = (s) => {
    if (!s) return "—";
    const d = new Date(s);
    return isNaN(d) ? s : d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800" data-testid="leads-title">
              {activeTab === "ads" ? "Ads Intelligence" : "Leads"}
            </h1>
            <p className="text-sm text-slate-500">
              {activeTab === "ads"
                ? "Campaign · keyword · creative · landing page performance"
                : "Read-only sales triage — Demo, Quote/Buy & Contact"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Tab switcher */}
            <div data-testid="leads-tab-bar" className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold">
              <button
                data-testid="tab-funnel-leads"
                onClick={() => setActiveTab("funnel")}
                className={`px-4 py-2 transition-colors ${activeTab === "funnel" ? "bg-slate-900 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
              >
                Leads &amp; Funnel
              </button>
              <button
                data-testid="tab-ads-intel"
                onClick={() => setActiveTab("ads")}
                className={`px-4 py-2 transition-colors border-l border-slate-200 ${activeTab === "ads" ? "bg-slate-900 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
              >
                Ads Intelligence
              </button>
            </div>
            {activeTab === "funnel" && (
              <>
                <button data-testid="leads-sync-crm" onClick={async () => {
                  try {
                    await fetch(`${API}/api/cms/sync/trigger`, {
                      method: "POST", headers: { Authorization: `Bearer ${token}` },
                    });
                    toast.success("CRM sync started (stage + source sync in background)");
                    setTimeout(() => { load(page); loadFunnel(); }, 8000);
                  } catch { toast.error("Sync failed"); }
                }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-100">
                  <RefreshCw className="h-4 w-4" /> Sync CRM
                </button>
                <button data-testid="leads-refresh" onClick={() => load(page)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                </button>
                <button data-testid="leads-export-csv" onClick={exportCsv}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
                  <Download className="h-4 w-4" /> Export CSV
                </button>
              </>
            )}
            <button data-testid="leads-signout" onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 flex flex-col gap-6">
        {activeTab === "ads" ? (
          <AdsIntelTab token={token} />
        ) : (
          <>

        {/* ── Funnel filter bar ── */}
        <section data-testid="funnel-filter-bar" className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex flex-wrap items-center gap-3 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Funnel Filters</span>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-xs text-slate-500">From</label>
            <input type="date" data-testid="funnel-filter-date-from"
              value={funnelFilters.date_from}
              onChange={e => setFunnelFilters(f => ({ ...f, date_from: e.target.value }))}
              className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-700 outline-none" />
            <span className="text-slate-400">→</span>
            <input type="date" data-testid="funnel-filter-date-to"
              value={funnelFilters.date_to}
              onChange={e => setFunnelFilters(f => ({ ...f, date_to: e.target.value }))}
              className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-700 outline-none" />
          </div>
          <select data-testid="funnel-filter-source"
            value={funnelFilters.source}
            onChange={e => setFunnelFilters(f => ({ ...f, source: e.target.value }))}
            className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-700 outline-none">
            <option value="">All sources</option>
            <option value="google_paid">Google Paid</option>
            <option value="meta">Meta</option>
            <option value="organic">Organic</option>
            <option value="direct">Direct</option>
            <option value="legacy">Legacy</option>
          </select>
          <select data-testid="funnel-filter-type"
            value={funnelFilters.type}
            onChange={e => setFunnelFilters(f => ({ ...f, type: e.target.value }))}
            className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-700 outline-none">
            <option value="">All types</option>
            <option value="demo">Demo</option>
            <option value="quote">Quote / Buy</option>
            <option value="contact">Contact</option>
          </select>
          <button data-testid="funnel-filter-apply"
            onClick={() => loadFunnel()}
            className="rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700">Apply</button>
          <button data-testid="funnel-filter-reset"
            onClick={() => setFunnelFilters({ date_from: "", date_to: "", source: "", type: "" })}
            className="rounded border border-slate-300 px-3 py-1 text-xs text-slate-500 hover:bg-slate-50">Reset</button>
        </section>

        {/* ── Funnel summary ── */}
        <FunnelPanel data={funnelData} loading={!funnelData} />

        {/* ── Funnel by source ── */}
        <FunnelBySource data={funnelBySource} loading={!funnelBySource} />

        {/* ── Attribution breakdown (keyword + ad set) ── */}
        <AttributionBreakdown
          token={token}
          dateFrom={funnelFilters.date_from}
          dateTo={funnelFilters.date_to}
          leadType={funnelFilters.type}
        />

        {/* ── Lost panel + sync status ── */}
        <div className="flex flex-col gap-3">
          <LostPanel data={lostData} loading={!lostData} />
          <SyncStatus data={syncStatus} onSync={handleSyncNow} />
          <AdSpendUpload token={token} onUploadComplete={loadFunnel} />
        </div>

        {/* ── Summary chips ── */}
        <div className="flex flex-wrap gap-3">
          <Chip label="Total" value={summary?.total ?? "—"} />
          <Chip label="Today" value={summary?.today ?? "—"} accent="text-emerald-600" />
          <Chip label="OTP verified" value={`${summary?.verified ?? 0} (${verifiedPct})`} accent="text-sky-600" />
          <Chip label="Paid source" value={summary?.paid ?? "—"} accent="text-amber-600" />
        </div>

        {/* Filters */}
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                data-testid="leads-search"
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm outline-none focus:border-slate-500"
                placeholder="Search name, phone, email, campaign…"
                defaultValue={filters.q}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
            <select
              data-testid="leads-filter-type"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500"
              value={filters.type}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="">All types</option>
              <option value="demo">Demo</option>
              <option value="quote">Quote / Buy</option>
              <option value="contact">Contact</option>
            </select>
            <input
              data-testid="leads-filter-city"
              className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              placeholder="City"
              value={filters.city}
              onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
            />
            <input
              data-testid="leads-filter-date-from"
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 outline-none focus:border-slate-500"
              value={filters.date_from}
              onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
            />
            <span className="text-slate-400 text-sm">→</span>
            <input
              data-testid="leads-filter-date-to"
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 outline-none focus:border-slate-500"
              value={filters.date_to}
              onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="h-3.5 w-3.5" /> Quick filters:
            </span>
            <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                data-testid="leads-filter-verified"
                type="checkbox"
                checked={filters.verified}
                onChange={(e) => setFilters((f) => ({ ...f, verified: e.target.checked }))}
              />
              OTP-verified only
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                data-testid="leads-filter-paid"
                type="checkbox"
                checked={filters.paid}
                onChange={(e) => setFilters((f) => ({ ...f, paid: e.target.checked }))}
              />
              Paid source only (gclid / fbclid)
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-red-600 cursor-pointer">
              <input
                data-testid="leads-filter-lost"
                type="checkbox"
                checked={filters.stage === "lost"}
                onChange={(e) => setFilters((f) => ({ ...f, stage: e.target.checked ? "lost" : "" }))}
              />
              Lost leads only
            </label>
          </div>
        </div>

        {/* Table */}
        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm" data-testid="leads-table">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Campaign / Ad Set / Ad</th>
                <th className="px-4 py-3">Search Term</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">CRM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-400">Loading…</td></tr>
              )}
              {!loading && (data?.items || []).length === 0 && (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-400" data-testid="leads-empty">No leads match these filters.</td></tr>
              )}
              {!loading && (data?.items || []).map((r) => (
                <tr key={`${r.type}-${r.id}`} className="hover:bg-slate-50" data-testid="leads-row">
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLE[r.type]}`}>
                      {r.intent}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 flex items-center gap-1.5">
                      {r.name || "—"}
                      {r.otp_verified === true && (
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" title="OTP verified" />
                      )}
                    </div>
                    <div className="text-slate-500">{r.phone}</div>
                    {r.email && <div className="text-slate-400 text-xs">{r.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.city || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <SourceBadge source={r.source} />
                      {r.paid && (
                        <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 w-fit">PAID</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-[180px]">
                    {r.campaign && <div className="truncate font-medium text-slate-700" title={r.campaign}>{r.campaign}</div>}
                    {r.ad_set   && <div className="truncate text-slate-500 mt-0.5" title={r.ad_set}><span className="text-[10px] text-slate-400 uppercase tracking-wide">Ad Set · </span>{r.ad_set}</div>}
                    {r.ad_name  && <div className="truncate text-slate-500 mt-0.5" title={r.ad_name}><span className="text-[10px] text-slate-400 uppercase tracking-wide">Ad · </span>{r.ad_name}</div>}
                    {!r.campaign && !r.ad_set && !r.ad_name && <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs max-w-[140px]">
                    {r.keyword
                      ? <span className="inline-block bg-slate-100 text-slate-700 rounded px-1.5 py-0.5 font-mono truncate max-w-full" title={r.keyword}>{r.keyword}</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs">
                    <div className="truncate" title={r.summary}>{r.summary}</div>
                    {r.device && (
                      <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-400">
                        {r.device === "mobile" ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                        {r.device}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StageBadge status={r.crm_status} /></td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">{fmtDate(r.created_at)}</td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                    {r.freshsales_url ? (
                      <a href={r.freshsales_url} target="_blank" rel="noreferrer"
                        data-testid="leads-freshsales-link"
                        className="inline-flex items-center gap-1 text-xs text-sky-600 hover:underline">
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : <span className="text-slate-300 text-xs">—</span>}
                    <button
                      data-testid="leads-delete-btn"
                      onClick={() => setDeleteTarget(r)}
                      className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                      title="Delete from dashboard"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span data-testid="leads-page-info">Page {data.page} of {data.pages} · {data.total} leads</span>
            <div className="flex gap-2">
              <button
                data-testid="leads-prev-page"
                disabled={page <= 1}
                onClick={() => load(page - 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40 hover:bg-white"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <button
                data-testid="leads-next-page"
                disabled={page >= data.pages}
                onClick={() => load(page + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40 hover:bg-white"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
          </>
        )}

        {/* Delete confirmation modal */}
        {deleteTarget && (
          <div data-testid="delete-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div data-testid="delete-modal" className="bg-white rounded-xl shadow-lg max-w-sm w-full mx-4 p-6">
              <h3 className="text-lg font-semibold text-slate-800">Delete Lead?</h3>
              <p className="mt-2 text-sm text-slate-600">
                This will permanently remove <strong>{deleteTarget.name || deleteTarget.phone}</strong> from the dashboard.
              </p>
              <p className="mt-1 text-xs text-amber-600 bg-amber-50 rounded px-2 py-1.5">
                The contact will remain in Freshsales. This cannot be undone.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button data-testid="delete-modal-cancel" onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button data-testid="delete-modal-confirm" onClick={handleDeleteLead}
                  className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
