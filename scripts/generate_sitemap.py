"""Generates public/sitemap.xml for the MyGenie V2.4 site (all canonical new URLs)."""
import json
from datetime import date

SITE = "https://www.mygenie.online"
OUT = "/app/frontend/public/sitemap.xml"
TODAY = date.today().isoformat()

STATIC = [
    ("/", "1.0"),
    ("/pricing", "0.9"),
    ("/customers", "0.8"),
    ("/roi", "0.7"),
    ("/resources", "0.6"),
    ("/blog", "0.8"),
    ("/ai", "0.8"),
    ("/about", "0.6"),
    ("/contact", "0.6"),
    ("/terms", "0.3"),
    ("/privacy", "0.3"),
    ("/refund", "0.3"),
]

SECTORS = [
    "restaurants", "cafes", "qsr", "cloud-kitchens", "hotels-resorts",
    "food-courts", "canteens", "chains", "bars-pubs", "bakeries", "ice-cream-desserts",
]
PRODUCTS = ["sell-serve", "run-property", "customers", "protect-profit", "see-everything", "central-inventory"]


def url_entry(loc, priority="0.7", lastmod=TODAY):
    return (
        f"  <url>\n    <loc>{SITE}{loc}</loc>\n"
        f"    <lastmod>{lastmod}</lastmod>\n    <priority>{priority}</priority>\n  </url>"
    )


def main():
    entries = [url_entry(p, pr) for p, pr in STATIC]
    entries += [url_entry(f"/solutions/{s}") for s in SECTORS]
    entries += [url_entry(f"/product/{p}") for p in PRODUCTS]

    with open("/app/frontend/src/data/blogPosts.json") as f:
        posts = json.load(f)
    for p in posts:
        lastmod = p.get("date") or TODAY
        entries.append(url_entry(f"/blog/{p['slug']}", "0.6", lastmod))

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(entries)
        + "\n</urlset>\n"
    )
    with open(OUT, "w") as f:
        f.write(xml)
    print(f"Wrote {len(entries)} URLs -> {OUT}")


if __name__ == "__main__":
    main()
