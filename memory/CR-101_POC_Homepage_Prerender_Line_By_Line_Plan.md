# CR-101 POC — Line-by-Line Implementation Plan (Homepage `/` Prerender)

**Date:** 2026-06 · **Scope:** `/` only, preview only · **Goal:** raw-HTML content + JSON-LD in the initial response, LCP element painted from HTML and never re-hidden, PostHog off the critical path.
**Touches (all reversible):** 1 new file (`scripts/prerender.js`), `package.json` (1 devDep + 1 script), `Hero.jsx` (5 edits), `public/index.html` (1 edit). **No component logic removed.**

**Tooling confirmed in-env:** `/usr/bin/google-chrome` (use via `puppeteer-core`, no Chromium download) · Python3 `http.server` for static serving. No `serve`/`react-snap` needed.

---

## STEP 0 — Baseline capture (before any edit)
```bash
# Prove today's problem: root is empty
curl -s https://beta.mygenie.online/ | grep -c "boosts profit by up to"   # expect 0
```
Checkpoint: confirms hero text is NOT in raw HTML today.

---

## STEP 1 — Add prerender dependency (devDependency only)
```bash
cd /app/frontend
yarn add -D puppeteer-core
```
- Updates `package.json` + `yarn.lock`. `puppeteer-core` uses the system Chrome — **no bundled Chromium**, not shipped to the browser bundle.
- Checkpoint: `grep puppeteer-core package.json` shows it under `devDependencies`.

---

## STEP 2 — Add the prerender script (NEW FILE)
**Create:** `/app/frontend/scripts/prerender.js` — exact content:
```js
// scripts/prerender.js — POC: prerender ONLY "/" into build/index.html
const fs = require("fs");
const path = require("path");
const http = require("http");
const puppeteer = require("puppeteer-core");

const ROUTES = ["/"];                       // POC: homepage only
const BUILD_DIR = path.resolve(__dirname, "..", "build");
const CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const PORT = 4321;

const TYPES = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css",
  ".json":"application/json", ".svg":"image/svg+xml", ".png":"image/png",
  ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".webp":"image/webp", ".ico":"image/x-icon",
  ".woff":"font/woff", ".woff2":"font/woff2", ".txt":"text/plain", ".xml":"application/xml" };

function serveBuild() {
  return http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    let file = path.join(BUILD_DIR, urlPath);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(BUILD_DIR, "index.html");   // SPA fallback for client routes
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
}

(async () => {
  const server = serveBuild().listen(PORT);
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    for (const route of ROUTES) {
      const page = await browser.newPage();
      await page.setRequestInterception(true);
      page.on("request", (r) =>
        /googletagmanager\.com|posthog\.com/.test(r.url()) ? r.abort() : r.continue()
      );
      await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: "networkidle0", timeout: 60000 });
      await page.waitForSelector('[data-testid="hero"]', { timeout: 30000 });
      await page.evaluate(() => {
        document.querySelectorAll(
          'script[src*="googletagmanager"],script[src*="posthog"],iframe[src*="googletagmanager"]'
        ).forEach((n) => n.remove());
        const titles = document.querySelectorAll("title");           // dedupe base + helmet title
        for (let i = 0; i < titles.length - 1; i++) titles[i].remove();
      });
      const html = "<!doctype html>\n" + (await page.content()).replace(/^<!doctype html>/i, "");
      const outDir = route === "/" ? BUILD_DIR : path.join(BUILD_DIR, route);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, "index.html"), html);
      console.log("prerendered", route, "->", path.join(outDir, "index.html"));
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
})();
```
Notes: serves `build/` → renders `/` in real Chrome → blocks & strips analytics → dedupes `<title>` → overwrites `build/index.html`. Only `/` is written; other routes' files are untouched.

**Edit `package.json` scripts** (add one line; leave existing lines intact):
```
  "scripts": {
    "start": "craco start",
    "build": "craco build",
    "prerender": "node scripts/prerender.js",   // ← ADD
    "test": "craco test"
  }
```

---

## STEP 3 — Fix the hero so the LCP element paints from HTML and is NEVER re-hidden
**File:** `/app/frontend/src/components/home/Hero.jsx` — set every above-the-fold `motion` element's `initial` to its resolved state (kills the opacity:0 → hydration re-hide that masks LCP). `animate`/`transition` stay, so they become visual no-ops.

