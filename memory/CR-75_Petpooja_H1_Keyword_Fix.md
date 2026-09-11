# CR-75 — Update Petpooja Alternative H1 with Keyword Relevance

**Type:** Keyword Relevance / On-Page SEO  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** IMPLEMENTED — 2026-08-20  
**Priority:** CRITICAL  
**Plan ID:** C6  
**Effort:** 15 min  
**Improves:** QS · SEO · Keyword Relevance  
**Scope:** `frontend/src/data/vsp.js`  
**Related:** CR-84 (H1 fixes for sell-serve, see-everything, cloud-kitchens), CR-111 (Petpooja meta title keyword — same page, folded into Batch 3)

---

## 1. Problem Statement

The `/petpooja-alternative` page H1 (`variant_a`) reads:
> “We get compared to Petpooja every week. Here’s the honest answer.”

This is brand-voice copy with zero searchable keywords. Users searching “Petpooja alternative”, “switch from Petpooja”, or “Petpooja competitor” see no keyword match in the H1, reducing Google’s Ad Relevance assessment for this LP.

---

## 2. Root Cause

**`frontend/src/data/vsp.js` (line 1):**
```js
export const VSP_HERO = {
  variant_a: "We get compared to Petpooja every week. Here's the honest answer.",
  ...
};
```

The H1 is rendered in `VspHero` in `PetpoojaAlternative.jsx` via `EditableText id="vsp.hero.variant_a"`.

---

## 3. Exact Changes Required

**`frontend/src/data/vsp.js` — update `variant_a`:**
```js
// BEFORE
variant_a: "We get compared to Petpooja every week. Here's the honest answer.",

// AFTER (keeps brand voice, adds keyword signal)
variant_a: "The honest Petpooja alternative — see why 500+ restaurants switched to MyGenie.",
```

Also update `variant_a_sub` for consistency if needed (optional, non-blocking).

---

## 4. Files Changed

| File | Change |
|---|---|
| `frontend/src/data/vsp.js` | Update `variant_a` H1 string to include “Petpooja alternative” keyword |

---

## 5. Definition of Done

- [ ] H1 on /petpooja-alternative renders the updated text
- [ ] Text includes “Petpooja alternative” keyword
- [ ] Brand voice maintained — no salesy or awkward phrasing
- [ ] CMS admin can still override via EditableText (no change to component logic)

---

*CR-75 registered 2026-08-20. Source: SEO & QS Audit · Plan ID C6.*
