# CR-76 — Replace Text Trust Badges with Logo Images on /petpooja-alternative

**Type:** Trust Signal Fix  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN — DESIGN APPROVED 2026-08-20
**Design decision:** Greyscale by default, full colour on hover. All 8 logo files confirmed present in `/public/brand/`. Both trust strips updated (VspHero: 4 logos, VspCta: 8 logos). VSP_TRUST_LOGOS in vsp.js to be converted from string array to `{name, img}` object array.
**Priority:** CRITICAL  
**Plan ID:** C7  
**Effort:** 20 min  
**Improves:** Trust · Conv · QS LP Experience  
**Scope:** `frontend/src/pages/PetpoojaAlternative.jsx`  
**Related:** CR-73 (footer trust), CR-74 (sticky CTA)

---

## 1. Problem Statement

Both trust strips on `/petpooja-alternative` display customer names as styled `<span>` text chips:
```jsx
{["Hyatt Centric", "Palm Forest Resort", "Love Bites", "The Mill Bakery"].map((name) => (
  <span key={name} className="bg-white border border-brand-line rounded-lg px-3 py-1 text-xs font-semibold text-brand-ink">
    {name}
  </span>
))}
```

The homepage `TrustBand` uses actual `<img>` logo files from `/brand/`. A text chip reading "Hyatt Centric" carries far less credibility than a recognizable hotel logo image. All logo files already exist in `/public/brand/`.

---

## 2. Root Cause

Two locations in `PetpoojaAlternative.jsx` use text chips instead of images:
1. `VspHero` trust strip (hero section) — 4 text spans
2. `VspCta` logo strip (CTA section) — 8 text spans from `VSP_TRUST_LOGOS` array

---

## 3. Exact Changes Required

### Change 1 — `VspHero` trust strip
Replace 4 text spans with `<img>` tags:
```jsx
// BEFORE
{["Hyatt Centric", "Palm Forest Resort", "Love Bites", "The Mill Bakery"].map((name) => (
  <span key={name} className="bg-white border border-brand-line rounded-lg px-3 py-1 text-xs font-semibold text-brand-ink">
    {name}
  </span>
))}

// AFTER
{[
  { name: "Hyatt Centric",    img: "/brand/hyatt-centric.png" },
  { name: "Palm Forest Resort",img: "/brand/palm-forest.png"  },
  { name: "Love Bites",        img: "/brand/love-bites.png"   },
  { name: "The Mill Bakery",   img: "/brand/mill-bakery.png"  },
].map((logo) => (
  <img key={logo.name} src={logo.img} alt={logo.name} title={logo.name}
       className="h-8 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
       loading="lazy" width={120} height={32} />
))}
```

### Change 2 — `VspCta` logo strip
Replace 8 text spans from `VSP_TRUST_LOGOS` with images:
```jsx
// BEFORE
{VSP_TRUST_LOGOS.map((name) => (
  <span key={name} className="bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#a3b8ac]">
    {name}
  </span>
))}

// AFTER — update VSP_TRUST_LOGOS in vsp.js to include img paths, then render:
{VSP_TRUST_LOGOS.map((logo) => (
  <img key={logo.name} src={logo.img} alt={logo.name} title={logo.name}
       className="h-7 w-auto object-contain opacity-50 hover:opacity-80 transition-opacity"
       loading="lazy" width={100} height={28} />
))}
```

Update `VSP_TRUST_LOGOS` in `vsp.js` from a string array to an object array with `name` + `img` fields.

---

## 4. Files Changed

| File | Change |
|---|---|
| `frontend/src/pages/PetpoojaAlternative.jsx` | Replace text spans with `<img>` tags in both trust strips |
| `frontend/src/data/vsp.js` | Update `VSP_TRUST_LOGOS` from strings to `{name, img}` objects |

---

## 5. Definition of Done

- [ ] Both trust strips show actual logo images, not text
- [ ] Images are correctly grayscaled by default, color on hover
- [ ] No broken image icons (all 8 files exist in /public/brand/)
- [ ] Mobile layout not broken (images wrap correctly)

---

*CR-76 registered 2026-08-20. Source: SEO & QS Audit · Plan ID C7.*
