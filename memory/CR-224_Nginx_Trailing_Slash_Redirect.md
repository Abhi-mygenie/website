# CR-224 — Production Nginx Forcing Trailing Slash 301 Redirect on All URLs

**Registered:** 2026-09-06
**Source:** Trailing Slash Brief — production nginx config
**Status:** 🔲 Open — 👤 Owner action (production server access required)
**Priority:** P0
**Owner:** Owner — production nginx config access
**File:** Production nginx site config (not in repo)

---

## 1. Problem

Production web server (nginx at `www.mygenie.online`) has a `rewrite` rule that
301-redirects every URL without a trailing slash to the version with one.

This causes two problems:
1. **SEO:** All sitemap URLs without trailing slashes hit a 301 → GSC "Redirect error" → 0 pages indexed (see CR-223)
2. **Performance:** Every ad click, every direct URL access, every internal navigation without trailing slash burns a full 301 round-trip before the page loads (~50–100ms wasted per visit)

---

## 2. Root Cause

nginx config likely contains one of these patterns:

```nginx
# Pattern 1 — explicit rewrite
rewrite ^([^.]*[^/])$ $1/ permanent;

# Pattern 2 — try_files with directory fallback
try_files $uri $uri/ /index.html;
# The $uri/ causes nginx to redirect to trailing slash if a directory exists
```

---

## 3. Fix (Owner — Production nginx)

### Option 1 — Remove the rewrite rule
```nginx
# Find and DELETE this line:
rewrite ^([^.]*[^/])$ $1/ permanent;
```

### Option 2 — Change try_files to not force directory redirect
```nginx
# Change:
try_files $uri $uri/ /index.html;
# To:
try_files $uri /index.html;
```

This is safe for a React SPA — all routes are handled by React Router, not filesystem directories. The `/index.html` fallback is correct.

### After change:
```bash
sudo nginx -t          # test config
sudo nginx -s reload   # apply
```

---

## 4. Verification

```bash
# Before fix:
curl -sI https://www.mygenie.online/pricing | grep HTTP
# HTTP/2 301

# After fix:
curl -sI https://www.mygenie.online/pricing | grep HTTP
# HTTP/2 200  ← direct, no redirect
```

---

## 5. Impact After Fix

| Metric | Before | After |
|---|---|---|
| Page load for ad clicks | 301 + 200 (two round trips) | 200 directly |
| Speed saving | — | ~50–100ms per visit |
| GSC redirect errors | 58 URLs | 0 |
| Sitemap change needed | Yes (CR-223) | No (sitemap already correct without slash) |

**If CR-224 (nginx fix) is done first, CR-223 (sitemap fix) is NOT needed** — sitemap URLs without trailing slash will return 200 directly, no redirect.

---

## 6. Related CRs

| CR | Relationship |
|---|---|
| CR-223 | Option A — fix sitemap to match server (code change, faster path) |
| CR-225 | Google Ads final URLs — update after deciding slash strategy |

---

*Registered 2026-09-06. Source: Trailing Slash Brief + live curl confirmation.*
*Owner action — no code change possible from this pod.*
