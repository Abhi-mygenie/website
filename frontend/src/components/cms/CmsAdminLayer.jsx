import React, { useState } from "react";
import { Pencil, Eye, EyeOff, LogOut, X, Check } from "lucide-react";
import { useCms } from "@/lib/cms/CmsProvider";

function fmtErr(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => (e && e.msg) || JSON.stringify(e)).join(" ");
  return String(detail);
}

function timeAgo(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function LoginModal() {
  const cms = useCms();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (!cms.loginOpen) return null;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await cms.login(u, p);
    } catch (ex) {
      setErr(fmtErr(ex.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4" data-testid="cms-login-modal">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg text-brand-ink">Admin sign in</h3>
          <button type="button" onClick={() => cms.setLoginOpen(false)} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <input
          value={u}
          onChange={(e) => setU(e.target.value)}
          placeholder="Username"
          data-testid="cms-username"
          className="w-full border border-brand-line rounded-lg px-3 py-2 mb-3"
        />
        <input
          value={p}
          onChange={(e) => setP(e.target.value)}
          type="password"
          placeholder="Password"
          data-testid="cms-password"
          className="w-full border border-brand-line rounded-lg px-3 py-2 mb-3"
        />
        {err ? (
          <p className="text-red-600 text-sm mb-2" data-testid="cms-login-error">
            {err}
          </p>
        ) : null}
        <button
          disabled={busy}
          data-testid="cms-login-submit"
          className="w-full py-2.5 rounded-lg bg-brand-green text-white font-semibold disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function EditModeBar() {
  const cms = useCms();
  const [busy, setBusy] = useState("");

  if (!cms.isAdmin) return null;

  const publish = async () => {
    setBusy("publish");
    try {
      await cms.publishAll();
    } finally {
      setBusy("");
    }
  };

  const discard = async () => {
    if (!window.confirm("Discard all unpublished changes?")) return;
    setBusy("discard");
    try {
      await cms.discardAll();
    } finally {
      setBusy("");
    }
  };

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2 bg-brand-ink text-white rounded-full px-3 py-2 shadow-2xl"
      data-testid="cms-editbar"
    >
      <span className="text-xs font-bold px-2 hidden sm:block">CMS</span>
      <button
        onClick={() => cms.setEditMode(!cms.editMode)}
        data-testid="cms-toggle-edit"
        className={`text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 ${cms.editMode ? "bg-brand-green" : "bg-white/10"}`}
      >
        <Pencil className="w-3.5 h-3.5" /> {cms.editMode ? "Editing" : "Edit"}
      </button>
      <button
        onClick={() => cms.setPreview(!cms.preview)}
        data-testid="cms-toggle-preview"
        className={`text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 ${cms.preview ? "bg-brand-orange" : "bg-white/10"}`}
      >
        {cms.preview ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />} Preview
      </button>
      <button
        onClick={publish}
        disabled={!cms.hasDraft || !!busy}
        data-testid="cms-publish"
        className="text-sm px-3 py-1.5 rounded-full bg-white text-brand-ink font-semibold flex items-center gap-1.5 disabled:opacity-40"
      >
        <Check className="w-3.5 h-3.5" /> {busy === "publish" ? "Publishing…" : "Publish"}
        {cms.hasDraft ? <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" /> : null}
      </button>
      <button
        onClick={discard}
        disabled={!cms.hasDraft || !!busy}
        data-testid="cms-discard"
        className="text-xs px-2 py-1.5 rounded-full bg-white/10 disabled:opacity-40"
      >
        Discard
      </button>
      <button onClick={cms.logout} title="Sign out" data-testid="cms-logout" className="text-xs px-2 py-1.5 rounded-full bg-white/10">
        <LogOut className="w-3.5 h-3.5" />
      </button>
      {cms.meta && cms.meta.last_published_at ? (
        <span className="text-[11px] text-white/55 pl-2 pr-1 hidden lg:block border-l border-white/15" data-testid="cms-last-published">
          Published {timeAgo(cms.meta.last_published_at)}
          {cms.meta.last_published_by ? ` · ${cms.meta.last_published_by}` : ""}
        </span>
      ) : null}
    </div>
  );
}

export default function CmsAdminLayer() {
  return (
    <>
      <LoginModal />
      <EditModeBar />
    </>
  );
}
