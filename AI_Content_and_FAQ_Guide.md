# MyGenie POS — Practical AI, Central Inventory & FAQ Enrichment Guide

> **📌 DURABLE — do not delete/overwrite.** Authoritative record + how-to for the content/feature work
> built in this session. PRD is transient; this doc is the source of truth for these features.
> Indexed from `PROJECT_DOCS_INDEX.md`.

---

## 0. Session changelog (what was done — June 2026)
1. **Hero/display-font fix** — headings used `tracking-tight` with Clash Display's narrow space glyph, causing word run-together ("Runamore"). Fixed globally with `word-spacing: 0.12em` on `.font-display` in `frontend/src/index.css`. Scales with size; touches no component.
2. **Practical AI hub page** at `/ai` — 7 live AI features, each Pain→What-AI-does→Outcome, with per-feature video slots, FAQ, demo CTA, FAQPage + BreadcrumbList schema.
3. **Central Inventory product page** at `/product/central-inventory` — franchise/multi-outlet product, 6 modules, video slot, proof, FAQ, schema.
4. **FAQ enrichment system** — shared `FaqItem` upgraded to support rich text + image/video + inline CTA chips; selectively enriched across all 11 sectors, 6 products, AI page and `/resources`.
5. **Video/media infrastructure** — new `FeatureVideo` component (self-hosted MP4/WebM, embeds, or clean placeholder). Used on AI page, product pages and inside FAQs.
6. **Content tracker** — `MyGenie_AI_Content_Tracker.xlsx` (AI shot-lists, Central Inventory, recording specs, FAQ-media plan) with seed metrics + owner-fill columns.
7. **Wiring** — `/ai` + Central Inventory added to navbar (desktop + mobile), footer, sitemap (now 50 URLs) and per-page SEO meta. Homepage AI band corrected (7 use-cases incl. AI Report Audit + CRM Segmentation) and links to `/ai`.

---

## 1. Practical AI page (`/ai`)

**Logic / positioning:** "AI that works on the floor — not in a pitch deck." All features are LIVE in production (confident present-tense copy, no "coming soon"). Goal = convert curiosity into demos. Formula per feature: **Problem → What the AI does → Outcome metric**.

**The 7 features** (data: `frontend/src/data/ai.js` → `AI_FEATURES`):
1. AI Menu Import · 2. AI Customer Insights · 3. Smart Cross-sell & Upsell · 4. **AI Report Audit** (AI-computed audit against each report — replaced the old "conversational reporting" which MyGenie does NOT have) · 5. Operational Recommendations · 6. Smart Validations · 7. AI CRM Segmentation.

**Files:**
- Page: `frontend/src/pages/AiPage.jsx` (hero, feature blocks, franchise cross-link, FAQ, demo).
- Data: `frontend/src/data/ai.js` (`AI_FEATURES`, `AI_FAQS`).
- Route: `/ai` in `frontend/src/App.js`. SEO: `PAGE_SEO["/ai"]` in `lib/seo.js`.
- Schema: FAQPage + BreadcrumbList (via `Seo` accepting a JSON-LD array).

**Seed metrics = PLACEHOLDER.** Each feature `outcome.value` carries `seed: true|false`. Seeds (e.g. +18% upsell, 30% repeat rate, 12% less wastage, 2× conversion, ~30 min import) are placeholders to replace with real figures. Verifiable ones marked `seed:false` (₹1 Lakh leakage caught; 100% reports auto-audited). **To change:** edit `outcome` in `data/ai.js`; track real numbers in the Excel tracker → "AI Page Content" sheet.

**How to edit AI content:** add/edit objects in `AI_FEATURES` (`id`, `icon` [lucide name], `title`, `pain`, `solution`, `outcome{value,label,seed}`, `videoSrc`, `poster`). The page renders them automatically (alternating layout).

---

## 2. Central Inventory product page (`/product/central-inventory`)

**Logic:** the franchise/multi-outlet buying decision was missing. Positioned as "one stock brain for every outlet."

**Modules (6):** Multi-Outlet Stock Visibility · Inter-Outlet Transfers · Central Procurement · **AI Auto-Reorder & Forecast** · Central Recipe & BOM Costing · Variance & Theft Detection.

**Files:**
- Data: `frontend/src/data/products.js` → `PRODUCT_PAGES["central-inventory"]` + added to `PRODUCT_ORDER`.
- Renders via the existing shared `frontend/src/pages/ProductPage.jsx` (route `/product/:bucket`).
- It is intentionally **NOT** in `MODULE_BUCKETS` (homepage bento has fixed col-spans). It's surfaced via Navbar `PRODUCTS` list + Footer (manual link) + sitemap + AI-page cross-link.

