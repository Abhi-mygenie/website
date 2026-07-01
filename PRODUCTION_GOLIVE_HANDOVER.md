# MyGenie POS — Production Go-Live Handover
**Domain:** www.mygenie.online  
**Prepared:** 24 June 2026  
**Status:** CONDITIONAL GO — all P0 gates must be live at DNS flip

---

## Quick Reference

| Key | Value |
|---|---|
| Production domain | `https://www.mygenie.online` |
| GTM Container | `GTM-K5D84Z3L` |
| GA4 Measurement ID | `G-KWHHFEZ5Q3` |
| Meta Pixel ID | `2862017797322752` |
| Google Ads Account | `AW-16740091756` |
| Ads Conversion Label | `NtqdClejmOgaEOyOpq4-` |
| FB Domain Verification | `52wnu6dg7xaa18lrghxek38u535rtw` |
| Sitemap URL | `https://www.mygenie.online/sitemap.xml` (48 URLs) |
| Redirect configs | `frontend/cloudflare-bulk-redirects.csv`, `frontend/nginx-redirects.conf` |

---

## STAGE 1 — Pre-Cutover: Dev Actions
**Do these BEFORE DNS flip. Owner provides values, Dev updates `.env` and rebuilds.**

- [ ] **1.1** Update `REACT_APP_BACKEND_URL` in `frontend/.env` to production backend URL (currently still preview URL — forms will fail if not updated)
- [ ] **1.2** Confirm `REACT_APP_SITE_URL=https://www.mygenie.online` is set in `frontend/.env`
- [ ] **1.3** Run `cd frontend && yarn build` — fresh production build with correct URLs
- [ ] **1.4** Deploy `frontend/build/` to production origin
- [ ] **1.5** Pull latest backend code to production server (`git pull origin main`)
- [ ] **1.6** Install backend dependencies: `pip install -r backend/requirements.txt`
- [ ] **1.7** Restart backend service

---

## STAGE 2 — Pre-Cutover: Infrastructure (Owner)
**Do these BEFORE DNS flip.**

- [ ] **2.1** Import `frontend/cloudflare-bulk-redirects.csv` into Cloudflare → Bulk Redirects → create Bulk Redirect List → attach Bulk Redirect Rule → **Deploy**
- [ ] **2.2** Confirm non-www → www Cloudflare Redirect Rule is still active (`mygenie.online` → `https://www.mygenie.online`)
- [ ] **2.3** SSL/TLS mode = **Full (strict)** in Cloudflare
- [ ] **2.4** Verify SSL cert is valid on `https://www.mygenie.online` before switching traffic

---

## STAGE 3 — DNS Cutover (Owner)
**The moment you flip DNS, STAGE 2 must already be live.**

- [ ] **3.1** Point `www.mygenie.online` CNAME/A to new origin (Emergent custom domain via Entri, or self-hosted nginx)
- [ ] **3.2** Point apex `mygenie.online` to same origin (or keep Cloudflare redirect rule active)
- [ ] **3.3** Keep proxy **ON** in Cloudflare so Bulk Redirects execute at the edge
- [ ] **3.4** Confirm padlock green on `https://www.mygenie.online` within 2–3 minutes

---

## STAGE 4 — Post-Cutover Verification (run within 2 hours)
**Run all curl checks immediately. Fix any failure before declaring go-live.**

### 4.1 — 301 Redirects (all 19 must return 301)
```bash
for u in /fine-dining /quick-service /Cafe-and-coffee-shop /cloud-kithen \
         /bar-and-pubs /bakeries /buffet-stations-restaurant /ice-green-and-dessert \
         /pizzerias /smart-billing /inventory-management /reports_and-analytics \
         /menu-management /about-us /contact-us /terms-and-conditions \
         /privacy-policy /refund-policy /blogs; do
  echo "$u → $(curl -sI https://www.mygenie.online$u | awk 'tolower($1) ~ /^http|^location/{printf "%s ", $2}')"
done
```
✅ Each must show `301` + correct new path. If any shows `200` or `404` → STOP, fix redirect layer.

### 4.2 — Non-www → www (must 301)
```bash
curl -sI http://mygenie.online/  | grep -iE 'HTTP|location'   # 301 → https://www.mygenie.online/
curl -sI https://mygenie.online/ | grep -iE 'HTTP|location'   # 301 → https://www.mygenie.online/
curl -sI https://www.mygenie.online/ | grep -i 'HTTP'         # 200
```

### 4.3 — Key pages return 200
```bash
for u in / /pricing /solutions/restaurants /solutions/bars-pubs /product/sell-serve \
         /customers /blog /about /contact /terms /privacy /refund; do
  echo "$u → $(curl -s -o /dev/null -w '%{http_code}' https://www.mygenie.online$u)"
done
```
✅ All must return `200`.

