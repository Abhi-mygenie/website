# CR-162 — Emergency Redirect: /restaurant-pos-comparison → /restaurant-pos-system

**Type:** Redirect / Ad Spend Protection
**Date Raised:** 2026-08-26
**Status:** OPEN — **P0 URGENT**
**Priority:** P0 — Google Ads spend is burning to a 404 on every click
**Relationship to CR-150:** CR-150 (full `/restaurant-pos-comparison` hub page) remains OPEN. This CR is the immediate fix while CR-150 is built.

---

## 1. Problem Statement

`/restaurant-pos-comparison` currently returns a 404 (`NotFound` page with a 42-char meta description). The POS/Billing Competitors ad group (ID: 204699439852) has 14 competitor keywords pointing to this URL. Every click is wasted spend — visitors land on a "Page Not Found" error.

**This is the highest-priority gap across all registered CRs.** Every day of delay = direct ad budget loss.

---

## 2. Fix — Add redirect to existing `redirects.js`

The codebase already has a `REDIRECTS` map (`frontend/src/data/redirects.js`) that is applied:
1. **Client-side** via `<Navigate replace />` in `App.js` L113–115
2. **Server-side** mirrored in `public/_redirects` and `nginx-redirects.conf`

**File:** `frontend/src/data/redirects.js`

Add one entry to the `REDIRECTS` object:

```js
// CR-162 — Temporary redirect while /restaurant-pos-comparison is built (CR-150)
"/restaurant-pos-comparison": "/restaurant-pos-system",
```

**Why `/restaurant-pos-system`:**
- Best semantic match for competitor POS comparison intent
- Has full content, LandingNavbar, DemoForm, prerendered
- Once CR-150 is built, this redirect is removed and the real page takes over

### Alternative targets (if preferred)
- `/petpooja-alternative` — has full comparison table against Petpooja (strong conversion page)
- `/pricing` — high intent landing
- `/restaurant-pos-system` — keyword match for POS comparison intent ← recommended

---

## 3. Files to Change

| File | Operation | Lines |
|---|---|---|
| `frontend/src/data/redirects.js` | ADD 1 entry to REDIRECTS object | +2 lines |

No `App.js` change needed — `REDIRECTS` is already read in `App.js` L34 and rendered L113–115.

---

## 4. After Build

After `yarn build` + `node scripts/prerender.js`:
- `build/restaurant-pos-comparison/` will contain redirect HTML
- Verify: `curl -o /dev/null -w "%{http_code}" [url]/restaurant-pos-comparison` should follow redirect

Verify client-side redirect works:
- Visit `/restaurant-pos-comparison` in browser
- Should instantly navigate to `/restaurant-pos-system`

---

## 5. Removal condition

This redirect is **temporary**. Remove it when CR-150 (`/restaurant-pos-comparison` full page) is deployed. At that point:
- Remove from `redirects.js`
- Add `/restaurant-pos-comparison` to sitemap with `priority=0.9`

---

## 6. Definition of Done

- [ ] Visiting `/restaurant-pos-comparison` redirects to `/restaurant-pos-system` (client-side immediately)
- [ ] `build/restaurant-pos-comparison/` exists after prerender
- [ ] `/restaurant-pos-system` page loads correctly at destination
- [ ] Meta description of `/restaurant-pos-comparison` is no longer 42 chars (it now reflects the target page)
- [ ] Google Ads clicks no longer land on NotFound page

*CR-162 registered 2026-08-26. P0 — implement before any other CR. Remove when CR-150 is live.*
