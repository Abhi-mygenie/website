# CR-229 — PetpoojaAlternative Page: 7 Remaining Content Changes from Audit Brief

**Registered:** 2026-09-06
**Source:** Content audit brief — `mygenie_petpooja_page_content_audit_FINAL.docx`
**Brief URL:** https://customer-assets-rejwkqb3.emergentagent.net/job_direct-react-app/artifacts/zpwpyfdo_mygenie_petpooja_page_content_audit_FINAL.docx
**Status:** ✅ Content approved 2026-09-06 — ready for dev implementation
**Priority:** P1
**Owner:** Content agent (FAQ copy) + Dev (code edits + rebuild)
**File:** `src/pages/PetpoojaAlternative.jsx`

---

## Context for Content/Impact Agent

The `/petpooja-alternative` page targets **broad Petpooja keyword traffic** — not only
"petpooja alternative" searchers, but also visitors who typed "petpooja", "petpooja billing",
"petpooja software", "petpooja POS". These visitors are at the top of the funnel — curious,
not yet committed to switching.

The audit brief (link above) identifies that the current page uses Petpooja's name 15+ times
and frames almost every section around switching — which alienates top-of-funnel visitors
who haven't decided to switch yet.

**Already registered separately:**
- CR-228: H1 + hero subheadline (vsp.js L7, L10) — approved by owner

**This CR covers the remaining 7 changes from the same brief.**

**What is NOT changing (owner decision):**
- Meta title: "Best Petpooja Alternative for Restaurants — MyGenie POS" — stays for SEO
  (not visible on page, only in browser tab + Google SERP)
- Testimonial quote *text* — customer's own words, not touched
- Comparison table *content* — stays, only the column label changes

---

## Change 1 — Comparison Section Column Label

**File:** `src/pages/PetpoojaAlternative.jsx` line 543

```jsx
// BEFORE:
"Billing Software — Petpooja's starting point"

// AFTER:
"Traditional Billing Software"
```

