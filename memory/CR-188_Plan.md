# CR-188 — Homepage "restaurant management" Body Gap

**Date registered:** 2026-09-02
**Status:** READY TO IMPLEMENT
**Priority:** P2
**Source:** Sep 2026 audit screenshot — confirmed against live prerendered build

---

## Problem

`"restaurant management"` appears **0 times** in the homepage body.

It appears in the `<meta description>` only:
> "MyGenie POS — powerful billing & restaurant management software for cafes, hotels & cloud kitchens. Boost profit 25%. Book a free demo."

Google keyword matching checks body text — the meta description does not count. The homepage already has strong coverage on `restaurant pos:2`, `billing software:2`, `pos system:5`, `table management:2`. This one compound phrase is the only gap in the auditor's 14-keyword matrix.

---

## Root Cause

No body component on the homepage contains this phrase. Components checked:
`Hero.jsx`, `TrustBand.jsx`, `OutcomePillars.jsx`, `AIBand.jsx`, `ProofSection.jsx`, `CtaDemo.jsx`, `HomeFaq.jsx` — all confirmed 0 occurrences.

CMS override status: `home.hero.subtitle` is NOT CMS-overridden — safe to add.

---

## Fix Approach

Add one natural sentence to an existing homepage body section. The sentence must:
- Contain "restaurant management" or "restaurant management software"
- Read naturally in context
- Not disrupt existing value proposition

**Auditor-suggested copy:**
> "Complete restaurant management from one app — billing, inventory, staff and customer loyalty."

**Best insertion point:** `home.hero.subtitle` fallback in `Hero.jsx` (NOT CMS-overridden) OR a subheading in `OutcomePillars.jsx` / `CtaDemo.jsx`.

Note: `home.hero.subtitle` is a CMS EditableText field. The fallback can safely include "restaurant management." Current fallback is 195ch rich text — any change must stay coherent.

---

## Files to Change

| # | File | Change |
|---|---|---|
| 1 | `src/components/home/Hero.jsx` OR `src/components/home/OutcomePillars.jsx` | Add 1 sentence/phrase with "restaurant management" |

Exact insertion point to be finalized during implementation based on which section reads most naturally.

---

## Verification Gate

```python
python3 -c "
html = open('/app/frontend/build/index.html').read()
body = html[html.find('<body'):]
print('restaurant management:', body.lower().count('restaurant management'))
print('PASS' if body.lower().count('restaurant management') >= 1 else 'FAIL')
"
```

---

*Plan registered 2026-09-02. 1 sentence, 1 file.*
