# CR-215B — Line-by-Line Implementation Plan: Reduce TRUST_LOGOS 56 → 16

**Date:** 2026-09-08
**Priority:** P2 — Performance
**Owner selection confirmed:** 16 logos (2026-09-08)

---

## Overview

Single file change. One array edit in `content.js` propagates to all 7 pages automatically.

| # | File | Operation |
|---|---|---|
| 1 | `src/data/content.js` | Replace TRUST_LOGOS array lines 11–66 — remove 40 entries, keep 16 |

---

## Op 1 — `src/data/content.js`

### Current state (lines 10–67):

```js
export const TRUST_LOGOS = [
  { name: "Abbies Garden",          img: "/brand/abbiesgarden.webp" },        // L11 REMOVE
  { name: "Aap Ki Apni Rasoi",      img: "/brand/aap-ki-apni-rasoi.webp" },   // L12 REMOVE
  { name: "Baba Italy",             img: "/brand/baba-italy.webp" },           // L13 REMOVE
  { name: "Bamboo Yoga",            img: "/brand/bambooyoga.webp" },           // L14 KEEP
  { name: "Baskobit",               img: "/brand/baskobitlogo.webp" },         // L15 REMOVE
  { name: "Bean Me Up",             img: "/brand/bean-me-up.webp" },           // L16 KEEP
  { name: "Cafe 103",               img: "/brand/cafe-103.webp" },             // L17 KEEP
  { name: "Cafe Amigos",            img: "/brand/cafe-amigos-logo.webp" },     // L18 REMOVE
  { name: "Chimney Clove",          img: "/brand/chmny-clove.webp" },          // L19 REMOVE
  { name: "Cutletopia",             img: "/brand/cutletopia-logo.webp" },      // L20 KEEP
  { name: "Dotara",                 img: "/brand/dotara.webp" },               // L21 REMOVE
  { name: "Drishti Yoga",           img: "/brand/drishti-yoga.webp" },         // L22 KEEP
  { name: "Food Corner",            img: "/brand/food-corner.webp" },          // L23 REMOVE
  { name: "Food Mohalla",           img: "/brand/food-mohalla.webp" },         // L24 REMOVE
  { name: "G Squer",                img: "/brand/g-squer-logo.webp" },         // L25 REMOVE
  { name: "Grean Leaf Resort",      img: "/brand/grean-leaf-resort.webp" },    // L26 KEEP
  { name: "Henchu",                 img: "/brand/henchu.webp" },               // L27 REMOVE
  { name: "Hiramani",               img: "/brand/hiramani.webp" },             // L28 REMOVE
  { name: "Humsafar",               img: "/brand/humsafar-menu-design-logo.webp" }, // L29 REMOVE
  { name: "Kasba Pureveg",          img: "/brand/kasba-pureveg.webp" },        // L30 KEEP
  { name: "Kings Lair",             img: "/brand/kings-lair.webp" },           // L31 REMOVE
  { name: "Kinara Cafe",            img: "/brand/kinara-cafe.webp" },          // L32 REMOVE
  { name: "Kunfa",                  img: "/brand/kunfa-logo.webp" },           // L33 KEEP
  { name: "La Fetta",               img: "/brand/lafetta.webp" },              // L34 REMOVE
  { name: "Love Bites",             img: "/brand/love-bites.webp" },           // L35 REMOVE
  { name: "LSD",                    img: "/brand/lsd.webp" },                  // L36 REMOVE
  { name: "Luxeevista",             img: "/brand/luxeevista.webp" },           // L37 KEEP
  { name: "Matroshka Cafe",         img: "/brand/matroshka-logo.webp" },       // L38 KEEP
  { name: "Militia Eateary",        img: "/brand/militia-eateary.webp" },      // L39 REMOVE
  { name: "Mill Bakery",            img: "/brand/mill-bakery.webp" },          // L40 KEEP
  { name: "Nainital Momos",         img: "/brand/nainital-momos-logo.webp" },  // L41 REMOVE
  { name: "Naradmuni",              img: "/brand/naradmuni-logo.webp" },       // L42 REMOVE
  { name: "Neo Italian",            img: "/brand/neo-italian.webp" },          // L43 REMOVE
  { name: "Nibble",                 img: "/brand/nibble.webp" },               // L44 REMOVE
  { name: "Nihao",                  img: "/brand/nihao.webp" },                // L45 KEEP
  { name: "Olala",                  img: "/brand/olala-logo.webp" },           // L46 REMOVE
  { name: "Palm Forest",            img: "/brand/palm-forest.webp" },          // L47 REMOVE
  { name: "Palm House",             img: "/brand/palm-house.webp" },           // L48 KEEP
  { name: "Pav & Pages",            img: "/brand/logo-pav-and-pages-re.webp" }, // L49 KEEP
  { name: "Rhino",                  img: "/brand/rhino.webp" },                // L50 REMOVE
  { name: "Runway",                 img: "/brand/runway.webp" },               // L51 REMOVE
  { name: "Sab",                    img: "/brand/sab.webp" },                  // L52 REMOVE
  { name: "Sab Logo",               img: "/brand/sab-logo.webp" },             // L53 REMOVE (duplicate)
  { name: "Serena By The Sea",      img: "/brand/serena-by-the-sea.webp" },    // L54 REMOVE
  { name: "Singh Oliwood",          img: "/brand/singh-oliwood-logo.webp" },   // L55 REMOVE
  { name: "SRT Bangle Bytes",       img: "/brand/srt-bangle-bytes.webp" },     // L56 REMOVE
  { name: "Sushi Cafe",             img: "/brand/sushi-cafe.webp" },           // L57 KEEP
  { name: "Taran",                  img: "/brand/taran-new-logo.webp" },       // L58 REMOVE
  { name: "Terraria",               img: "/brand/terraia.webp" },              // L59 REMOVE
  { name: "The Cake",               img: "/brand/the-cake.webp" },             // L60 REMOVE
  { name: "The Craft",              img: "/brand/the-craft.webp" },            // L61 REMOVE
  { name: "The Palm Aryan",         img: "/brand/the-palm-aryan.webp" },       // L62 KEEP
  { name: "The Sattva",             img: "/brand/the-sattva.webp" },           // L63 REMOVE
  { name: "The Trible",             img: "/brand/the-trible-logo.webp" },      // L64 REMOVE
  { name: "Tons Cafe",              img: "/brand/tons-cafe.webp" },            // L65 REMOVE
  { name: "Wooden Stone",           img: "/brand/wooden-stone.webp" },         // L66 REMOVE
];
```

