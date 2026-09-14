# Agent Handover — 2026-09-08 · Session 12 (End of Session)

**Written by:** E1 Agent
**Repo:** https://github.com/Abhi-mygenie/website.git · branch: main
**Preview URL:** https://react-deploy-6.preview.emergentagent.com
**Production:** https://www.mygenie.online / https://beta.mygenie.online
**Previous handover:** `HANDOVER_2026-09-08_Session10.md`, `HANDOVER_2026-09-08_Session11.md`

---

## HOW TO USE THIS HANDOVER

1. Read Section 2 (what was done) to understand current build state
2. Read Section 3 (open CRs) for prioritised next actions
3. Start with P0 owner actions before any code work
4. All decisions and plans are in `/app/memory/CR_INTAKE_REGISTER.md`

**Respond to the owner in English only.**

---

## 1. System State

| Service | Status | Port |
|---|---|---|
| frontend (`scripts/static-server.js`, serves prerendered `build/`) | RUNNING | 3000 |
| backend (uvicorn / FastAPI) | RUNNING | 8001 |
| MongoDB | remote `52.66.232.149` | — |

**`frontend/.env` (do not overwrite):**
```
REACT_APP_BACKEND_URL=https://react-deploy-6.preview.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
REACT_APP_WHATSAPP_ENABLED=false
```

**Rebuild command:**
```bash
cd /app/frontend && yarn build && sudo supervisorctl restart frontend
```
*(~2 min, pre-renders 65 routes)*

---

## 2. What Was Done This Session (Full CR Log)

### Deployment & Sync
- Cloned `https://github.com/Abhi-mygenie/website.git` (main branch) into `/app`
- Synced `memory/` directory from repo (334 files)
- Set all env vars in `backend/.env` per owner-provided keys
- Built and deployed frontend with static-server

### CR-236 Step A ✅
Added `data-testid="product-hero-image"` to `ProductPage.jsx` hero `<img>`. Pre-render now injects `<link rel="preload" as="image">` into `<head>` of all 5 product sub-pages. LCP improvement on product pages.

### Batch AY — Content & Copy Fixes ✅ (CR-239 → CR-246)
All 8 content CRs implemented in one pass:
- CR-239: QSR LP pricing `₹4,000/year` → `₹799/outlet/month · billed annually`
- CR-240: City count standardised to **75** everywhere
- CR-241: Go-live time standardised to **24hr** everywhere (incl. Matryyoshka testimonial)
- CR-242: "take orders"/"ordering app" copy added to `/product/sell-serve` Captain App module
- CR-243: New "Take orders on any phone" section added to `/restaurant-management-software`
- CR-244: Swiggy/Zomato badge strip + "fast food" in `/qsr-pos-system` hero
- CR-245: Petpooja hero — "Petpooja runs 1.5 lakh restaurants. It's earned that." restored
- CR-246: Petpooja comparison table footnote + `c3` row → "Local POS terminal"

### Bug Fixes ✅
- **WhatsApp FAB**: Added `REACT_APP_WHATSAPP_ENABLED=false` to `frontend/.env` — FAB no longer shows
- **Mobile navbar**: Added "Book Free Demo" button between logo and hamburger in `Navbar.jsx`

### CR-255 — Trust Signal Uplift: 5 Google Ads LPs ✅
All 8 sub-tasks shipped across `RestaurantPosSystem`, `RestaurantBillingSoftware`, `RestaurantManagementSoftware`, `CloudKitchenPos`, `QsrPosSystem`:
- "WORKS WITH" hero badge strip (Swiggy + Zomato + Razorpay + GST-ready + 75 cities)
- "Free data migration included · No lock-in · Cancel anytime" line in hero
- India compliance section on BillingSW + UPI/Razorpay in CK feature card
- Pricing footer → "Free data migration · No hidden fees · Cancel anytime"
- Claim disclaimer (*case studies) in all proof sections
- 24hr go-live stat card on BillingSW, MgmtSW, CloudKitchen
- New testimonial sections: BillingSW (Matryyoshka + La Fetta), MgmtSW (Mill Bakery + Kates Kitchen)

