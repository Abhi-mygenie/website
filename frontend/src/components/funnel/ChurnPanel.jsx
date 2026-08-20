import { useEffect, useState, useMemo } from "react";
import { RefreshCw, Search, MessageCircle, Phone, Download } from "lucide-react";
import * as XLSX from "xlsx";

const API = process.env.REACT_APP_BACKEND_URL;

const BUCKETS = [
  {
    key: "d3",
    label: "3 Days No Order",
    sub: "3–6 days silent",
    topBorder: "border-t-[3px] border-t-yellow-400",
    numCls: "text-yellow-600",
    selCls: "ring-2 ring-yellow-400 bg-yellow-50",
  },
  {
    key: "d7",
    label: "7 Days No Order",
    sub: "7–29 days silent",
    topBorder: "border-t-[3px] border-t-amber-500",
    numCls: "text-amber-600",
    selCls: "ring-2 ring-amber-500 bg-amber-50",
  },
  {
    key: "d30",
    label: "30 Days No Order",
    sub: "30–59 days silent",
    topBorder: "border-t-[3px] border-t-orange-500",
    numCls: "text-orange-600",
    selCls: "ring-2 ring-orange-500 bg-orange-50",
  },
  {
    key: "d30plus",
    label: "60+ Days No Order",
    sub: "No activity for 60+ days",
    topBorder: "border-t-[3px] border-t-red-500",
    numCls: "text-red-600",
    selCls: "ring-2 ring-red-500 bg-red-50",
  },
];

const PAGE_SIZE = 25;

function fmtRevenue(n) {
  if (!n) return "₹0";
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function fmtLastOrder(iso) {
  if (!iso) return { date: "—", time: "" };
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  return { date, time };
}

function InactivePill({ days }) {
  const cls =
    days >= 30 ? "bg-red-100 text-red-700" :
    days >= 7  ? "bg-orange-100 text-orange-700" :
    days >= 3  ? "bg-amber-100 text-amber-700" :
                 "bg-green-100 text-green-700";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {days}d
    </span>
  );
}

