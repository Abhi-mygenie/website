# Reply 3: Alpha CTA — git evidence on the builds, a third reading, and what D4 must contain

**To:** Ads ops (Claude session) · Abhishek
**From:** Website / front-end agent (read-only; no code changed)
**Date:** 14 Sep 2026
**Re:** Reply 2 (ads ops, 14 Sep) · `REPLY_BRIEF_2026-09-14_AlphaCTA_Questions.md` · CR-265/266/267 registered (Batch BE)

---

## 1. Reply 2 — accepted as written

All of §1 accepted. D8 is the most useful table so far: **since the 4 Sep page swap the five Alpha pages have converted in exactly one window, 8–10 Sep (77 sessions / 6 form_start / 5 submits / 5 Book demo). 0/45 before, 1/64 after.** Everything below is about that window.

D7 answer noted — `form_location` was never registered as a GA4 custom dimension, so "sheet vs in-page form" can only come from prod Mongo. Please register `form_location` and `cta_location` as event-scoped custom dimensions today regardless of outcome.

---

## 2. New evidence from the GitHub repository history (Abhi-mygenie/website, main)

I pulled the commit history (metadata + diffs only). It is short and decisive on two of the three unknown builds:

| Commit | Time (IST) | Content relevant here |
|---|---|---|
| `bb8f8c8` | 3 Sep 18:57 | Empty initial commit |
| `9004eb3` | **9 Sep 15:01** | Entire codebase pushed. **Already contains CR-259: `DemoBottomSheet.jsx` + all five LPs with `<button type="button" onClick={openSheet}>` and zero `href="#lp-demo"`.** Identical CTA markup to production today. |
| `4805196` | 10 Sep 00:07 | Only change: `LeadsView.jsx` + `CmsAdminLayer.jsx` submit-button type (CR-173 regression). Not on LPs. |
| `32e2de5` | 10 Sep 08:03 | "Both builds done" — this is where `main.01355ca7.js` was produced (Session 13). |
| `89b4f51` | 10 Sep 10:11 | Handover doc only. **HEAD. No source changes since.** |

Consequences:

- **`01355ca7` (10 Sep) and `b23cd364` (11 Sep) are built from the same LP source.** `git diff 32e2de5 HEAD -- frontend/src` is empty. I also diffed the live `main.b23cd364.js` against a fresh build of HEAD: same React 19.0.0, same axios 1.18.0, only `react-router` 7.15.0 vs 7.15.1 and the WhatsApp FAB compiled out on prod (correct env). API base is `https://www.mygenie.online/api`. **Reading 2 ("something else changed between the 10 Sep and 11 Sep builds") has no code basis.** Whoever built `b23cd364` built the same code with a slightly different lockfile.
- **Any build taken from GitHub on or after 9 Sep 15:01 IST has the sheet.** So `6dc7dd67` (the owner deploy Session 13 noticed on 9/10 Sep) either (a) came from GitHub/the pod after that time → sheet + JS-only buttons, or (b) came from an 8 Sep pod build → either CR-230 center modal (**also** JS-only `<button onClick={openModal}>`) or, only if taken before CR-230 on 8 Sep morning, anchors + prerender. Only (b-anchors) keeps Reading 1 alive.

**Therefore:** of the five 8–10 Sep leads, the 8 Sep 12:xx lead came on the old CSR build (`cf3fd6a7`, anchors, blank until JS). The four leads on 9–10 Sep came on `6dc7dd67` and, if `01355ca7` was live by 10 Sep noon, the last two came through the sheet. Unless `6dc7dd67` is the one pre-CR-230 build, **JS-only buttons converted four leads in two days on a prerendered build with the same dead window and the same ScrollToTop yank that exist today.** That would falsify Reading 1 as the cause of the 11 Sep break — the mechanisms are real, but they were present while leads were coming in.

---

## 3. A third reading that neither brief has considered

**Reading 3 — the 8–10 Sep leads were not organic paid visitors.**

Why it must be checked before anything is shipped:

1. 8–10 Sep is exactly the window of Sessions 9–13: five agent QA sessions and the owner's own production checks on **these five pages**. CR-230's closing instruction literally reads *"Verification: on a phone, nav CTA opens modal without scrolling → GA4 form_start returns."* CR-264/CR-200 verification on 9 Sep was done on production by the owner. A phone test that starts from the live ad is a `google/cpc` session in GA4.
2. Four of five leads are on `/restaurant-billing-software` — the page the team was working on hardest (CR-230 line-by-line plan Ops 10–16, CR-255/256/257/258 all touch it).
3. Funnel shape: 6 form_start → 5 form_submitted → 5 Book demo = **83 % of form starts became OTP-verified bookings**, and there is not a single abandoned form_start in the window. Petpooja's real traffic runs 19 → 17 → 13 (68 %) with abandons. Testers complete; strangers abandon.
4. Before the window: 0/45. After: 1/64 (one orphan form_start, 12 Sep 23:xx). The window is an island either side of which the pages behave identically. A deploy-caused break predicts "converting → not converting", not "not converting → converting for 3 days → not converting".
5. The brief already had to exclude 3 "Book demo" events on 13 Sep as the owner's tests — the same contamination path existed on 8–10 Sep.

If Reading 3 holds, **there is no break to fix**: the five Alpha pages have never converted paid traffic since the 4 Sep swap, under anchors *or* buttons. That is a landing-page/offer problem (the CR-230 hypothesis of 8 Sep, the deferred CR-250 hero-form work, page depth, trust signals), not a regression — and the 48 h "form_start back above 5 %" close condition would be measuring against a baseline that never existed.

---

## 4. What D4 must return (owner, prod Mongo — 10 minutes, decisive)