---

## 3. FAQ enrichment system

**Decision:** FAQs **stay on their own pages/sections** (sector, product, AI, resources) — NOT a central hub. They're just made richer in place. **Selective**: only high-impact FAQs get media; others get richer text + links.

**Component:** `frontend/src/components/site/FaqItem.jsx`. Props:
```
q        (string)   – question
a        (string)   – primary answer
details  (string[]) – optional extra paragraphs
media    (object)   – optional { type:'image'|'video', src, poster, caption }
links    (object[]) – optional [{ label, to }]  (internal)  OR  [{ label, href }] (external/anchor)
testid   (string)
```
- `media.src = null` → clean "coming soon" placeholder (image slot = dashed box; video slot = solid green panel + play icon).
- Backward compatible: old `{q,a}` FAQs still work.

**Where FAQ data lives & is wired:**
- Sectors: `data/sectors.js` (`faqs` per sector) → rendered in `pages/SectorPage.jsx`.
- Products: `data/products.js` (`faqs` per product) → `pages/ProductPage.jsx`.
- AI: `data/ai.js` (`AI_FAQS`) → `pages/AiPage.jsx`.
- Resources: `pages/Resources.jsx` (`FAQS` array, fully enriched showcase).
- All four call sites pass `details/media/links` through to `FaqItem`.

**What's enriched now:** `/resources` (9 FAQs, text+media+CTAs), top FAQ of each of the 11 sectors + 6 products (video slot + CTA), and AI FAQ CTAs. Density = 1 high-impact FAQ per page (can raise to 2 on request).

**How to enrich any FAQ:** add `media` and/or `links` (and optional `details`) fields to the FAQ object in its data file. Example:
```js
{ q: "...", a: "...",
  media: { type: "video", src: "/videos/bar-tabs.mp4", poster: "/video-posters/bar-tabs.jpg", caption: "Open, split & merge tabs" },
  links: [{ label: "Build your plan", to: "/pricing" }] }
```
(`scripts/enrich_faqs.py` shows the bulk pattern used for the first-FAQ rollout.)

---

## 4. Video & media infrastructure

**Component:** `frontend/src/components/site/FeatureVideo.jsx`.
- `.mp4/.webm/.mov` src → self-hosted `<video>` autoplay, **muted, looped** (ideal web loops).
- youtube/vimeo src → responsive iframe.
- no src → clean branded placeholder (solid green + play icon + caption). *(No baked-in stock image — the old overlapping-text placeholder was removed this session.)*

**Where to drop assets (owner workflow):**
1. Put clips in `frontend/public/videos/` and posters/screenshots in `frontend/public/video-posters/` (create folders if absent).
2. Set the path in the relevant data file:
   - AI feature → `videoSrc`/`poster` in `data/ai.js`.
   - Product page → `videoUrl`/`poster` in `data/products.js`.
   - FAQ → `media.src`/`media.poster` in the FAQ's data file.
3. They auto-render — no component changes needed.

**Specs (from tracker):** portrait 1080×1920 for phone/floor features; 1920×1080 for dashboards; 15–25s; muted with caption overlays; MP4+WebM < 2–3 MB; realistic demo data, no PII.

---

## 5. Content tracker — `MyGenie_AI_Content_Tracker.xlsx`
Generated by `scripts/make_ai_tracker.py`. Sheets:
1. **AI Page Content** — 7 features: headline, pain, what-AI-does, **seed outcome (PLACEHOLDER)**, blank "Your Real Metric", device, length, **exact video shot-list**, captions, status.
2. **Central Inventory** — the ~25s multi-outlet shot-list.
3. **Recording Specs** — device, length, captions, data hygiene, export, where files go.
4. **FAQ Media** — which FAQ on which page gets what visual + the exact shot/screenshot + inline CTA + status.

Owner: fill real metrics, record clips/screenshots, then tell the agent to wire `src` values.

---

## 6. Navigation, sitemap & SEO wiring (this session)
- Navbar: "Practical AI" top-level link + Central Inventory in the Product dropdown (desktop + mobile).
- Footer: Practical AI + Central Inventory links.
- Sitemap (`scripts/generate_sitemap.py`): `/ai` (static) + `central-inventory` (product) added → **50 URLs**, single www host.
- Per-page SEO meta via `react-helmet-async`; `Seo` now accepts a **single object or an array** of JSON-LD blocks. BreadcrumbList added to `/ai` and all product pages.

---

## 7. Known cosmetic/owner-pending
- All AI/FAQ/product video `src` are `null` (clean placeholders) until clips/screenshots are provided — honest, no stock-photo misleads.
- AI feature seed metrics are placeholders pending owner's real numbers.
