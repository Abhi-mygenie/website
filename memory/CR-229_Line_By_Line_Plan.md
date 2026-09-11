# CR-229 — Line-by-Line Implementation Plan

**CR:** CR-229 — PetpoojaAlternative Page: 7 Content Changes
**Status:** Content approved 2026-09-06 — Plan written, awaiting dev execution
**Files:** 2 files, 13 search_replace operations, 1 rebuild

---

## Files Touched

| File | Operations | Change type |
|---|---|---|
| `src/data/vsp.js` | 6 | Add `badge` field to each VSP_QUOTES entry |
| `src/pages/PetpoojaAlternative.jsx` | 7 | String edits + badge render update |

---

## PRE-FLIGHT CHECK

Before starting, confirm current state:

```bash
grep -n "Billing Software — Petpooja's starting point" /app/frontend/src/pages/PetpoojaAlternative.jsx
# Expected: line 544

grep -n "Switched from Petpooja" /app/frontend/src/pages/PetpoojaAlternative.jsx
# Expected: line 756

grep -c "Switched from Petpooja" /app/frontend/src/pages/PetpoojaAlternative.jsx
# Expected: 1 (hardcoded once, rendered for all 6 quotes via map)

grep -n "badge" /app/frontend/src/data/vsp.js
# Expected: no output (badge field doesn't exist yet)
```

---

## FILE 1 — `src/data/vsp.js`

### Operations 1–6: Add `badge` field to each VSP_QUOTES entry

Each quote object currently has: `key`, `text`, `name`, `outlet`, `initial`
Adding: `badge` field (string) — used by PetpoojaAlternative.jsx line 756

---

**Op 1 — q1 (Bismeet Kaur, Oliwood Cafe) → keep "Switched from Petpooja"**

```
OLD (lines 46–51):
  {
    key: "q1",
    text: "On Petpooja, the whole system would stall if the LAN dropped — staff waiting, kitchen confused. On MyGenie, the owner, waiters and kitchen are all connected from anywhere. It just works.",
    name: "Bismeet Kaur",
    outlet: "Oliwood Cafe",
    initial: "B",
  },

NEW:
  {
    key: "q1",
    text: "On Petpooja, the whole system would stall if the LAN dropped — staff waiting, kitchen confused. On MyGenie, the owner, waiters and kitchen are all connected from anywhere. It just works.",
    name: "Bismeet Kaur",
    outlet: "Oliwood Cafe",
    initial: "B",
    badge: "Switched from Petpooja",
  },
```

---

**Op 2 — q2 (Bhanu Pratap Thakur, Cafe Amigos) → "Renewed After Year One"**

```
OLD (lines 52–58):
  {
    key: "q2",
    text: "We needed inventory that worked and a Captain App without a LAN cable. Switched to MyGenie, got both at a price published upfront — no calls, no surprises. Renewed after a year without thinking twice.",
    name: "Bhanu Pratap Thakur",
    outlet: "Cafe Amigos",
    initial: "B",
  },

NEW:
  {
    key: "q2",
    text: "We needed inventory that worked and a Captain App without a LAN cable. Switched to MyGenie, got both at a price published upfront — no calls, no surprises. Renewed after a year without thinking twice.",
    name: "Bhanu Pratap Thakur",
    outlet: "Cafe Amigos",
    initial: "B",
    badge: "Renewed After Year One",
  },
```

---

**Op 3 — q3 (Himal Chauhan, The Tribe Cafe) → keep "Switched from Petpooja"**

```
OLD (lines 59–65):
  {
    key: "q3",
    text: "Petpooja felt complicated for no reason. MyGenie was up and running within a day. We've already referred three other businesses — that's how confident we are.",
    name: "Himal Chauhan",
    outlet: "The Tribe Cafe",
    initial: "H",
  },

NEW:
  {
    key: "q3",
    text: "Petpooja felt complicated for no reason. MyGenie was up and running within a day. We've already referred three other businesses — that's how confident we are.",
    name: "Himal Chauhan",
    outlet: "The Tribe Cafe",
    initial: "H",
    badge: "Switched from Petpooja",
  },
```

---

**Op 4 — q4 (Pranav Dogra, Cafe 103) → keep "Switched from Petpooja"**

```
OLD (lines 66–72):
  {
    key: "q4",
    text: "Five years on Petpooja and the LAN dependency was a daily headache — Captain App limited, KDS limited, inventory limited. One month on MyGenie and I can't imagine going back.",
    name: "Pranav Dogra",
    outlet: "Cafe 103",
    initial: "P",
  },

NEW:
  {
    key: "q4",
    text: "Five years on Petpooja and the LAN dependency was a daily headache — Captain App limited, KDS limited, inventory limited. One month on MyGenie and I can't imagine going back.",
    name: "Pranav Dogra",
    outlet: "Cafe 103",
    initial: "P",
    badge: "Switched from Petpooja",
  },
```

