#!/usr/bin/env python3
"""MyGenie POS Regression Test Suite — T1 through T8"""

import os
import re
import glob
from pathlib import Path
from datetime import datetime

BUILD = "/app/frontend/build"
BASE_URL = "https://frontend-as-is-run.preview.emergentagent.com"

results = {}

# ─── T1 Bundle Hash ───────────────────────────────────────────────────────────
known_bad = {"main.107ff3e9.js", "main.04593470.js", "main.8fe91636.js"}
known_good = {"main.74f504ee.js"}

js_files = glob.glob(f"{BUILD}/static/js/main.*.js")
hashes = [os.path.basename(f) for f in js_files]
t1_flag = any(h in known_bad for h in hashes)
t1_note = f"Hash(es) found: {hashes}. Known-bad match: {t1_flag}"
results["T1"] = {"result": "FLAG" if t1_flag else "PASS", "note": t1_note}
print(f"T1: {results['T1']}")

# ─── T2 — React #418 (static check via source) ────────────────────────────────
# Check ConsentBanner source for body class mutation at mount
consent_path = "/app/frontend/src/components/site/ConsentBanner.jsx"
app_path = "/app/frontend/src/App.js"
t2_note = ""
t2_result = "SKIP"

if os.path.exists(consent_path):
    src = open(consent_path).read()
    if "consent-banner-open" in src and ("document.body" in src or "classList" in src or "className" in src):
        t2_result = "FAIL"
        t2_note = "ConsentBanner mutates document.body class (consent-banner-open) — known root cause of React #418 hydration mismatch"
    else:
        t2_result = "PASS (static)"
        t2_note = "ConsentBanner does not appear to mutate body class"
else:
    t2_note = "ConsentBanner.jsx not found"

results["T2"] = {"result": t2_result, "note": t2_note}
print(f"T2: {results['T2']}")

# ─── T3 — CR-187 h1 Keywords ─────────────────────────────────────────────────
t3_pages = ["restaurants", "cafes", "qsr", "cloud-kitchens", "food-courts", "bakeries"]
t3_details = []
t3_fail = False

for slug in t3_pages:
    path = f"{BUILD}/solutions/{slug}/index.html"
    if not os.path.exists(path):
        t3_details.append(f"{slug}: FILE MISSING")
        t3_fail = True
        continue
    html = open(path).read()
    h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE | re.DOTALL)
    h1_text = re.sub(r'<[^>]+>', '', h1_match.group(1)).strip() if h1_match else "(no h1)"
    has_pos = "pos system" in h1_text.lower()
    has_billing = "billing software" in h1_text.lower()
    status = "PASS" if (has_pos and has_billing) else "FAIL"
    if status == "FAIL":
        t3_fail = True
    t3_details.append(f"{slug}: {status} | h1='{h1_text[:120]}' | pos_system={has_pos}, billing_software={has_billing}")

results["T3"] = {"result": "FAIL" if t3_fail else "PASS", "note": "; ".join(t3_details)}
print(f"T3: {results['T3']}")

# ─── T4 — Meta Description Length ────────────────────────────────────────────
t4_slugs = [
    ("homepage", f"{BUILD}/index.html"),
    ("solutions/restaurants", f"{BUILD}/solutions/restaurants/index.html"),
    ("solutions/cafes", f"{BUILD}/solutions/cafes/index.html"),
    ("solutions/qsr", f"{BUILD}/solutions/qsr/index.html"),
    ("solutions/cloud-kitchens", f"{BUILD}/solutions/cloud-kitchens/index.html"),
    ("solutions/food-courts", f"{BUILD}/solutions/food-courts/index.html"),
    ("solutions/bakeries", f"{BUILD}/solutions/bakeries/index.html"),
    ("restaurant-billing-software", f"{BUILD}/restaurant-billing-software/index.html"),
    ("restaurant-management-software", f"{BUILD}/restaurant-management-software/index.html"),
    ("restaurant-pos-comparison", f"{BUILD}/restaurant-pos-comparison/index.html"),
    ("qsr-pos-system", f"{BUILD}/qsr-pos-system/index.html"),
    ("cloud-kitchen-pos", f"{BUILD}/cloud-kitchen-pos/index.html"),
    ("petpooja-alternative", f"{BUILD}/petpooja-alternative/index.html"),
    ("product/sell-serve", f"{BUILD}/product/sell-serve/index.html"),
    ("product/see-everything", f"{BUILD}/product/see-everything/index.html"),
    ("product/central-inventory", f"{BUILD}/product/central-inventory/index.html"),
    ("blog", f"{BUILD}/blog/index.html"),
]
t4_details = []
t4_fail = False