### 4.4 — Sitemap integrity
```bash
curl -s https://www.mygenie.online/sitemap.xml | grep -c '<loc>'          # expect 48
curl -s https://www.mygenie.online/sitemap.xml | grep -i 'preview\|localhost'  # expect empty
curl -s https://www.mygenie.online/robots.txt                              # must show sitemap line
```

### 4.5 — Facebook domain verification in HTML
```bash
curl -s https://www.mygenie.online/ | grep 'facebook-domain-verification'
# expect: 52wnu6dg7xaa18lrghxek38u535rtw
```

### 4.6 — Backend API live
```bash
curl -s https://www.mygenie.online/api/cms/funnel/summary -H "Authorization: Bearer <token>" | python3 -c "import sys,json;d=json.load(sys.stdin);print('OK' if 'lead_in' in d else 'FAIL')"
```

---

## STAGE 5 — SEO: Google Search Console (Owner, same day)

- [ ] **5.1** Verify property `https://www.mygenie.online` in GSC (DNS TXT or HTML tag method)
- [ ] **5.2** Submit sitemap: GSC → Sitemaps → Add → `https://www.mygenie.online/sitemap.xml` → Submit
- [ ] **5.3** Use URL Inspection on 3 redirected old URLs (e.g. `/fine-dining`, `/smart-billing`, `/about-us`) — confirm Google sees 301 → new URL
- [ ] **5.4** Use URL Inspection on 3 new pages (`/`, `/blog`, `/solutions/restaurants`) — request indexing
- [ ] **5.5** Check Coverage report after 24h for any 404 spikes

---

## STAGE 6 — Google Ads (Owner, before live campaigns)

- [ ] **6.1** Mark `demo_booked` as **GA4 Key Event**: GA4 → Admin → Events → toggle ON
- [ ] **6.2** Import `demo_booked` into Google Ads: Goals → Conversions → Import from GA4 → select `demo_booked` → Import
- [ ] **6.3** Set `demo_booked` as **Primary** conversion action, category = "Book appointment", Count = Once
- [ ] **6.4** Verify `GAds - Book Demo` fires on `lead_verifided` trigger (OTP-verified only) — already ✅ done
- [ ] **6.5** Register GA4 custom dimensions: `otp_verified`, `form_location`, `plan_interest`, `lead_quality` (event-scoped)
- [ ] **6.6** Turn off Zapier "Book appointments" import ONLY after browser-side `demo_booked` confirmed working (avoid double-count)
- [ ] **6.7** (P1) Turn on Enhanced Conversions for leads: Google Ads → Goals → Book Demo → Edit settings → Enhanced conversions = ON
- [ ] **6.8** (P1) Map `conversion_value` + `currency: INR` to GAds conversion tags in GTM

---

## STAGE 7 — Meta / Facebook (Owner, before live campaigns)

- [ ] **7.1** Confirm Facebook domain verification: Meta Business Settings → Brand Safety → Domains → `mygenie.online` → Status = Verified
- [ ] **7.2** Confirm `FB - Book demo` tag fires on `lead_verifided` with 6-field Manual Advanced Matching — already ✅
- [ ] **7.3** Confirm `FB - OTP Verified` tag is unpaused — already ✅
- [ ] **7.4** Confirm `FB - Book Appointment` (Schedule event) fires on `calendly Trigger` — already ✅
- [ ] **7.5** Add Manual AM (6 fields) to `FB - OTP Verified` tag: `em→email`, `ph→phone`, `fn→first_name`, `ln→last_name`, `ct→city_name`, `external_id→external_id`
- [ ] **7.6** Add same 6-field AM block to `FB - Book Appointment` tag
- [ ] **7.7** Republish GTM container after 7.5 + 7.6
- [ ] **7.8** Check Event Match Quality score ≥ 6.0: Meta Events Manager → your pixel → Events → EMQ column
- [ ] **7.9** Verify `Lead` + `Schedule` events appear in Meta Events Manager Test Events on production URL

---

## STAGE 8 — GTM Full Verification (Owner, day of go-live)

- [ ] **8.1** GTM Preview → enter `https://www.mygenie.online`
- [ ] **8.2** Submit demo form → confirm `form_submitted` tag fires
- [ ] **8.3** Complete OTP → confirm `lead_verifided` tag fires (note: typo is intentional, matches GTM trigger)
- [ ] **8.4** Reach thank-you → confirm `thankyou_conversion` fires
- [ ] **8.5** Book Calendly slot → confirm `demo_booked` fires
- [ ] **8.6** (P1) Wire Consent Mode v2 variables to all tags in GTM → Republish

---

## STAGE 9 — Payments & Webhooks (Owner + Dev)

