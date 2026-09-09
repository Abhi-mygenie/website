# CR-233 + CR-234 — Combined Line-by-Line Plan: prerender.js Hero Preload Fixes

**Date:** 2026-09-08 (final, after full-site audit + exact code verification)
**Priority:** P1 (CR-233) + P2 (CR-234)
**File:** `frontend/scripts/prerender.js`
**Total ops:** 1 search-replace
**Total lines changed:** 16 → 22 (replace block lines 122–137)
**Affected pages fixed:** 6 (homepage + 5 ad landing pages)
**Out of scope:** `/product/*` — see CR-236

---

## Decision Log

| Decision | Rationale |
|---|---|
| Batch CR-233 + CR-234 together | Both fixes are inside the same 16-line block. CR-233 extends the selector; CR-234 changes how the preload is written. Each alone is an incomplete fix. |
| Read `srcset`/`sizes` from the live `<img>` element | Avoids hardcoding image paths. If `srcSet` ever changes in JSX, preload auto-syncs at next build. |
| Fallback to `preload.href` if no `srcset` | Defensive. Covers any page where heroImg has no srcset — currently no such page in scope, but safe. |
| Remove inner duplicate-check guard | `document.querySelectorAll(...).forEach(l => l.remove())` on line 124 already clears all preload tags. A second guard checking for existing `[href="..."]` is redundant and doesn't apply to `imagesrcset`-based preloads. |
| ProductPage excluded | Requires a JSX change (`data-testid` on `<img>`) + new mobile image assets that don't yet exist. Separate CR-236. |

---

## Pre-Implementation Verification

Run before making the edit to confirm the target block is unchanged:

```bash
grep -n "hero-visual\|Idempotent re-injection\|preload.href = href" /app/frontend/scripts/prerender.js
```

**Expected output:**
```
125:        // Idempotent re-injection: only for pages that have a hero-visual img
126:        const heroImg = document.querySelector('[data-testid="hero-visual"] img');
134:            preload.href = href;
```

If lines/content differ, re-read the file before applying.

---

## Op 1 — `frontend/scripts/prerender.js` lines 122–137

### Find (exact — 16 lines):

```js
        // Inject hero image preload so browser starts download at HTML parse time
        // First remove any image preload inherited from the shell (banner.webp bleeds into all pages)
        document.querySelectorAll('head link[rel="preload"][as="image"]').forEach(l => l.remove());
        // Idempotent re-injection: only for pages that have a hero-visual img
        const heroImg = document.querySelector('[data-testid="hero-visual"] img');
        if (heroImg && heroImg.src) {
          const href = new URL(heroImg.src).pathname;
          if (!document.querySelector(`link[rel="preload"][as="image"][href="${href}"]`)) {
            const preload = document.createElement("link");
            preload.rel = "preload";
            preload.as = "image";
            preload.setAttribute("fetchpriority", "high");
            preload.href = href;
            document.head.appendChild(preload);
          }
        }
```

### Replace with (exact — 22 lines):

```js
        // Inject hero image preload so browser starts download at HTML parse time
        // CR-233: selector extended — catches homepage (hero-visual wrapper) AND all 5 ad
        // landing pages (img[data-testid$="-hero-image"]: pos, billing, mgmt, ck, qsr).
        // CR-234: use imagesrcset + imagesizes from the <img> element so mobile browsers
        // fetch banner-mobile.webp (18KB) not banner.webp (38KB) — saves 20KB per mobile visit.
        document.querySelectorAll('head link[rel="preload"][as="image"]').forEach(l => l.remove());
        const heroImg =
          document.querySelector('[data-testid="hero-visual"] img') ||
          document.querySelector('img[data-testid$="-hero-image"]');
        if (heroImg && heroImg.src) {
          const preload = document.createElement("link");
          preload.rel = "preload";
          preload.as = "image";
          preload.setAttribute("fetchpriority", "high");
          const srcset = heroImg.getAttribute("srcset") || heroImg.getAttribute("srcSet");
          const sizes  = heroImg.getAttribute("sizes");
          if (srcset) {
            preload.setAttribute("imagesrcset", srcset);
            if (sizes) preload.setAttribute("imagesizes", sizes);
          } else {
            // Fallback: no srcset on this img — single href (no mobile optimisation possible)
            preload.href = new URL(heroImg.src).pathname;
          }
          document.head.appendChild(preload);
        }
```

---

## Line-by-Line Diff

