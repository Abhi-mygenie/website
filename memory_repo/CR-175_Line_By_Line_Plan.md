# CR-175 — Line-by-Line Implementation Plan
## Footer Social Links: Add `noopener` to `rel` Attribute

**File count:** 1
**Lines changed:** 2 (add one word to each)
**Rebuild required:** Yes
**Risk:** NONE — `noreferrer` already implies `noopener` in all modern browsers

---

## Pre-flight checks

```bash
# 1. Confirm current rel values on social links
grep -n "noreferrer\|noopener" /app/frontend/src/components/site/Footer.jsx
# Expected:
# 32: rel="noreferrer"   ← YouTube (missing noopener)
# 33: rel="noreferrer"   ← Facebook (missing noopener)

# 2. Confirm no other external links in Footer missing noopener
grep -n "target.*blank" /app/frontend/src/components/site/Footer.jsx
# Expected: only L32 (YouTube) and L33 (Facebook) — both will be fixed
```

---

## File 1 of 1 — `frontend/src/components/site/Footer.jsx`

### Change 1 — Line 32: YouTube link

```
BEFORE (L32):
              <a href={COMPANY.social.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" data-testid="footer-youtube" ...>

AFTER (L32):
              <a href={COMPANY.social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" data-testid="footer-youtube" ...>
```

**Exact diff:**
```diff
-              <a href={COMPANY.social.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" ...>
+              <a href={COMPANY.social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" ...>
```

---

### Change 2 — Line 33: Facebook link

```
BEFORE (L33):
              <a href={COMPANY.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" data-testid="footer-facebook" ...>

AFTER (L33):
              <a href={COMPANY.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" data-testid="footer-facebook" ...>
```

**Exact diff:**
```diff
-              <a href={COMPANY.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" ...>
+              <a href={COMPANY.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" ...>
```

---

## Why this exact value

`rel="noopener noreferrer"` — space-separated, both values required by Lighthouse:
- `noopener` — prevents opened page accessing `window.opener` (explicit Lighthouse check)
- `noreferrer` — prevents referrer header being sent + implies noopener (already present)

Order: `noopener` first is conventional (matches MDN docs and Lighthouse recommendation).

**No other rel attributes on the page need changing** — confirmed by pre-flight check.

---

## Scope

Footer is rendered on **every page** across the site (42+ pages). However:
- This is a `rel` attribute — zero visual change, zero behavioural change
- No layout, no JS, no style affected
- Safe to apply site-wide without any page-specific review

**`data-testid` attributes unchanged** — `footer-youtube` and `footer-facebook` preserved.

---

## Verification (post-rebuild)

```bash
# 1. Confirm noopener in homepage prerender
grep "noopener noreferrer" /app/frontend/build/index.html | grep "footer"
# Expected: both YouTube and Facebook links show rel="noopener noreferrer"

# 2. Spot-check another page (footer is on all pages)
grep "noopener noreferrer" /app/frontend/build/about/index.html | grep "footer"
# Expected: same — noopener noreferrer on both

# 3. Confirm old value gone
grep "rel=\"noreferrer\"" /app/frontend/build/index.html | grep "footer"
# Expected: no results (old value replaced)
```

---

## Rollback

```
Revert L32 and L33: rel="noreferrer" (remove "noopener "). Rebuild.
```

*Plan written 2026-08-30.*
