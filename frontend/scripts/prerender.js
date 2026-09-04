// scripts/prerender.js — Full rollout: prerender all routes from sitemap.xml
const fs = require("fs");
const path = require("path");
const http = require("http");
const puppeteer = require("puppeteer-core");

// Auto-read all routes from sitemap.xml — stays in sync when new pages are added
const ROUTES = (() => {
  const xml = fs.readFileSync(path.resolve(__dirname, "../public/sitemap.xml"), "utf8");
  const sitemapRoutes = [...xml.matchAll(/<loc>https:\/\/www\.mygenie\.online([^<]*)<\/loc>/g)]
    .map(m => m[1] || "/");
  // Not in sitemap (noindex/transactional) but prerendered for UX/ad-landing speed.
  const extraRoutes = ["/demo", "/payment-success", "/404", "/thank-you"];
  return [...sitemapRoutes, ...extraRoutes];
})();
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
      await page.waitForSelector(
        '[data-testid="hero"], [data-testid$="-hero"], [data-testid$="-page"], [data-testid^="legal-page"]',
        { timeout: 30000 }
      );
      // CR-133: Wait for react-helmet-async to commit its tags.
      // og:title is appended as a portal element — when count > 1 react-helmet has committed.
      // Non-fatal: .catch ensures prerender continues even if signal doesn't appear.
      await page.waitForFunction(
        () => document.querySelectorAll('meta[property="og:title"]').length > 1,
        { timeout: 5000 }
      ).catch(() => {});
      await page.evaluate(() => {
        document.querySelectorAll(
          'script[src*="googletagmanager"],script[src*="posthog"],iframe[src*="googletagmanager"]'
        ).forEach((n) => n.remove());
        const titles = document.querySelectorAll("title");           // dedupe base + helmet title
        for (let i = 0; i < titles.length - 1; i++) titles[i].remove();

        // ── NEW 1: deduplicate inline <style> blocks (Sonner injects twice) ──────
        const seenStyles = new Set();
        document.querySelectorAll('head style').forEach((el) => {
          const key = el.textContent.trim().slice(0, 100);
          if (seenStyles.has(key)) el.remove();
          else seenStyles.add(key);
        });

        // ── NEW 2: remove <noscript> from <head> (serialised as blocking stylesheet) ─
        document.querySelectorAll('head noscript').forEach((n) => n.remove());

        // ── NEW 3: remove googleapis.com links (CR-118: Poppins now self-hosted) ─────
        document.querySelectorAll('head link[href*="googleapis.com"]').forEach((n) => n.remove());

        // ── NEW 4: deduplicate canonical links — keep LAST (react-helmet), remove earlier ones ─
        const canonicals = document.querySelectorAll('link[rel="canonical"]');
        Array.from(canonicals).slice(0, -1).forEach((c) => c.remove());

        // ── NEW 5: sync <title> from last og:title + deduplicate all duplicate head tags ──────
        // react-helmet-async 3.0 appends og:title via portal (reliable) but updates <title>
        // via document.title asynchronously. Use og:title as source of truth for <title>.
        const ogTitles = document.querySelectorAll('meta[property="og:title"]');
        if (ogTitles.length > 1) {
          const correctTitle = ogTitles[ogTitles.length - 1].getAttribute('content');
          const titleEl = document.querySelector('title');
          if (titleEl) titleEl.textContent = correctTitle;
          Array.from(ogTitles).slice(0, -1).forEach(m => m.remove());
        }
        // Deduplicate og:description, meta description, og:url, twitter tags (keep last = helmet)
        [
          'meta[property="og:description"]',
          'meta[name="description"]',
          'meta[property="og:url"]',
          'meta[name="twitter:title"]',
          'meta[name="twitter:description"]',
          'meta[name="twitter:image"]',
        ].forEach(sel => {
          const tags = document.querySelectorAll(sel);
          Array.from(tags).slice(0, -1).forEach(m => m.remove());
        });

        // ── CR-167: strip ConsentBanner — session-dependent UI must not bake into prerendered HTML ─
        // ConsentBanner useEffect fires at mount → Puppeteer captures show=true (banner visible).
        // React hydrates with show=false (initial state) → DOM mismatch → React error #418 → CSR fallback.
        // Strip the element and its body class so prerendered HTML matches React's initial render state.
        document.querySelectorAll('[data-testid="consent-banner"]').forEach(n => n.remove());
        document.body.classList.remove("consent-banner-open");

        // Inject hero image preload so browser starts download at HTML parse time
        // First remove any image preload inherited from the shell (banner.webp bleeds into all pages)
        document.querySelectorAll('head link[rel="preload"][as="image"]').forEach(l => l.remove());
        // Idempotent re-injection: only for pages that have a hero-visual img
        const heroImg = document.querySelector('[data-testid="hero-visual"] img');
        if (heroImg && heroImg.src) {
          const href = new URL(heroImg.src).pathname;
          if (!document.querySelector(`link[rel="preload"][as="image"][href="${href}"]`)) {
            const preload = document.createElement("link");
            preload.rel = "preload";
            preload.as = "image";
            preload.setAttribute("fetchpriority", "high");
            preload.href = href;
            document.head.appendChild(preload);
          }
        }
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