**Why (from brief):** Attaches negative attributes ("doesn't have real-time sync", "doesn't know
why profit is down") directly to Petpooja's name in the same block. Legal risk — each ✗ reads
as a factual claim about Petpooja specifically. Generalising to "Traditional Billing Software"
makes the same point without brand-specific legal exposure. The "MYGENIE — HOSPITALITY
OPERATING SYSTEM" label on the right column stays unchanged.

---

## Change 2 — Testimonial Badge Labels (6 quotes, all showing same badge)

**File:** `src/pages/PetpoojaAlternative.jsx` line 756

```
// BEFORE (all 6 identical):
"Switched from Petpooja"

// AFTER — keep 2–3, replace rest with outcome-based labels:
Keep on:  Bismeet Kaur (Oliwood Cafe) → "Switched from Petpooja"
Keep on:  Pranav Dogra (Cafe 103)    → "Switched from Petpooja"
Keep on:  Himal Chauhan (The Tribe)  → "Switched from Petpooja"
Replace:  Bhanu Pratap (Cafe Amigos) → "Renewed After Year One"
Replace:  Arun Guleria (Bake N Bite) → "Opened 2nd Outlet on MyGenie"
Replace:  Jobhanpreet Singh          → "Live in 24 Hours"
```

**Why (from brief):** Six identical "SWITCHED FROM PETPOOJA" badges in a row turns social proof
into a repetitive anti-Petpooja chorus. For a visitor who hasn't decided to switch, this reads
as a hard sell. Diversifying with outcome tags ("Opened 2nd Outlet", "Renewed After Year One")
gives the same credibility signal without the one-note competitive framing.

**Note for dev:** The badge text is currently a hardcoded string in the JSX rendering block
(line 756). Each quote object in VSP_QUOTES (vsp.js) does not have a badge field — dev needs
to either (a) add a `badge` field to each VSP_QUOTES entry and render dynamically, or
(b) apply the badge conditionally by quote index. Check the rendering block at line 756 before
implementing.

---

## Change 3 — AI Section Small Uppercase Label

**File:** `src/pages/PetpoojaAlternative.jsx` line 791

```jsx
// BEFORE:
"The section Petpooja doesn't have"

// AFTER:
"The AI layer most billing software skips"
```

**Why (from brief):** By this point in the page Petpooja has been named 8+ times. Another
explicit callout ("doesn't have") adds to the aggressive tone without new information. The
replacement makes the same point (this is a differentiator) without another named brand hit.

---

## Change 4 — FAQ Section Heading

**File:** `src/pages/PetpoojaAlternative.jsx` line 1046

```jsx
// BEFORE:
<h2>Common questions about switching from Petpooja.</h2>

// AFTER:
<h2>Common questions about choosing MyGenie.</h2>
```

**Why (from brief):** "Switching from Petpooja" serves only visitors who've already decided
to leave. A restaurant with no existing POS, or one evaluating several options, gets zero
relevant answers and has no reason to keep reading. "Choosing MyGenie" is inclusive of all
funnel stages.

---

## Change 5 — FAQ Questions (content rewrite — needs content agent)

**File:** `src/pages/PetpoojaAlternative.jsx` lines 1049–1052

**Current 4 FAQs (all switching/Petpooja-specific):**
```
Q1: "Is MyGenie a better alternative to Petpooja?"
Q2: "Can I migrate from Petpooja to MyGenie without downtime?"
Q3: "Does MyGenie integrate with Swiggy and Zomato like Petpooja?"
Q4: "What's the main difference between Petpooja and MyGenie?"
```

**Brief recommendation:** Mix in general questions alongside the switching-specific ones.

**Suggested mix (content agent to finalise):**
```
Keep (switching-specific, high-intent):
  Q1: "Can I migrate from Petpooja to MyGenie without downtime?"
      → A: same as current
  Q2: "What's the main difference between Petpooja and MyGenie?"
      → A: same as current

Add (general, top-of-funnel):
  Q3: "Is MyGenie a good fit for a new restaurant with no existing POS?"
      → A: [content agent to write — should address zero-migration path,
            quick setup, ₹799 entry price, works on any Android phone]
  Q4: "How does MyGenie pricing compare to other POS options?"
      → A: [content agent to write — transparent pricing, no hidden fees,
            compare ₹799 vs ₹15–30k terminal cost, link to pricing page]
```

**Why (from brief):** Current FAQs serve only the bottom of the funnel. A visitor who typed
"petpooja" and is exploring options gets no relevant answers and bounces.

**Action required from content agent:** Write answers for Q3 and Q4 above before dev
implements. Answers must be factual — do not invent numbers.

---

## Change 6 — Final CTA Small Uppercase Tag

**File:** `src/pages/PetpoojaAlternative.jsx` line ~950

```jsx
// BEFORE (hardcoded in JSX):
"The switch is easier than you think"

// AFTER:
"Getting started is easier than you think"
```

**Why (from brief):** "The switch" assumes the visitor has a system they're leaving.
"Getting started" works for first-time POS buyers and switchers alike.

---

## Change 7 — Final CTA H2

**File:** `src/pages/PetpoojaAlternative.jsx` line 954 (`fallback` prop)

```jsx
// BEFORE:
fallback="See if MyGenie is the right switch for your restaurant."

// AFTER:
fallback="See if MyGenie is the right fit for your restaurant."
```

**Why (from brief):** "Right switch" presupposes an existing system to switch from.
"Right fit" works for any visitor regardless of their current setup. One word change.

---

## Implementation Notes for Dev

**Order of operations:**
1. Change 5 (FAQs) requires content agent to write Q3+Q4 answers FIRST
2. Changes 1, 3, 4, 6, 7 are straightforward string edits — can be done independently
3. Change 2 (testimonial badges) requires checking the rendering logic at line 756 first
   — may need a `badge` field added to VSP_QUOTES in `vsp.js` depending on how it's rendered

**Rebuild required after all edits.**

---

## Validation (post-build)

```bash
# Change 1
grep "Traditional Billing Software" /app/frontend/build/petpooja-alternative/index.html
grep "Petpooja's starting point" /app/frontend/build/petpooja-alternative/index.html
# Expected: first → found, second → not found

# Change 3
grep "AI layer most billing software" /app/frontend/build/petpooja-alternative/index.html
grep "section Petpooja doesn't have" /app/frontend/build/petpooja-alternative/index.html
# Expected: first → found, second → not found

# Change 4
grep "Common questions about choosing MyGenie" /app/frontend/build/petpooja-alternative/index.html
# Expected: found

# Change 6+7
grep "Getting started is easier" /app/frontend/build/petpooja-alternative/index.html
grep "right fit for your restaurant" /app/frontend/build/petpooja-alternative/index.html
# Expected: both found
```

---

## Related CRs

| CR | Relationship |
|---|---|
| CR-228 | Companion CR — H1 + subheadline already registered (vsp.js L7, L10) |
| CR-137 | PetpoojaAlternative missing FAQPage schema — separate SEO fix |

---

## Brief Reference

**Full audit document:** https://customer-assets-rejwkqb3.emergentagent.net/job_direct-react-app/artifacts/zpwpyfdo_mygenie_petpooja_page_content_audit_FINAL.docx

The brief covers 10 total changes. Changes 1–3 (meta title kept, H1 via CR-228, subheadline
via CR-228) are resolved. This CR covers changes 4–10 from the brief. Read the full brief
for the rationale behind each recommendation before implementing.

---

*Registered 2026-09-06. No code changes made at registration.*
*Content agent must provide FAQ answers (Change 5) before dev can implement fully.*

---

## APPROVED CONTENT — 2026-09-06

Owner approved all 10 items below. Dev to implement as-is. No further content discussion needed.

---

### Change 1 — Comparison Column Label
```
BEFORE: Billing Software — Petpooja's starting point
AFTER:  Traditional Billing Software
```

---

### Change 2 — Testimonial Badge Labels (per quote)

| Quote key | Person | Badge |
|---|---|---|
| q1 | Bismeet Kaur, Oliwood Cafe | Switched from Petpooja ← KEEP |
| q2 | Bhanu Pratap Thakur, Cafe Amigos | Renewed After Year One |
| q3 | Himal Chauhan, The Tribe Cafe | Switched from Petpooja ← KEEP |
| q4 | Pranav Dogra, Cafe 103 | Switched from Petpooja ← KEEP |
| q5 | Arun Guleria, Bake N Bite | Opened 2nd Outlet on MyGenie |
| q6 | Jobhanpreet Singh, The Frost & Froth | Support That Picks Up |

Dev note: Badge is currently hardcoded as one string at line 756 of PetpoojaAlternative.jsx.
Add a `badge` field to each VSP_QUOTES entry in vsp.js, render dynamically.

---

### Change 3 — AI Section Label
```
BEFORE: The section Petpooja doesn't have
AFTER:  The AI layer most billing software skips
```

---

### Change 4 — FAQ Section Heading
```
BEFORE: Common questions about switching from Petpooja.
AFTER:  Common questions about choosing MyGenie.
```

---

### Change 5 — FAQ Questions (full set, approved)

**Q1 (NEW — replaces "Is MyGenie a better alternative to Petpooja?"):**
Q: Is MyGenie a good fit for a restaurant opening for the first time?
A: Yes. MyGenie works for restaurants at every stage — including outlets that have never
   used a POS before. Setup takes under 24 hours, no hardware purchase is needed (runs on
   any Android phone or tablet), and a dedicated onboarding specialist is included from day
   one. Starting at ₹799/outlet/month, there's no upfront cost and no long-term contract.

**Q2 (KEEP — unchanged):**
Q: Can I migrate from Petpooja to MyGenie without downtime?
A: Yes. MyGenie's onboarding team migrates your menu, inventory, and customer data in under
   48 hours. Your Petpooja system keeps running until go-live. No manual re-entry, no downtime.

**Q3 (NEW — replaces "Does MyGenie integrate with Swiggy and Zomato like Petpooja?"):**
Q: How does MyGenie pricing compare to other restaurant POS options?
A: MyGenie pricing starts at ₹799/outlet/month, published upfront — no calls, no quotes,
   no surprises. Most POS systems either require a ₹15,000–30,000 terminal purchase plus a
   monthly fee, or hide pricing behind a sales inquiry. MyGenie's Starter plan includes
   billing, inventory, KOT and daily reports. Growth (₹1,299/month) adds aggregator sync,
   CRM and Captain App. See the full breakdown on the pricing page.

**Q4 (KEEP — unchanged):**
Q: What's the main difference between Petpooja and MyGenie?
A: Petpooja is billing-first. MyGenie is a hospitality OS — billing + inventory + AI + CRM
   + loyalty in one app, not separate modules. The comparison table above covers 10 features
   side by side.

---

### Change 6 — Final CTA Label
```
BEFORE: The switch is easier than you think
AFTER:  Getting started is easier than you think
```

### Change 7 — Final CTA H2 (fallback prop)
```
BEFORE: See if MyGenie is the right switch for your restaurant.
AFTER:  See if MyGenie is the right fit for your restaurant.
```

---

*Content approved by owner 2026-09-06. Impact analysis closed.*
*Dev: implement all 7 changes + rebuild when scheduled. No further content approval needed.*
