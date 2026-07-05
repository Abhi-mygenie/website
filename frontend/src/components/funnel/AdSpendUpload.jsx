import React, { useState, useEffect, useCallback } from "react";
import { Upload, Trash2, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

function fmtINR(n) {
  if (n == null) return "—";
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function fmtDate(d) {
  if (!d) return "—";
  return d;
}

export default function AdSpendUpload({ token, onUploadComplete }) {
  const [platform, setPlatform]       = useState("auto");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd]     = useState("");
  const [file, setFile]               = useState(null);
  const [preview, setPreview]         = useState(null);   // parsed result before confirm
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [history, setHistory]         = useState([]);
  const [showHistory, setShowHistory] = useState(true);
  const [uploadId, setUploadId]       = useState(null);   // confirmed upload id

  const headers = { Authorization: `Bearer ${token}` };

  const loadHistory = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/cms/ad-spend/history`, { headers });
      if (r.ok) setHistory(await r.json());
    } catch {}
  }, [token]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(null);
    setError("");
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("file", f);
      if (periodStart) fd.append("period_start", periodStart);
      if (periodEnd)   fd.append("period_end",   periodEnd);

      const r = await fetch(`${API}/api/cms/ad-spend/upload`, {
        method: "POST",
        headers,
        body: fd,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || "Upload failed");

      setPreview(data);
      setUploadId(data.upload_id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setPreview(null);
    setFile(null);
    setUploadId(null);
    await loadHistory();
    if (onUploadComplete) onUploadComplete();
  };

  const handleDiscard = async () => {
    if (uploadId) {
      await fetch(`${API}/api/cms/ad-spend/${uploadId}`, { method: "DELETE", headers });
    }
    setPreview(null);
    setFile(null);
    setUploadId(null);
    setError("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this upload? Cost metrics will recalculate.")) return;
    await fetch(`${API}/api/cms/ad-spend/${id}`, { method: "DELETE", headers });
    await loadHistory();
    if (onUploadComplete) onUploadComplete();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5" data-testid="ad-spend-upload">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Ad Spend Upload</h3>
        <span className="text-xs text-slate-400">Uploads CPL, CP Demo Sched, CP Demo, CP Win to the table above</span>
      </div>

      {/* Platform selector */}
      <div className="flex gap-3 mb-4">
        {[["auto", "Auto-detect"], ["google", "Google Ads"], ["meta", "Meta Ads"]].map(([val, label]) => (
          <label key={val} className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input
              type="radio" name="platform" value={val}
              checked={platform === val}
              onChange={() => setPlatform(val)}
              data-testid={`platform-${val}`}
              className="accent-emerald-600"
            />
            <span className={platform === val ? "font-semibold text-slate-800" : "text-slate-500"}>{label}</span>
          </label>
        ))}
      </div>

      {/* Period inputs — required for Google */}
      {(platform === "google" || platform === "auto") && (
        <div className="flex gap-3 mb-4 items-center">
          <span className="text-xs text-slate-500 w-28">Reporting period</span>
          <input
            type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}
            data-testid="period-start"
            className="border border-slate-200 rounded px-2 py-1 text-sm"
            placeholder="From"
          />
          <span className="text-slate-400 text-xs">→</span>
          <input
            type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)}
            data-testid="period-end"
            className="border border-slate-200 rounded px-2 py-1 text-sm"
            placeholder="To"
          />
          {platform === "meta" && (
            <span className="text-xs text-slate-400">(auto-filled from file)</span>
          )}
        </div>
      )}

      {/* File input */}
      {!preview && (
        <label
          data-testid="ad-spend-file-input-label"
          className="flex items-center gap-2 border-2 border-dashed border-slate-200 rounded-lg px-4 py-3 cursor-pointer hover:border-emerald-400 transition-colors w-full"
        >
          <Upload className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500">
            {loading ? "Parsing…" : file ? file.name : "Choose Google Ads or Meta CSV file"}
          </span>
          <input
            type="file" accept=".csv" className="hidden"
            data-testid="ad-spend-file-input"
            onChange={handleFile}
            disabled={loading}
          />
        </label>
      )}

      {/* Error */}
      {error && (
        <div data-testid="ad-spend-error" className="flex items-center gap-2 mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div data-testid="ad-spend-preview" className="mt-3 border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 flex items-center justify-between border-b border-slate-200">
            <div className="text-xs font-semibold text-slate-600">
              {preview.source === "google" ? "Google Ads (Campaign)" : preview.source === "google_keywords" ? "Google Ads (Keywords)" : "Meta Ads"} — {preview.row_count} {preview.source === "google_keywords" ? "keywords" : "campaigns"}
              &nbsp;·&nbsp;
              {fmtDate(preview.period_start)} – {fmtDate(preview.period_end)}
            </div>
            <div className="text-sm font-bold text-emerald-700">Total: {fmtINR(preview.total_spend)}</div>
          </div>
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                {preview.source === "google_keywords"
                  ? <th className="px-3 py-2 text-left text-slate-400 font-semibold uppercase tracking-wide">Keyword</th>
                  : <th className="px-3 py-2 text-left text-slate-400 font-semibold uppercase tracking-wide">Campaign</th>
                }
                {preview.source === "meta" && <th className="px-3 py-2 text-left text-slate-400 font-semibold uppercase tracking-wide">Ad Set</th>}
                {preview.source === "google_keywords" && <th className="px-3 py-2 text-left text-slate-400 font-semibold uppercase tracking-wide">Campaign</th>}
                <th className="px-3 py-2 text-right text-slate-400 font-semibold uppercase tracking-wide">Spend (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {preview.preview.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-700 max-w-xs truncate">
                    {preview.source === "google_keywords" ? (r.keyword || "—") : r.campaign}
                  </td>
                  {preview.source === "meta" && <td className="px-3 py-2 text-slate-500 max-w-xs truncate">{r.ad_set || "—"}</td>}
                  {preview.source === "google_keywords" && <td className="px-3 py-2 text-slate-500 max-w-xs truncate">{r.campaign || "—"}</td>}
                  <td className="px-3 py-2 text-right font-semibold text-slate-800">{fmtINR(r.spend)}</td>
                </tr>
              ))}
              {preview.row_count > 5 && (
                <tr>
                  <td colSpan={preview.source === "meta" || preview.source === "google_keywords" ? 3 : 2} className="px-3 py-2 text-slate-400 text-center">
                    + {preview.row_count - 5} more rows
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="flex gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50">
            <button
              data-testid="ad-spend-confirm-btn"
              onClick={handleConfirm}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-1.5 rounded transition"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Confirm & Save
            </button>
            <button
              data-testid="ad-spend-discard-btn"
              onClick={handleDiscard}
              className="text-sm text-slate-500 hover:text-red-600 px-3 py-1.5 rounded border border-slate-200 transition"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Upload history */}
      {history.length > 0 && (
        <div className="mt-5">
          <button
            className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2"
            onClick={() => setShowHistory(h => !h)}
            data-testid="toggle-history"
          >
            Upload History
            {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showHistory && (
            <div data-testid="ad-spend-history" className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
              {history.map(h => (
                <div key={h.upload_id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="font-semibold text-slate-700">
                      {h.source === "google" ? "Google" : h.source === "google_keywords" ? "Google KW" : "Meta"}
                    </span>
                    <span className="text-slate-400 text-xs">
                      {fmtDate(h.period_start)} – {fmtDate(h.period_end)}
                    </span>
                    <span className="text-slate-600 font-semibold">{fmtINR(h.total_spend)}</span>
                    <span className="text-slate-400 text-xs">{h.row_count} rows · {h.filename}</span>
                  </div>
                  <button
                    data-testid={`delete-upload-${h.upload_id}`}
                    onClick={() => handleDelete(h.upload_id)}
                    className="text-slate-300 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
