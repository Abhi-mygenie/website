import React, { useState } from "react";

function timeAgo(isoStr) {
  if (!isoStr) return "Never";
  try {
    const diff = (Date.now() - new Date(isoStr).getTime()) / 1000;
    if (diff < 60)      return "Just now";
    if (diff < 3600)    return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400)   return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  } catch {
    return "—";
  }
}

export default function SyncStatus({ data, onSync }) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try { await onSync(); } finally {
      setTimeout(() => setSyncing(false), 3000);
    }
  };

  if (!data) return null;

  return (
    <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-400 bg-white border border-slate-200 rounded-lg shadow-sm">
      <span data-testid="sync-status-text">
        Last sync:{" "}
        <span className="text-slate-600 font-medium">{timeAgo(data.last_sync_at)}</span>
        {data.contacts_updated > 0 && (
          <> · <span className="text-slate-500">{data.contacts_updated} contacts updated</span></>
        )}
        {data.errors > 0 && (
          <> · <span className="text-red-500">{data.errors} errors</span></>
        )}
      </span>
      <button
        data-testid="sync-now-btn"
        onClick={handleSync}
        disabled={syncing}
        className="ml-4 rounded border border-slate-300 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1 flex-shrink-0"
      >
        {syncing ? "Syncing…" : "↻ Sync now"}
      </button>
    </div>
  );
}
