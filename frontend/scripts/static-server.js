// scripts/static-server.js — serve the prerendered build/ with SPA fallback + gzip compression
const fs = require("fs");
const path = require("path");
const http = require("http");
const zlib = require("zlib");

const DIR = path.resolve(__dirname, "..", "build");
const PORT = process.env.PORT || 3000;
const TYPES = { ".html":"text/html; charset=utf-8", ".js":"text/javascript", ".css":"text/css",
  ".json":"application/json", ".svg":"image/svg+xml", ".png":"image/png", ".jpg":"image/jpeg",
  ".jpeg":"image/jpeg", ".webp":"image/webp", ".gif":"image/gif", ".ico":"image/x-icon",
  ".woff":"font/woff", ".woff2":"font/woff2", ".ttf":"font/ttf", ".txt":"text/plain",
  ".xml":"application/xml", ".map":"application/json" };

// Gzip these text-based formats — binary formats (images, fonts) are already compressed
const GZIP_EXTS = new Set([".html", ".js", ".css", ".json", ".svg", ".xml", ".txt", ".map"]);

// Cache strategy: immutable for content-hashed assets, no-cache for HTML.
function getCacheControl(filePath) {
  if (/\/static\/(js|css|media)\//.test(filePath))
    return "public, max-age=31536000, immutable";
  if (/\/fonts\//.test(filePath))
    return "public, max-age=31536000, immutable";
  if (/\/brand\//.test(filePath))
    return "public, max-age=604800";
  if (filePath.endsWith(".html"))
    return "no-cache";
  return "public, max-age=3600";
}

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  let file = path.normalize(path.join(DIR, urlPath));
  if (!file.startsWith(DIR)) file = path.join(DIR, "index.html"); // no traversal
  let isSpaFallback = false;
  const notFoundPage = path.join(DIR, "404", "index.html");
  try {
    if (!fs.existsSync(file)) {
      isSpaFallback = true;
      file = fs.existsSync(notFoundPage) ? notFoundPage : path.join(DIR, "index.html");
    } else if (fs.statSync(file).isDirectory()) {
      const dirIndex = path.join(file, "index.html");
      if (fs.existsSync(dirIndex)) {
        file = dirIndex;                                           // prerendered route → 200
      } else {
        isSpaFallback = true;
        file = fs.existsSync(notFoundPage) ? notFoundPage : path.join(DIR, "index.html");
      }
    }
  } catch (e) {
    isSpaFallback = true;
    file = fs.existsSync(notFoundPage) ? notFoundPage : path.join(DIR, "index.html");
  }
  const ext = path.extname(file);
  const acceptsGzip = (req.headers["accept-encoding"] || "").includes("gzip");
  const canGzip = GZIP_EXTS.has(ext) && acceptsGzip;
  const status = isSpaFallback ? 404 : 200;

  const headers = { "Content-Type": TYPES[ext] || "application/octet-stream", "Cache-Control": getCacheControl(file) };
  if (canGzip) headers["Content-Encoding"] = "gzip";

  res.writeHead(status, headers);
  const stream = fs.createReadStream(file);
  if (canGzip) stream.pipe(zlib.createGzip()).pipe(res);
  else stream.pipe(res);
}).listen(PORT, "0.0.0.0", () => console.log("static build served on", PORT));