### CR-256 + CR-257 — 5 Landing Pages Mobile Fix ✅
- Hero `pt-32 → pt-20` on all 5 LPs (200px dead space → 152px on mobile)
- "See Pricing ↓" secondary CTA removed from all 5 LP heroes

### CR-258 — Site-wide Padding + See Pricing ✅
- `pt-32 → pt-20` on **ALL pages** site-wide (Hero.jsx, SectorPage, ProductPage, Petpooja, PosComparison, AiPage, SuccessStories, ProductIndex, SolutionsIndex, About, Blog, BlogPost, Contact, Legal, Resources) — zero `pt-32` remains in codebase
- "See Pricing" secondary CTA removed from **Homepage** (`Hero.jsx`) and **all 11 solution pages** (`SectorPage.jsx`)

---

## 3. Open CRs — Prioritised

### P0 — Owner action, no code, do immediately

| CR | What | How to verify / close |
|---|---|---|
| **CR-200** | **Deploy `build/` to production `www.mygenie.online`** — every improvement this session is invisible on production until deployed. SSH to www server, replace static files. | `view-source:https://www.mygenie.online` — should show new build hash (not old `main.cf3fd6a7.js`) |
| **CR-264** | **Verify GTM_ID in production build.** If `REACT_APP_GTM_ID` was not in `.env` at last prod build, GTM is silent on production — GA4/Ads/Meta all dark. | `view-source:https://www.mygenie.online` — search for `GTM-K5D84Z3L` in `<head>`. If found → close CR-264. If missing → redo CR-198/199 and rebuild before deploying. |

---

### P1 — GTM Dashboard batch (owner does in tagmanager.google.com)

Full plan: `/app/memory/GTM_BATCH_CR216_CR220_CR221_CR222_Plan.md`
Container: **GTM-K5D84Z3L**

| CR | What | Priority |
|---|---|---|
| **CR-220 Fix A+C** | Create `dlv - user_data` variable; switch GAds tag EC mode → Code. Enhanced Conversions broken without this. | P0 within GTM |
| **CR-216** | Unified Google Tag — remove duplicate GA4 + Ads scripts (−179 KB, −308ms) | P1 |
| **CR-247 step 1** | Rename GTM trigger `lead_verifided` → `lead_verified` (then agent does step 2 in code) | P1 |
| **CR-262** | Add `demo_booked` Custom Event trigger → fire GA4 + Google Ads conversion (value ₹300). Calendly bookings are currently untracked. | P1 |
| **CR-248** | Add trigger for `whatsapp_click` → fire to GA4 | P2 |
| **CR-221/222** | Inspect + fix remarketing tag failures | P1 |

---

### P1 — Agent can implement (code work, no blocker)

| CR | What | Files | Effort |
|---|---|---|---|
| **CR-260** | Add `sector` prop to 6 DemoForm instances — currently all appear as "homepage" leads in Freshsales. `ProductPage.jsx`, `SolutionsIndex.jsx`, `About.jsx`, `ProductIndex.jsx`, `AiPage.jsx`, `Contact.jsx` — 1 line each. | 6 files | 5 min + rebuild |
| **CR-247 step 2** | Update `gtm.js` L279: `lead_verified: "lead_verifided"` → `lead_verified: "lead_verified"` after GTM trigger renamed | `src/lib/gtm.js` | 1 line |
| **CR-252** | Cloudflare cache purge automation script — needs `CF_ZONE_ID` + `CF_API_TOKEN` from owner | New deploy script | Medium |

---

### P1 — Owner decision/action needed first

| CR | What | Blocked on |
|---|---|---|
| **CR-263** | Calendly webhook signing key — add to `backend/.env` | Owner provides signing key from Calendly dashboard → Webhooks |
| **CR-259** | Standardise ALL CTAs to bottom sheet (extract `QuickDemoSheet` as shared component, wire to homepage, SectorPages, ProductPages, 5 LPs, Petpooja). Full plan needed — impact analysis first. | Impact analysis + owner approval |
| **CR-250** | Compact hero-section form on 5 landing pages | Owner design/UX approval |

---

### P2 — Lower priority / deferred

