# CR-102 — Resume Blog Publishing — 15-Month Gap Since May 2025

**Type:** Content / SEO Authority  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN — ONGOING  
**Priority:** LOW  
**Plan ID:** L2  
**Effort:** Ongoing (2 posts/month)  
**Improves:** SEO · Authority · E-E-A-T  
**Scope:** `frontend/src/data/blogPosts.json`, `frontend/public/blog/`  
**Related:** CR-88 (blog authors), CR-101 (SSR — posts only indexed by Google after SSR)

---

## 1. Problem Statement

The last blog post was published on **2025-05-23** (slug: `improve-table-turnover-pos-order-management`). As of August 2026, there is a **15-month publishing gap**. 21 existing posts all lack author attribution.

Regular fresh content is one of the strongest signals for Google’s freshness algorithm. A 15-month gap signals an abandoned or unmaintained site.

Additionally, approximately 50% of the target SERP demand is comparison/buyer’s-guide intent (“MyGenie vs Petpooja”, “how to choose restaurant POS”) — content types entirely absent from the current blog.

---

## 2. Priority Content Topics

### Comparison / Buyer’s Guide (highest SEO value)
1. “MyGenie vs Posist — Which POS is better for Indian restaurants?”
2. “MyGenie vs Petpooja — Full feature comparison 2026” (supplements the /petpooja-alternative page)
3. “How to choose the best POS system for your restaurant in India”
4. “Cloud kitchen POS comparison 2026: What to look for”

### India-specific guides (trust + authority)
5. “GST billing for restaurants: everything owners need to know”
6. “How Swiggy and Zomato integration works with a modern POS”
7. “UPI and contactless payments in Indian restaurants: 2026 guide”

### Product-led content (mid-funnel)
8. “How to reduce food waste in your restaurant with POS inventory tracking”
9. “5 signs your restaurant POS is costing you money”
10. “Restaurant WhatsApp marketing: how to bring customers back automatically”

---

## 3. Process

- Add `author` field to new posts (CR-88 must be done first)
- Publish to `blogPosts.json` + add image to `/public/blog/`
- Update sitemap.xml with new post URLs + accurate lastmod
- Target: 2 posts/month minimum
- Revise 5 oldest 2024 posts (October 2024) which may have AI-content markers

---

## 4. Definition of Done (per post)

- [ ] New post in blogPosts.json with: slug, title, heading, description, date, author, authorTitle, image, body
- [ ] Post image in /public/blog/ (WebP format preferred after CR-81)
- [ ] BlogPosting JSON-LD includes author object
- [ ] sitemap.xml updated with new post URL
- [ ] Post visible on /blog listing page

---

*CR-102 registered 2026-08-20. Source: SEO & QS Audit · Plan ID L2. Ongoing content cadence task.*
