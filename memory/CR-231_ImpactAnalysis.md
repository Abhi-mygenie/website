# CR-231 — Impact Analysis: WhatsApp FAB Disable

**Date:** 2026-09-08
**Priority:** P1
**Decision:** Disable via `REACT_APP_WHATSAPP_ENABLED=false`
**Source:** Dev brief 2026-09-07 · code investigation 2026-09-08

---

## 1. Problem Statement

A floating WhatsApp button (green circle, bottom-right) is visible on **every page site-wide** on mobile devices. It was intended for customer support but may be diverting paid visitors away from the demo form. The button is not tracked in GA4, making it invisible to marketing analytics.

**Data:**
- 3 `wa.me` outbound clicks caught via GA4's generic outbound-link tracking across all 5 new ad pages in 30 days
- 0 form starts from 27 paid sessions on the same pages in same period
- The button appears on the same pages that show 0% form conversion

---

## 2. Current Implementation (confirmed from source code)

### Where it renders

```jsx
// src/App.js line 151 — global, every page
{process.env.REACT_APP_WHATSAPP_ENABLED !== "false" && <WhatsAppFab />}
```

### How it works

```jsx
// src/components/site/WhatsAppFab.jsx
const href = `https://wa.me/919104743156?text=Hi, I'd like to know more...`;
// On tap: opens WhatsApp with pre-filled message
// Also fires: pushEvent("whatsapp_click", { source:"fab", page_path })
// BUT: GTM has no trigger/tag for "whatsapp_click" → invisible in GA4
```

### Visibility scope

```css
className="lg:hidden ..."   /* MOBILE ONLY — hidden on desktop (≥1024px) */
```

Renders on: every page (Homepage, all 5 ad pages, pricing, solutions, product, blog, etc.)

### Why it's currently ON

```
frontend/.env — REACT_APP_WHATSAPP_ENABLED is NOT SET
```
`undefined !== "false"` evaluates to `true` → FAB always renders.
The env var was never explicitly set; it defaults to showing.

---

## 3. Side Effect — Contact Form Also Affected

**IMPORTANT:** A second file also reads this env var:

```jsx
// src/components/site/MessageForm.jsx line 12
const WA_ENABLED = process.env.REACT_APP_WHATSAPP_ENABLED !== "false";
// Used on line 17: { value: "whatsapp", label: "WhatsApp" }
// If WA_ENABLED = false → WhatsApp option removed from contact method dropdown
```

Setting `REACT_APP_WHATSAPP_ENABLED=false` will affect **two things**:

| What changes | Visible to user |
|---|---|
| WhatsApp FAB (floating button, all pages, mobile) | Removed — green circle gone |
| WhatsApp option in `/contact` page MessageForm | Removed — "WhatsApp" choice removed from "Preferred contact method" dropdown |

The contact page WhatsApp removal is a low-impact side effect (contact page is not a paid ad landing page). Worth noting for marketing awareness.

---

## 4. What Changes

### Single env var change (no code changes)

```
File: frontend/.env
Add:  REACT_APP_WHATSAPP_ENABLED=false
```

Then rebuild and deploy.

**That is the only change.** No JSX modifications, no component deletions. The env var is read at build time by React's build tool — the FAB component is tree-shaken out of the bundle when `=false`.

---

## 5. Files Affected

| File | Change |
|---|---|
| `frontend/.env` | Add `REACT_APP_WHATSAPP_ENABLED=false` |
| `src/App.js` | No change — conditional already handles it |
| `src/components/site/WhatsAppFab.jsx` | No change — excluded by condition |
| `src/components/site/MessageForm.jsx` | No change — WA option auto-hides |

---

## 6. Risks

| Risk | Assessment |
|---|---|
| Users who relied on WhatsApp to reach support | Low — 3 clicks in 30 days site-wide. Phone number (9104743156) remains in nav bar and hero on all pages. |
| Contact page WhatsApp option removed | Low impact — `/contact` is not an ad landing page. Email and phone options remain. |
| Tracking loss | None — `whatsapp_click` was never reaching GA4 anyway (GTM not wired). |
| Reverting | Trivial — remove `=false` from `.env` → rebuild. |

---

## 7. Expected Outcomes

| Metric | Before | After |
|---|---|---|
| WhatsApp FAB visible on mobile | Yes — all pages | No |
| `wa.me` outbound clicks from ad pages | 3/30 days | 0 |
| Demo form competition on ad pages | FAB competes on mobile | Removed — only CTA is demo form |
| Contact form WhatsApp option | Available | Hidden |
| GA4 `whatsapp_click` event | Fires but unmeasured | No longer fires |

---

## 8. Verification (post-deploy)

- [ ] Open `/restaurant-pos-system` on phone (iPhone + Android) → no green WhatsApp circle in bottom-right corner
- [ ] Open `/contact` on phone → WhatsApp option absent from contact method dropdown
- [ ] Homepage mobile → no FAB
- [ ] Desktop (≥1024px) — no change expected (was already `lg:hidden`)

---

## 9. Build & Deploy Notes

- Can be batched in the **same rebuild** as CR-215B (logo reduction) and CR-230 (modal CTA)
- `REACT_APP_WHATSAPP_ENABLED` is read at **build time** (webpack env injection) — restart alone does NOT apply this change. A full `yarn build` is required.
- After deploy: Cloudflare → Purge Everything

---

*Written 2026-09-08. Investigation: App.js:151, WhatsAppFab.jsx, MessageForm.jsx:12, frontend/.env.*
