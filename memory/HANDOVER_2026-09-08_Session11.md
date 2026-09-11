# Agent Handover — 2026-09-08 · Post CR-255 Session

**Written by:** E1 Agent
**Repo:** https://github.com/Abhi-mygenie/website.git · branch: main
**Preview URL:** https://react-deploy-6.preview.emergentagent.com
**Production:** https://www.mygenie.online / https://beta.mygenie.online
**Previous handover:** `HANDOVER_2026-09-08_Session10.md`

---

## HOW TO USE THIS HANDOVER

Owner tested CR-255 on iPhone and found 2 issues (see Section 3).
Fix both, then owner will test again and provide further feedback.
Do NOT jump to other CRs until these 2 fixes are confirmed.

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

**Rebuild + prerender command (from `/app/frontend`):**
```bash
cd /app/frontend && yarn build
sudo supervisorctl restart frontend
```
*(Run in background — takes ~2 min.)*

---

## 2. What Was Done This Session (CR-255)

### CR-255 — Trust Signal Uplift on 5 Google Ads Landing Pages ✅ SHIPPED

Added the following to all 5 pages (`/restaurant-pos-system`, `/restaurant-billing-software`, `/restaurant-management-software`, `/cloud-kitchen-pos`, `/qsr-pos-system`):

| Sub-task | What was added |
|---|---|
| **255-A + 255-G** | "WORKS WITH" hero badge strip: Swiggy + Zomato + Razorpay + GST-ready + **75 cities in India** — below CTAs in hero left column |
| **255-B** | India compliance section on `RestaurantBillingSoftware` (GST/UPI/Swiggy pills). UPI+Razorpay added to `CloudKitchenPos` feature card. |
| **255-C** | `"Free data migration included · No lock-in · Cancel anytime"` text line below Works with strip in hero |
| **255-D** | Pricing section footer updated to `"Free data migration · No hidden fees · Cancel anytime"` on 3 pages |
| **255-E** | `*Based on internal case studies & partner results` disclaimer added to all 5 proof sections |
| **255-F** | 24hr go-live stat card added to BillingSW, MgmtSW, CloudKitchen (replaced one existing stat) |
| **255-H** | New testimonial/proof sections on BillingSW (Matryyoshka + La Fetta) and MgmtSW (Mill Bakery + Kates Kitchen) |

