# CR-212 — Dead Routes: /solutions/bars-and-pubs and /solutions/hotels Return HTTP 404

**Registered:** 2026-09-05
**Source:** Route audit — ISS-A and ISS-B
**Status:** 🔲 Open — Ready to implement
**Priority:** P1 (Googlebot sees 404, ad final URLs may be broken)
**Owner:** Agent (code) + Owner (nginx production config)
**Files:** `scripts/prerender.js` (pod fix) · `nginx-redirects.conf` (production fix)

---

## 1. Problem

Two old URL patterns return HTTP 404 on the static server and production:

| Dead URL | Correct URL | Impact |
|---|---|---|
| `/solutions/bars-and-pubs` | `/solutions/bars-pubs` | Googlebot 404, backlinks dead |
| `/solutions/hotels` | `/solutions/hotels-resorts` | Googlebot 404, backlinks dead |

---

## 2. Why the Redirects Exist But Don't Work

The redirect rules are defined **correctly** in two places — but neither is effective on the production/pod static server:

### Layer 1 — `src/data/redirects.js` (React `<Navigate replace>`)
```js
"/solutions/bars-and-pubs": "/solutions/bars-pubs",    // line 18 (CR-202)
"/solutions/hotels":         "/solutions/hotels-resorts", // line 19 (CR-203)
```
**Works for:** Browser users (React boots, fires `<Navigate>`, browser follows).
**Fails for:** Googlebot (no JS execution), cURL, any HTTP-level check.

### Layer 2 — `public/_redirects` (Netlify / Cloudflare Pages format)
```
/solutions/bars-and-pubs  /solutions/bars-pubs       301
/solutions/hotels         /solutions/hotels-resorts  301
```
**Works for:** Netlify or CF Pages deployments only.
**Fails for:** Any nginx-based production server (nginx ignores `_redirects` format).

### Layer 3 — `static-server.js` (pod + any custom node server)
```js
const status = isSpaFallback ? 404 : 200;
// serves /build/404/index.html for any path with no prerendered folder
```
No redirect logic. Unknown paths → HTTP 404 + 404 page content.

### Layer 4 — `nginx-redirects.conf`
Referenced in `redirects.js` comments: *"mirrored in nginx-redirects.conf for true server-side 301s at deploy time."*
**This file does not exist in the repo.** It was never created.

**Confirmed HTTP 404 on preview pod:**
```bash
curl -o /dev/null -w "%{http_code}" http://localhost:3000/solutions/bars-and-pubs  → 404
curl -o /dev/null -w "%{http_code}" http://localhost:3000/solutions/hotels          → 404
```

---

## 3. Fix — Two Parts

### Part A: Prerender the redirect pages (pod + static-server fix)

Add both dead URLs to the prerender script's extra routes list. Puppeteer visits each URL → React's `<Navigate>` fires → Puppeteer follows the redirect → captures the correct destination page content. Static-server finds the prerendered folder → returns HTTP 200 (not 404). React boots at the correct canonical URL.

**File:** `scripts/prerender.js`
**Change:** Add to `extraRoutes` array:
```js
"/solutions/bars-and-pubs",
"/solutions/hotels",
```

**Pre-flight:**
```bash
grep -n "extraRoutes\|bars\|hotels" /app/frontend/scripts/prerender.js | head -10
```

**Post-build validation:**
```bash
ls /app/frontend/build/solutions/bars-and-pubs/   # Expected: index.html present
ls /app/frontend/build/solutions/hotels/           # Expected: index.html present
curl -o /dev/null -w "%{http_code}" http://localhost:3000/solutions/bars-and-pubs
# Expected: 200 (not 404)
curl -o /dev/null -w "%{http_code}" http://localhost:3000/solutions/hotels
# Expected: 200 (not 404)
# Verify content is the correct destination (not 404 page):
grep -o "<title>.*</title>" /app/frontend/build/solutions/bars-and-pubs/index.html
# Expected: Bars & Pubs POS System & Billing Software | MyGenie
grep -o "<title>.*</title>" /app/frontend/build/solutions/hotels/index.html
# Expected: Hotels & Resorts POS System & Billing Software | MyGenie
```

**Limitation:** Prerendering gives HTTP 200 (not 301). Googlebot will find a 200 page at the old URL — not ideal canonically. The canonical tag in the prerendered page will point to the correct URL, which helps. But a true 301 requires Part B.

### Part B: nginx-redirects.conf (production server — owner action)

Create or update the nginx server config for `www.mygenie.online` to add:

```nginx
# CR-212: dead route 301 redirects
location = /solutions/bars-and-pubs { return 301 /solutions/bars-pubs; }
location = /solutions/hotels         { return 301 /solutions/hotels-resorts; }
```

This is the **true server-side 301** that Googlebot follows and that passes link equity.
The `nginx-redirects.conf` file referenced in `redirects.js` comments should be created
in the repo and included from the main nginx site config.

---

## 4. Priority of Parts

| Part | HTTP status | Googlebot | Link equity | Effort |
|---|---|---|---|---|
| Part A (prerender) | 200 + canonical | Follows canonical ≈ OK | Partial | Code + rebuild |
| Part B (nginx conf) | 301 | Full redirect | Full | Owner nginx access |
| Both together | 301 (nginx wins) | Full redirect | Full | Best outcome |

Implement Part A now (code change). Part B is an owner action on the production server.

---

## 5. Additional Check — Canonical Tags

After Part A, verify the prerendered redirect pages have the correct canonical:
```bash
grep "canonical" /app/frontend/build/solutions/bars-and-pubs/index.html
# Expected: href="https://www.mygenie.online/solutions/bars-pubs"
grep "canonical" /app/frontend/build/solutions/hotels/index.html
# Expected: href="https://www.mygenie.online/solutions/hotels-resorts"
```
If the canonical points to the destination URL, Googlebot consolidates signals correctly
even without a true 301.

---

## 6. Summary

| Item | Detail |
|---|---|
| Affected URLs | `/solutions/bars-and-pubs`, `/solutions/hotels` |
| Root cause | `nginx-redirects.conf` never created; `_redirects` not read by nginx/static-server |
| Part A fix | Add 2 routes to `prerender.js` extraRoutes → rebuild |
| Part B fix | Owner adds `return 301` directives to nginx production config |
| Risk | Zero — prerendering adds folders, doesn't remove anything |
| Related CRs | CR-202 (`/solutions/bars-and-pubs` redirect rule), CR-203 (`/solutions/hotels` redirect rule) |

*Registered 2026-09-05. ISS-A + ISS-B combined. E1 Agent.*
