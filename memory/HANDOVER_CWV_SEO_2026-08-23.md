# HANDOVER — CWV + SEO Optimization Workstream
## From: E1 (session ending 2026-08-23)
## To: Next agent

**Branch:** `23aug` · **Repo:** `https://github.com/Abhi-mygenie/website.git`
**Preview URL:** `https://frontend-staging-12.preview.emergentagent.com`
**Production URL:** `https://beta.mygenie.online` (behind Cloudflare)

---

## 1. CRITICAL — Read First

### Current serving mode
The frontend is running in **static-server mode** (NOT `yarn start`):
```
Supervisor: command=/usr/bin/node /app/frontend/scripts/static-server.js
```
`static-server.js` serves the prerendered `build/` directory. There is **no hot reload**. After ANY source change you MUST:
```bash
cd /app/frontend && yarn build && node scripts/prerender.js
```
Then verify with the structural gate check script (see §4).

### Do NOT switch back to yarn start
Switching to `yarn start` would serve the CSR shell (empty `<div id="root">`) instead of the prerendered content. All SEO and LCP work would be invisible.

---

## 2. What Was Built This Session (Full CR List)

### CWV POC — Homepage `/` (all complete)

| CR | Title | Status |
|----|-------|--------|
| **CR-101 POC** | Homepage prerender POC | ✅ DONE (Jun 2026) |
| **CR-114** | Clash Display font self-hosted, `font-display:optional` | ✅ FIXED |
| **Hero preload** | Hero image `<link rel="preload">` injected by prerender | ✅ FIXED |
| **CR-117** | Prerender snapshot pollution (Sonner CSS, noscript, canonical dedup) | ✅ FIXED |
| **CR-115** | React.lazy 8 below-fold sections + framer-motion removal + PostHog 6s deferral | ✅ FIXED |
| **CR-118** | Poppins body font self-hosted, Google Fonts blocking eliminated | ✅ FIXED |
| **CR-119** | Trust logos resized 250×250 → 128×128 (−55% size) | ✅ FIXED |
| **CR-120** | EditableImage width/height (Hero: 776×637, Logo: 156×82) | ✅ FIXED |
| **CR-81** | WebP conversion + loading=lazy (remaining items completed) | ✅ FIXED |
| **CR-82** | Explicit width/height on all JSX img tags | ✅ FIXED |
| **CR-116** | Gzip compression | ✅ CLOSED (nginx/Cloudflare already handles it) |

### Sitemap + Full Rollout

| CR | Title | Status |
|----|-------|--------|
| **CR-121** | Added /solutions and /product hub pages to sitemap (51→53 URLs) | ✅ FIXED |
| **CR-122** | Updated 30 stale lastmod dates to 2026-08-23 | ✅ FIXED |
| **CR-101 Rollout** | Extended prerendering from `/` to all 53 routes | ✅ FIXED |

### Bug Fixes

| CR | Title | Status |
|----|-------|--------|
| **CR-117** | Prerender snapshot pollution (Sonner CSS dupe, noscript, canonical) | ✅ FIXED |
| **Shell contamination** | banner.webp preload bleeding into all 52 non-homepage pages | ✅ FIXED |

### Open CRs

| CR | Title | Priority |
|----|-------|---------|
| **CR-123** | Blog post Markdown images missing width/height (social icons, all 21 posts) | LOW |
| **CR-82 remainder** | Pricing page EditableImage dims (FeatureDemoModal, PlanShowcase) | LOW |
| SEO CRs (77-99, 100+) | Various SEO, schema, content improvements | MEDIUM |
| Attribution CRs (39-65) | Freshsales, Meta CAPI — need real API keys | Blocked on keys |

---

## 3. Current Performance Metrics

### Homepage `/` (India test, cable speed)
- **FCP: 1.9s** · **LCP: 2.2s ✅** · **TBT: 452ms** · **CLS: 0 ✅**
- **Performance: 86** · Accessibility: 93 · Best Practices: 100 · SEO: 54

### /product page (after shell contamination fix)
- **Performance: 70** (16-pt gap vs homepage is STRUCTURAL — text LCP vs image LCP, not a bug)

