# CR-228 — PetpoojaAlternative Hero H1 + Subheadline Rewrite

**Registered:** 2026-09-06
**Source:** Owner decision — content strategy review of /petpooja-alternative page
**Status:** 🔲 Open — dev, 2 string edits + rebuild
**Priority:** P1
**Owner:** Dev
**File:** `src/data/vsp.js` lines 7 and 10

---

## 1. Context & Why

The `/petpooja-alternative` page targets broad Petpooja keyword traffic — not just
"petpooja alternative" searchers but also people typing "petpooja", "petpooja billing",
"petpooja software", "petpooja POS". These visitors are curious and exploring, not yet
committed to switching.

The current H1 "The honest Petpooja alternative" has two problems:
1. **"honest" = legal risk** — implies Petpooja is dishonest (comparative advertising exposure)
2. **Assumes switching intent** — alienates visitors who just searched "petpooja" to learn about it

The subheadline "Petpooja runs 1.5 lakh restaurants. It's earned that..." is fine in tone
but naming Petpooja this early reinforces the competitor-first framing before the visitor
has seen MyGenie's value.

Meta title ("Best Petpooja Alternative for Restaurants — MyGenie POS") is NOT changing —
it is only visible in browser tab and Google SERP, not on the page. SEO value preserved.

---

## 2. Changes

### Change A — H1 (variant_a)

**File:** `src/data/vsp.js` line 7

```js
// BEFORE:
variant_a: "The honest Petpooja alternative — see why 500+ restaurants switched to MyGenie.",

// AFTER:
variant_a: "The restaurant OS built for what billing software can't do — inventory, CRM, AI, all connected.",
```

**Why:** Leads with MyGenie's value proposition instead of a competitor callout. Works
for ALL visitors — curious Petpooja searchers, general POS researchers, and confirmed
switchers alike. Removes the legal risk from "honest."

---

### Change B — Hero subheadline (variant_a_sub)

**File:** `src/data/vsp.js` line 10

```js
// BEFORE:
variant_a_sub:
  "Petpooja runs 1.5 lakh restaurants. It's earned that. But a holistic OS — billing, inventory, expenses, customers and AI, all connected — is a different thing entirely.",

// AFTER:
variant_a_sub:
  "Billing software and a restaurant operating system are different things. Here's what changes when billing, inventory, expenses, customers and AI all run in one connected system.",
```

**Why:** Makes the same product differentiation point without opening with Petpooja's name.
A curious visitor discovers the difference between billing software and a full OS —
without being told what they should switch from.

---

## 3. What Is NOT Changing

| Element | Decision |
|---|---|
| Meta title | Stays — "Best Petpooja Alternative for Restaurants — MyGenie POS" (SEO, not visible on page) |
| variant_b headline | Stays — "Most Indian restaurants run on Petpooja. Some of them switch to us." |
| variant_b_sub | Stays |
| CTA buttons | Stays — "Book a Free Demo →" / "See the comparison ↓" |
| Comparison table | Stays |
| Rest of page content | Stays |

---

## 4. Validation (post-build)

```bash
# H1 must show new text
grep "restaurant OS built for" /app/frontend/build/petpooja-alternative/index.html
# Expected: match found

# Old H1 must be gone
grep "honest Petpooja alternative" /app/frontend/build/petpooja-alternative/index.html
# Expected: no output

# Subheadline must show new text
grep "Billing software and a restaurant operating system" /app/frontend/build/petpooja-alternative/index.html
# Expected: match found
```

---

## 5. File Reference

| File | Line | Change |
|---|---|---|
| `src/data/vsp.js` | L7 | `variant_a` — H1 text |
| `src/data/vsp.js` | L10 | `variant_a_sub` — subheadline text |

**Effort:** 2 search_replace edits + 1 rebuild (~3 min)
**Risk:** Zero — static string changes, no logic affected

---

*Registered 2026-09-06. Owner confirmed both strings. Meta title unchanged.*