| Old line | New line | What changed | CR |
|---|---|---|---|
| `// Idempotent re-injection: only for pages that have a hero-visual img` | Updated 4-line comment | Explains both CRs for future maintainers | — |
| `const heroImg = document.querySelector('[data-testid="hero-visual"] img');` | Two-line selector with `\|\|` | Adds fallback for `img[data-testid$="-hero-image"]` | **CR-233** |
| `const href = new URL(heroImg.src).pathname;` | Removed | Not needed — srcset path now read from element | CR-234 |
| `if (!document.querySelector(...))` (inner guard) | Removed | Redundant — outer `forEach remove` handles idempotency | cleanup |
| `preload.href = href;` | `imagesrcset + imagesizes` block | Reads responsive attributes from `<img>` | **CR-234** |
| *(not present)* | `else { preload.href = ... }` | Fallback for imgs with no srcset | defensive |

**Net change:** 16 lines → 22 lines. +6 lines total.

---

## What Stays the Same

Every other line in `prerender.js` is untouched:
- ROUTES auto-read from `sitemap.xml` — unchanged
- `serveBuild()` static server — unchanged
- Puppeteer launch + page navigation — unchanged
- `waitForSelector` + `waitForFunction` — unchanged
- GTM/Posthog script removal — unchanged
- Title deduplication (NEW 1–5 blocks) — unchanged
- ConsentBanner strip (CR-167) — unchanged
- `page.content()` serialisation + write to disk — unchanged

---

## Page-by-Page Expected Outcome

| Page | Before | After |
|---|---|---|
| `/` (Homepage) | `<link rel="preload" href="/brand/banner.webp">` — single URL, wrong on mobile | `<link rel="preload" imagesrcset="...400w, ...776w" imagesizes="...">` |
| `/restaurant-pos-system` | No preload tag at all | `<link rel="preload" imagesrcset="...400w, ...776w" imagesizes="...">` |
| `/restaurant-billing-software` | No preload tag at all | Same |
| `/restaurant-management-software` | No preload tag at all | Same |
| `/cloud-kitchen-pos` | No preload tag at all | Same |
| `/qsr-pos-system` | No preload tag at all | Same |
| All other pages | No change (no heroImg found) | No change — `if (heroImg && heroImg.src)` block skipped |

---

## Build Command

```bash
cd /app/frontend && yarn build
sudo supervisorctl restart frontend
```

`yarn build` calls `craco build && node scripts/prerender.js` — prerender runs automatically.

---

## Post-Build Verification

```bash
# 1. Homepage — imagesrcset replaces old href
grep -o 'imagesrcset="[^"]*"' /app/frontend/build/index.html

# 2. Ad pages — preload now present (was completely absent before)
for page in restaurant-pos-system restaurant-billing-software restaurant-management-software cloud-kitchen-pos qsr-pos-system; do
  count=$(grep -c 'imagesrcset' /app/frontend/build/${page}/index.html 2>/dev/null || echo 0)
  echo "$page: $count preload(s) with imagesrcset"
done

# 3. No page should have the old single-href preload for banner.webp
grep -r 'rel="preload" as="image".*href="/brand/banner.webp"' /app/frontend/build/*/index.html && echo "FAIL — old single-href still present" || echo "PASS — no old-style preload"
```

### Expected output:

```
# Check 1:
imagesrcset="/brand/banner-mobile.webp 400w, /brand/banner.webp 776w"

# Check 2:
restaurant-pos-system: 1 preload(s) with imagesrcset
restaurant-billing-software: 1 preload(s) with imagesrcset
restaurant-management-software: 1 preload(s) with imagesrcset
cloud-kitchen-pos: 1 preload(s) with imagesrcset
qsr-pos-system: 1 preload(s) with imagesrcset

# Check 3:
PASS — no old-style preload
```

---

## Production Deploy (after preview validation)

```bash
cd /app/frontend
REACT_APP_BACKEND_URL=https://www.mygenie.online REACT_APP_GTM_ID=GTM-K5D84Z3L yarn build
cd /app && zip -r mygenie-prod-build.zip frontend/build/
# Upload zip to production → CF Purge Everything
```

---

## Out of Scope — CR-236 (ProductPage)

5 of 6 `/product/*` pages have `fetchPriority="high"` hero imgs not reached by this fix:

| Gap | Root cause | Unblocked by |
|---|---|---|
| No preload injected | `<img>` has no `data-testid` — selector can't find it | Add `data-testid="product-hero-image"` to `ProductPage.jsx` (1 JSX line — separate CR-236 Step A) |
| No responsive image | `feature*.webp` has no mobile variants | Create `feature1–5-mobile.webp` assets (owner/design — CR-236 Step B) |

After CR-236 Step A adds `data-testid="product-hero-image"` to the img, this batch's `img[data-testid$="-hero-image"]` selector will **automatically cover product pages too** at the next build — no further prerender.js change needed.

---

*Plan finalised 2026-09-08. Exact Find block verified against live file. 1 op, 1 file, 16→22 lines.*
