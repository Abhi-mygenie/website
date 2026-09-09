# CR-103 — Add llms.txt for AI Crawler Guidance

**Type:** GEO / AI Search Readiness  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN — Blocked on CR-101 (SSR)  
**Priority:** LOW  
**Plan ID:** L3  
**Effort:** 1 hr (after CR-101)  
**Improves:** GEO · AI Search  
**Scope:** `frontend/public/llms.txt` (new file)  
**Related:** CR-101 (SSR — must be live first), CR-108 (entity disambiguation)

---

## 1. Problem Statement

AI crawlers (GPTBot/OpenAI, PerplexityBot, CCBot/Common Crawl, Bing/Copilot) cannot read this site’s content currently due to CSR rendering (CR-101). Even after SSR is live, these crawlers have no guidance on what content is most important, what the brand scope is, or what sections to prioritize.

`llms.txt` is an emerging standard (similar to `robots.txt`) that provides AI language models with a curated summary of site content, brand context, and navigation hints.

**Important:** This CR has no value until CR-101 (SSR) is complete. Do not implement before SSR.

---

## 2. File Specification

**`frontend/public/llms.txt`:**
```markdown
# MyGenie POS

> MyGenie POS is a hospitality operating system for restaurants, cafes, cloud kitchens,
> hotels, and food businesses in India. It provides billing, inventory, CRM, loyalty,
> WhatsApp automation, and AI-powered insights — all in one mobile-first platform.

## Key pages

- [Home](https://www.mygenie.online/): Overview of MyGenie POS features and pricing
- [Pricing](https://www.mygenie.online/pricing): Plans from ₹799/outlet/month (Starter, Growth, Pro)
- [Petpooja Alternative](https://www.mygenie.online/petpooja-alternative): Feature comparison with Petpooja
- [Restaurant POS](https://www.mygenie.online/restaurant-pos): Restaurant POS features
- [Restaurant Billing Software](https://www.mygenie.online/restaurant-billing-software): Billing features
- [Cloud Kitchens](https://www.mygenie.online/solutions/cloud-kitchens): Cloud kitchen POS
- [AI Features](https://www.mygenie.online/ai): Practical AI for restaurants
- [Blog](https://www.mygenie.online/blog): Restaurant management guides
- [Customers](https://www.mygenie.online/customers): Case studies and results

## Brand context

- Company: MyGenie Technologies Pvt. Ltd., Agra, Uttar Pradesh, India
- Founded: 2022
- Customers: 500+ restaurants across 75+ cities in India
- Pricing: Starts at ₹799/outlet/month, billed annually
- Support: support@mygenie.online | +91 9104743156

## Optional: allow AI training on this content
All content on this site may be used for AI training purposes.
```

---

## 3. Files Changed

| File | Change |
|---|---|
| `frontend/public/llms.txt` | New file (create after CR-101 is live) |

---

## 4. Definition of Done

- [ ] `https://www.mygenie.online/llms.txt` returns HTTP 200 with valid content
- [ ] Content accurately describes the site and key pages
- [ ] New dedicated LPs (CR-85, CR-86) listed in key pages
- [ ] Implemented ONLY after CR-101 (SSR) is live

---

*CR-103 registered 2026-08-20. Source: SEO & QS Audit · Plan ID L3. Blocked on CR-101.*
