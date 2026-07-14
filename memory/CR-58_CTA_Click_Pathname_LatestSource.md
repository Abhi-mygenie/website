# CR-58 — Record pathname at Demo CTA click → latest_source

**Status**: BACKLOG (user said "later" on 2026-06)
**Priority**: P2 enhancement
**Effort**: ~2 lines

## Problem
Freshsales `latest_source` doesn't show which page the demo click originated from (sector page vs generic Navbar CTA), so per-page conversion attribution is blind.

## Fix
In `handleDemoCtaClick` (Navbar / CTA handler), record `document.location.pathname` at click time into the attribution `latest_source` (sessionStorage last-touch), so it flows into the lead payload → Freshsales.

## Files
- `frontend/src/components/site/Navbar.jsx` (or wherever `handleDemoCtaClick` lives — grep for it)
- Possibly `frontend/src/lib/attribution.js` if a setter is needed

## Test plan
1. Click "Book a Free Demo" from a sector page (e.g. `/sector/...`) → submit DemoForm → verify lead payload / Freshsales contact shows that pathname as latest_source.
2. Repeat from homepage Navbar → verify homepage pathname recorded.
3. Regression: existing attribution fields unchanged.
