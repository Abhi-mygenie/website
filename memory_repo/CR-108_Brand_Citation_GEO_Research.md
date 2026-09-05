# CR-108 — Third-Party Brand Mention & Citation Investigation for GEO

**Type:** GEO / Off-site Authority  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit (GAP-4 — missing from original plan)  
**Status:** OPEN  
**Priority:** LOW  
**Plan ID:** L8 (GAP-4)  
**Effort:** 2 days (research)  
**Improves:** GEO · E-E-A-T · Backlinks  
**Scope:** External research task — no code change  
**Related:** CR-110 (entity disambiguation)

---

## 1. Problem Statement

The audit flagged "third-party brand mention / citation presence unverified" as a GEO finding. For AI answer engines (Perplexity, ChatGPT, Google AI Overview) to cite MyGenie POS, the brand must have verifiable presence on third-party authoritative sites — review platforms, directories, comparison articles.

This was **entirely absent from the original plan** (GAP-4).

---

## 2. Research Tasks

### Task 1 — Review platform audit
Check presence and claim/complete profiles on:
- G2 (`g2.com`) — major B2B software review site
- Capterra (`capterra.com`)
- SoftwareSuggest (`softwaresuggest.com`) — India-focused
- GetApp (`getapp.com`)
- Software Advice (`softwareadvice.com`)

Action per platform:
- If profile exists: claim it, add description, pricing, screenshots, respond to any reviews
- If no profile: create one (free tier sufficient)

### Task 2 — India-specific directories
- Justdial (`justdial.com`) — claim/complete business listing
- IndiaMART (`indiamart.com`) — verify presence
- Sulekha (`sulekha.com`) — check listing
- Tracxn (`tracxn.com`) — verify startup profile

### Task 3 — Comparison article presence
Search Google for: `site:medium.com "MyGenie"`, `site:yourstory.com "MyGenie"`, `"best restaurant POS india" site:blogger.com`

Identify gaps where MyGenie should be mentioned but isn’t. Reach out to authors for inclusion.

### Task 4 — Wikipedia / Wikidata
Check if MyGenie POS has a Wikidata entity. If not, create one with:
- instance of: software / point of sale software
- country: India
- developer: MyGenie Technologies Pvt. Ltd.
- website: mygenie.online

---

## 3. Files Changed

| Location | Action |
|---|---|
| External platforms | Claim/create profiles |
| Wikidata | Create entity |
| No code changes | — |

---

## 4. Definition of Done

- [ ] G2 or Capterra profile claimed and complete with logo, description, pricing, screenshots
- [ ] SoftwareSuggest profile complete (India-specific, highest priority)
- [ ] Wikidata entity created for MyGenie POS
- [ ] Citation map documented: which platforms list MyGenie, which competitor-only lists are gaps
- [ ] Follow-up task: outreach to 3 India restaurant tech bloggers for inclusion in comparison articles

---

*CR-108 registered 2026-08-20. Source: SEO & QS Audit (GAP-4) · Plan ID L8. Off-site research task.*
