# CR-186 — Cloudflare RUM Script in Critical Path (2,003ms)

**Type:** Performance / Infrastructure
**Date Raised:** 2026-09-02
**Status:** OPEN — 👤 OWNER ACTION (Cloudflare dashboard)
**Priority:** P1
**Source:** Lighthouse mobile audit — Network dependency tree, critical path latency 2,003ms
**Batch:** W — Lighthouse Audit Gaps

---

## Problem

Cloudflare Analytics (Real User Monitoring) injects `beacon.min.js` which lands in the critical path and triggers two `/cdn-cgi/rum` callbacks — one taking **2,003ms**:

```
Initial page (285ms)
└─ /beacon.min.js from static.cloudflareinsights.com (292ms, 9.63 KiB)
     └─ /cdn-cgi/rum  (1,343ms, 0.36 KiB)
     └─ /cdn-cgi/rum  (2,003ms, 0.36 KiB)  ← bottleneck
```

This 2-second Cloudflare RUM ping is the single largest contributor to the critical path latency, competing with LCP image load and font downloads.

---

## Fix Options

All require Cloudflare dashboard access — no code change:

**Option A (recommended):** Disable Cloudflare Web Analytics for the domain in Cloudflare dashboard → Analytics & Logs → Web Analytics → Remove site.

**Option B:** Keep analytics but add `defer` to the beacon script injection via Cloudflare Speed settings. This moves it off the critical path.

**Option C:** Use Cloudflare Zaraz to defer all analytics scripts with a single toggle.

---

## No Code Change Needed

The beacon.min.js is injected by Cloudflare at the CDN layer — it is not in the app's source code. This is a Cloudflare dashboard-only fix.

---

## Expected Outcome

Removing beacon from critical path reduces maximum critical path latency from **2,003ms → ~285ms**. This directly improves LCP, Speed Index, and Time to Interactive.

*CR-186 registered 2026-09-02. Source: Lighthouse mobile audit. Owner: Cloudflare dashboard access required.*
