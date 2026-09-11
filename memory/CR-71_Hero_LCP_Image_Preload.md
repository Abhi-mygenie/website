# CR-71 — Preload Hero LCP Image + Add fetchpriority to img Tag

**Type:** Performance Fix / LCP  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** IMPLEMENTED (Option B) — 2026-08-20  
**Priority:** CRITICAL  
**Plan ID:** C2 (+ GAP-5 merged)  
**Effort:** 20 min  
**Improves:** Perf · LCP · QS Landing Page Experience  
**Scope:** `frontend/public/index.html`, `frontend/src/components/home/Hero.jsx`  
**Related:** CR-70 (font preload), CR-73 (code splitting)  
**Impact Analysis Date:** 2026-08-20  
**Impact Verdict:** ✅ PROCEED — Both changes safe. Critical CMS nuance documented (see Finding 7 + 8). Preload benefit only verifiable on production, not in this preview environment.

---

## 1. Problem Statement

`banner.png` (305 KB) is the Largest Contentful Paint (LCP) element on the homepage — the single image Google uses to score page speed. The browser does not discover this image until after:
1. HTML parsed → JS bundle downloaded → JS executed → React renders → `<img>` tag appears in DOM

This chain can take 4–8 seconds on Indian 4G, directly suppressing the Google Ads Landing Page Experience score.

Additionally, the `<img>` tag rendered by `EditableImage` has no `fetchpriority="high"` attribute — so even after the JS renders, the browser treats this image at default priority, yielding to other resource fetches.

---

## 2. Root Cause

**`frontend/public/index.html`:** No `<link rel="preload">` for `/brand/banner.png`.

**`frontend/src/components/home/Hero.jsx` (lines 54–60):**
```jsx
<EditableImage
  block
  id="home.hero.banner_image"
  fallback="/brand/banner.png"
  alt="MyGenie POS hospitality operating system"
  className="w-full h-[420px] object-contain"
/>
```
`EditableImage` renders a plain `<img>` with no `fetchpriority` attribute.

---

## 3. Exact Changes Required

### ~~Change 1 — `frontend/public/index.html`~~ — DROPPED (Scope Revision 2026-08-20)

> **Decision by owner (2026-08-20):** The `<link rel="preload">` for `banner.png` in `index.html` was originally planned but has been **dropped**.
>
> **Reason:** This is a multi-route SPA. `index.html` is shared by all routes. Adding a preload here causes `banner.png` (305 KB) to be downloaded on **every page** — `/pricing`, `/blog`, `/solutions/...` etc. — even though the image is only used on the homepage. This is a known anti-pattern for SPAs.
>
> **Resolution:** Option B selected — implement only `fetchpriority="high"` + `loading="eager"` on `Hero.jsx`. The `fetchpriority` attribute still tells the browser to prioritise the image fetch once React renders the component. The `index.html` preload line and `frontend/public/index.html` are **out of scope for this CR**.
>
> **Future note:** If a homepage-only preload is ever desired, it would require SSR or a route-aware preload injection strategy — out of scope here.

### Change 1 — `frontend/src/components/home/Hero.jsx`
Add `fetchpriority="high"` and `loading="eager"` to the `EditableImage` call:
```jsx
<EditableImage
  block
  id="home.hero.banner_image"
  fallback="/brand/banner.png"
  alt="MyGenie POS hospitality operating system"
  className="w-full h-[420px] object-contain"
  fetchpriority="high"
  loading="eager"
/>
```
Verify `EditableImage` in `Editable.jsx` passes `...rest` to the underlying `<img>` — confirmed it does (`{...rest}` on line 444).

---

## 4. Files Changed

| File | Change |
|---|---|
| ~~`frontend/public/index.html`~~ | ~~Add `<link rel="preload">` for banner.png~~ — **DROPPED** (scope revision 2026-08-20, see Change 1 note above) |
| `frontend/src/components/home/Hero.jsx` | Add `fetchpriority="high"` + `loading="eager"` to EditableImage |

---

## 5. Definition of Done

- [ ] `fetchpriority="high"` visible on the rendered `<img>` in DevTools Elements panel
- [ ] `loading="eager"` attribute present on the rendered `<img>`
- [ ] LCP measurement improves (target: ≤ 2.5s on mobile) — **measure on production, not preview** (see Finding 7 + 8)
- [ ] No layout shift from the image (existing `h-[420px]` prevents CLS)
- [ ] ~~`banner.png` appears near top of network waterfall before JS execution~~ — **NOT testable** (preload dropped, Option B)

---

*CR-71 registered 2026-08-20. Source: SEO & QS Audit · Plan ID C2 + GAP-5.*

---

## 6. Impact Analysis — Findings (2026-08-20)

**Investigator:** Planning Agent  
**Method:** Full dependency trace — read `Hero.jsx`, `Editable.jsx`, `CmsProvider.jsx`, `storage.py`, `server.py`. Queried live CMS content endpoint on both preview and production environments.

---