### Replace entire lines 10–67 with:

```js
export const TRUST_LOGOS = [
  { name: "Bamboo Yoga",            img: "/brand/bambooyoga.webp" },
  { name: "Bean Me Up",             img: "/brand/bean-me-up.webp" },
  { name: "Cafe 103",               img: "/brand/cafe-103.webp" },
  { name: "Cutletopia",             img: "/brand/cutletopia-logo.webp" },
  { name: "Drishti Yoga",           img: "/brand/drishti-yoga.webp" },
  { name: "Grean Leaf Resort",      img: "/brand/grean-leaf-resort.webp" },
  { name: "Kasba Pureveg",          img: "/brand/kasba-pureveg.webp" },
  { name: "Kunfa",                  img: "/brand/kunfa-logo.webp" },
  { name: "Luxeevista",             img: "/brand/luxeevista.webp" },
  { name: "Matroshka Cafe",         img: "/brand/matroshka-logo.webp" },
  { name: "Mill Bakery",            img: "/brand/mill-bakery.webp" },
  { name: "Nihao",                  img: "/brand/nihao.webp" },
  { name: "Palm House",             img: "/brand/palm-house.webp" },
  { name: "Pav & Pages",            img: "/brand/logo-pav-and-pages-re.webp" },
  { name: "Sushi Cafe",             img: "/brand/sushi-cafe.webp" },
  { name: "The Palm Aryan",         img: "/brand/the-palm-aryan.webp" },
];
```

**What changes:**
- Lines removed: 40 entries (L11–L13, L15, L18–L19, L21, L23–L25, L27–L29, L31–L32, L34–L36, L39, L41–L44, L46–L47, L50–L56, L58–L61, L63–L66)
- Lines kept: 16 entries
- Array reduced from 57 lines to 18 lines (including open/close brackets)

---

## CMS Override Check (post-deploy, important)

TrustBand uses `EditableList id="home.trust_logos"`. If the CMS database has an override for this key, it will take precedence over `content.js` at runtime and the old logos will still show.

**Check after deploy:**
1. Log into CMS (Ctrl+Shift+E on any page → admin / admin123)
2. Navigate to homepage
3. Inspect the TrustBand marquee — if old logos show, CMS override is active
4. In CMS admin, find `home.trust_logos` entry → delete or update to match the 16-logo list

Alternatively, dev can check MongoDB directly:
```
db.cms_content.findOne({ id: "home.trust_logos" })
// If this returns a document with 56 logos → delete it or update it
// If null → content.js is the source of truth → no action needed
```

---

## Files NOT Changed

| File | Why untouched |
|---|---|
| `src/components/home/TrustBand.jsx` | No change needed — reads TRUST_LOGOS dynamically |
| All 7 page files importing TrustBand | No change needed — all render `<TrustBand />` with no props |
| `/brand/*.webp` image files | Unused files remain on disk (safe, no runtime cost). Optional cleanup in a separate pass. |

---

## DOM Node Count Verification

After deploy, in browser DevTools on any page with TrustBand:
```js
// Should return 32 (16 logos × 2 from loop = [...items, ...items])
document.querySelectorAll('[data-testid="trust-band"] .animate-marquee img').length
```

---

## Build Notes

- Can be batched in same rebuild as CR-230 and CR-231
- After deploy: Cloudflare → Purge Everything
- Lighthouse re-run on `/restaurant-pos-system` after deploy to confirm Style & Layout improvement

---

*Plan written 2026-09-08. Source: content.js lines 10–67, TrustBand.jsx, owner logo selection confirmed 2026-09-08.*