| CR | What | Note |
|---|---|---|
| **CR-261** | Duplicate DemoForm on 5 LPs | Auto-closes when CR-259 ships |
| **CR-248** | WhatsApp click → GTM/GA4 | GTM dashboard only |
| **CR-254** | Freshsales data hygiene (outlet-type answers polluting utm_term/gclid) | Owner — Freshsales field ID audit |
| **CR-253** | Freshsales: add "Search Query" field for `utm_query` | After CR-254 resolved |
| **CR-172** | AggregateRating schema — 6-line add to `seo.js` | Owner: provide ratingValue + reviewCount + source platform |
| **CR-186** | Cloudflare RUM beacon defer (2s critical path hit) | Owner — CF dashboard |
| **CR-88** | Individual blog author names (all 21 say "MyGenie Editorial Team") | Owner provides names |

---

## 4. Recommended Next Session Order

```
Session start:
  1. Owner confirms CR-200 (production deploy) + CR-264 (GTM ID verified)
  2. Agent: CR-260 (missing sector prop — 5 min, direct Freshsales accuracy fix)
  3. Owner: GTM batch (CR-220 → CR-216 → CR-247 step 1 → CR-262 → CR-248)
  4. Agent: CR-247 step 2 after GTM rename confirmed
  5. Owner: Calendly signing key → Agent: CR-263

Then discuss:
  6. CR-259 (bottom sheet standardisation) — impact analysis first
  7. CR-250 (hero form on LPs) — owner decision
```

---

## 5. Key Architecture Notes

### Form tracking flow (every DemoForm):
```
submit → POST /api/demo-request → MongoDB + Freshsales upsert
       → pushLead("form_submitted") → dataLayer → GTM → GA4 + Ads + Meta
OTP verify → POST /api/otp/verify + /api/lead/otp-confirm
           → pushLead("book_demo") → dataLayer → "thankyou_conversion" GTM trigger
Calendly booking → pushLead("demo_booked") → dataLayer → NO GTM trigger yet (CR-262)
                 → POST /api/demo-booked → Freshsales mark_demo_booked
```

### GTM gating (important):
- GTM loads ONLY on `www.mygenie.online` and `mygenie.online` — never on preview
- `pushEvent` always queues to `window.dataLayer` regardless of GTM — events are pushed but tags don't fire on preview
- This is intentional — prevents GA4/Ads pollution from test traffic

### `lead_verifided` typo:
- `gtm.js` L279 maps `lead_verified → "lead_verifided"` — intentional typo matches live GTM trigger name
- CR-247: rename GTM trigger first, then update code. Order is critical — reversing breaks tracking.

### Calendly webhook:
- Primary booking path: frontend `calendly.event_scheduled` → `/api/demo-booked` — WORKS
- Webhook redundancy: not registered (no signing key) — CR-263

---

## 6. Files & Docs Reference

| File | What |
|---|---|
| `/app/memory/CR_INTAKE_REGISTER.md` | Full CR register — every CR with status, priority, file locations |
| `/app/memory/GTM_BATCH_CR216_CR220_CR221_CR222_Plan.md` | GTM batch 7-step plan |
| `/app/memory/CR-255_ImpactAnalysis_Line_By_Line_Plan.md` | Trust signals plan (done) |
| `/app/memory/CR-239-to-246_Batch_AY_ImpactAnalysis.md` | Batch AY plan (done) |
| `/app/memory/HANDOVER_2026-09-08_Session11.md` | Previous handover (CR-256/257 fix) |
| `/app/memory/test_credentials.md` | CMS + DB credentials |
| `/app/test_reports/iteration_3.json` | Latest test run — cross-device mobile hero padding (all pass) |

---

## 7. Project Health

- **No broken flows** — all forms submit, OTP sends, leads save to MongoDB
- **No mocked APIs** — all real endpoints
- **Known non-issues on preview:** GTM silent (by design), Freshsales skipped (no API key in preview env)
- **Production not yet updated:** CR-200 pending — production at `www.mygenie.online` still serves the old pre-prerender build

---

*Handover written 2026-09-08 · End of Session 12. Next agent: start with CR-200 verification + CR-260 (quick win) + GTM batch.*
