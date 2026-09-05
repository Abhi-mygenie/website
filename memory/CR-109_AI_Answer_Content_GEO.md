# CR-109 — Create Structured Answer-Style Content for AI Crawlers (GEO)

**Type:** GEO / AI Search Readiness / Content  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit (GAP-6 — missing from original plan)  
**Status:** OPEN — Blocked on CR-101 (SSR)  
**Priority:** LOW  
**Plan ID:** L9 (GAP-6)  
**Effort:** Ongoing (after CR-101)  
**Improves:** GEO · AI Search  
**Scope:** `frontend/src/pages/Resources.jsx`, `frontend/src/data/sectors.js`, new blog posts  
**Related:** CR-101 (SSR — must be live first), CR-103 (llms.txt)

---

## 1. Problem Statement

The audit found **"No structured, extractable answer-style content"** as a High severity GEO finding. AI answer engines (Perplexity, ChatGPT, Google AI Overview) extract and synthesize answers from structured, explicit Q&A content. The current site has FAQ sections but no definition blocks, numbered step sections, or comparison tables in a format optimized for AI extraction.

This was **missing from the original plan** (GAP-6). Not actionable until SSR (CR-101) is live.

---

## 2. Content Changes Required

### Type 1 — Definition blocks ("What is...") — Add to /resources page
```
What is a restaurant POS system?
A restaurant POS (Point of Sale) system is software that handles billing, order management, kitchen synchronization, inventory tracking, and customer data for restaurants. Modern cloud-based POS systems like MyGenie run on any mobile device and provide real-time dashboards accessible from anywhere.
```

### Type 2 — Numbered step content — Add to blog posts
Example: “5 steps to reduce food waste using POS inventory tracking” — use `<ol>` structured markup.

### Type 3 — Comparison tables — Add to blog and /petpooja-alternative
Explicit feature comparison tables already exist on /petpooja-alternative. Expand to blog posts.

### Type 4 — Stat blocks with attribution
```
“Restaurant owners using MyGenie report up to 25% profit improvement, based on partner results (Palm Forest Resort, Love Bites, La Fetta Pizzeria, 2025).”
```
Attributed stats are more likely to be cited by AI engines than anonymous claims.

### Implementation
- `/resources` page: Add 10 definition blocks in Q&A format
- New blog posts (CR-102): Write in Q&A format with explicit headings
- Sector pages: Add a “Frequently asked questions” block with longer, more detailed answers than current FAQs

---

## 3. Files Changed

| File | Change |
|---|---|
| `frontend/src/pages/Resources.jsx` | Add definition blocks + expanded Q&A content |
| `frontend/src/data/sectors.js` | Expand FAQ answers to 2–3 sentences with specifics |
| New blog posts (CR-102) | Write in structured Q&A format |

---

## 4. Definition of Done

- [ ] /resources page has 10 definition-style Q&A blocks
- [ ] At least 3 new blog posts written with numbered step format
- [ ] FAQ answers on cloud-kitchens and sell-serve are 2+ sentences with India-specific detail
- [ ] Perplexity or ChatGPT cites MyGenie in response to “best restaurant POS India” (verify after 60 days)

**Note:** Dependent on CR-101 (SSR) being live. No point adding content if AI crawlers can’t read it.

---

*CR-109 registered 2026-08-20. Source: SEO & QS Audit (GAP-6) · Plan ID L9. Blocked on CR-101.*
