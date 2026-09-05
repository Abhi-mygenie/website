# CR-184 — Trust Band Logos Oversized (25–35 KiB each)

**Type:** Performance / Images
**Date Raised:** 2026-09-02
**Status:** OPEN
**Priority:** P2
**Source:** Lighthouse mobile audit — "Improve image delivery, Est savings 294 KiB"
**Batch:** W — Lighthouse Audit Gaps

---

## Problem

Lighthouse flags trust band / customer logos as significantly oversized for their display size.

Display size: `h-16 w-auto` = 64px tall, ~160px wide (TrustBand.jsx)

Actual file sizes:
```
baskobitlogo.webp    27 KiB  → needs ~2 KiB at 320×128 (2x retina)
g-squer-logo.webp    27 KiB  → same
tons-cafe.webp       35 KiB  → same
humsafar-menu-design-logo.webp  27 KiB
luxeevista.webp      28 KiB
taran-new-logo.webp  29 KiB
nihao.webp           33 KiB
kinara-cafe.webp     24 KiB
```

Each logo is displayed at ~160×64px but the source file is full-resolution. Lighthouse estimates 294 KiB total savings across all trust logos.

---

## Fix

Re-export all trust band logos at **320×128px max** (2× for retina displays) in WebP format. Target: 2–5 KiB per logo.

Files to resize: all `.webp` files in `/public/brand/` that appear in the TrustBand marquee.

Reference file: `src/lib/content.js` — `TRUST_LOGOS` array lists all 58 logos used.

---

## Files to Change

| Location | Change |
|---|---|
| `/public/brand/*.webp` (trust logos) | Re-export at 320×128px, WebP quality 80 |
| No JSX changes required | Image files replaced in-place |

---

## Expected Outcome

~200–250 KiB reduction in total page weight. Faster TrustBand marquee loading. LCP improvement (fewer bytes competing for bandwidth at initial load).

*CR-184 registered 2026-09-02. Source: Lighthouse mobile audit.*
