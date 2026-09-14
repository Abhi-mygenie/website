# CR-78 — 301 Redirect Apex to www + Fix Duplicate Sitemap on Apex Host

**Type:** Technical SEO / Duplicate Domain  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** CRITICAL  
**Plan ID:** C9 (+ GAP-3 merged)  
**Effort:** 30 min  
**Improves:** SEO · Crawl · Canonical Consolidation  
**Scope:** Cloudflare Dashboard (no code change)  
**Related:** CR-77 (Googlebot), Marketing brief Issue 2

---

## 1. Problem Statement

`mygenie.online` (apex) and `www.mygenie.online` both serve identical content without a 301 redirect between them. Canonical tags exist in the codebase but are injected via `react-helmet-async` (JavaScript) — non-JS crawlers see no canonical in raw HTML.

Additionally, the audit found a second independently-served sitemap on the apex host, creating conflicting sitemap signals for Googlebot.

This constitutes a duplicate content issue that splits crawl equity between two hosts.

---

## 2. Fix Required

### Fix 1 — Cloudflare Redirect Rule: apex → www
```
Dashboard: Rules → Redirect Rules → Create Rule
Name: Apex to www 301
Condition: (http.host eq "mygenie.online")
Action: Static redirect → https://www.mygenie.online/${request.uri.path} → 301
```

**Alternative via Page Rules (legacy):**
```
URL: mygenie.online/*
Setting: Forwarding URL → 301
Destination: https://www.mygenie.online/$1
```

### Fix 2 — Verify and neutralize the apex sitemap
```bash
# Check if apex host serves its own sitemap
curl -I https://mygenie.online/sitemap.xml
# If HTTP 200 (not 301): the apex sitemap is independently served
```

If apex sitemap returns 200 (not redirecting to www), the 301 redirect rule from Fix 1 will automatically resolve this — `mygenie.online/sitemap.xml` will 301 to `www.mygenie.online/sitemap.xml`.

If a separate sitemap is configured at the server/hosting level, remove or redirect it via the Cloudflare rule above.

### Fix 3 — Verify canonical in raw HTML (post-SSR, CR-103)
Once SSR (CR-103) is implemented, add a static `<link rel="canonical" href="https://www.mygenie.online/...">` per route in the server-rendered HTML. This is a dependency of CR-103, not CR-78.

---

## 3. Verification

```bash
# Confirm 301 redirect fires
curl -I https://mygenie.online/
# Expected: HTTP/1.1 301 + Location: https://www.mygenie.online/

# Confirm apex sitemap redirects
curl -I https://mygenie.online/sitemap.xml
# Expected: HTTP/1.1 301 + Location: https://www.mygenie.online/sitemap.xml

# Confirm www still serves correctly
curl -I https://www.mygenie.online/
# Expected: HTTP/2 200
```

---

## 4. Files Changed

| Location | Change |
|---|---|
| Cloudflare Dashboard | Redirect Rule: apex → www (301) |

---

## 5. Definition of Done

- [ ] `curl -I https://mygenie.online/` returns 301 to `https://www.mygenie.online/`
- [ ] All apex URLs redirect to www equivalents
- [ ] `mygenie.online/sitemap.xml` redirects to `www.mygenie.online/sitemap.xml`
- [ ] `www.mygenie.online` still serves correctly (no redirect loop)
- [ ] Google Search Console: submit `www.mygenie.online` as the canonical property

---

*CR-78 registered 2026-08-20. Source: SEO & QS Audit · Plan ID C9 + GAP-3.*
