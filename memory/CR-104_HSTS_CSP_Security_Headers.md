# CR-104 — Add HSTS and CSP Security Headers via Cloudflare

**Type:** Security / Technical SEO  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** LOW  
**Plan ID:** L4  
**Effort:** 2 hrs  
**Improves:** Security · Technical SEO  
**Scope:** Cloudflare Dashboard — Transform Rules (no code change)  
**Related:** CR-78 (apex/www redirect)

---

## 1. Problem Statement

HTTP response headers are missing two important security standards:
- `Strict-Transport-Security` (HSTS) — forces HTTPS for all future requests
- `Content-Security-Policy` (CSP) — controls which resources the browser can load

Absence of HSTS is flagged in the audit as a Medium severity Technical SEO issue.

---

## 2. Fix Required

### HSTS — Cloudflare Dashboard → SSL/TLS → Edge Certificates → HSTS
```
Enable HSTS: ON
Max Age: 6 months (15768000 seconds) — start conservative, extend to 1 year after verification
Include Subdomains: YES
Preload: NO (until fully verified and stable)
```

**Alternative via Transform Rules:**
```
Rule: Add Response Header
Header: Strict-Transport-Security
Value: max-age=15768000; includeSubDomains
```

### CSP — Cloudflare Dashboard → Rules → Transform Rules → Modify Response Headers

**Important:** CSP implementation requires careful testing — a misconfigured CSP can break GTM, PostHog, Google Fonts, Calendly, and other third-party scripts.

Recommended approach: Start with **report-only mode** before enforcing:
```
Content-Security-Policy-Report-Only: default-src 'self'; 
  script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://us.i.posthog.com https://assets.calendly.com https://fonts.googleapis.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com;
  font-src 'self' https://fonts.gstatic.com https://api.fontshare.com;
  img-src 'self' data: https:;
  connect-src 'self' https://us.i.posthog.com https://mygenie-org.myfreshworks.com;
  report-uri /api/csp-report
```

Deploy report-only for 2 weeks, review violations, then switch to enforcement mode.

---

## 3. Files Changed

| Location | Change |
|---|---|
| Cloudflare Dashboard: SSL/TLS | Enable HSTS |
| Cloudflare Dashboard: Transform Rules | Add response headers |

---

## 4. Risk

| Risk | Mitigation |
|---|---|
| CSP breaks GTM/PostHog | Use report-only mode first; whitelist all current third-party origins |
| HSTS locks out HTTP | Ensure all pages serve HTTPS correctly before enabling |
| includeSubDomains breaks subdomains | Verify all subdomains are HTTPS |

---

## 5. Definition of Done

- [ ] `curl -I https://www.mygenie.online/` shows `Strict-Transport-Security` header
- [ ] HSTS max-age is at least 15768000 (6 months)
- [ ] CSP report-only mode running for 2 weeks with zero critical violations
- [ ] Browser console: no CSP violations for normal page load and form submission

---

*CR-104 registered 2026-08-20. Source: SEO & QS Audit · Plan ID L4.*