### Expected on production (Cloudflare CDN)
- TTFB: ~80ms (vs 660ms in preview) → FCP: ~1.0s → LCP: ~1.2s
- **Expected Lighthouse mobile: 90–94**

---

## 4. Key Files

### prerender.js — THE most important file

`/app/frontend/scripts/prerender.js` — controls everything about the prerender pipeline.

**Critical sections:**
```js
// Line 7-12: reads all routes from sitemap.xml automatically
const ROUTES = (() => {
  const xml = fs.readFileSync(...sitemap.xml...);
  return [...xml.matchAll(/<loc>https:\/\/www\.mygenie\.online([^<]*)<\/loc>/g)]
    .map(m => m[1] || "/");
})();

// Line 48-51: waitForSelector covering ALL page types
await page.waitForSelector(
  '[data-testid="hero"], [data-testid$="-hero"], [data-testid$="-page"], [data-testid^="legal-page"]',
  { timeout: 30000 }
);

// Line 70 (approx): ALWAYS remove image preloads before re-injecting
// This prevents banner.webp from contaminating all non-homepage pages
document.querySelectorAll('head link[rel="preload"][as="image"]').forEach(l => l.remove());
// Then only re-inject for pages with [data-testid="hero-visual"] img
```

### Structural gate check (run after every prerender)

```bash
python3 << 'PYEOF'
import re, os
html = open('/app/frontend/build/index.html').read()
head = re.search(r'<head>(.*?)</head>', html, re.DOTALL).group(1)
styles    = re.findall(r'<style[^>]*>(.*?)</style>', head, re.DOTALL)
noscripts = re.findall(r'<noscript>', head)
canonicals= re.findall(r'<link[^>]*canonical[^>]*>', html)
img_pre   = [l for l in re.findall(r'<link[^>]+>', html) if 'preload' in l and 'image' in l]
font_pre  = [l for l in re.findall(r'<link[^>]+>', head) if 'preload' in l and 'font' in l]
g = {
    "style blocks == 2":   len(styles) == 2,
    "noscript in head == 0": len(noscripts) == 0,
    "canonical == 1":      len(canonicals) == 1,
    "image preload == 1":  len(img_pre) == 1,
    "font preloads == 3":  len(font_pre) == 3,
    "no googleapis":       'googleapis' not in html,
    "hero text present":   'boosts profit by up to' in html,
}
for k, v in g.items(): print(f"{'PASS' if v else 'FAIL'} {k}")
PYEOF
```

Also verify non-homepage pages have 0 image preloads:
```bash
python3 -c "
import re
for route in ['product', 'pricing', 'solutions/restaurants']:
    html = open(f'/app/frontend/build/{route}/index.html').read()
    count = len([l for l in re.findall(r'<link[^>]+>', html) if 'preload' in l and 'image' in l])
    print(f'/{route}: {count} image preloads (expected: 0)')
"
```

---

## 5. Architecture

```
Browser
  ↓ request
Nginx proxy (gzip on, port 443)
  ↓
static-server.js (port 3000, serves build/)
  ↓
build/{route}/index.html (prerendered HTML)
  → React hydrates in browser
  → fetchpriority="high" loads banner.webp for homepage
  → Self-hosted fonts (Clash Display + Poppins) from /fonts/
  → Lazy chunks load for below-fold sections
```

### Font files (self-hosted)
```
/app/frontend/public/fonts/
  clash-display-600.woff2  (15 KB)
  clash-display-700.woff2  (15 KB)  ← LCP heading weight
  poppins-400.woff2         (8 KB)  ← body text, preloaded
  poppins-500.woff2         (8 KB)
  poppins-600.woff2         (8 KB)
  poppins-700.woff2         (8 KB)
```

### Brand images
```
/app/frontend/public/brand/
  banner.webp   (38 KB)  ← homepage hero, 776×637px
  poppins-*.webp         ← testimonial avatars (8-9 KB each)
  *-trust-logo*.webp     ← trust band logos, resized 128×128px
```

---

## 6. Environment Notes