for slug, path in t4_slugs:
    if not os.path.exists(path):
        t4_details.append(f"{slug}: FILE MISSING")
        continue
    html = open(path).read()
    m = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', html, re.IGNORECASE)
    if not m:
        m = re.search(r'<meta\s+content=["\'](.*?)["\']\s+name=["\']description["\']', html, re.IGNORECASE)
    if m:
        desc = m.group(1)
        length = len(desc)
        status = "PASS" if length <= 160 else "FAIL"
        if status == "FAIL":
            t4_fail = True
        t4_details.append(f"{slug}: {length} chars [{status}] — '{desc[:80]}...'")
    else:
        t4_details.append(f"{slug}: NO META DESCRIPTION")
        t4_fail = True

results["T4"] = {"result": "FAIL" if t4_fail else "PASS", "note": "\n  ".join(t4_details)}
print(f"T4: {results['T4']}")

# ─── T5 — 6 SEO Landing Pages ─────────────────────────────────────────────────
t5_pages = [
    ("restaurant-billing-software", "restaurant billing software", "billing software"),
    ("restaurant-management-software", "restaurant management software", "management software"),
    ("restaurant-pos-comparison", None, None),  # check separately
    ("qsr-pos-system", None, None),
    ("cloud-kitchen-pos", "cloud kitchen", "cloud kitchen"),
    ("petpooja-alternative", "petpooja", "petpooja"),
]
t5_details = []
t5_fail = False

def check_h1_title(html, h1_kws, title_kws):
    h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE | re.DOTALL)
    h1_text = re.sub(r'<[^>]+>', '', h1_match.group(1)).strip().lower() if h1_match else ""
    title_match = re.search(r'<title[^>]*>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
    title_text = re.sub(r'<[^>]+>', '', title_match.group(1)).strip().lower() if title_match else ""
    return h1_text, title_text

for slug, h1_kw, title_kw in t5_pages:
    path = f"{BUILD}/{slug}/index.html"
    if not os.path.exists(path):
        t5_details.append(f"{slug}: FILE MISSING — FAIL")
        t5_fail = True
        continue
    html = open(path).read()
    h1_text, title_text = check_h1_title(html, None, None)

    if slug == "restaurant-pos-comparison":
        h1_ok = "compare" in h1_text or "pos comparison" in h1_text
        title_ok = "compare" in title_text or "pos comparison" in title_text
    elif slug == "qsr-pos-system":
        h1_ok = "qsr" in h1_text or "quick service" in h1_text
        title_ok = "qsr" in title_text or "quick service" in title_text
    else:
        h1_ok = h1_kw.lower() in h1_text
        title_ok = title_kw.lower() in title_text

    status = "PASS" if (h1_ok and title_ok) else "FAIL"
    if status == "FAIL":
        t5_fail = True
    t5_details.append(f"{slug}: {status} | h1='{h1_text[:80]}' | title='{title_text[:80]}' | h1_ok={h1_ok}, title_ok={title_ok}")

results["T5"] = {"result": "FAIL" if t5_fail else "PASS", "note": "; ".join(t5_details)}
print(f"T5: {results['T5']}")

# ─── T6 — Dead Routes bars-and-pubs and hotels (static check) ─────────────────
# Check build dirs
t6_details = []
t6_fail = False

for slug, dir_name in [("bars-and-pubs", "bars-pubs"), ("hotels", "hotels-resorts")]:
    path = f"{BUILD}/solutions/{dir_name}/index.html"
    if os.path.exists(path):
        html = open(path).read()
        h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE | re.DOTALL)
        h1_text = re.sub(r'<[^>]+>', '', h1_match.group(1)).strip() if h1_match else "(no h1)"
        canonical_match = re.search(r'<link\s+rel=["\']canonical["\']\s+href=["\'](.*?)["\']', html, re.IGNORECASE)
        canonical = canonical_match.group(1) if canonical_match else "(none)"
        # Check if it's a 404 page or redirects to homepage
        is_404_page = "not found" in h1_text.lower() or "404" in h1_text.lower()
        t6_details.append(f"solutions/{slug} (build dir: {dir_name}): h1='{h1_text[:80]}', canonical={canonical}, is404page={is_404_page}")
        # If it has actual content (not 404), it might be silently serving real content
        if not is_404_page:
            t6_details.append(f"  WARNING: Has real content, check if URL /solutions/{slug} maps to this directory or to homepage")
    else:
        # Check if there's any redirect config
        t6_details.append(f"solutions/{slug}: build dir not found at expected path")

