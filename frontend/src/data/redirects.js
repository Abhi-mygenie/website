// 301 redirect map: OLD live-site URLs -> NEW V2.4 URLs.
// Applied client-side via <Navigate replace> AND mirrored in public/_redirects
// + nginx-redirects.conf for true server-side 301s at deploy time.
// NOTE: old blog post URLs (/blog/<slug>) are preserved 1:1 by the new /blog/:slug
// route, so they need no redirect.
export const REDIRECTS = {
  // Sectors
  "/fine-dining": "/solutions/restaurants",
  "/quick-service": "/solutions/qsr",
  "/Cafe-and-coffee-shop": "/solutions/cafes",
  "/cloud-kithen": "/solutions/cloud-kitchens",
  "/bar-and-pubs": "/solutions/bars-pubs",
  "/bakeries": "/solutions/bakeries",
  "/buffet-stations-restaurant": "/solutions/food-courts",
  "/ice-green-and-dessert": "/solutions/ice-cream-desserts",
  "/pizzerias": "/solutions/restaurants",
  // Feature pages -> product buckets
  "/smart-billing": "/product/sell-serve",
  "/inventory-management": "/product/protect-profit",
  "/reports_and-analytics": "/product/see-everything",
  "/menu-management": "/product/sell-serve",
  // Core / legal / blog index
  "/about-us": "/about",
  "/contact-us": "/contact",
  "/terms-and-conditions": "/terms",
  "/privacy-policy": "/privacy",
  "/refund-policy": "/refund",
  "/blogs": "/blog",
};