Also fixed two separate bugs:
- **Mobile navbar**: Added "Book a Free Demo" button to mobile header in `Navbar.jsx` (was logo + hamburger only — Petpooja page had it, others didn't)
- **WhatsApp FAB**: Added `REACT_APP_WHATSAPP_ENABLED=false` to `frontend/.env` — FAB was showing despite owner expecting it disabled

---

## 3. TWO OPEN ISSUES — Owner reported after testing on iPhone

Owner tested `/restaurant-billing-software` on iPhone and found:

### Issue A — Large empty space at top of hero on mobile (HIGH)

**Screenshot 1 (current bad state):** Large blank green space between navbar and eyebrow pill. H1 is not visible on first fold.

**Root cause confirmed by code inspection:**
All 5 landing pages have this hero section class:
```jsx
<section className="bg-brand-sand pt-32 pb-20 lg:pt-40 ...">
```
- `main` has `pt-[72px]` (offsets the fixed 72px navbar)
- `pt-32` = 8rem = **128px** additional top padding inside the hero
- Combined: 72 + 128 = **200px** of space before H1 appears
- On a standard iPhone (852px height), this wastes ~23% of the first fold

**All 5 pages are affected** — same `pt-32 pb-20 lg:pt-40` on all.

**Proposed fix:**
```jsx
// BEFORE (all 5 pages)
<section className="bg-brand-sand pt-32 pb-20 lg:pt-40 ...">

// AFTER
<section className="bg-brand-sand pt-20 pb-16 lg:pt-40 ...">
```
- `pt-20` = 5rem = 80px (down from 128px) — reduces dead space
- `lg:pt-40` unchanged — desktop layout unaffected
- `pb-20` → `pb-16` — minor tighten, optional

**Files:** `RestaurantPosSystem.jsx`, `RestaurantBillingSoftware.jsx`, `RestaurantManagementSoftware.jsx`, `CloudKitchenPos.jsx`, `QsrPosSystem.jsx` — 1 string edit per file (5 total).

**Lighthouse safety:** This is a padding change on a non-LCP, non-image element. Zero CLS (no layout shift — just less whitespace). Zero LCP impact. Safe.

---

### Issue B — "See Pricing ↓" secondary CTA should be removed (MEDIUM)

**Owner's feedback:** The "See Pricing ↓" button is unnecessary. It distracts from the primary "Book a Free Demo" CTA on a paid landing page. Remove it.

**Root cause confirmed:**
All 5 pages have this secondary CTA button in the hero:
```jsx
<a href="#lp-pricing" ... data-testid="{page}-lp-cta-secondary">
  See Pricing ↓
</a>
```

**All 5 pages are affected** — identical pattern.

**Proposed fix:** Remove the `<a href="#lp-pricing">` secondary CTA from the hero on all 5 pages. The pricing section stays on the page — users who scroll will still find it. Only the hero CTA button is removed.

**Files:** Same 5 files — 1 element removal per file.

**Lighthouse safety:** Removing a button reduces DOM nodes slightly. Zero LCP impact. Positive for conversion focus.

---

## 4. Fix Implementation Instructions

### Step 1 — Fix A: Reduce hero top padding (5 pages)
For each file, find and replace:
```
"bg-brand-sand pt-32 pb-20 lg:pt-40 relative overflow-hidden"
```
Replace with:
```
"bg-brand-sand pt-20 pb-16 lg:pt-40 relative overflow-hidden"
```

Files: `RestaurantPosSystem.jsx`, `RestaurantBillingSoftware.jsx`, `RestaurantManagementSoftware.jsx`, `CloudKitchenPos.jsx`, `QsrPosSystem.jsx`

Note: `QsrPosSystem.jsx` uses `pt-32 pb-20 lg:pt-40` — same change applies.

### Step 2 — Fix B: Remove "See Pricing ↓" CTA (5 pages)
For each file, remove this entire `<a>` block from the hero:
```jsx
                  <a href="#lp-pricing" className="inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold border-2 border-brand-orange/40 text-brand-orange hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all" data-testid="{page}-lp-cta-secondary">
                    See Pricing ↓
                  </a>
```
The `data-testid` suffix differs per page: `pos-lp-cta-secondary`, `billing-lp-cta-secondary`, `mgmt-lp-cta-secondary`, `ck-lp-cta-secondary`, `qsr-lp-cta-secondary`.

### Step 3 — Build
```bash
cd /app/frontend && yarn build
sudo supervisorctl restart frontend
```

### Step 4 — Verify (mobile viewport 390px)
Take screenshot at 390×844 of `/restaurant-billing-software` — H1 should be visible within first fold, no large empty space, no "See Pricing" button visible in hero.

---

## 5. Other Open Items (do NOT start until owner confirms Issues A+B are fixed)

### Agent-executable (code work)
| CR | What | Priority |
|---|---|---|
| CR-247 | Fix `lead_verifided` typo in GTM + `gtm.js` L279 — GTM rename must happen first | P1 |
| CR-252 | Cloudflare cache purge automation script | P1 |

### Owner/GTM dashboard batch (CR-216 + CR-220 + CR-247 + CR-248 + CR-221/222)
Full 7-step plan: `/app/memory/GTM_BATCH_CR216_CR220_CR221_CR222_Plan.md`
Container: **GTM-K5D84Z3L**

### Owner action (no code)
| CR | What |
|---|---|
| CR-200 | **Deploy current `build/` to `www.mygenie.online`** — production still serving old pre-prerender build. Everything shipped today is invisible on production until this is done. |
| CR-254 | Freshsales data hygiene — outlet-type answers polluting utm_term/gclid fields |

---

## 6. Key Files Reference

| File | What |
|---|---|
| `/app/memory/CR_INTAKE_REGISTER.md` | Full CR register — every CR with status |
| `/app/memory/CR-255_ImpactAnalysis_Line_By_Line_Plan.md` | Full CR-255 plan with all decisions |
| `/app/memory/GTM_BATCH_CR216_CR220_CR221_CR222_Plan.md` | GTM batch 7-step plan |
| `/app/memory/test_credentials.md` | CMS + DB credentials |

---

## 7. Project Health

- **CR-255 shipped:** Trust signals on 5 landing pages ✅
- **Mobile navbar fix shipped:** "Book Free Demo" in mobile header ✅
- **WhatsApp FAB disabled:** `REACT_APP_WHATSAPP_ENABLED=false` in .env ✅
- **Two post-CR-255 issues open:** Hero padding (empty space) + "See Pricing" removal
- **Production not yet updated:** CR-200 pending owner deploy
- **No broken flows. No mocked APIs.**

---

*Handover written 2026-09-08 · Post CR-255. Next agent: fix Issues A+B → owner tests → continue.*
