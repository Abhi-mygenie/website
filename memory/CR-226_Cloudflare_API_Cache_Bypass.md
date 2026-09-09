# CR-226 — Cloudflare Missing Cache Bypass Rule for /api/* Endpoints

**Registered:** 2026-09-06
**Source:** Cloudflare Caching Fix doc — marketing team request for dev team input
**Status:** ✅ CLOSED 2026-09-06 — Validated live: all /api/* endpoints return CF-Cache-Status: DYNAMIC
**Priority:** P1
**Owner:** Owner — Cloudflare dashboard access
**File:** Cloudflare Cache Rules — third rule needed

---

## 1. Context

Marketing team implemented 2 Cloudflare Cache Rules on www.mygenie.online:
- **Rule 1:** Static assets (`.js, .css, .woff, .svg, .png, .jpg, .jpeg, .webp, .ico`) → 30 days ✅
- **Rule 2:** All other page loads (HTML) → 10 minutes ✅

Cache hit ratio improved from 31.87% → 38%. Rule 2 (HTML caching) is live but without an explicit exclusion for dynamic API endpoints — **this is a risk.**

---

## 2. Problem

Rule 2 caches ALL requests for 10 minutes. This includes `/api/*` backend endpoints. If Cloudflare caches an API response:
- Form submissions may return stale data
- OTP send/verify endpoints may be served from cache (wrong OTP, broken flow)
- Lead data may not reach the backend
- Payments and Calendly webhooks may be cached incorrectly

---

## 3. Dynamic Endpoints That Must Never Be Cached

Confirmed from codebase (`server.py`, `leads.py`, `otp.py`, `payments.py`):

```
/api/leads              POST — demo form submission
/api/otp/send           POST — OTP send
/api/otp/verify         POST — OTP verify
/api/contact            POST — contact form
/api/quote              POST — quote form
/api/payment/*          POST/GET — Razorpay payment flows
/api/calendly/*         POST — Calendly webhook
/api/cms/*              GET/POST — CMS admin
/api/*                  ALL — safest: bypass all /api/* from cache
```

---

## 4. Fix (Owner — Cloudflare Dashboard)

Add a **3rd Cache Rule** with higher priority than Rule 2, to bypass cache for all API endpoints:

```
Cloudflare → Caching → Cache Rules → Create rule
Rule name: "Bypass API endpoints"
Priority: HIGHER than Rule 2 (drag above it)

When: URI path starts with /api/
Then: Cache status = Bypass (or "No store")
```

### Rule order after fix:
```
Rule 1 (highest): Bypass /api/*           ← NEW
Rule 2: Static assets → 30 days           (existing)
Rule 3: HTML pages → 10 minutes           (existing)
```

---

## 5. Additional Dev Team Answers (for marketing team doc)

**Q: Are the static file types complete?**
Yes — `.js, .css, .woff, .svg, .png, .jpg, .jpeg, .webp, .ico` covers all assets served from this origin. No `.avif`, `.mp4`, `.pdf` served. ✅

**Q: Is 10-minute HTML cache safe?**
Yes — all HTML is prerendered static. No server-side rendering. Content only changes on deploy. 10-minute browser TTL is safe as long as `/api/*` is excluded. ✅

**Q: Do query params personalize content?**
No — UTM params (`?utm_source=` etc.) are read by JS only, not used to render different HTML. Cache can ignore them safely. ✅

---

## 6. Impact

| Scenario | Without Rule | With Rule |
|---|---|---|
| OTP verify cached | Broken OTP flow | Works correctly |
| Demo form cached | Lead not captured | Lead captured |
| Payment endpoint cached | Payment failure risk | Works correctly |
| HTML pages | Cached 10 min (fine) | Cached 10 min (fine) |
| Static assets | Cached 30 days | Cached 30 days |

---

*Registered 2026-09-06. Source: Cloudflare Caching Fix doc + codebase confirmation.*
*Owner action — add Rule 3 in Cloudflare dashboard.*
