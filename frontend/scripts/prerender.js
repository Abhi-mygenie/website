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