**Edit 1 — badge (line 16):**
```
- initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
+ initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
```
**Edit 2 — H1 (line 25):**
```
- initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
+ initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
```
**Edit 3 — sub-heading `<p>` (the identified LCP element, line 35):**
```
- initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }}
+ initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }}
```
**Edit 4 — CTA row (line 46):**
```
- initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.19 }}
+ initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.19 }}
```
**Edit 5 — hero visual/image wrapper (line 73)** — in case the banner image becomes the largest element after text is fixed:
```
- initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}
+ initial={{ opacity: 1, scale: 1 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}
```
Result: whichever element is LCP (text or image) is visible on first paint and stays visible through hydration → LCP locks at first paint. Below-the-fold `Reveal` animations elsewhere are untouched.

---

## STEP 4 — Take PostHog off the critical path
**File:** `/app/frontend/public/index.html` — wrap ONLY the `posthog.init(...)` call (lines 102–109) so it fires after `load` + idle. The stub IIFE (40–101) stays; `array.js` + session recorder only download when `init` runs, so deferring `init` defers all of it.

**Before (lines 102–109):**
```html
            posthog.init("phc_xAvL2Iq4tFmANRE7kzbKwaSqp1HJjN7x48s3vr0CMjs", {
                api_host: "https://us.i.posthog.com",
                person_profiles: "identified_only",
                session_recording: {
                    recordCrossOriginIframes: true,
                    capturePerformance: false,
                },
            });
```
**After:**
```html
            function __initPosthog() {
                posthog.init("phc_xAvL2Iq4tFmANRE7kzbKwaSqp1HJjN7x48s3vr0CMjs", {
                    api_host: "https://us.i.posthog.com",
                    person_profiles: "identified_only",
                    session_recording: {
                        recordCrossOriginIframes: true,
                        capturePerformance: false,
                    },
                });
            }
            var __idle = window.requestIdleCallback || function (cb) { setTimeout(cb, 2000); };
            if (document.readyState === "complete") __idle(__initPosthog);
            else window.addEventListener("load", function () { __idle(__initPosthog); });
```
Behaviour unchanged (same events, same config) — only timing moves to post-load/idle.

> Note: Steps 3 & 4 edit source, so the **running dev preview hot-reloads** and reflects these immediately (desirable). Step 2's prerender only affects the `build/` artifact.

---

## STEP 5 — Build + prerender + validate (no supervisor changes)
```bash
cd /app/frontend
yarn build                       # produces build/ (empty-root index.html)
yarn prerender                   # overwrites build/index.html for "/"

# 5a. Raw-HTML win — hero text now present
grep -c "boosts profit by up to" build/index.html          # expect >= 1  (was 0)
# 5b. Structured data in raw HTML
grep -c "application/ld+json" build/index.html              # expect 2 (ORG + SOFTWARE_APP)
# 5c. Single title
grep -c "<title" build/index.html                           # expect 1
# 5d. No analytics baked in
grep -c "posthog\|googletagmanager" build/index.html        # expect 0
```
**Serve the build on a temp port to test hydration (dev server untouched):**
```bash
cd /app/frontend/build && python3 -m http.server 5055 &   # temp static server
```
Then validate via screenshot tool against `http://localhost:5055/` (or an exposed port):
- Hero renders, nav dropdowns open, "Book a Free Demo" scrolls to form, CMS pencil (`?admin=1`) still works → hydration healthy.
- Kill the temp server after: `kill %1`.

**Checkpoint / Definition of Done:**
- [ ] 5a ≥ 1, 5b = 2, 5c = 1, 5d = 0
- [ ] Served build looks identical to current site and is interactive (no broken hydration)
- [ ] LCP element (hero) present at first paint; not re-hidden (verified visually / via Lighthouse if run against the served port)

---

## STEP 6 — Rollback (if POC rejected)
```bash
cd /app/frontend
git checkout src/components/home/Hero.jsx public/index.html   # revert Steps 3 & 4
rm scripts/prerender.js                                        # revert Step 2
git checkout package.json && yarn install                     # revert Step 1 (drops puppeteer-core)
rm -rf build && yarn build                                     # clean artifact
```
Returns to exact current behaviour. Nothing in production was touched.

---

## Order of operations
1 (devDep) → 2 (script + package.json) → 3 (Hero) → 4 (index.html) → 5 (build/prerender/validate). Steps 3 & 4 are independent of 1 & 2 and can be verified on the live dev preview first.

## Explicitly OUT of scope for this POC
- The other 50 routes (dynamic slugs/blog/legal/leads/payment-success).
- Production deploy / Cloudflare edge-cache of prerendered HTML (would further cut the 707 ms TTFB).
- Turning `prerender` into a `postbuild` hook for all routes (that's the full CR-101 rollout, planned only after this POC passes).
- CMS→rebuild workflow decision (published homepage edits won't hit raw HTML until a rebuild).

*Plan only. No code changed. Awaiting approval to execute Steps 1–5 in preview.*