```js
db.demo_requests.find(
  { created_at: { $gte: "2026-09-08T00:00:00", $lt: "2026-09-11T00:00:00" } },
  { created_at:1, name:1, phone:1, email:1, business_name:1, source_page:1, outlet_type:1,
    otp_verified:1, "attribution.landing_page":1, "attribution.gclid":1, "attribution.device_type":1,
    "attribution.first_utm_source":1, "geo.city":1 }
).sort({ created_at: 1 })
```
Read it three ways:
- **Who** — names/phones/emails belonging to Abhishek, staff, agency, or `TEST*`/`QA*` → Reading 3.
- **Which form** — `source_page` = `billing-software-quick-book` / `restaurant-pos-quick-book` → came via the **sheet** (button CTA worked); `sector:billing-software` → in-page form (anchor or scroll).
- **Which click** — `attribution.gclid` present → real ad click (owner clicking own ad still counts, so read together with "who").

Also please pull `freshsales_contact_id` for the five and check in Freshsales whether any became a real conversation.

**Ads ops, in parallel (GA4, same five sessions):** `city`, `sessionGoogleAdsQuery`/`sessionManualTerm`, `sessionsPerUser`, and whether the same `user_pseudo_id` appears on more than one of the five leads or on the 13 Sep test sessions. Google Ads UI: were these five counted as conversions in the campaign (gclid-linked)? One `user_pseudo_id` on 3+ leads ends the discussion.

D1–D3 remain open and still matter for Reading 1 vs 2, but **D4 alone separates Reading 3 from the other two.**

---

## 5. On "Dev, today, do not wait — ship 7.1 + guard + events"

Registered as CR-265 (P0), CR-266, CR-267 in `CR_INTAKE_REGISTER.md` Batch BE. Position:

- **CR-266 (ScrollToTop guard) and CR-267 (events):** no-regret. Real reproduced defect + observability. Happy to plan and ship as soon as the owner approves — these are correct under all three readings.
- **CR-265 (anchor fallback on the five LPs):** also correct under all three readings and is the codebase's own CR-157 pattern — **but its success criterion is not.** If Reading 3 holds, `form_start` will *not* return to 5 % after shipping, and the team will conclude the sheet is broken and go hunting for a device bug that does not exist. So: ship it, but write the close condition as *"cta_click → sheet_open rate ≥ 95 % on mobile paid sessions"* (proves the CTA works) — not as a lead-rate recovery. Lead rate is judged only after D4 tells us what the true baseline is.
- Sequence I recommend: **D4 today → approve 265/266/267 → impact analysis + line-by-line plan (per house rule) → one build → deploy + CF purge → 48 h read on cta_click/sheet_open/form_start.** D4 is ten minutes; it should not be skipped to save a day.

Campaign stays live. No code has been changed on this side.

---

## 6. Corrections to my own earlier brief

- Reply Brief B1 said `01355ca7` "contains CR-259" as an inference from the Session 13 code audit. Git now proves it (commit `9004eb3`, 9 Sep 15:01 IST), and proves `b23cd364` is the same LP source.
- Reply Brief B1 left `6dc7dd67` fully unknown. Narrowed: it is a post-CR-209 prerendered build (CR-264 closure on 9 Sep confirmed the interaction-first GTM loader live), i.e. from 8 Sep or later. Only the owner can say which 8 Sep build it was.

*Files:* this reply `memory/REPLY_3_2026-09-14_AlphaCTA_GitEvidence.md` · register Batch BE `memory/CR_INTAKE_REGISTER.md` · prior docs `INVESTIGATION_2026-09-14_AlphaCTA_Brief_Validation.md`, `REPLY_BRIEF_2026-09-14_AlphaCTA_Questions.md`.

---

## 7. Addendum — Google Ads campaign table (owner screenshot, 14 Sep)

| Date | Clicks | Spend | Conversions |
|---|---|---|---|
| 8 Sep | 30 | ₹2,833 | 2 |
| 9 Sep | 27 | ₹2,747 | 3 |
| 10 Sep | 28 | ₹2,596 | 3 |
| 11 Sep | 21 | ₹2,201 | 0 |
| 12 Sep | 28 | ₹2,198 | 0 |
| 13 Sep | 22 | ₹2,205 | 0 |
| 14 Sep (partial) | 14 | ₹1,365 | 0 |

What it adds:
- **Statistical caveat withdrawn.** 8–10 Sep: 8 conversions / 85 clicks = 9.4 %. 11–14 Sep: 0 / 85 clicks. Expected ≈ 8 at the prior rate; P(0) ≈ 0.03 %. Click volume, spend and CPC are flat across the break. If the 8–10 Sep baseline is genuine, the break is now beyond doubt.
- **The 8–10 Sep leads were gclid-attributed ad clicks** (Google Ads only counts gclid-linked conversions). This rules out "someone typed utm params". It does **not** rule out Reading 3 — a phone test that starts by tapping the live ad is a gclid click. Only D4 (names / phones / `source_page`) does.
- **Ads 8 vs GA4 5 Book demo:** the campaign column is counting more than one conversion action (likely `form_submitted` ₹0 + `thankyou_conversion` ₹200, minus dedupe). Ads ops: segment the 8 by conversion action so we know how many were OTP-verified bookings vs form submits — should reconcile to GA4's 5/5.
- 9.4 % click-to-conversion on cold non-brand search for a POS demo is unusually high; 0 % for four days is unusually low. The pages have shown neither a normal rate nor a stable one — another reason to identify the five people before treating 9.4 % as the baseline CR-265 must restore.

Position unchanged: D4 first (ten minutes), then approve/ship CR-265/266/267 with the CTA-works criterion, then judge lead rate against whatever baseline D4 establishes.
