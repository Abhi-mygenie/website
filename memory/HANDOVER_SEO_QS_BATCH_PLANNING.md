# Agent Handover — SEO & Google Ads Quality Score Improvement Programme

**Date:** 2026-08-20  
**Handing off:** Planning Session Agent → Next Agent  
**Session type:** Planning & Impact Analysis (no code was written this session)  
**Current stage:** Impact Analysis COMPLETE for Batches 1, 2, 3 — **Awaiting owner approval before implementation**

---

## What This Programme Is About

MyGenie is losing 35–59% of eligible Google Ads impressions due to Ad Rank, confirmed root cause: **Landing Page Experience = "Below Average"** across every keyword in both campaigns. The owner received a marketing brief (5 issues) and an external SEO audit (SEO Health: 41/100).

This session diagnosed every issue to the source code, registered 41 CRs, organised them into 4 batches, completed impact analysis for Batches 1/2/3, and wrote a detailed implementation plan for Batch 1.

**Nothing has been coded yet. The next agent's first job is to present the batch summaries to the owner and get implementation approval before writing a single line.**

---

## What Was Completed This Session

### 1. Deployment
- Cloned `https://github.com/Abhi-mygenie/website.git` (branch: main) into `/app`
- All env variables applied to `frontend/.env` and `backend/.env`
- Memory dir synced from remote (33 CR files)
- All 41 new CRs registered as `/app/memory/CR-70_*.md` through `/app/memory/CR-110_*.md`

### 2. Investigation & Audit
- Investigated all 5 issues from the marketing brief in detail
- Received and validated `FULL-AUDIT-REPORT.md` + `ACTION-PLAN.md` from external auditor
- Found 4 inaccuracies in the external audit (documented — important context for owner)
- Found 7 additional gaps not covered in the original plan (registered as GAP-1 through GAP-7, merged into relevant CRs)

### 3. Plan & Tracker
- Built a complete 49-item prioritised plan across 4 tiers: Critical / High / Medium / Low
- Created interactive HTML tracker at `/app/frontend/public/seo-plan.html` (accessible at the site URL)
- Organised all 10 Critical CRs into **4 batches** based on file overlap and execution logic

### 4. Impact Analysis — Completed
- **Batch 1 (CR-70 + CR-71):** Complete. Implementation plan written. ✅ Ready to code on approval.
- **Batch 2 (CR-72 + CR-79):** Impact analysis complete. Implementation plan NOT yet written.
- **Batch 3 (CR-73 + CR-74 + CR-75 + CR-76):** Impact analysis complete. Implementation plan NOT yet written.
- **Batch 4 (CR-77 + CR-78):** Cloudflare dashboard changes only — owner action, no agent work needed.

---

## The 4 Batches — What Each Does

### Batch 1 — `index.html` Performance *(CR-70 + CR-71)*
**Files:** `public/index.html`, `src/index.css`, `src/components/home/Hero.jsx`  
**Time:** 50 min dev  
**What it fixes:** Wrong font preloaded (Inter, which is unused) + actual fonts Poppins/Clash Display loaded as render-blocking CSS `@import`. Hero image (305KB, LCP candidate) not preloaded. These directly hurt FCP and LCP — the two metrics Google measures for LP Experience.  
**Impact analysis verdict:** ✅ PROCEED — All dependencies verified clean. One caveat: CR-71 preload benefit only measurable on production (not in preview due to a stale CMS hero image override — documented in CR-71 Finding 7+8, pre-existing bug filed separately).

### Batch 2 — `App.js` Refactor *(CR-72 + CR-79)*
**Files:** `src/App.js` (modified), `src/pages/NotFound.jsx` (new)  
**Time:** ~2.5 hrs dev  
**What it fixes:** All 19 pages are eagerly bundled into one 2.17MB JS file — code splitting eliminates this. Soft-404s return HTTP 200 (homepage redirect instead of real 404 page) — hurts crawl budget and indexation.  
**Impact analysis verdict:** ✅ PROCEED — Key findings: (1) `lazy` + `Suspense` must be added to the React import line; (2) 5 non-page imports must stay eager (CmsAdminLayer, ConsentBanner, Toaster, ScrollDepthTracker, WhatsAppFab); (3) Legal component needs only 1 lazy import covering 3 routes; (4) NotFound.jsx should also be lazy since it's a rare access path.

### Batch 3 — Petpooja LP Full Overhaul *(CR-73 + CR-74 + CR-75 + CR-76 + CR-111)*
**Files:** `src/pages/PetpoojaAlternative.jsx` (modified), `src/components/home/StickyMobileCta.jsx` (modified), `src/data/vsp.js` (modified)  
**Time:** ~1.5 hrs dev  
**What it fixes:** The highest-spend Google Ads LP has 4 issues — stripped footer (no phone/privacy), broken mobile sticky CTA, H1 with zero search keywords, and trust logos showing as text instead of images.  
**Impact analysis key findings:**
- `COMPANY` is NOT yet imported in `PetpoojaAlternative.jsx` — must add
- `StickyMobileCta` is NOT imported — must add
- Root cause of broken sticky CTA confirmed: hardcoded `data-testid="hero"` selector in `StickyMobileCta.jsx` line 37 — VSP page uses `"vsp-hero"`. Fix: expand to 4 testids
- Production CMS has NO stored VSP keys → vsp.js H1 change takes effect immediately on production
- VSP_TRUST_LOGOS has TWO consumer strips: VspHero (hardcoded 4 items) and VspCta (uses VSP_TRUST_LOGOS). Both need updating
- All 8 logo files confirmed to exist with exact filenames verified against `stories.js`

