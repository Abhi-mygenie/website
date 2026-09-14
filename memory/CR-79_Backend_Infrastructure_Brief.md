# CR-79 — Backend/Infrastructure Brief: Soft-404 HTTP Status Fix
**Filed by:** Agent (2026-08-20)  
**For:** Backend / Infrastructure / DevOps team  
**Urgency:** High — affecting Google crawl budget and indexation  
**Agent validation required:** Yes — see Section 4  
**Status:** OPEN — awaiting infrastructure action

---

## 1. What the Problem Is (Plain English)

When someone visits a URL on mygenie.online that doesn't exist — for example `https://mygenie.online/some-made-up-page` — the server returns **HTTP 200 (Success)** and shows the homepage.

This is called a **"soft 404"**. The page looks like a 404 but the HTTP status code says everything is fine.

Google's crawler sees this and thinks:
- "The URL `/some-made-up-page` is a valid page"
- It crawls it, indexes it, notices it's identical to the homepage
- It flags it as duplicate content
- Over time this wastes crawl budget on URLs that don't exist

In Google Search Console this shows up as **"Crawled — currently not indexed"** and **"Duplicate without user-selected canonical"** warnings.

---

## 2. Root Cause

**Two-layer problem:**

### Layer 1 — React Router (Frontend)
The React app has a wildcard catch-all route that redirects unknown URLs to the homepage:
```jsx
// frontend/src/App.js — current wildcard route
<Route path="*" element={<Navigate to="/" replace />} />
```
This needs to show a proper 404 page instead of redirecting.  
**→ This is the agent's fix (React-side). Not in scope for this brief.**

### Layer 2 — Web Server / CDN (Infrastructure — THIS BRIEF)
Even after the React-side fix, the web server still returns **HTTP 200** for every URL because it's a Single Page Application (SPA). The server config looks like:
```nginx
# Nginx SPA config (simplified)
location / {
    try_files $uri /index.html;   # always returns 200 + index.html
}
```
This is correct for routing (all SPA routes need to serve index.html), but it means even genuinely non-existent paths return HTTP 200.

**A real 404 status must be set at the server/CDN level** — React cannot set HTTP status codes.

---

## 3. What Needs to Be Done (Infrastructure Action)

### Option A — Cloudflare Worker (Recommended if on Cloudflare)

Create a Cloudflare Worker that:
1. Has a list of all known valid path prefixes (see Section 3a)
2. For requests matching a known path: passes through normally (returns 200)
3. For requests to unknown paths: fetches `index.html` BUT returns it with HTTP status `404`

**Pseudocode:**
```js
const KNOWN_PATHS = [
  "/", "/pricing", "/solutions", "/product", "/customers",
  "/roi", "/resources", "/ai", "/blog", "/about", "/contact",
  "/terms", "/privacy", "/refund", "/leads", "/petpooja-alternative",
  "/demo", "/payment-success",
  // add any new routes as they're created
];

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Known path prefixes — allow through
  const isKnown = KNOWN_PATHS.some(p =>
    path === p || path.startsWith(p + "/") || path.startsWith("/blog/") || path.startsWith("/solutions/") || path.startsWith("/product/")
  );

  if (isKnown) {
    return fetch(request); // normal pass-through
  }

  // Unknown path — fetch index.html but return 404 status
  const response = await fetch(new Request(url.origin + "/", request));
  return new Response(response.body, {
    ...response,
    status: 404,
    statusText: "Not Found",
  });
}
```

### Option B — Nginx Config (if Nginx is directly accessible)

This is more complex for SPAs. The challenge is distinguishing between:
- `/pricing` → valid SPA route → serve index.html with 200
- `/abc-xyz-nonexistent` → invalid → serve index.html with 404

One approach using a map:
```nginx
# Define valid SPA routes
map $uri $is_valid_route {
    default                0;
    "/"                    1;
    "/pricing"             1;
    "/solutions"           1;
    "~^/solutions/"        1;
    "~^/product/"          1;
    "/customers"           1;
    "/roi"                 1;
    "/resources"           1;
    "/ai"                  1;
    "/blog"                1;
    "~^/blog/"             1;
    "/about"               1;
    "/contact"             1;
    "/terms"               1;
    "/privacy"             1;
    "/refund"              1;
    "/petpooja-alternative" 1;
    "/demo"                1;
    "/payment-success"     1;
    "/leads"               1;
}

location / {
    try_files $uri /index.html;
    # Return 404 for unknown routes (still serves the SPA, but with correct status)
    if ($is_valid_route = 0) {
        return 404 /index.html;
    }
}
```

### Option C — `_redirects` file (Netlify/Cloudflare Pages) ← MOST LIKELY PATH

A `_redirects` file **already exists** at `/app/frontend/public/_redirects` and is actively being used (it has 19 redirect rules). This means the hosting is **Netlify or Cloudflare Pages**.

**Current last line of `_redirects`:**
```
/*    /index.html    200
```
This wildcard line catches ALL unmatched paths and serves them with HTTP 200 — this IS the soft-404 bug.