- [ ] **9.1** Re-register **Razorpay webhook** to production URL: Razorpay dashboard → Settings → Webhooks → update to `https://www.mygenie.online/api/payments/razorpay/webhook` → Events: `payment.captured`, `payment.failed`
- [ ] **9.2** Run a **test payment** on production using test card `4111 1111 1111 1111` / `12/28` / CVV `123` / OTP `1234` → confirm PaymentSuccess page + invoice PDF
- [ ] **9.3** After test passes → Dev swaps Razorpay keys to live (`rzp_live_...`) in `backend/.env` → restart backend
- [ ] **9.4** Re-register **Calendly webhook** to production backend URL: Calendly → Integrations → Webhooks → update endpoint → re-enter `CALENDLY_WEBHOOK_SIGNING_KEY`
- [ ] **9.5** Test Calendly booking end-to-end → confirm `demo_booked` fires in GTM + appears in Leads dashboard

---

## STAGE 10 — GA4 Realtime Sanity (Owner, same day)

- [ ] **10.1** GA4 → Reports → Realtime → submit test lead on production → within 5 min see `form_submitted`
- [ ] **10.2** Complete OTP → see `lead_verifided` in Realtime
- [ ] **10.3** Book Calendly → see `demo_booked` in Realtime
- [ ] **10.4** Confirm `otp_verified`, `form_location`, `plan_intent` dimensions populated after Stage 6.5

---

## ROLLBACK TRIGGERS
**Revert DNS immediately if any of these occur within first 2 hours:**

| Trigger | Detection | Action |
|---|---|---|
| Old URLs returning 404 (not 301) | `curl -sI https://www.mygenie.online/fine-dining` → 404 | Repoint DNS to old origin immediately |
| Homepage blank / forms broken | White screen or 500 on form submit | Fix `REACT_APP_BACKEND_URL` → rebuild → redeploy. If > 30 min → rollback DNS |
| SSL error on www | Browser "Not Secure" | Fix Cloudflare SSL → Full (strict). If > 15 min → rollback |
| Sitemap serving preview/wrong domain | `curl sitemap.xml | grep preview` → output found | Fix `REACT_APP_SITE_URL` → rebuild. Do NOT leave > 1h |
| 5xx spike from origin | Server logs / Cloudflare analytics | Check backend logs → restart service → if unresolved > 30 min → rollback |

**Rollback = repoint DNS/CNAME to old origin.** Keep old site live for minimum 7 days post-cutover.

---

## POST GO-LIVE: Week 1 Monitoring

- [ ] Check GSC Coverage report daily for 404 spikes
- [ ] Monitor GA4 Realtime for event drop-offs
- [ ] Check Meta Events Manager EMQ score (target ≥ 6.0)
- [ ] Verify Google Ads conversions incrementing (allow 24–48h delay)
- [ ] Check Freshsales — new leads appearing from production form
- [ ] Confirm Calendly demo bookings syncing to Leads dashboard

---

## FUTURE / POST GO-LIVE TASKS

| Task | Priority | Notes |
|---|---|---|
| CR-15 Zapier Offline Conversions | P1 | 3 Zaps: Demo Scheduled, Demo Given, Purchase → Google Ads OCI + Meta CAPI. Requires: Freshsales field audit, Calendly calendar names, deal stage names. Full spec in `/app/CR-15_Zapier_Offline_Conversion_Events.md` |
| CR-19 Phase 4: Dimensions breakdown | P2 | Campaign / Ad Set / Keyword breakdown in Funnel Dashboard |
| CloudFront CDN for S3 media | P2 | DNS-level routing for media assets |
| server.py refactor | P2 | Split 900+ line file into `/routes` — routers for CMS, funnel, sync, ad-spend, payments |
| Consent Mode v2 in GTM | P1 | Wire localStorage consent variables to all conversion tags |
| react-snap pre-render | P1 | Static HTML generation so non-JS crawlers see full content |

---

## Key Files Reference

| File | Purpose |
|---|---|
| `/app/backend/server.py` | All API endpoints (lines 751, 764, 785 = new funnel endpoints) |
| `/app/backend/funnel.py` | Funnel metrics + ad spend aggregation logic |
| `/app/backend/ad_spend.py` | CSV parsers (Google Ads UTF-16 LE, Meta UTF-8) |
| `/app/backend/crm_sync.py` | Freshsales background sync + backfill |
| `/app/frontend/src/pages/LeadsView.jsx` | CMS dashboard — login + funnel + leads table |
| `/app/frontend/src/components/funnel/FunnelBySource.jsx` | Per-source funnel + cost metrics table |
| `/app/frontend/cloudflare-bulk-redirects.csv` | 19 old→new 301s for Cloudflare |
| `/app/frontend/nginx-redirects.conf` | 19 old→new 301s for nginx |
| `/app/frontend/public/_redirects` | 19 old→new 301s + SPA fallback (in build) |
| `/app/frontend/public/sitemap.xml` | 48 URLs, www only |
| `/app/SEO_Production_Cutover_Gate.md` | Full SEO gate with curl QA commands |
| `/app/SEO_Migration_Strategy.md` | Full redirect map + strategy |
| `/app/readiness.html` | (on site) Full go-live readiness contract |

---

*Document prepared by Emergent Labs E1 agent. All P0 items in Stages 1–4 must be complete before declaring go-live.*