### Batch 4 — Cloudflare *(CR-77 + CR-78)* — Owner Action
**No agent work needed.** Owner must:
- CR-77: Security → WAF → allow Googlebot (first confirm 403 with: `curl -A "Googlebot/2.1 (+http://www.google.com/bot.html)" https://mygenie.online/petpooja-alternative -I`)
- CR-78: Rules → Redirect Rule: `mygenie.online/*` → `https://www.mygenie.online/$1` (301). Also verify apex sitemap redirects.
- Can be done in parallel with any other batch — zero code dependencies

---

## Recommended Execution Order

```
PARALLEL:
├── Owner does Batch 4 (Cloudflare) — 1 hr, no agent involvement
└── Dev:
    Batch 3 (1.5 hrs) → Batch 1 (50 min) → Batch 2 (2.5 hrs)
```
*Why Batch 3 first: highest direct QS impact (fixes the live ad LP). Batch 2 last: largest code change (routing layer), benefits from other changes being stable first.*

---

## What the Next Agent Must Do (In Order)

### Step 1 — Read the impact analysis documents
Before starting anything:
```
/app/memory/CR-70_Wrong_Font_Preload_index_html.md    — Batch 1, full plan written
/app/memory/CR-71_Hero_LCP_Image_Preload.md           — Batch 1, full plan written
/app/memory/CR-72_React_Lazy_Code_Splitting.md        — Batch 2
/app/memory/CR-79_Soft_404_Fix.md                     — Batch 2
/app/memory/CR-73_LandingFooter_Trust_Links_Petpooja.md — Batch 3
/app/memory/CR-74_StickyMobileCta_Petpooja_Fix.md     — Batch 3
/app/memory/CR-75_Petpooja_H1_Keyword_Fix.md          — Batch 3
/app/memory/CR-76_Petpooja_Trust_Logo_Images.md       — Batch 3
```

### Step 2 — Present to owner and get approval
Present the per-batch summary above (Section "The 4 Batches"). Ask:
1. Which batch to start with (recommendation: Batch 3 first, but owner decides)
2. Confirm Batch 4 (Cloudflare) will be handled by the owner/DevOps
3. Get go-ahead to write the implementation plan for the approved batch

**Do not start writing code until the owner explicitly approves.**

### Step 3 — Write implementation plan for the approved batch
For the batch the owner approves first, follow the **same structure as the Batch 1 plan** in `CR-70`:
- Step-by-step execution order with exact before/after for every line
- Checkpoint after each step (what to verify in browser/DevTools before moving on)
- Rollback instruction per step
- Full validation checklist at the end

Batch 1 plan already written — if owner approves Batch 1 first, skip directly to implementation.

### Step 4 — Get approval on the implementation plan
Show the plan to the owner. Only begin coding after explicit approval of the plan document.

### Step 5 — Implement, then update CR status
After implementation, update each CR file:
```
Status: IMPLEMENTED — [date]
```
And update the HTML tracker at `/app/frontend/public/seo-plan.html` (check the checkbox for the relevant items).

---

## Key Files Reference

| File | What it is |
|---|---|
| `/app/frontend/public/seo-plan.html` | Interactive tracking dashboard — 49 items, checkboxes persist in localStorage |
| `/app/memory/CR-70_*.md` to `CR-110_*.md` | All 41 registered CRs |
| `/app/memory/CR-70_Wrong_Font_Preload_index_html.md` | Most complete — has both impact analysis AND full step-by-step implementation plan |
| `/app/memory/CR-71_Hero_LCP_Image_Preload.md` | Has impact analysis with CMS override caveat (read Finding 7+8) |

---

## Important Nuances to Not Lose

### 1. Hero image CMS override in preview (Finding B-CR71-7+8)
The preview environment has a stale CMS override pointing `home.hero.banner_image` to a missing local file. Production does NOT have this override. After Batch 1 is implemented, the hero image preload will work on production but the preview will still show a broken hero image. This is a **pre-existing bug**, not caused by Batch 1. Fix separately: remove the `home.hero.banner_image` key from the preview CMS via the admin panel.

### 2. CR-72 must NOT lazify these 5 imports
`CmsAdminLayer`, `ConsentBanner`, `Toaster`, `ScrollDepthTracker`, `WhatsAppFab`. All explained in Finding B2-2. Lazifying ConsentBanner or Toaster would cause functional regressions.

### 3. CR-76 has two separate trust strips (Finding B3-10)
VspHero uses a **hardcoded array** (not VSP_TRUST_LOGOS). VspCta uses VSP_TRUST_LOGOS. Both must be updated in the same session. After converting VSP_TRUST_LOGOS to objects, VspHero should use `VSP_TRUST_LOGOS.slice(0, 4)` to eliminate the duplication.

### 4. Batch 4 is entirely owner/DevOps action
CR-77 (Googlebot whitelist) and CR-78 (apex → www redirect). Zero code changes. The agent only needs to verify after the owner has actioned it, using the curl commands in the CR files.

### 5. All 4 batches have zero file overlap between them
Confirmed and verified. Batches can be implemented in any order and by different agents without conflict.

---

## CRs Still OPEN (not yet planned)

High tier: CR-80 through CR-88 (H1–H10)  
Medium tier: CR-89 through CR-100 (M1–M12)  
Low tier: CR-101 through CR-110 (L1–L10)  

These are not the next agent's immediate concern. Focus only on Critical CRs 70–79 (the 4 batches).

---

## Session Closed

This session ends here. No code was written. The site is running correctly with no changes made. The next agent begins with Step 1 above.

---

*Handover written 2026-08-20. Planning session agent. Next: present batch summaries to owner → get approval → write implementation plan → get plan approval → implement.*
