# CR-114 — Heading Webfont (Clash Display) Causes Delayed LCP + CLS on Mobile

**Type:** Bug / Web Performance (Core Web Vitals)
**Date Raised:** 2026-06
**Raised By:** CR-101 POC investigation (Lighthouse mobile on prerendered `/`)
**Status:** FIXED — 2026-08-23
**Priority:** HIGH
**Effort:** ~0.5–1 day
**Improves:** LCP · CLS · Google Ads Landing Page Experience
**Scope:** `frontend/public/index.html`, `frontend/src/index.css` (font setup), heading `.font-display` usage
**Related:** CR-101 (prerender POC), CR-70 (font preload), CR-82 (image CLS)

---

## 1. Problem Statement
On the prerendered homepage (Lighthouse mobile, Moto G / Slow-4G), overall score = **46**. The **LCP element is the `<h1>` heading text** (measured 380×151), and it is recorded at **~6.0s** — roughly **2× the FCP** — even though the H1 is already present in the raw prerendered HTML.

Root cause: the heading uses `.font-display { font-family: "Clash Display", ... }`, loaded **asynchronously from a third-party CDN (`api.fontshare.com`)** with `display=swap`. The H1 first paints in the fallback font (fast), but when Clash Display finally downloads over the slow link and **swaps in, the large heading re-paints/reflows** — Chrome then logs a **new, later, larger LCP** at font-arrival time, and the reflow produces the **CLS ≈ 0.15**.

So a single defect (a late third-party heading font that swaps after first paint) is inflating **both LCP and CLS**.

## 2. Evidence
- Instrumented headless-Chrome run (4× CPU + Slow-4G emulation): `lcpTag:"H1"`, `lcpSize:"380x151"`, `lcp` ≈ 2× `fcp`.
- Lighthouse mobile (user-run) on prerendered `/`: LCP 6,006 ms (score 13), CLS 0.15 (score 76), SI 2,869 ms (score 95 — architecture OK).
- CSS: `.font-display{font-family:Clash Display,Poppins,sans-serif;word-spacing:.12em}`.
- `index.html`: heading font loaded via `<link ... href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap" ...>` (async loadCSS pattern) — third-party origin, no self-host, no `woff2` preload.

## 3. Suggested Fix (for later — NOT part of this intake)
1. **Self-host** the Clash Display (600/700) and Poppins `woff2` files under `frontend/public/fonts/`.
2. Add `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the heading weight(s) used above the fold.
3. Define `@font-face` with **`font-display: optional`** (or a `size-adjust`/`ascent-override` metric-matched fallback) so there is **no post-paint swap** on the LCP heading.
4. Drop the render path's dependency on `api.fontshare.com` for the above-the-fold heading.

## 4. Files Likely Changed
| File | Change |
|---|---|
| `frontend/public/index.html` | Remove third-party heading-font link from critical path; add self-hosted preload |
| `frontend/src/index.css` | Add `@font-face` (self-hosted, `font-display: optional` + metric-matched fallback) |
| `frontend/public/fonts/*` | New: self-hosted woff2 files |

## 5. Definition of Done
- [ ] LCP element (H1) paints at first paint and does **not** re-register on font load
- [ ] No layout shift attributable to the heading font swap (CLS from font ≈ 0)
- [ ] LCP ≤ 2.5s and CLS ≤ 0.1 on Lighthouse mobile (real deploy, gzip on)
- [ ] Verification by testing_agent required before marking fixed

---

*CR-114 registered 2026-06. Source: CR-101 POC investigation. Intake only — no code changed.*
