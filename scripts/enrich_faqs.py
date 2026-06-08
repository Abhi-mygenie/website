"""Selectively enriches the FIRST FAQ of each sector & product with a video media slot
+ a contextual CTA link. Idempotent-ish: skips a FAQ that already has 'media'."""
import re

SECTORS = {
    "Can multiple waiters serve the same table?": ("Multiple captains serving one table, live", "Build your plan", "/pricing"),
    "Do I need special hardware?": ("MyGenie running on a normal phone", "Build your plan", "/pricing"),
    "Does scan & order need an app?": ("Scan & order from the table — no app", "See Sell & Serve", "/product/sell-serve"),
    "Which aggregators integrate?": ("All aggregator orders in one screen", "See Sell & Serve", "/product/sell-serve"),
    "Can it handle rooms and restaurant together?": ("Rooms + restaurant on one folio", "See Run the Property", "/product/run-property"),
    "Can guests pay across counters with one wallet?": ("One wallet across every counter", "See Bring Customers Back", "/product/customers"),
    "Can it handle prepaid meal balances?": ("Prepaid meal balances in action", "Build your plan", "/pricing"),
    "Can I control menus across outlets?": ("Central menu control across outlets", "Explore Central Inventory", "/product/central-inventory"),
    "Can I manage multiple open tabs?": ("Open, split & merge bar tabs", "Build your plan", "/pricing"),
    "Can I manage advance and custom cake orders?": ("Advance & custom cake orders", "Build your plan", "/pricing"),
    "Can it handle fast counter service?": ("Fast counter billing at peak rush", "Build your plan", "/pricing"),
}

PRODUCTS = {
    "Does billing work offline?": ("Offline billing then auto-sync", "View Pricing", "/pricing"),
    "Can rooms and restaurant share one bill?": ("Rooms + restaurant on a single folio", "For Hotels & Resorts", "/solutions/hotels-resorts"),
    "Do loyalty and coupons work automatically?": ("Loyalty & coupons auto-applied at billing", "View Pricing", "/pricing"),
    "Can MyGenie detect theft?": ("Audit log catching a post-payment void", "For Chains & Franchises", "/solutions/chains"),
    "Can I see all my outlets in one place?": ("Multi-outlet owner dashboard, live", "Explore Central Inventory", "/product/central-inventory"),
    "Is Central Inventory built for franchises and chains?": ("Central stock across every outlet", "For Chains & Franchises", "/solutions/chains"),
}


def enrich(path, mapping):
    src = open(path).read()
    count = 0
    for q, (caption, label, to) in mapping.items():
        # match a single FAQ object: { q: "Q", a: "....." }  (answer has no double quotes)
        pattern = re.compile(r'(\{\s*q:\s*"' + re.escape(q) + r'",\s*a:\s*"[^"]*")(\s*\})')
        m = pattern.search(src)
        if not m:
            print("  !! not found:", q)
            continue
        if "media:" in m.group(0):
            print("  -- already enriched:", q)
            continue
        add = f', media: {{ type: "video", src: null, caption: "{caption}" }}, links: [{{ label: "{label}", to: "{to}" }}]'
        src = src[:m.start()] + m.group(1) + add + m.group(2) + src[m.end():]
        count += 1
    open(path, "w").write(src)
    print(f"{path}: enriched {count} FAQs")


enrich("/app/frontend/src/data/sectors.js", SECTORS)
enrich("/app/frontend/src/data/products.js", PRODUCTS)
