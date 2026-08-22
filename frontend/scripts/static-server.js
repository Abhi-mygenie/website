// scripts/static-server.js — serve the prerendered build/ with SPA fallback (POC demo)
const fs = require("fs");
const path = require("path");
const http = require("http");

const DIR = path.resolve(__dirname, "..", "build");
const PORT = process.env.PORT || 3000;
const TYPES = { ".html":"text/html; charset=utf-8", ".js":"text/javascript", ".css":"text/css",
  ".json":"application/json", ".svg":"image/svg+xml", ".png":"image/png", ".jpg":"image/jpeg",
  ".jpeg":"image/jpeg", ".webp":"image/webp", ".gif":"image/gif", ".ico":"image/x-icon",
  ".woff":"font/woff", ".woff2":"font/woff2", ".ttf":"font/ttf", ".txt":"text/plain",
  ".xml":"application/xml", ".map":"application/json" };

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  let file = path.normalize(path.join(DIR, urlPath));
  if (!file.startsWith(DIR)) file = path.join(DIR, "index.html"); // no traversal
  try {
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(DIR, "index.html");                        // SPA fallback
    }
  } catch (e) {
    file = path.join(DIR, "index.html");
  }
  const ext = path.extname(file);
  res.writeHead(200, { "Content-Type": TYPES[ext] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, "0.0.0.0", () => console.log("static build served on", PORT));
