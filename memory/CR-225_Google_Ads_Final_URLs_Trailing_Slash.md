# CR-225 — Google Ads Alpha Campaign Final URLs Missing Trailing Slash

**Registered:** 2026-09-06
**Source:** Trailing Slash Brief — Google Ads campaign config
**Status:** 🔲 Open — 👤 Owner action (Google Ads console)
**Priority:** P1
**Owner:** Owner — Google Ads console access
**File:** Google Ads → Alpha campaign → 5 ad group final URLs

---

## 1. Problem

Every paid ad click to the 5 landing pages burns a 301 redirect before the page loads.

Google Ads final URLs are currently set without trailing slashes:
```
https://www.mygenie.online/restaurant-billing-software   → 301 → /restaurant-billing-software/
https://www.mygenie.online/restaurant-pos-system         → 301 → /restaurant-pos-system/
https://www.mygenie.online/cloud-kitchen-pos             → 301 → /cloud-kitchen-pos/
https://www.mygenie.online/qsr-pos-system                → 301 → /qsr-pos-system/
https://www.mygenie.online/restaurant-management-software → 301 → /restaurant-management-software/
```

Each click from a paid ad wastes a round-trip redirect (~50–100ms) before the landing page loads. On mobile 4G in India, this is measurable drop in Quality Score and conversion rate.

---

## 2. Fix (Owner — Google Ads Console)

**Wait until CR-223 OR CR-224 is implemented first** — then pick the URL format that matches the server and update all 5 final URLs.

### If CR-224 (nginx fix) is chosen — server stops adding slash:
```
Final URL: https://www.mygenie.online/restaurant-billing-software    (no change needed)
```

### If CR-223 (sitemap fix) is chosen — server keeps slash:
```
Update Final URL to: https://www.mygenie.online/restaurant-billing-software/
```

### Steps in Google Ads:
```
Google Ads → Campaigns → Alpha campaign
→ Ad Groups → open each of the 5 ad groups
→ Ads → Edit each ad
→ Final URL field → update to match chosen format
→ Save
```

---

## 3. Impact

| Metric | Before | After |
|---|---|---|
| Ad click page load | 301 + 200 | 200 directly |
| Speed saving | — | ~50–100ms per paid click |
| Quality Score risk | Low (301 not penalised directly) | Improved (faster landing) |
| Ad spend efficiency | Slight waste per click | Clean |

---

## 4. Related CRs

| CR | Relationship |
|---|---|
| CR-223 | Sitemap fix — Option A. If done: update ads to trailing slash. |
| CR-224 | Nginx fix — Option B. If done: ads need no change. |

---

*Registered 2026-09-06. Source: Trailing Slash Brief.*
*Owner action — update after CR-223 or CR-224 is resolved.*