# Check _redirects file
redirects_path = f"{BUILD}/_redirects"
if os.path.exists(redirects_path):
    redirects = open(redirects_path).read()
    t6_details.append(f"_redirects content:\n{redirects}")
else:
    t6_details.append("No _redirects file found")

results["T6"] = {"result": "WARN", "note": "; ".join(t6_details)}
print(f"T6: {results['T6']}")

# ─── T7 — Canonical Tags ──────────────────────────────────────────────────────
t7_pages = [
    ("homepage", f"{BUILD}/index.html"),
    ("pricing", f"{BUILD}/pricing/index.html"),
    ("demo", f"{BUILD}/demo/index.html"),
    ("solutions/restaurants", f"{BUILD}/solutions/restaurants/index.html"),
    ("solutions/cafes", f"{BUILD}/solutions/cafes/index.html"),
    ("solutions/qsr", f"{BUILD}/solutions/qsr/index.html"),
    ("solutions/cloud-kitchens", f"{BUILD}/solutions/cloud-kitchens/index.html"),
    ("restaurant-billing-software", f"{BUILD}/restaurant-billing-software/index.html"),
    ("restaurant-pos-comparison", f"{BUILD}/restaurant-pos-comparison/index.html"),
    ("petpooja-alternative", f"{BUILD}/petpooja-alternative/index.html"),
    ("blog", f"{BUILD}/blog/index.html"),
    ("product/sell-serve", f"{BUILD}/product/sell-serve/index.html"),
]
t7_details = []
t7_fail = False

for slug, path in t7_pages:
    if not os.path.exists(path):
        t7_details.append(f"{slug}: FILE MISSING")
        continue
    html = open(path).read()
    m = re.search(r'<link\s+rel=["\']canonical["\']\s+href=["\'](.*?)["\']', html, re.IGNORECASE)
    if not m:
        m = re.search(r'<link\s+href=["\'](.*?)["\']\s+rel=["\']canonical["\']', html, re.IGNORECASE)
    if m:
        canon = m.group(1)
        bad = "preview.emergentagent.com" in canon or ("mygenie" not in canon.lower() and "localhost" not in canon.lower())
        if "preview.emergentagent.com" in canon:
            t7_fail = True
            status = "FAIL"
        else:
            status = "PASS"
        t7_details.append(f"{slug}: {status} | canonical='{canon}'")
    else:
        t7_details.append(f"{slug}: NO CANONICAL TAG — FAIL")
        t7_fail = True

results["T7"] = {"result": "FAIL" if t7_fail else "PASS", "note": "; ".join(t7_details)}
print(f"T7: {results['T7']}")

# ─── T8 — Page Title Uniqueness ───────────────────────────────────────────────
t8_pages = list({p: f for p, f in t5_pages[:6] + [(s, f) for s, f in t7_pages]}.items())
# Collect from T5 slugs + T7 paths + homepage
all_title_pages = []
for slug, h1, title in [(s, h, t) for s, h, t in t5_pages]:
    all_title_pages.append((slug, f"{BUILD}/{slug}/index.html"))
for slug, path in t7_pages:
    all_title_pages.append((slug, path))

seen_titles = {}
t8_details = []
t8_fail = False

for slug, path in all_title_pages:
    if not os.path.exists(path):
        continue
    html = open(path).read()
    m = re.search(r'<title[^>]*>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
    title = re.sub(r'<[^>]+>', '', m.group(1)).strip() if m else "(no title)"
    if title in seen_titles:
        t8_details.append(f"DUPLICATE: '{title}' on both '{seen_titles[title]}' and '{slug}'")
        t8_fail = True
    else:
        seen_titles[title] = slug
        t8_details.append(f"{slug}: '{title}'")

results["T8"] = {"result": "FAIL" if t8_fail else "PASS", "note": "; ".join(t8_details)}
print(f"T8: {results['T8']}")

# ─── SUMMARY ──────────────────────────────────────────────────────────────────
print("\n\n" + "="*80)
print(f"ENV: Dev  |  BUILD: {hashes}  |  URL: {BASE_URL}  |  DATE: {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}")
print("="*80)
print(f"{'TEST':<8} {'RESULT':<10} NOTE")
print("-"*80)
for t, v in results.items():
    print(f"{t:<8} {v['result']:<10} {v['note'][:120]}")

print("\n\nDETAILS:")
for t, v in results.items():
    print(f"\n--- {t} ---")
    print(v['note'])