export default function ChurnPanel({ token }) {
  const [raw, setRaw]                   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [activeBucket, setActiveBucket] = useState(null);
  const [search, setSearch]             = useState("");
  const [sortKey, setSortKey]           = useState("inactive_days");
  const [sortDir, setSortDir]           = useState("desc");
  const [page, setPage]                 = useState(1);
  const [filterActive, setFilterActive] = useState(true);
  const [filterStatus, setFilterStatus] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/cms/churn-report`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRaw(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    if (!raw) return [];
    let rows = raw.records;
    if (activeBucket) rows = rows.filter((r) => r.bucket === activeBucket);
    if (filterActive) rows = rows.filter((r) => r.active === 1);
    if (filterStatus) rows = rows.filter((r) => r.status === 1);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.restaurant_name.toLowerCase().includes(q));
    }
    rows = [...rows].sort((a, b) => {
      const va = a[sortKey] ?? 0;
      const vb = b[sortKey] ?? 0;
      return sortDir === "desc" ? vb - va : va - vb;
    });
    return rows;
  }, [raw, activeBucket, search, sortKey, sortDir, filterActive, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
    setPage(1);
  };

  const sortIcon = (key) =>
    sortKey === key ? (sortDir === "desc" ? " ↓" : " ↑") : " ↕";

  const activeYesCount = useMemo(() => raw?.records.filter((r) => r.active === 1).length ?? 0, [raw]);
  const statusYesCount = useMemo(() => raw?.records.filter((r) => r.status === 1).length ?? 0, [raw]);

  const BUCKET_LABELS = { d3: "3 Days", d7: "7 Days", d30: "30 Days", d30plus: "60+ Days" };

  const downloadExcel = () => {
    const date = new Date().toISOString().slice(0, 10);
    const filterMeta = [
      `Active: ${filterActive ? "Yes" : "All"}`,
      `Status: ${filterStatus ? "Yes" : "All"}`,
      `Bucket: ${activeBucket ? BUCKET_LABELS[activeBucket] : "All"}`,
      search.trim() ? `Search: "${search.trim()}"` : null,
      `Sorted by: ${sortKey} ${sortDir === "desc" ? "↓" : "↑"}`,
    ].filter(Boolean).join("  |  ");

    const rows = filtered.map((r) => ({
      "Restaurant ID":       r.restaurant_id ?? "",
      "Restaurant Name":     r.restaurant_name ?? "",
      "Last Order Date":     r.last_order ? r.last_order.slice(0, 10) : "—",
      "Inactive Days":       r.inactive_days ?? 0,
      "Orders Last 7d":      r.orders_last_7_days ?? 0,
      "Orders Last 30d":     r.orders_last_30_days ?? 0,
      "Revenue Last 30d (₹)":r.last_30_days_revenue ?? 0,
      "Active":              r.active === 1 ? "Yes" : "No",
      "Status":              r.status === 1 ? "Yes" : "No",
      "Churn Bucket":        BUCKET_LABELS[r.bucket] ?? r.bucket,
    }));

    const ws = XLSX.utils.aoa_to_sheet([
      ["MyGenie — Churned Clients Report"],
      [`Generated: ${date}    Filters: ${filterMeta}    Total rows: ${filtered.length}`],
      [],
    ]);
    XLSX.utils.sheet_add_json(ws, rows, { origin: "A4", skipHeader: false });

    // Bold header row (row 4)
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 3, c })];
      if (cell) cell.s = { font: { bold: true } };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Churned Clients");

    const bucketSlug = activeBucket ? `_${activeBucket}` : "_all";
    const activeSlug = filterActive ? "_active-yes" : "";
    const statusSlug = filterStatus ? "_status-yes" : "";
    XLSX.writeFile(wb, `churn-report${bucketSlug}${activeSlug}${statusSlug}_${date}.xlsx`);
  };

  const revenueAtRisk = useMemo(() => {
    if (!raw) return 0;
    return raw.records
      .filter((r) => r.bucket === "d30")
      .reduce((acc, r) => acc + (r.last_30_days_revenue || 0), 0);
  }, [raw]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        <RefreshCw className="animate-spin h-4 w-4 mr-2" /> Loading churn data…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        Failed to load churn report: {error}
        <button onClick={load} className="ml-3 underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5" data-testid="churn-panel">

      {/* Summary stats row */}
      <div className="flex items-center gap-8">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Total Clients</span>
          <div className="text-2xl font-extrabold text-slate-800" data-testid="churn-total-clients">{raw?.total_all ?? 0}</div>
        </div>
        <div className="w-px h-10 bg-slate-200" />
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Active</span>
          <div className="text-2xl font-extrabold text-emerald-600" data-testid="churn-active-count">{raw?.active_count ?? 0}</div>
          <div className="text-[10px] text-slate-400">ordered in last 2 days</div>
        </div>
        <div className="w-px h-10 bg-slate-200" />
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-teal-500">Active 7D</span>
          <div className="text-2xl font-extrabold text-teal-600" data-testid="churn-active-7d-count">{raw?.active_7_count ?? 0}</div>
          <div className="text-[10px] text-slate-400">ordered in last 7 days</div>
        </div>
        <div className="w-px h-10 bg-slate-200" />
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-red-400">At Risk</span>
          <div className="text-2xl font-extrabold text-red-500" data-testid="churn-at-risk-count">{raw?.at_risk_count ?? 0}</div>
          <div className="text-[10px] text-slate-400">not ordered in 7+ days</div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {BUCKETS.map((b) => {
          const count    = raw?.counts?.[b.key] ?? 0;
          const isActive = activeBucket === b.key;
          return (
            <button
              key={b.key}
              data-testid={`churn-card-${b.key}`}
              onClick={() => { setActiveBucket(isActive ? null : b.key); setPage(1); }}
              className={`rounded-xl border bg-white px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${b.topBorder} ${isActive ? b.selCls : ""}`}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {b.label}
              </div>
              <div className={`mt-1 text-3xl font-extrabold leading-none ${b.numCls}`}>
                {count}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">{b.sub}</div>
              <div className="mt-2 text-[10px] text-slate-300">Click to filter</div>
            </button>
          );
        })}
      </div>

      {/* Revenue at risk banner */}
      {revenueAtRisk > 0 && (
        <div
          data-testid="churn-revenue-banner"
          className="flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 px-5 py-3"
        >
          <div>
            <div className="text-sm font-semibold text-orange-800">
              Revenue at Risk — clients with no orders in last 30 days
            </div>
            <div className="mt-0.5 text-xs text-orange-600">
              {raw?.counts?.d3 ?? 0} went silent in 3d &nbsp;·&nbsp;
              {raw?.counts?.d7 ?? 0} in 7d &nbsp;·&nbsp;
              {raw?.counts?.d30 ?? 0} in 30d &nbsp;·&nbsp;
              {raw?.counts?.d30plus ?? 0} over 30d
            </div>
          </div>
          <div className="text-xl font-extrabold text-orange-700">
            {fmtRevenue(revenueAtRisk)}
          </div>
        </div>
      )}

      {/* Search + count row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            data-testid="churn-search"
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm outline-none focus:border-slate-500"
            placeholder="Search restaurant name…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <button
          data-testid="churn-toggle-active"
          onClick={() => { setFilterActive((v) => !v); setPage(1); }}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
            filterActive
              ? "bg-emerald-100 text-emerald-700 border-emerald-300"
              : "bg-white text-slate-500 border-slate-300 hover:bg-slate-50"
          }`}
        >
          Active: {filterActive ? "Yes" : "All"} <span className="ml-1 font-bold">{activeYesCount}</span>
        </button>
        <button
          data-testid="churn-toggle-status"
          onClick={() => { setFilterStatus((v) => !v); setPage(1); }}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
            filterStatus
              ? "bg-emerald-100 text-emerald-700 border-emerald-300"
              : "bg-white text-slate-500 border-slate-300 hover:bg-slate-50"
          }`}
        >
          Status: {filterStatus ? "Yes" : "All"} <span className="ml-1 font-bold">{statusYesCount}</span>
        </button>
        <span className="text-xs text-slate-400">
          {filtered.length} of {raw?.total ?? 0} &nbsp;|&nbsp;
          {activeBucket
            ? BUCKETS.find((b) => b.key === activeBucket)?.label
            : "All buckets"}
        </span>
        <button
          data-testid="churn-refresh"
          onClick={load}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
        <button
          data-testid="churn-download-excel"
          onClick={downloadExcel}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-100 font-medium"
        >
          <Download className="h-3.5 w-3.5" /> Download Excel
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Restaurant ID</th>
              <th className="px-4 py-3 text-left font-semibold">Restaurant</th>
              <th
                className="px-4 py-3 text-left font-semibold cursor-pointer hover:text-slate-600 whitespace-nowrap"
                onClick={() => toggleSort("inactive_days")}
              >
                Last Order{sortIcon("inactive_days")}
              </th>
              <th
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:text-slate-600 whitespace-nowrap"
                onClick={() => toggleSort("orders_last_7_days")}
              >
                Orders 7d{sortIcon("orders_last_7_days")}
              </th>
              <th
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:text-slate-600 whitespace-nowrap"
                onClick={() => toggleSort("orders_last_30_days")}
              >
                Orders 30d{sortIcon("orders_last_30_days")}
              </th>
              <th
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:text-slate-600 whitespace-nowrap"
                onClick={() => toggleSort("last_30_days_revenue")}
              >
                Revenue 30d{sortIcon("last_30_days_revenue")}
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Active</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-slate-400 text-sm">


                  No records found{activeBucket ? " for this bucket" : ""}.
                </td>
              </tr>
            )}
            {pageRows.map((r, i) => {
              const lo = fmtLastOrder(r.last_order);
              return (
                <tr
                  key={r.restaurant_id ?? i}
                  className="border-t border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 text-xs font-mono text-slate-400 whitespace-nowrap" data-testid="churn-row-id">
                    {r.restaurant_id ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="font-semibold text-slate-800 text-sm"
                      data-testid="churn-row-name"
                    >
                      {r.restaurant_name}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-700">{lo.date}</div>
                    <div className="text-xs text-slate-400">{lo.time}</div>
                    <div className="mt-1">
                      <InactivePill days={r.inactive_days} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-bold text-sm ${
                        r.orders_last_7_days === 0 ? "text-slate-300" : "text-slate-800"
                      }`}
                    >
                      {r.orders_last_7_days.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-semibold text-sm ${
                        r.orders_last_30_days === 0 ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      {r.orders_last_30_days.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-semibold text-sm ${
                        r.last_30_days_revenue === 0 ? "text-slate-300" : "text-slate-800"
                      }`}
                    >
                      {fmtRevenue(r.last_30_days_revenue)}
                    </span>
                  </td>
                  <td className="px-4 py-3" data-testid="churn-row-active">
                    {r.active === 1
                      ? <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-700">Yes</span>
                      : r.active === 0
                      ? <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-red-100 text-red-600">No</span>
                      : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3" data-testid="churn-row-status">
                    {r.status === 1
                      ? <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-700">Yes</span>
                      : r.status === 0
                      ? <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-red-100 text-red-600">No</span>
                      : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        data-testid="churn-row-whatsapp"
                        href={`https://wa.me/?text=Hi+${encodeURIComponent(r.restaurant_name)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-[#25D366] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#1da851] transition-colors"
                      >
                        <MessageCircle className="h-3 w-3" /> WhatsApp
                      </a>
                      <button
                        data-testid="churn-row-call"
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Phone className="h-3 w-3" /> Call
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <span>
            Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-1">
            <button
              data-testid="churn-page-prev"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded border border-slate-200 px-2.5 py-1 hover:bg-slate-50 disabled:opacity-40"
            >
              ←
            </button>
            <span className="rounded border border-slate-200 bg-slate-800 text-white px-2.5 py-1">
              {page}
            </span>
            <button
              data-testid="churn-page-next"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded border border-slate-200 px-2.5 py-1 hover:bg-slate-50 disabled:opacity-40"
            >
              →
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