### Finding 7 — CMS has overridden the hero image in THIS preview environment ⚠️ Critical nuance

`EditableImage` in `Editable.jsx` (line 412) resolves the rendered image URL via:
```js
const src = useContent(id, fallback);
// id = "home.hero.banner_image", fallback = "/brand/banner.png"
```
`useContent` (in `CmsProvider.jsx`) returns the MongoDB-stored CMS value when set, **ignoring the fallback entirely**. Querying `/api/cms/content` in this preview environment revealed:
```json
"home.hero.banner_image": "/api/cms/media/435e66d8111e4ee2ab5803b66816c7c9.png"
```
The actual image being rendered in this preview is the CMS URL — **not** `/brand/banner.png`. If the preload in `index.html` pointed to `/brand/banner.png`, it would preload the wrong image in this environment: wasting 305 KB of bandwidth and providing zero LCP benefit.

---

### Finding 8 — Production has NO CMS override — `/brand/banner.png` IS the production LCP image ✅ Preload is correct for production

Querying the live production API (`https://www.mygenie.online/api/cms/content`):
```
home.hero.banner_image: NOT SET
```
Production serves `/brand/banner.png` as the hero image. The proposed `<link rel="preload" href="/brand/banner.png">` in `index.html` is **correct for production**. The CMS override in the preview environment is a stale test upload that does not exist on the production MongoDB.

**Testing implication:** The preload improvement cannot be validated in this preview environment. DoD testing must be done against production or by first clearing the stale CMS override in this preview environment (query `/api/cms/content` → confirm `home.hero.banner_image` is removed before testing).

---

### Finding 9 — Preview environment has a broken hero image — separate pre-existing bug 🔴 Out of Batch 1 scope

- `STORAGE_BACKEND = "local"` in this preview `.env`
- File `/app/backend/uploads/435e66d8111e4ee2ab5803b66816c7c9.png` **does not exist** in local uploads
- `GET /api/cms/media/435e66d8111e4ee2ab5803b66816c7c9.png` returns a JSON error, not an image
- Hero image is currently broken/invisible in the preview environment
- **Not caused by Batch 1. Not fixed by Batch 1. File separately after Batch 1 ships.**
- Fix path: remove the stale `home.hero.banner_image` CMS key via `DELETE /api/cms/content` or admin CMS panel, which will restore the `/brand/banner.png` fallback

---

### Finding 10 — `EditableImage` passes `{...rest}` to the rendered `<img>` tag ✅ fetchpriority lands correctly

`Editable.jsx` line 444:
```jsx
mediaEl = <img src={src} alt={alt} className={className} {...rest} />;
```
`{...rest}` is spread at the end — any extra props passed to `<EditableImage>` reach the native `<img>` tag directly. Adding `fetchpriority="high"` and `loading="eager"` to the `<EditableImage>` call in `Hero.jsx` will produce:
```html
<img src="..." alt="..." class="..." fetchpriority="high" loading="eager" />
```
No wrapper, no prop filtering, no HOC that could swallow the attributes. Confirmed clean.

---

### Finding 11 — CMS media served with `no-store, no-cache` headers ⚠️ Flagged — out of scope

When any CMS image override is active, the `/api/cms/media/` endpoint returns:
```
cache-control: no-store, no-cache, must-revalidate
```
In production (S3 backend), the API does a `302 RedirectResponse` to the S3 URL. The S3 object itself has `Cache-Control: public, max-age=31536000, immutable`. However:
- The API redirect endpoint is never CDN-cached (Cloudflare treats `/api/` as `DYNAMIC`)
- Every page load hits the API for a 302, adding one extra network roundtrip before the image download begins
- This is a latency issue affecting any page that uses CMS-overridden images

**Action:** Not a Batch 1 fix. Raise as a separate CR: "Serve CMS media directly via CDN-cached S3 URL instead of API redirect." Currently production is not affected because the hero image CMS override is not set.

---

### Risk Register

| Risk | Likelihood | Impact | Verdict |
|---|---|---|---|
| Preload targets wrong URL in preview | **Confirmed** | None in preview — correct on production | Document + test on production only |
| `fetchpriority` prop not reaching `<img>` | None | — | Cleared (line 444 `{...rest}` confirmed) |
| `loading="eager"` conflicts with lazy-load on other images | None | Eager is the default — explicit is safe | No action |
| Preview hero image broken after Batch 1 | Pre-existing | Visible in preview only | File separate bug — not caused by this CR |
| Banner image CLS | None | `h-[420px]` reserves height before image loads | Cleared |

---

### Scope Confirmation — Files touched (verified, no hidden deps)

| File | Change | Safe |
|---|---|---|
| `frontend/public/index.html` | Add `<link rel="preload" as="image" href="/brand/banner.png" fetchpriority="high">` | ✅ |
| `frontend/src/components/home/Hero.jsx` | Add `fetchpriority="high"` + `loading="eager"` to `<EditableImage>` | ✅ |

**No other files touched. No component logic changes. Additive-only changes.**
