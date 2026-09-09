// Phase 2c helper — list merge utilities for sector/product detail pages.
//
// These lists have no stable per-row id (pains, solutions, proof, modules),
// so we merge by INDEX. lockItems mode in EditableList guarantees the index
// is stable across edits (no add/delete/reorder), which makes this safe.
//
// preserveKeys: keys on the base item that the CMS override must NEVER
// touch (typically code-controlled fields like `icon` for solutions/modules).

export function parseListJson(raw) {
  if (raw == null) return null;
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== "string") return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function mergeByIndex(base, overrideRaw, preserveKeys = []) {
  const override = parseListJson(overrideRaw);
  if (!Array.isArray(override)) return base;
  return base.map((b, i) => {
    const o = override[i];
    if (!o || typeof o !== "object") return b;
    const merged = { ...b };
    for (const k of Object.keys(o)) {
      if (preserveKeys.includes(k)) continue; // code-controlled
      const v = o[k];
      if (v === undefined || v === null || v === "") continue; // empty → keep base
      if (k === "caps" && Array.isArray(v)) merged[k] = v.map((s) => String(s)).filter(Boolean);
      else merged[k] = v;
    }
    return merged;
  });
}
