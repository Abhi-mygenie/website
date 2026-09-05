# CR-178 — Homepage Keyword Density: 9 Ad Keywords at 0 Occurrences

**Type:** SEO / Google Ads Quality Score
**Date Raised:** 2026-08-30
**Status:** OPEN
**Priority:** P1
**Source:** UAT audit keyword frequency tab (beta.mygenie.online, 2026-08-27)

---

## 1. Problem

Google Ads Quality Score uses "Landing Page Experience" as one of three components.
Keywords with 0 occurrences on the landing page get "Below Average" LP experience,
raising CPL and reducing ad rank.

Confirmed by grep on `build/index.html` (2026-08-30):

| Keyword | Ad Group | Occurrences | Target | Gap |
|---|---|---|---|---|
| pos system | Alpha → POS System | 0x | 3+ | ✗ |
| inventory management | Alpha Terms | 0x | 3+ | ✗ |
| restaurant billing | Alpha → Billing Software | 0x | 3+ | ✗ |
| pos billing | Alpha → Billing Software | 0x | 2+ | ✗ |
| restaurant software | Alpha Terms | 0x | 2+ | ✗ |
| loyalty program | Alpha Terms | 0x | 2+ | ✗ |
| qr menu | Alpha Terms | 0x | 2+ | ✗ |
| table management | Alpha → Management & Ordering | 0x | 2+ | ✗ |
| food business | Alpha Terms | 0x | 2+ | ✗ |

Already passing (no change needed):
- `restaurant pos` → 5x ✓
- `billing software` → 5x ✓
- `restaurant management` → 3x ✓

---

## 2. Fix — Natural Copy Integration

Do NOT keyword-stuff. Each keyword must fit naturally into existing copy.
No new sections required — all keywords slot into existing homepage components.

### Placement map

| Keyword | Where | Copy suggestion |
|---|---|---|
| `pos system` | Feature H2 | "Our POS system makes you money" (replace generic heading) |
| `pos system` | Hero subtitle | Add "POS system" to subtext |
| `inventory management` | Captain App / feature card | "Inventory management — track every ingredient, auto-deduct per order" |
| `restaurant billing` | Billing feature card heading | "Restaurant billing in under 10 seconds" |
| `restaurant billing` | Hero subtitle or eyebrow | Weave in naturally |
| `pos billing` | Billing feature card subtext | "POS billing — GST-compliant, KOT-triggered" |
| `restaurant software` | Footer intro OR "One complete package" section | "One restaurant software for every outlet" |
| `loyalty program` | CRM/AI section | "Built-in loyalty program — rewards that bring guests back" |
| `qr menu` | Scan & Order feature card | "QR menu — guests scan, browse and order themselves" |
| `table management` | Captain App feature card | "Table management — live floor view, transfers, covers" |
| `food business` | Hero subtitle | "for any food business" |

### Key files to edit

| File | Purpose |
|---|---|
| `frontend/src/components/home/Features.jsx` (or equivalent) | Main feature section headings + bullets |
| `frontend/src/components/home/Hero.jsx` | Subtitle copy (L35–39 `home.hero.subtitle`) |
| `frontend/src/components/home/CtaDemo.jsx` | Section heading copy |

**Important:** Hero subtitle uses `EditableText` with `fallback`. Check if CMS override exists
before editing fallback. As of 2026-08-30, no CMS overrides confirmed for homepage.

---

## 3. Verification

```bash
python3 -c "
from pathlib import Path
html = (Path('/app/frontend/build') / 'index.html').read_text(errors='ignore').lower()
keywords = ['pos system', 'inventory management', 'restaurant billing',
            'pos billing', 'restaurant software', 'loyalty program',
            'qr menu', 'table management', 'food business']
for kw in keywords:
    count = html.count(kw)
    status = 'PASS' if count >= 2 else 'FAIL'
    print(f'{status} \"{kw}\": {count}x')
"
```

---

## 4. Definition of Done

- [ ] All 9 keywords appear ≥2x in prerendered `build/index.html`
- [ ] No keyword stuffing — each use is natural in context
- [ ] No existing copy removed that was passing (restaurant pos, billing software, etc.)
- [ ] Homepage visual layout unchanged (copy fits existing components)

*CR-178 registered 2026-08-30. Source: UAT audit keyword frequency tab.*