---

**Op 5 — q5 (Arun Guleria, Bake N Bite) → "Opened 2nd Outlet on MyGenie"**

```
OLD (lines 73–79):
  {
    key: "q5",
    text: "I needed real-time sales visibility, not a report the next morning. MyGenie gave me that from day one. We've already opened a second outlet on it — a third is coming.",
    name: "Arun Guleria",
    outlet: "Bake N Bite",
    initial: "A",
  },

NEW:
  {
    key: "q5",
    text: "I needed real-time sales visibility, not a report the next morning. MyGenie gave me that from day one. We've already opened a second outlet on it — a third is coming.",
    name: "Arun Guleria",
    outlet: "Bake N Bite",
    initial: "A",
    badge: "Opened 2nd Outlet on MyGenie",
  },
```

---

**Op 6 — q6 (Jobhanpreet Singh, The Frost & Froth) → "Support That Picks Up"**

```
OLD (lines 80–86):
  {
    key: "q6",
    text: "Petpooja had too many features I didn't need and not enough of the ones I did. MyGenie was comprehensive without being overwhelming — and when I call support, someone actually picks up.",
    name: "Jobhanpreet Singh",
    outlet: "The Frost & Froth Cafe",
    initial: "J",
  },

NEW:
  {
    key: "q6",
    text: "Petpooja had too many features I didn't need and not enough of the ones I did. MyGenie was comprehensive without being overwhelming — and when I call support, someone actually picks up.",
    name: "Jobhanpreet Singh",
    outlet: "The Frost & Froth Cafe",
    initial: "J",
    badge: "Support That Picks Up",
  },
```

---

## FILE 2 — `src/pages/PetpoojaAlternative.jsx`

### Op 7 — Line 755–757: Make badge dynamic (reads q.badge instead of hardcoded string)

This is the key structural change. Currently line 756 hardcodes "Switched from Petpooja"
for all 6 quotes. After Op 1–6 add `badge` to each VSP_QUOTES entry, this line reads from it.

```jsx
OLD (lines 755–757):
                <span className="inline-block bg-brand-green/8 border border-brand-green/20 text-brand-greenDark text-xs font-bold px-2 py-0.5 rounded-md tracking-wide uppercase mb-4">
                  Switched from Petpooja
                </span>

NEW:
                <span className="inline-block bg-brand-green/8 border border-brand-green/20 text-brand-greenDark text-xs font-bold px-2 py-0.5 rounded-md tracking-wide uppercase mb-4">
                  {q.badge}
                </span>
```

DEPENDENCY: Ops 1–6 (vsp.js) MUST be done before this op. If badge field is missing, {q.badge} renders undefined.

---

### Op 8 — Line 544: Comparison column label

```jsx
OLD (line 544):
                Billing Software — Petpooja's starting point

NEW:
                Traditional Billing Software
```

---

### Op 9 — Line 792: AI section label

```jsx
OLD (line 792):
                The section Petpooja doesn't have

NEW:
                The AI layer most billing software skips
```

---

### Op 10 — Line 949: Final CTA label

```jsx
OLD (line 949):
                The switch is easier than you think

NEW:
                Getting started is easier than you think
```

---

### Op 11 — Line 954: Final CTA H2 fallback

```jsx
OLD (line 954):
                  fallback="See if MyGenie is the right switch for your restaurant."

NEW:
                  fallback="See if MyGenie is the right fit for your restaurant."
```

---

### Op 12 — Line 1046: FAQ section heading

```jsx
OLD (line 1046):
              <h2 className="font-display text-3xl font-bold text-brand-ink mb-10 text-center">Common questions about switching from Petpooja.</h2>

NEW:
              <h2 className="font-display text-3xl font-bold text-brand-ink mb-10 text-center">Common questions about choosing MyGenie.</h2>
```

---

### Op 13 — Lines 1049 + 1051: Replace FAQ Q1 and Q3

**Q1 replacement (line 1049):**

```jsx
OLD:
              <FaqItem q="Is MyGenie a better alternative to Petpooja?" a="MyGenie includes AI insights, CRM, loyalty, and WhatsApp automation in one plan — features that are separate tools or add-ons on Petpooja. Starting at ₹799/outlet/month, MyGenie gives you billing, inventory, kitchen, and customers in a single app." testid="vsp-faq-0" />

NEW:
              <FaqItem q="Is MyGenie a good fit for a restaurant opening for the first time?" a="Yes. MyGenie works for restaurants at every stage — including outlets that have never used a POS before. Setup takes under 24 hours, no hardware purchase is needed (runs on any Android phone or tablet), and a dedicated onboarding specialist is included from day one. Starting at ₹799/outlet/month, there's no upfront cost and no long-term contract." testid="vsp-faq-0" />
```

**Q3 replacement (line 1051):**

