# CR-215B — Impact Analysis: Reduce TRUST_LOGOS 56 → 16

**Date:** 2026-09-08
**Priority:** P2 — Performance
**Owner selection confirmed:** 16 logos to keep (2026-09-08)
**Source:** Lighthouse audit 2026-09-05 · TrustBand.jsx code investigation

---

## 1. Problem Statement

The `TrustBand` marquee component renders all logos from the `TRUST_LOGOS` array **doubled** into a single flex container to create a seamless scroll loop. With 56 logos, this creates **112 `<img>` DOM nodes** in a single flex row — every page that includes TrustBand pays this DOM cost.

Lighthouse flagged: Style & Layout 431ms, Rendering 335ms on pages with TrustBand. The CR-215 Part A fix (adding `will-change: transform; contain: layout style`) addressed GPU compositing but did not reduce the DOM node count.

---

## 2. How TrustBand Works (confirmed from source)

```jsx
// src/components/home/TrustBand.jsx
const loop = [...items, ...items];  // Doubles the array for seamless marquee loop
return (
  <div className="flex gap-12 w-max animate-marquee items-center"
       style={{willChange:"transform", contain:"layout style"}}>
    {loop.map((logo, i) => (
      <img src={logo.img} alt={logo.name} width={160} height={64} loading="lazy" />
    ))}
  </div>
);
```

| State | Logos | DOM nodes | Marquee animation covers |
|---|---|---|---|
| Current | 56 | **112** | 56 × (160px + 48px gap) = 11,648px flex row |
| After fix | 16 | **32** | 16 × (160px + 48px gap) = 3,328px flex row |
| Reduction | −40 logos | **−80 nodes (71%)** | −8,320px width reduction |

---

## 3. Pages Affected

TrustBand is imported and rendered on **7 pages** — one data change covers all of them:

| Page | TrustBand line | Ad page? |
|---|---|---|
| `src/pages/Home.jsx` | Line 41 | No |
| `src/pages/RestaurantPosSystem.jsx` | Line 159 | **Yes — paid** |
| `src/pages/RestaurantBillingSoftware.jsx` | Line 152 | **Yes — paid** |
| `src/pages/RestaurantManagementSoftware.jsx` | Line 153 | **Yes — paid** |
| `src/pages/CloudKitchenPos.jsx` | Line 162 | **Yes — paid** |
| `src/pages/QsrPosSystem.jsx` | Line 161 | **Yes — paid** |
| `src/pages/RestaurantPosComparison.jsx` | Line 176 | No |

All 5 paid ad landing pages include TrustBand. Performance improvement applies directly to the pages suffering the GSC LCP issue.

---

## 4. Confirmed Logo Selection (owner approved 2026-09-08)

**16 KEEP:**

| # | Name | File |
|---|---|---|
| 1 | Bamboo Yoga | `/brand/bambooyoga.webp` |
| 2 | Bean Me Up | `/brand/bean-me-up.webp` |
| 3 | Cafe 103 | `/brand/cafe-103.webp` |
| 4 | Cutletopia | `/brand/cutletopia-logo.webp` |
| 5 | Drishti Yoga | `/brand/drishti-yoga.webp` |
| 6 | Grean Leaf Resort | `/brand/grean-leaf-resort.webp` |
| 7 | Kasba Pureveg | `/brand/kasba-pureveg.webp` |
| 8 | Kunfa | `/brand/kunfa-logo.webp` |
| 9 | Luxeevista | `/brand/luxeevista.webp` |
| 10 | Matroshka Cafe | `/brand/matroshka-logo.webp` |
| 11 | Mill Bakery | `/brand/mill-bakery.webp` |
| 12 | Nihao | `/brand/nihao.webp` |
| 13 | Palm House | `/brand/palm-house.webp` |
| 14 | Pav & Pages | `/brand/logo-pav-and-pages-re.webp` |
| 15 | Sushi Cafe | `/brand/sushi-cafe.webp` |
| 16 | The Palm Aryan | `/brand/the-palm-aryan.webp` |

