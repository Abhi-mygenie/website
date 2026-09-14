# CR-116 — Ensure Compression (gzip/brotli) for Prerendered HTML in Production

**Type:** Bug / Deployment & Serving Config
**Date Raised:** 2026-06
**Raised By:** CR-101 POC investigation
**Status:** CLOSED — 2026-08-23 (resolved at infrastructure level)
**Priority:** MEDIUM
**Effort:** ~1–2 hrs (infra/serving config)
**Improves:** FCP · LCP (transfer time) on slow networks
**Scope:** Production/preview static serving layer (CDN/Cloudflare/host), prerender serving
**Related:** CR-101 (prerender POC), CR-78 (Cloudflare config)

---

## 1. Problem Statement
The prerendered homepage HTML is **132 KB uncompressed** but **~21 KB gzipped**. During the CR-101 POC, the interim static server (`frontend/scripts/static-server.js`) served the HTML **without compression** (`content-encoding` absent), which inflates FCP/LCP over Slow-4G (part of the preview's FCP ≈ 2.7s).

This is a **serving/config concern, not application code** — but it must be verified so that prerendered pages (which are larger than the old empty-root shell) are always delivered compressed in production.

## 2. Evidence
- `wc -c build/index.html` = 132,336 bytes; `gzip -c build/index.html | wc -c` ≈ 20,885 bytes (~6.3× smaller).
- Preview response headers on `https://app-instant-launch.preview.emergentagent.com/`: no `content-encoding` (POC interim server).

## 3. Suggested Fix (for later — NOT part of this intake)
1. Ensure the production static host / CDN / Cloudflare serves `text/html`, `application/javascript`, `text/css` with **gzip or brotli**.
2. If a Node static server is used in production, enable compression middleware (the POC `static-server.js` is a demo, not production-grade).
3. Confirm `Content-Encoding: gzip|br` on the deployed prerendered pages.

## 4. Definition of Done
- [ ] Deployed prerendered HTML returns `Content-Encoding: gzip` or `br`
- [ ] Transfer size of `/` HTML ≈ 20–25 KB (not ~132 KB)
- [ ] FCP improvement confirmed on real deploy Lighthouse
- [ ] Verification by testing_agent (or deployment health check) before marking fixed

---

*CR-116 registered 2026-06. Source: CR-101 POC investigation. Intake only — no code changed.*