```jsx
OLD:
              <FaqItem q="Does MyGenie integrate with Swiggy and Zomato like Petpooja?" a="Yes. MyGenie syncs with Swiggy, Zomato, and Magicpin — orders flow directly into the POS. Same integrations, same GST compliance, same aggregator sync." testid="vsp-faq-2" />

NEW:
              <FaqItem q="How does MyGenie pricing compare to other restaurant POS options?" a="MyGenie pricing starts at ₹799/outlet/month, published upfront — no calls, no quotes, no surprises. Most POS systems either require a ₹15,000–30,000 terminal purchase plus a monthly fee, or hide pricing behind a sales inquiry. MyGenie's Starter plan includes billing, inventory, KOT and daily reports. Growth (₹1,299/month) adds aggregator sync, CRM and Captain App. See the full breakdown on the pricing page." testid="vsp-faq-2" />
```

Q2 (line 1050) and Q4 (line 1052) are UNCHANGED.

---

## EXECUTION ORDER

```
Step 1 — vsp.js: Run Ops 1–6 (add badge field to all 6 quotes)
Step 2 — PetpoojaAlternative.jsx: Run Op 7 (make badge dynamic) — depends on Step 1
Step 3 — PetpoojaAlternative.jsx: Run Ops 8–13 in any order (independent string edits)
Step 4 — yarn build
Step 5 — sudo supervisorctl restart frontend
Step 6 — Run validation checks (see below)
```

---

## VALIDATION CHECKS (post-build)

```bash
BUILD=/app/frontend/build/petpooja-alternative/index.html

# Op 8 — comparison label
grep -c "Traditional Billing Software" $BUILD         # Expected: 1
grep -c "Petpooja's starting point" $BUILD            # Expected: 0

# Op 7 — badge render (3 × "Switched from Petpooja", 1× each outcome)
grep -c "Switched from Petpooja" $BUILD               # Expected: 3
grep -c "Renewed After Year One" $BUILD               # Expected: 1
grep -c "Opened 2nd Outlet on MyGenie" $BUILD         # Expected: 1
grep -c "Support That Picks Up" $BUILD                # Expected: 1

# Op 9 — AI label
grep -c "AI layer most billing software skips" $BUILD  # Expected: 1
grep -c "section Petpooja doesn't have" $BUILD         # Expected: 0

# Op 10 — CTA label
grep -c "Getting started is easier" $BUILD             # Expected: 1
grep -c "switch is easier than you think" $BUILD       # Expected: 0

# Op 11 — CTA H2
grep -c "right fit for your restaurant" $BUILD         # Expected: 1
grep -c "right switch for your restaurant" $BUILD      # Expected: 0

# Op 12 — FAQ heading
grep -c "choosing MyGenie" $BUILD                      # Expected: 1
grep -c "switching from Petpooja" $BUILD               # Expected: 0

# Op 13 — FAQ Q1 + Q3
grep -c "restaurant opening for the first time" $BUILD # Expected: 1
grep -c "pricing compare to other restaurant POS" $BUILD # Expected: 1
grep -c "better alternative to Petpooja" $BUILD        # Expected: 0
grep -c "Swiggy and Zomato like Petpooja" $BUILD       # Expected: 0
```

---

## RISK NOTES

| Risk | Likelihood | Mitigation |
|---|---|---|
| `{q.badge}` renders blank if badge field missing | HIGH if Op 1–6 skipped | Do Ops 1–6 before Op 7. Run pre-flight check. |
| FAQ schema mismatch (CR-137 pending) | LOW | FAQPage schema in QAPage references these FAQs — update schema questions to match new Q1/Q3 text when CR-137 is implemented |
| CMS override ignores fallback change | LOW | If CMS has stored value for `vsp.s6.h2`, fallback change won't show. CMS stored values take priority over fallback prop. Check CMS admin if CTA H2 doesn't change after build. |

---

## SUMMARY

| Ops | File | Type |
|---|---|---|
| 1–6 | `src/data/vsp.js` | Add `badge` field to 6 quote objects |
| 7 | `src/pages/PetpoojaAlternative.jsx` L755–757 | Hardcoded string → `{q.badge}` |
| 8 | `src/pages/PetpoojaAlternative.jsx` L544 | Comparison label string |
| 9 | `src/pages/PetpoojaAlternative.jsx` L792 | AI section label string |
| 10 | `src/pages/PetpoojaAlternative.jsx` L949 | CTA label string |
| 11 | `src/pages/PetpoojaAlternative.jsx` L954 | CTA H2 fallback string |
| 12 | `src/pages/PetpoojaAlternative.jsx` L1046 | FAQ heading string |
| 13 | `src/pages/PetpoojaAlternative.jsx` L1049+1051 | 2 FAQ items |

**Total: 13 search_replace operations across 2 files + 1 rebuild**

---

*Plan written 2026-09-06. Content approved. No code has been changed.*
*Next step: dev execution — say "implement CR-229" to proceed.*
