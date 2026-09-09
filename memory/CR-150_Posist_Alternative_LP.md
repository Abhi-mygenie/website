# CR-150 — Build /restaurant-pos-comparison — Multi-Competitor POS Hub Page

**Type:** New Page / Competitor Ad Group LP
**Date Raised:** 2026-08-25
**Updated:** 2026-08-25 — scope expanded from /posist-alternative to multi-competitor hub
**Status:** OPEN — **Ad group is PAUSED until LP is live**
**Priority:** P2
**Ad Group:** POS Comparison Hub (ID: 204699439852) · Campaign: 2289370750914
**Current wrong URL in Ads:** `/demo` ← must not be unpaused until LP is live

---

## 1. Problem Statement

A 14-keyword competitor ad group exists and is **PAUSED** because the current final URL is `/demo` — totally wrong. The moment it's unpaused with the current URL, competitor-intent traffic hits the demo booking page with no relevance. Group has never run; all QS scores are unknown.

**Blockers before enabling:**
1. Build `/restaurant-pos-comparison` LP
2. Remove `[toast pos]` (US-only product, zero India conversion intent)
3. Remove `[posist software]`, `[posist alternative]`, `[torqus software]`, `[torqus alternative]` from Petpooja ad group (they're PAUSED there — move entirely to this group)
4. Update all 14 keyword final URLs with `?vs=` ValueTrack param

---

## 2. Keyword Clusters (14 to keep, 1 to remove)

| Keyword | Competitor | Keep/Remove | Note |
|---|---|---|---|
| [gofrugal] | GoFrugal | ✅ KEEP | Retail-first POS, high India name recognition |
| [billberry] | Billberry | ✅ KEEP | Direct restaurant POS competitor |
| [posist software] | Posist/Restroworks | ✅ KEEP | Also paused in Petpooja group — move here |
| [posist alternative] | Posist/Restroworks | ✅ KEEP | Also paused in Petpooja group — move here |
| [restroworks] | Restroworks | ✅ KEEP | Posist rebranded 2023 — both names needed |
| [ezee pos] | EzeeIt | ✅ KEEP | EzeeIt product |
| [ezee technosys] | EzeeIt | ✅ KEEP | Parent company name |
| [ezee optimus] | EzeeIt | ✅ KEEP | EzeeIt product |
| [ezo software] | EZO | ✅ KEEP | Monitor — may be asset mgmt, not POS |
| [posify] | Posify | ✅ KEEP | Direct Indian restaurant POS competitor |
| [dotpe] | DotPe | ✅ KEEP | Monitor — ordering-first audience |
| [torqus software] | Torqus | ✅ KEEP | Also paused in Petpooja group — move here |
| [torqus alternative] | Torqus | ✅ KEEP | Also paused in Petpooja group — move here |
| [urbanpiper] | UrbanPiper | ✅ KEEP | Monitor — aggregator middleware, adjacent audience |
| [toast pos] | Toast POS | ❌ REMOVE | US-only product — zero India conversion intent |

---

## 3. Page Specification

### SEO
| Field | Value |
|---|---|
| **URL** | `/restaurant-pos-comparison` |
| **Meta Title** | `Mygenie vs GoFrugal, Posist, Billberry & More \| Best Restaurant POS India` |
| **Meta Description** | `Honest feature and pricing comparison: Mygenie vs top Indian restaurant POS systems. See why restaurants switch. Book a free 20-min demo.` |
| **H1 (dynamic)** | `Looking for a [Competitor] alternative?` (default: "Looking for a better restaurant POS?") |
| **Canonical** | `https://www.mygenie.online/restaurant-pos-comparison` |

### Dynamic Personalisation — `?vs=` URL param
Each keyword gets a final URL with `?vs=CompetitorName` appended. JavaScript reads the param and swaps the competitor name into:
- Hero H1 token `[Competitor]`
- Hero subheadline: "Mygenie vs [Competitor] — honest feature and pricing comparison."
- Per-competitor accordion expands to that competitor by default

```js
const vs = new URLSearchParams(location.search).get('vs');
// If vs exists → replace [Competitor] token in H1 + title with vs value
// If no vs → show generic: "a better restaurant POS"
```

**Example final URLs per keyword:**
- `[gofrugal]` → `/restaurant-pos-comparison?vs=GoFrugal`
- `[posist software]` → `/restaurant-pos-comparison?vs=Posist`
- `[restroworks]` → `/restaurant-pos-comparison?vs=Restroworks`
- `[billberry]` → `/restaurant-pos-comparison?vs=Billberry`
- `[ezee pos]` → `/restaurant-pos-comparison?vs=EzeePOS`

One page. Personalised experience per competitor. QS stays high because headline matches search intent.

---

## 4. Page Structure (7 sections)

### Section 1 — Hero (above fold)
Dynamic H1: `Looking for a [Competitor] alternative?`
Subheadline: `Mygenie vs [Competitor] — honest feature and pricing comparison.`
CTA: `Book a Free Demo`

### Section 2 — Why restaurants switch (trust)
3–4 reasons restaurants leave competitors — from real Capterra/G2/Play Store reviews.
Generic but true: "Clunky UI requiring training" · "Support goes silent after onboarding" · "Pricing jumps on renewal"
Do NOT fabricate — use only verifiable pain points.

### Section 3 — Feature comparison table (core section)
Sticky-header table:
- **Rows:** Billing, KDS, Cloud Sync, Inventory, CRM, Online Orders (Swiggy/Zomato), Multi-outlet, Mobile App, Offline Mode, Support SLA, India pricing
- **Columns:** Mygenie + top 6 competitors (GoFrugal, Billberry, Posist/Restroworks, EzeePOS, Posify, DotPe)
- Values: ✓ / ✗ / "Partial"
- Mygenie column highlighted
- Do NOT include all 14 competitors in the table — pick the 6 most searched

### Section 4 — Per-competitor accordion (SEO + depth)
One collapsible section per competitor. Each expands to:
- 2–3 sentence overview of the competitor
- "Where Mygenie wins" — 3 bullets
- "Where [Competitor] may suit you better" — 1 honest bullet (builds trust)
- Pricing comparison row if public data is available

SEO benefit: each section is indexable content for "[competitor] alternative" queries.
If `?vs=GoFrugal` is in the URL, GoFrugal accordion opens by default.

**Competitors to include in accordions (6 featured):**
GoFrugal · Billberry · Posist / Restroworks · EzeePOS / Ezee Technosys · Posify · DotPe

**Remaining 4 (lighter treatment — single-line mention):**
EZO · Torqus (legacy) · UrbanPiper (not a POS) · Toast POS (US-only, not in table)

### Section 5 — India pricing callout (conversion)
Transparent pricing: "Starting at ₹X/month. No hidden fees. No per-outlet markup."
Only include competitor pricing where public data is available — never fabricate.

### Section 6 — Social proof — switchers (trust)
2–3 testimonials from restaurants that switched from a named competitor.
Format: "We were on [Competitor] for 2 years. Migration took 1 day." — [Name, Restaurant, City]
If no competitor-specific quotes, filter existing testimonials to restaurants mentioning "switching" or "before Mygenie."

### Section 7 — CTA — book demo (conversion)
Full-width. "See Mygenie in 20 minutes. No commitment."
Light demo form: name, phone, restaurant type. No outlet count or POS detail at this stage.

---

## 5. RSA Copy (one RSA for the group)

### Headlines (15 max)
| Headline | Pin |
|---|---|
| Mygenie vs {Competitor: GoFrugal} | Pin 1 (dynamic) |
| Switch From {Competitor: Posist} Today | Pin 1 alt (dynamic) |
| Best Restaurant POS in India | Pin 2 |
| ₹ Better Pricing Than Competitors | Pin 3 |
| Free Migration From Any POS | Rotate |
| Billing + KDS + Inventory — One App | Rotate |
| Trusted by 5,000+ Indian Restaurants | Rotate |
| Works Offline. No Data Loss. | Rotate |
| Compare Mygenie vs Top POS Systems | Rotate |
| See Why Restaurants Switch to Mygenie | Rotate |
| 20-Min Demo. No Commitment. | Rotate |
| Cloud POS for Indian Restaurants | Rotate |

### Descriptions (2)
1. "Mygenie POS — Free comparison vs GoFrugal, Posist & more. Book demo."
2. "Switching restaurant POS? See how Mygenie compares on features, price & support."

**Note:** Use Ad Customizers / {=KeywordInsertion()} for keyword-level headline personalisation if needed without separate ad groups.

---

## 6. Files to Create/Change

| File | Change |
|---|---|
| `frontend/src/pages/RestaurantPosComparison.jsx` | New page with `?vs=` param reading logic |
| `frontend/src/App.js` | Add lazy import + route `/restaurant-pos-comparison` |
| `frontend/public/sitemap.xml` | Add URL entry (priority 0.8) |

---

## 7. Google Ads Ordered Action Items (before enabling group)

| Step | Owner | Action |
|---|---|---|
| 1 | **DEV** | Build `/restaurant-pos-comparison` LP with feature matrix, competitor accordions, ?vs= personalisation |
| 2 | **ADS** | Remove [toast pos] from the group |
| 3 | **ADS** | Remove [posist software], [posist alternative], [torqus software], [torqus alternative] from Petpooja ad group (190599557224) — they're PAUSED there, this group is the right home |
| 4 | **ADS** | Update each keyword's final URL → `mygenie.online/restaurant-pos-comparison?vs=[CompetitorName]` (set at keyword level) |
| 5 | **ADS** | Write + upload RSA using headlines above. Use keyword insertion in Pin 1 for dynamic competitor name |
| 6 | **ADS** | Unpause POS Comparison Hub ad group once LP is live + URL is updated. Start ₹300–500/day budget |
| 7 | **ADS** | After 30 days: review [ezo software], [urbanpiper], [dotpe] individually. If conversion rate <1%, pause + remove |
| 8 | **ADS** | Add negative keywords: [gofrugal login], [billberry login], [dotpe merchant login], [urbanpiper login] — existing-customer intent, not switcher intent |

---

## 8. Definition of Done

- [ ] `/restaurant-pos-comparison` renders on desktop + mobile
- [ ] H1 dynamically swaps competitor name from `?vs=` param; fallback works when no param
- [ ] Feature comparison table has Mygenie + 6 competitors, all 11 feature rows
- [ ] Per-competitor accordions for all 6 featured competitors
- [ ] [toast pos] removed from ad group
- [ ] [posist software], [posist alternative], [torqus software], [torqus alternative] removed from Petpooja group
- [ ] All 14 keyword final URLs updated with `?vs=CompetitorName`
- [ ] RSA uploaded and ad group unpaused
- [ ] LandingNavbar (no global nav)
- [ ] FAQPage JSON-LD valid
- [ ] URL in sitemap + prerendered

---

*CR-150 registered 2026-08-25. Scope: originally /posist-alternative → expanded to full multi-competitor hub /restaurant-pos-comparison covering GoFrugal, Billberry, Posist/Restroworks, EzeeIT, Posify, DotPe, Torqus, UrbanPiper. Source: Live Google Ads account brief.*