**The fix** — replace the wildcard line with two lines:
```
# Known dynamic route prefixes — return 200
/solutions/*    /index.html    200
/product/*      /index.html    200
/blog/*         /index.html    200

# SPA fallback for all other unmatched paths — return 404
/*              /index.html    404
```

**Full updated `_redirects` file** (replacing the current one):
```
# Netlify / Cloudflare Pages style redirects (301) — old live-site URLs -> new V2.4 URLs.

/fine-dining                  /solutions/restaurants        301
/quick-service                /solutions/qsr                301
/Cafe-and-coffee-shop         /solutions/cafes              301
/cloud-kithen                 /solutions/cloud-kitchens     301
/bar-and-pubs                 /solutions/bars-pubs          301
/bakeries                     /solutions/bakeries           301
/buffet-stations-restaurant   /solutions/food-courts        301
/ice-green-and-dessert        /solutions/ice-cream-desserts 301
/pizzerias                    /solutions/restaurants        301
/smart-billing                /product/sell-serve           301
/inventory-management         /product/protect-profit       301
/reports_and-analytics        /product/see-everything       301
/menu-management              /product/sell-serve           301
/about-us                     /about                        301
/contact-us                   /contact                      301
/terms-and-conditions         /terms                        301
/privacy-policy               /privacy                      301
/refund-policy                /refund                       301
/blogs                        /blog                         301

# Known dynamic SPA route prefixes — must return 200
/solutions/*    /index.html    200
/product/*      /index.html    200
/blog/*         /index.html    200

# All other unmatched paths — SPA fallback with correct 404 status
/*              /index.html    404
```

⚠️ **WARNING:** The `_redirects` file is in `frontend/public/` — it is a FRONTEND file. The infrastructure/platform team does NOT need to touch Nginx. **The agent can make this change directly** once the approach is confirmed by the owner.

**This reduces the fix from "infrastructure work" to a 3-line change in a public file.**

---

## 3a — Complete List of Valid Paths (as of 2026-08-20)

These are all the routes defined in `frontend/src/App.js`:

```
/                           → Homepage
/pricing                    → Pricing page
/solutions                  → Solutions index
/solutions/:slug            → Any sector page (e.g. /solutions/restaurants)
/product                    → Product index
/product/:bucket            → Any product page (e.g. /product/sell-serve)
/customers                  → Success stories
/roi                        → ROI calculator
/resources                  → Resources
/ai                         → AI page
/blog                       → Blog index
/blog/:slug                 → Any blog post
/about                      → About
/contact                    → Contact
/terms                      → Terms & Conditions
/privacy                    → Privacy Policy
/refund                     → Refund Policy
/leads                      → Internal leads view (CMS-auth gated)
/petpooja-alternative       → Petpooja comparison LP
/demo                       → Demo landing page
/payment-success            → Payment success page
```

Additionally, there are 301-equivalent redirects in `data/redirects.js` — these old URLs redirect to new ones within the SPA and should also return 200.

---

## 4. Agent Validation Steps (Post-Fix Checklist)

Once the infrastructure team has made the change, agent to verify:

### Step 1 — HTTP status check on a non-existent URL
```bash
curl -I https://www.mygenie.online/this-page-does-not-exist-xyz123
```
**Expected BEFORE fix:** `HTTP/2 200`  
**Expected AFTER fix:** `HTTP/2 404`

### Step 2 — HTTP status check on a valid URL
```bash
curl -I https://www.mygenie.online/pricing
curl -I https://www.mygenie.online/solutions/restaurants
curl -I https://www.mygenie.online/blog/some-slug
```
**Expected:** `HTTP/2 200` for all known valid paths

### Step 3 — React-side 404 page renders
Visit `https://www.mygenie.online/this-page-does-not-exist-xyz123` in browser:
- Should show the NotFound page (404 headline, "Back to home" button)
- Should NOT redirect to homepage
- URL bar should remain at `/this-page-does-not-exist-xyz123` (not redirect)

### Step 4 — Google Search Console (1–2 weeks after fix)
- Go to Coverage report
- "Crawled — currently not indexed" count should start declining
- "Duplicate without user-selected canonical" warnings should clear

---

## 5. Agent's Own TODO (On Backend Confirmation)

When infrastructure confirms the HTTP status fix is live:

1. **Run validation** using curl commands in Section 4
2. **Implement React-side fix** (NotFound.jsx page + App.js wildcard route change) — this is the agent's separate code change
3. **Update CR-79 status** to IMPLEMENTED
4. **Update CR-79 decision doc** with: which option was used (A/B/C), date deployed, baseline curl output, post-fix curl output
5. **Register a 2-week follow-up task** to check Google Search Console Coverage report

---

## 6. Questions for Infrastructure Team

1. Are you on Cloudflare, and do you use Cloudflare Workers?
2. Is Nginx config directly editable, or is it managed by a platform (Kubernetes ingress, etc.)?
3. Is the `_redirects` file at `frontend/public/_redirects` currently being processed by the CDN?
4. Any current WAF rules that might conflict with a status-code-overriding Worker?

---

*Brief filed 2026-08-20. Agent: no code changes made for this CR. Implementation of the React-side NotFound page is deferred until HTTP status fix is confirmed live.*