**40 REMOVE** (including "Sab Logo" which is a duplicate of "Sab"):
Abbies Garden, Aap Ki Apni Rasoi, Baba Italy, Baskobit, Cafe Amigos, Chimney Clove, Dotara, Food Corner, Food Mohalla, G Squer, Henchu, Hiramani, Humsafar, Kings Lair, Kinara Cafe, La Fetta, Love Bites, LSD, Militia Eateary, Nainital Momos, Naradmuni, Neo Italian, Nibble, Olala, Palm Forest, Rhino, Runway, Sab, Sab Logo, Serena By The Sea, Singh Oliwood, SRT Bangle Bytes, Taran, Terraria, The Cake, The Craft, The Sattva, The Trible, Tons Cafe, Wooden Stone

---

## 5. What Changes

### Single file change

```
File:   src/data/content.js
Change: Edit TRUST_LOGOS array
        Remove 40 entries → keep 16 entries listed above
```

No other files need changing. `TrustBand.jsx` reads `TRUST_LOGOS` dynamically — one data change propagates to all 7 pages automatically.

**Note:** TrustBand also has a CMS `EditableList` wrapper (`id="home.trust_logos"`). If CMS has overridden this list via the database, the CMS value takes precedence over `content.js` at runtime. Dev should check if `home.trust_logos` has a CMS entry in MongoDB after deploy and clear/update it if needed.

---

## 6. Performance Impact

| Metric | Before | After | Change |
|---|---|---|---|
| DOM nodes (TrustBand) | 112 | 32 | **−80 nodes (71%)** |
| Style & Layout time | ~431ms | ~120ms (estimated) | **~−310ms** |
| Flex row width | 11,648px | 3,328px | **−8,320px** |
| Lazy-loaded images (off-screen) | 112 | 32 | **−80 img requests** |
| Lighthouse score impact | — | ~+2–3 pts | Per session 8 estimate |

Applies to all **7 pages** including all 5 paid ad landing pages.

---

## 7. Risks

| Risk | Assessment |
|---|---|
| Removed restaurants may complain | Low — logos are small, grayscale, decorative. Removed brands are not prominently featured anywhere else. |
| Marquee feels empty with 16 logos | No — 16 logos × 2 = 32 items, marquee still scrolls smoothly with `gap-12`. At 160px wide + 48px gap = 3,328px row, well above any viewport width. |
| CMS override causes logos not to update | Medium — if `home.trust_logos` CMS entry exists in MongoDB, it overrides `content.js`. Dev must check and update CMS entry post-deploy. |
| Brand image files not deleted from `/brand/` | None — unused files in `/brand/` have no runtime cost. Can be cleaned up separately. |

---

## 8. Verification (post-deploy)

- [ ] Homepage mobile/desktop: TrustBand shows exactly 16 unique logos scrolling
- [ ] `/restaurant-pos-system`: TrustBand shows same 16 logos
- [ ] Browser DevTools: count `<img>` tags inside `.animate-marquee` div = 32 (16 × 2)
- [ ] Lighthouse mobile re-run on `/restaurant-pos-system`: Style & Layout time reduced
- [ ] CMS admin (Ctrl+Shift+E): check `home.trust_logos` entry — update if stale

---

## 9. Build & Deploy Notes

- One change in `src/data/content.js` — one rebuild covers all 7 pages
- Can be batched in **same rebuild** as CR-230 (modal CTA) and CR-231 (WhatsApp disable)
- After deploy: Cloudflare → Purge Everything
- Optional follow-up: delete the 40 removed `.webp` files from `/brand/` folder (separate cleanup task, no rebuild needed)

---

*Written 2026-09-08. Source: TrustBand.jsx, src/data/content.js, Lighthouse audit 2026-09-05, owner logo selection 2026-09-08.*
