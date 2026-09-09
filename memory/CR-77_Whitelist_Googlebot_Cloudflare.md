# CR-77 — Whitelist Googlebot in Cloudflare WAF

**Type:** Crawler Access Fix  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** CRITICAL  
**Plan ID:** C8  
**Effort:** 30 min  
**Improves:** QS · Crawl · GSC Coverage  
**Scope:** Cloudflare Dashboard (no code change)  
**Related:** CR-78 (apex/www redirect), Marketing brief Issue 2

---

## 1. Problem Statement

The server returns HTTP 403 for non-browser user agents. If Cloudflare WAF Bot Fight Mode is blocking Googlebot’s IP ranges or user agent, Google cannot properly crawl and evaluate the landing pages — resulting in automatic LP Experience degradation.

This issue cannot be diagnosed from code alone. It requires live verification via curl with a Googlebot user agent.

---

## 2. Investigation Steps

### Step 1 — Test from server
```bash
curl -v -A "Googlebot/2.1 (+http://www.google.com/bot.html)" \
  https://mygenie.online/petpooja-alternative -I
```
**Expected:** `HTTP/2 200`  
**If actual is 403/503:** Cloudflare Bot Fight Mode is blocking Googlebot.

Test all 5 affected URLs:
- `https://mygenie.online/petpooja-alternative`
- `https://www.mygenie.online`
- `https://mygenie.online/product/sell-serve`
- `https://mygenie.online/product/see-everything`
- `https://mygenie.online/solutions/cloud-kitchens`

---

## 3. Fix (if 403 confirmed)

### Cloudflare Dashboard — Security → Bots

**Option A (Recommended):** Bot Fight Mode → **Off** (if only Googlebot is affected and other bot traffic is low)

**Option B (Precise):** Create a WAF Custom Rule to explicitly allow Googlebot:
```
Rule Name: Allow Googlebot
Condition: (http.user_agent contains "Googlebot") AND (not cf.client.bot)
Action: Allow (Skip all WAF rules)
```

**Option C:** Security → WAF → Tools → IP Access Rules → Add Google’s ASN (AS15169) with action "Allow"

---

## 4. Verification After Fix

```bash
# Re-run the curl test after Cloudflare rule change (may take 60s to propagate)
curl -v -A "Googlebot/2.1 (+http://www.google.com/bot.html)" \
  https://mygenie.online/petpooja-alternative -I
# Expected: HTTP/2 200

# Also verify in Google Search Console:
# URL Inspection → test each of the 5 LP URLs → confirm “URL is on Google”
```

---

## 5. Files Changed

| Location | Change |
|---|---|
| Cloudflare Dashboard | WAF rule to allow Googlebot; no code changes |

---

## 6. Definition of Done

- [ ] `curl -A "Googlebot/2.1"` returns HTTP 200 for all 5 LP URLs
- [ ] Google Search Console: no Coverage errors for /petpooja-alternative, /product/sell-serve, /product/see-everything, /solutions/cloud-kitchens
- [ ] GSC URL Inspection shows pages as crawlable

---

*CR-77 registered 2026-08-20. Source: SEO & QS Audit · Marketing brief Issue 2 · Plan ID C8.*
