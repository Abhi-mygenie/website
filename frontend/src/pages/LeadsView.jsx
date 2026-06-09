import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Search, Download, ExternalLink, ShieldCheck, Filter, RefreshCw,
  LogOut, ChevronLeft, ChevronRight, Smartphone, Monitor,
} from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;
const TOKEN_KEY = "cms_token";

const TYPE_STYLE = {
  demo: "bg-sky-100 text-sky-700",
  quote: "bg-amber-100 text-amber-700",
  contact: "bg-violet-100 text-violet-700",
};

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
  });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const searchTimer = useRef(null);

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
  }, [authed, filters.type, filters.verified, filters.paid, filters.city, filters.date_from, filters.date_to]);

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
        "otp_verified", "paid", "source", "medium", "campaign", "summary", "freshsales_contact_id"];
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
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800" data-testid="leads-title">Leads</h1>
            <p className="text-sm text-slate-500">Read-only sales triage — Demo, Quote/Buy & Contact</p>
          </div>
          <div className="flex items-center gap-2">
            <button data-testid="leads-refresh" onClick={() => load(page)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button data-testid="leads-export-csv" onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button data-testid="leads-signout" onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* Summary chips */}
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
                <th className="px-4 py-3">Source / Campaign</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">CRM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Loading…</td></tr>
              )}
              {!loading && (data?.items || []).length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400" data-testid="leads-empty">No leads match these filters.</td></tr>
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
                    <div className="flex items-center gap-1.5 text-slate-700">
                      {r.source || "direct"}
                      {r.paid && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">PAID</span>
                      )}
                    </div>
                    {r.campaign && <div className="text-xs text-slate-400">{r.campaign}</div>}
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
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">{fmtDate(r.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {r.freshsales_url ? (
                      <a href={r.freshsales_url} target="_blank" rel="noreferrer"
                        data-testid="leads-freshsales-link"
                        className="inline-flex items-center gap-1 text-xs text-sky-600 hover:underline">
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : <span className="text-slate-300 text-xs">—</span>}
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
      </main>
    </div>
  );
}