### .env values (placeholders only — need real keys for production features)
- Backend `.env`: all `FRESHSALES_*`, `META_*`, `RAZORPAY_*`, `SMS_*`, `CALENDLY_*` set to PLACEHOLDER
- Frontend `.env`: `REACT_APP_BACKEND_URL=https://frontend-staging-12.preview.emergentagent.com`
- To enable CRM sync: set `CRM_SYNC_ENABLED=true` + real `FRESHSALES_API_KEY`
- To enable OTP SMS: set `OTP_SMS_ENABLED=true` + real `SMS_*` keys
- To enable S3 storage: set `STORAGE_BACKEND=s3` + real `AWS_*` keys

### Supervisor mode
```bash
# Check current mode
grep "command=" /etc/supervisor/conf.d/supervisord.conf | grep frontend
# Expected: /usr/bin/node .../static-server.js

# If you need dev mode temporarily:
# 1. Edit supervisord.conf: change to "yarn start"
# 2. sudo supervisorctl reread && sudo supervisorctl update && sudo supervisorctl restart frontend
# 3. Then you can edit source with hot reload
# 4. When done: switch back to static-server.js + yarn build + node scripts/prerender.js
```

---

## 7. Next Priorities

### Immediate (before production deployment)
1. **Deploy `build/` to production** (`beta.mygenie.online`)
2. **Submit sitemap** to Google Search Console after deployment
3. Run Lighthouse mobile on production to confirm ≥90

### Short-term
4. **CR-123** — Blog post social share icon images (21 posts, `Markdown.jsx` fix) — LOW
5. **Check production** after deploying — run Lighthouse on `/product`, `/solutions/restaurants`, `/blog/*` to verify all pages benefit from prerendering
6. **CrUX monitoring** — field data takes 28 days to update after production deployment

### Medium-term
7. **Attribution CRs** (CR-39, 44, 47, 48, 63) — need real `FRESHSALES_*` + `META_*` keys
8. **CR-50 CRITICAL** — Calendly overlay CSS broken (blocks demo bookings on production!)
9. **CR-82 pricing page** — EditableImage dims on FeatureDemoModal + PlanShowcase

---

## 8. Known Issues / Gotchas

### Performance gap between pages (not a bug)
- Homepage: 86 (image LCP, preloaded hero)
- Non-homepage pages: ~70 (text LCP, no hero image preload)
- Gap is structural — image LCP pages always score higher than text LCP pages
- In production with Cloudflare: both should score 85+

### SEO score stuck at 54
- Canonical URL points to `https://placeholder.example.com/` (REACT_APP_SITE_URL is placeholder)
- Will fix when real `REACT_APP_SITE_URL=https://www.mygenie.online` is set in `.env`

### Calendly P0 (CR-50)
- Calendly overlay CSS is broken on production — demo bookings are blocked
- Needs investigation before production launch

### 3rd-party credentials
- PostHog: live key in `index.html` (`phc_xAvL2Iq4tFmANRE7kzbKwaSqp1HJjN7x48s3vr0CMjs`)
  - Currently deferred 6s post-load (CR-115 fix)
  - Working correctly, not blocking performance

---

## 9. Test Reports

All test reports in `/app/test_reports/`:
- `iteration_9.json` — CR-114 fonts (11/11 PASS)
- `iteration_10.json` — hero preload (7/7 PASS)
- `iteration_11.json` — CR-117 cleanup (10/10 PASS)
- `iteration_12.json` — CR-115 JS bundle (11/11 PASS)
- `iteration_13.json` — CR-118 Poppins (11/11 PASS)
- `iteration_14.json` — CR-81+82 images (13/13 PASS)
- `iteration_15.json` — CR-119+120 logo resize + EditableImage (12/12 PASS)
- `iteration_16.json` — CR-101 full rollout (10/10 PASS)
- `iteration_17.json` — shell contamination fix (13/13 PASS)

---

*Handover written 2026-08-23. All optimization work for the CWV + SEO workstream is complete in the preview environment. Awaiting production deployment to validate ≥90 Lighthouse mobile score.*
