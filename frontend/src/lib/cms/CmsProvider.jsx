import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const API = process.env.REACT_APP_BACKEND_URL;
const TOKEN_KEY = "cms_token";
const EDITMODE_KEY = "cms.editMode";
const PREVIEW_KEY = "cms.preview";

const CmsContext = createContext(null);

export const useCms = () => useContext(CmsContext);

async function apiGet(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || res.statusText);
  }
  return res.json();
}

async function apiSend(path, method, body, token) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.detail || res.statusText);
  }
  return res.json();
}

export function CmsProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [user, setUser] = useState(null);
  const [published, setPublished] = useState({});
  const [draft, setDraft] = useState({});
  const [hasDraft, setHasDraft] = useState(false);
  const [editMode, setEditMode] = useState(() => localStorage.getItem(EDITMODE_KEY) === "true");
  const [preview, setPreview] = useState(() => localStorage.getItem(PREVIEW_KEY) === "true");
  const [loginOpen, setLoginOpen] = useState(() => {
    const q = new URLSearchParams(window.location.search);
    return q.get("admin") === "1" || window.location.hash === "#admin";
  });
  const [publishedLoaded, setPublishedLoaded] = useState(false);
  const [meta, setMeta] = useState(null);

  const isAdmin = !!user;

  // Public published content — always loaded, drives the live site.
  useEffect(() => {
    apiGet("/api/cms/content")
      .then(setPublished)
      .catch(() => {})
      .finally(() => setPublishedLoaded(true));
  }, []);

  const loadDraft = useCallback(async (tok) => {
    const d = await apiGet("/api/cms/content/draft", tok);
    setDraft(d.content || {});
    setHasDraft(!!d.has_draft);
  }, []);

  const loadMeta = useCallback(async (tok) => {
    const m = await apiGet("/api/cms/meta", tok);
    setMeta(m && m.last_published_at ? m : null);
  }, []);

  // Validate an existing token on mount.
  useEffect(() => {
    if (!token) return;
    apiGet("/api/cms/me", token)
      .then((d) => {
        setUser(d.user);
        loadDraft(token).catch(() => {});
        loadMeta(token).catch(() => {});
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      });
  }, [token, loadDraft]);

  // Admin entry shortcut: Ctrl+Shift+E.
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "E" || e.key === "e")) {
        e.preventDefault();
        if (user) setEditMode((v) => !v);
        else setLoginOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [user]);

  // Persist last-used edit/preview mode so returning admins resume where they left off.
  useEffect(() => {
    if (user) localStorage.setItem(EDITMODE_KEY, String(editMode));
  }, [editMode, user]);
  useEffect(() => {
    if (user) localStorage.setItem(PREVIEW_KEY, String(preview));
  }, [preview, user]);

  const login = useCallback(
    async (username, password) => {
      const d = await apiSend("/api/cms/login", "POST", { username, password });
      localStorage.setItem(TOKEN_KEY, d.token);
      setToken(d.token);
      setUser(d.user);
      setLoginOpen(false);
      // Restore last-used mode; first-time admin (no saved pref) lands in edit mode so pencils show.
      const savedEdit = localStorage.getItem(EDITMODE_KEY);
      setEditMode(savedEdit === null ? true : savedEdit === "true");
      setPreview(localStorage.getItem(PREVIEW_KEY) === "true");
      await loadDraft(d.token);
      loadMeta(d.token).catch(() => {});
    },
    [loadDraft, loadMeta]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setEditMode(false);
    setPreview(false);
  }, []);

  const saveField = useCallback(
    async (key, type, value) => {
      await apiSend("/api/cms/content", "PUT", { key, type, value }, token);
      setDraft((d) => ({ ...d, [key]: value }));
      setHasDraft(true);
    },
    [token]
  );

  const uploadMedia = useCallback(
    async (file, onProgress) => {
      const ext = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "";

      // Step 1: Ask backend for a presigned S3 URL (or null for local storage)
      const presignRes = await fetch(`${API}/api/cms/media/presign`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ext }),
      });
      if (!presignRes.ok) {
        const b = await presignRes.json().catch(() => ({}));
        throw new Error(b.detail || "Failed to get upload URL");
      }
      const { presign_url, name, url } = await presignRes.json();

      if (presign_url) {
        // S3 presigned flow — browser uploads directly to S3, nginx not involved
        const uploadRes = await fetch(presign_url, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
          body: file,
        });
        if (!uploadRes.ok) throw new Error("S3 upload failed — check bucket CORS allows PUT");

        // Step 2: Record the upload in MongoDB
        const confirmRes = await fetch(`${API}/api/cms/media/confirm`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ name, filename: file.name, size: file.size }),
        });
        if (!confirmRes.ok) throw new Error("Upload confirm failed");
        return url;
      }

      // Local storage fallback — original multipart POST
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API}/api/cms/media`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.detail || "Upload failed");
      }
      return (await res.json()).url;
    },
    [token]
  );

  const publishAll = useCallback(async () => {
    await apiSend("/api/cms/publish", "POST", null, token);
    const pub = await apiGet("/api/cms/content");
    setPublished(pub);
    setHasDraft(false);
    loadMeta(token).catch(() => {});
  }, [token, loadMeta]);

  const discardAll = useCallback(async () => {
    await apiSend("/api/cms/discard", "POST", null, token);
    await loadDraft(token);
  }, [token, loadDraft]);

  const showDraft = isAdmin && (editMode || preview);
  const getValue = useCallback(
    (key, fallback) => {
      const map = showDraft ? draft : published;
      const v = map[key];
      return v === undefined || v === null ? fallback : v;
    },
    [showDraft, draft, published]
  );

  const value = {
    user,
    isAdmin,
    publishedLoaded,
    meta,
    editMode,
    setEditMode,
    preview,
    setPreview,
    loginOpen,
    setLoginOpen,
    hasDraft,
    login,
    logout,
    saveField,
    uploadMedia,
    publishAll,
    discardAll,
    getValue,
  };

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
}

export function useContent(key, fallback) {
  const ctx = useContext(CmsContext);
  if (!ctx) return fallback;
  return ctx.getValue(key, fallback);
}

// --- useContentDoc -------------------------------------------------------
// Reads a single CMS key whose value is a JSON-serialised object/array and
// returns it shallow-merged onto `fallback` (so partial overrides keep
// untouched code-controlled fields). Reactive to draft/preview toggles.
//
// For arrays (e.g. AI_FEATURES, AI_FAQS) fallback should be the static
// array — published value replaces it wholesale. For objects, published
// keys win, missing keys fall back to code.
function parseDoc(raw) {
  if (raw == null) return null;
  if (typeof raw !== "string") return raw;
  try { return JSON.parse(raw); } catch { return null; }
}

function shallowMerge(base, override) {
  if (Array.isArray(override)) return override; // arrays: replace wholesale
  if (override == null) return base;
  if (typeof override !== "object") return override;
  if (!base || typeof base !== "object") return override;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const k of Object.keys(override)) out[k] = override[k];
  return out;
}

export function useContentDoc(key, fallback) {
  const ctx = useContext(CmsContext);
  if (!ctx) return fallback;
  const raw = ctx.getValue(key, null);
  const parsed = parseDoc(raw);
  if (parsed == null) return fallback;
  return shallowMerge(fallback, parsed);
}

// Save a whole JSON doc (object/array) under one CMS key. Type = "doc"
// so the CMS UI can route to nested editors later if needed.
export function useSaveDoc() {
  const ctx = useContext(CmsContext);
  return async (key, doc) => {
    if (!ctx) return;
    await ctx.saveField(key, "doc", JSON.stringify(doc));
  };
}
