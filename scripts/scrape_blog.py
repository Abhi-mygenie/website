"""
Scrapes the live MyGenie blog (server-rendered) and saves all posts 1:1 into the
new React site as a JSON manifest + downloaded hero images. Preserves slugs for SEO.
"""
import json, os, re, time
import requests
from bs4 import BeautifulSoup
from markdownify import markdownify as md

BASE = "https://www.mygenie.online"
INDEX = f"{BASE}/blogs"
OUT_JSON = "/app/frontend/src/data/blogPosts.json"
IMG_DIR = "/app/frontend/public/blog"
os.makedirs(IMG_DIR, exist_ok=True)

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; MyGenieMigration/1.0)"}


def get(url):
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    return r.text


def discover_slugs():
    soup = BeautifulSoup(get(INDEX), "html.parser")
    slugs = []
    for a in soup.select('a[href*="/blog/"]'):
        href = a.get("href", "")
        m = re.search(r"/blog/([^/#?]+)$", href)
        if m:
            slug = m.group(1)
            if slug and slug not in slugs and slug != "":
                slugs.append(slug)
    return slugs


def download_img(url, slug):
    if not url:
        return None
    try:
        ext = os.path.splitext(url.split("?")[0])[1] or ".jpg"
        if len(ext) > 5:
            ext = ".jpg"
        fname = f"{slug[:60]}{ext}"
        path = os.path.join(IMG_DIR, fname)
        r = requests.get(url, headers=HEADERS, timeout=30)
        if r.ok and r.content:
            with open(path, "wb") as f:
                f.write(r.content)
            return f"/blog/{fname}"
    except Exception as e:
        print("  img fail", e)
    return None


def clean_md(text):
    # collapse excessive blank lines and stray escapes
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text


def scrape_post(slug):
    url = f"{BASE}/blog/{slug}"
    soup = BeautifulSoup(get(url), "html.parser")

    title_tag = soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else slug
    desc_tag = soup.find("meta", attrs={"name": "description"})
    description = desc_tag["content"].strip() if desc_tag and desc_tag.get("content") else ""
    ogimg = soup.find("meta", attrs={"property": "og:image"})
    og_image = ogimg["content"].strip() if ogimg and ogimg.get("content") else ""

    h1 = soup.find("h1")
    heading = h1.get_text(strip=True) if h1 else title

    date_el = soup.select_one(".blog_detail-date")
    date = date_el.get_text(strip=True) if date_el else ""

    hero_el = soup.select_one(".blog_detail_top-img img")
    hero_url = hero_el.get("src") if hero_el else og_image
    local_img = download_img(hero_url, slug)

    body_el = soup.select_one(".blog_detail-text-content")
    body_md = ""
    if body_el:
        # drop social-share + nested cards if present inside content
        for junk in body_el.select(".detail_cards, .blog_card, script, style"):
            junk.decompose()
        body_md = clean_md(md(str(body_el), heading_style="ATX", strip=["a"] if False else None))

    return {
        "slug": slug,
        "title": title,
        "heading": heading,
        "description": description,
        "date": date,
        "image": local_img or "",
        "body": body_md,
    }


def main():
    slugs = discover_slugs()
    print(f"Discovered {len(slugs)} posts")
    posts = []
    for i, slug in enumerate(slugs):
        try:
            print(f"[{i+1}/{len(slugs)}] {slug}")
            posts.append(scrape_post(slug))
            time.sleep(0.3)
        except Exception as e:
            print("  FAIL", slug, e)
    with open(OUT_JSON, "w") as f:
        json.dump(posts, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(posts)} posts -> {OUT_JSON}")


if __name__ == "__main__":
    main()
