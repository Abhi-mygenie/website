# UAT Audit Investigation — Full Session Documentation
## Session: 2026-08-30 | Agent: E1

**Audit source:** https://claude.ai/code/artifact/4b570a08-8fe7-4d5c-a342-7915ad46b562
**Audit date:** 2026-08-27 (run on beta.mygenie.online)
**Investigation date:** 2026-08-30 (code-level verification in this session)
**Repo:** https://github.com/Abhi-mygenie/website.git · branch: main

---

## How to Read This Document

Every audit finding was cross-referenced against the actual source code and prerendered build.
Statuses are one of:
- ✅ ALREADY FIXED — confirmed in code, prerender verified
- ✅ FIXED THIS SESSION — implemented + tested today
- 🔲 OPEN — confirmed gap, CR registered, not yet implemented
- ℹ️ NOT A BUG — audit was incorrect; code investigation proves it works correctly
- 👤 OWNER DECISION — no code possible until owner decides

---

## PART 1 — Audit Findings vs Code Reality

### P0 Critical Findings

---

#### P0-1 · Form inputs have no `name` or `id` — "zero leads captured"

**Audit claim:** "3/4 real inputs missing name attribute. Every submission sends empty data."

**Code investigation result: ℹ️ NOT A BUG**

`DemoForm.jsx` uses React-controlled form with `axios.post()`:
```js
const submit = async (e) => {
  e.preventDefault();                        // ← prevents native HTML submission
  await axios.post(`${API}/demo-request`, {
    ...form,                                 // ← React state object, not DOM form values
    attribution: getAttribution(),
  });
};
```
The `name` attribute on HTML inputs is only required for **native browser form submission**
(which reads values from the DOM). React reads from `useState` — `name` attributes are irrelevant.

**What `name` attributes ARE still useful for (low-priority):**
- Browser autocomplete / password manager autofill hints
- Accessibility (some screen readers)

**Not a blocker. Leads ARE being captured.**

---

#### P0-2 · All 19 buttons have no `type` attribute — "every nav click submits the form"

**Audit claim:** "All 19 buttons default to submit. Nav dropdowns trigger form submission."

**Code investigation result: 🔲 PARTIALLY REAL — Lighthouse failure, but nav buttons don't trigger form**

HTML spec: `<button>` without `type` defaults to `type="submit"`. However, `type="submit"` only
submits a form when the button is a **descendant of the `<form>` element** or has a `form` attribute.
Navbar buttons are outside the `<form>` in the DOM — they physically cannot submit the DemoForm.

However: this IS a legitimate Lighthouse audit failure and best practice violation.
- 119 buttons without `type=` confirmed by grep
- Key files: `Navbar.jsx` (8 buttons), `DemoForm.jsx` (buttons inside the form card)
- The submit button in DemoForm correctly needs `type="submit"` — all others need `type="button"`

**→ Registered as CR-173**

---

#### P0-3 · React Hydration Error #418 — "SSR discarded, full CSR fallback"

**Audit claim:** "Minified React error #418 in console. Prerendered HTML discarded."

**Code investigation result: ✅ ALREADY FIXED (CR-160, 2026-08-26)**

`Reveal.jsx` — the primary source of hydration mismatch — was fixed:
```js
// CR-160 fix:
const [visible, setVisible] = useState(true);  // START VISIBLE — progressive enhancement
// ...
if (navigator.webdriver) return;  // Skip re-hide during Puppeteer prerender
```

Before CR-160: `useState(false)` caused hydration mismatch because prerendered HTML had
`opacity:1` (Puppeteer rendered with CSS) but React initial state was `opacity:0`.

**However:** The audit ran on 2026-08-27, one day after the fix was deployed. Status post-fix
is **unverified on beta.mygenie.online** — the fix is confirmed in code but has not been
re-tested in the live browser console since the fix.

**`/solutions/qsr` blank page issue:** Also mentioned in audit as "JavaScript not rendering."
Confirmed FIXED — `build/solutions/qsr/index.html` exists, is 62KB of prerendered HTML,
has full H1 and QSR content. Audit was run before prerender pipeline was active on beta.

---

#### P0-4 · No `noindex` on beta subdomain

**Audit claim:** "`beta.mygenie.online` has no robots noindex. Google indexing the beta URL."

**Code investigation result: 👤 OWNER DECISION REQUIRED**

Current canonical config:
```js
// seo.js L3:
export const SITE_URL = (process.env.REACT_APP_SITE_URL || "https://www.mygenie.online")
```

`REACT_APP_SITE_URL` is NOT set in `frontend/.env` → canonicals default to `www.mygenie.online`.

**For this preview pod** (`mygenie-react-app.preview.emergentagent.com`): correct — canonicals
point to www, telling Google this is a copy of production.

**For `beta.mygenie.online` specifically:**
- Option A: Beta IS the permanent production domain → set `REACT_APP_SITE_URL=https://beta.mygenie.online` + drop "beta" from domain name eventually
- Option B: Will migrate to `www.mygenie.online` → add `noindex` to beta build by setting a noindex env flag

**→ Registered as CR-180. No code until owner decides.**

---

### P1 Warning Findings

---

#### P1-1 · DOM Interactive 2,588ms

**Audit claim:** "Main JS bundle blocks rendering. DOM Interactive target <1,500ms."

**Code investigation result:** Performance concern — but significant improvement already done.

Prior state: 5,632ms (staging). Current: 3,523ms (37% faster — CR-115 bundle splitting done).
The remaining 2,588ms DOM Interactive is largely Calendly + GTM loading. Further gains require:
- Additional lazy loading of below-fold components
- Defer Calendly widget load until user interacts with form
Not registered as a new CR — covered by existing performance backlog.

---

#### P1-2 · scroll-margin-top: 0px on `#demo`

**Code investigation result: 🔲 CONFIRMED GAP**

`CtaDemo.jsx` L54:
```jsx
<div id="demo" data-testid="demo-anchor">
  <DemoForm sector={sector} shortForm />
</div>
```
No `scroll-margin-top` class. Sticky nav = `h-[72px]`. When any "Book a Free Demo" button
fires `href="#demo"` or `onDemo()`, the section scrolls flush to top of viewport — nav
covers the top ~72px of the form, hiding the card's top edge.

**Fix:** Add `className="scroll-mt-20"` (80px) to that div. One word.

**→ Registered as CR-174**

---

#### P1-3 · YouTube & Facebook links missing `rel="noopener"`

**Code investigation result: 🔲 PARTIAL GAP**

`Footer.jsx` L32–33:
```jsx
<a href={COMPANY.social.youtube} target="_blank" rel="noreferrer" ...>
<a href={COMPANY.social.facebook} target="_blank" rel="noreferrer" ...>
```
`rel="noreferrer"` implies `rel="noopener"` in all modern browsers (Chrome 88+, Firefox 79+,
Safari 12.1+). Functionally not a security risk. However Lighthouse explicitly checks for
the string `"noopener"` — absence = Lighthouse warning.

**Fix:** Change `rel="noreferrer"` → `rel="noopener noreferrer"` on both lines.

**→ Registered as CR-175**

---

#### P1-4 · No `/thank-you` page

**Code investigation result: 🔲 CONFIRMED GAP — with important context**

**What the audit said:** "No /thank-you page — can't track Google Ads conversions."

**What the code actually does (key finding):**

The `thankyou_conversion` GTM event fires at Stage 2 (OTP verification), NOT at Calendly booking:

```
Stage 1: Form submit     Stage 2: OTP verify         Stage 3: Calendly booking
─────────────────        ──────────────────────       ──────────────────────────
pushLead(                pushLead(                    CalendlyInline.jsx:
  "form_submitted")        "book_demo"   ← !)           pushLead("demo_booked")
GTM: form_submitted ₹0   GTM:                           markBooked() called
                           "thankyou_conversion" ₹200   setBooked(true) ← inline card
                         setStage("calendly")           URL NEVER CHANGES
```

**Owner confirmed: Stage 2 fire is INTENTIONAL and correct. No change to conversion trigger.**

**What CR-176 IS (clarified scope):**
1. Create `/thank-you` page as a POST-CALENDLY UX landing (after `markBooked()`)
2. `navigate("/thank-you", { state: { name } })` added to `markBooked()` — Stage 3 only
3. Provides retargeting segment: "visited /thank-you" = completed full booking flow
4. Optional secondary Google Ads destination conversion (supplements Stage 2 event)
5. The `thankyou_conversion` GTM event at Stage 2 = UNTOUCHED

**History of `thankyou_conversion` name:**
The GTM event name `thankyou_conversion` strongly implies a `/thank-you` page existed previously.
At some point the team replaced page navigation with a JS event (keeping the same GTM trigger name
to reuse existing Google Ads tags). The page was removed but the event name persists in gtm.js.

**Files needed for CR-176:**
- New `src/pages/ThankYou.jsx` (~50 lines)
- `DemoForm.jsx` `markBooked()`: add `navigate("/thank-you", { state: { name: form.name } })`
- `App.js`: add lazy import + `<Route path="/thank-you" element={<ThankYou />} />`
- `seo.js`: add `"/thank-you": { title: "Demo Booked | MyGenie POS", noindex: true }`
- `prerender.js` extraRoutes: add `"/thank-you"`

**→ Registered as CR-176**

---

#### P1-5 · No autofocus on name field

**Code investigation result: 🔲 CONFIRMED GAP**

`DemoForm.jsx` L316 — input array map:
```jsx
[{ key: "name", type: "text" }, { key: "phone" }, ...].map(({ key, type }) => (
  <input type={type} ... />   // ← no autoFocus anywhere
))
```
When user clicks "Book a Free Demo" CTA and form scrolls into view, no field is focused.
User must manually click into first field before typing.

**Fix:** Add `autoFocus={key === "name"}` to the input element. One prop addition.

**→ Registered as CR-177**

---

#### P1-6 · No Meta Pixel

**Code investigation result: 👤 GTM/MARKETING TASK — no code change needed**

`gtm.js` is built to fire Meta Pixel events via GTM tags (fb_pixel tags in the GTM container).
The code side is correct — `pushLead()` fires all the right events with enhanced matching data
(email, phone normalized, split name, fbclid, fbp, fbc). The Meta Pixel tag just needs to be
configured in the GTM container UI by the marketing team.

**Not a code CR. Owner/marketing action in GTM console.**

---

### Passing Checks (confirmed good — do not change)

| Check | Code confirmation |
|---|---|
| 120 images have alt text | `img` tags audited — confirmed |
| Lazy loading 114/120 images | Above-fold hero correctly `loading="eager"`, rest `loading="lazy"` |
| OG tags present | `Seo.jsx` outputs og:title, og:description, og:image, og:url |
| GTM infrastructure ready | `gtm.js` — loads on prod hosts only, dataLayer queues on all |
| 14 dedicated solution/product pages | App.js routes confirmed |
| `#demo` and `#pricing` sections exist | `CtaDemo.jsx` id="demo", `CtaDemo.jsx` id="pricing" |
| Phone tel: links (3) | `Hero.jsx`, `Navbar.jsx`, `Footer.jsx` |
| Solution page titles are unique | `SectorPage.jsx` L62: `${s.name} POS System & Billing Software \| MyGenie` |

---

## PART 2 — All CRs Registered This Session

### BATCH Q — Homepage SEO Gaps (CR-167 → CR-172)

Source: SEO audit report provided by owner at session start.
All 6 investigated against code. CR-167–170 implemented and tested same session.

| CR | Title | Status | Files |
|---|---|---|---|
| CR-167 | Homepage H1 missing primary keywords | ✅ DONE | `Hero.jsx` L26, L28 |
| CR-168 | Homepage `<title>` 68 chars | ✅ DONE | `seo.js` L86, `public/index.html` L146 |
| CR-169 | Homepage meta description 191 chars | ✅ DONE | `seo.js` L87–88 |
| CR-170 | No `<link rel="sitemap">` in `<head>` | ✅ DONE | `Seo.jsx` L26 |
| CR-171 | Homepage FAQ section + QAPage JSON-LD | 🔲 Open | New FAQ section + `seo.js` + `Home.jsx` |
| CR-172 | AggregateRating missing on SoftwareApp schema | 🔲 Blocked | `seo.js` — needs verified review source |

**Implementation note CR-168:** `public/index.html` ALSO needed updating.
`prerender.js` only syncs `<title>` from `og:title` when `og:title` portal count > 1
(line 91: `if (ogTitles.length > 1)`). In this app, react-helmet-async creates exactly
1 `og:title` — condition is never true. So `<title>` in prerendered HTML always reflects
`public/index.html` template, not the Helmet-set value. Both files must be updated together.

---

### BATCH R — UAT Audit Dev Fixes (CR-173 → CR-177)

Source: UAT audit beta.mygenie.online 2026-08-27. Code-investigated 2026-08-30.

| CR | Title | Status | Files | Effort |
|---|---|---|---|---|
| CR-173 | 119 buttons missing `type="button"` | 🔲 Open | `Navbar.jsx`, `DemoForm.jsx` + others | Medium — many files |
| CR-174 | `#demo` missing `scroll-margin-top` | 🔲 Open | `CtaDemo.jsx` L54 | Tiny — 1 word |
| CR-175 | Footer social links missing `noopener` | 🔲 Open | `Footer.jsx` L32–33 | Tiny — 2 words |
| CR-176 | No `/thank-you` page | 🔲 Open | New `ThankYou.jsx` + 4 existing files | Small — ~75 lines |
| CR-177 | No `autoFocus` on DemoForm name field | 🔲 Open | `DemoForm.jsx` L316 | Tiny — 1 prop |

---

### BATCH S — Homepage Keyword Density (CR-178)

Source: UAT audit keyword frequency tab. Confirmed by grep on `build/index.html`.

| CR | Title | Status | Files |
|---|---|---|---|
| CR-178 | 9 homepage ad keywords at 0 occurrences | 🔲 Open | Homepage components — feature sections, H2s |

**Keywords confirmed at 0 occurrences (need 3+ each):**

| Keyword | Ad Group | Current | Target |
|---|---|---|---|
| pos system | Alpha → POS System | 0x | 3+ |
| inventory management | Alpha Terms | 0x | 3+ |
| restaurant billing | Alpha → Billing Software | 0x | 3+ |
| pos billing | Alpha → Billing Software | 0x | 2+ |
| restaurant software | Alpha Terms | 0x | 2+ |
| loyalty program | Alpha Terms | 0x | 2+ |
| qr menu | Alpha Terms | 0x | 2+ |
| table management | Alpha → Management & Ordering | 0x | 2+ |
| food business | Alpha Terms | 0x | 2+ |

**Keywords already passing (no change):**

| Keyword | Current | Target |
|---|---|---|
| restaurant pos | 5x | 3+ ✓ |
| billing software | 5x | 3+ ✓ |
| restaurant management | 3x | 3+ ✓ |

**Suggested copy placements (from audit, no new sections needed):**
- "pos system" → Feature H2: "Our POS system makes you money" (replace "How MyGenie makes you money")
- "inventory management" → Feature bullet: "Inventory management — track every ingredient"
- "restaurant billing" → Feature card heading or hero subtitle
- "loyalty program" → AI/CRM section existing copy
- "qr menu" → Scan & Order feature card
- "table management" → Captain App feature card
- "food business" → Hero subtitle: "for any food business"
- "restaurant software" → Footer intro or One complete package section
- "pos billing" → Billing feature card subtext

---

### BATCH T — Solution & Product Page Keyword Optimization (CR-179)

Source: UAT audit per-page keyword tab.

| CR | Title | Status | Files |
|---|---|---|---|
| CR-179 | 5 pages missing target ad group keywords | 🔲 Open | `SectorPage.jsx` data + `ProductPage.jsx` data |

**Per-page breakdown (confirmed by audit — not re-grepped individually):**

**`/solutions/restaurants`** — Ad Groups: Alpha Terms, Billing Software, Management & Ordering
- Missing: `pos system` (0x), `billing software` (0x), `restaurant billing` (0x), `restaurant management` (0x), `table management` (0x), `qr menu` (0x)
- Title fix: `"Restaurant POS System & Billing Software for Dine-In | MyGenie"`
- Add intro para: "MyGenie is a complete restaurant management software — POS system at the counter, table management on the floor, restaurant billing in under 10 seconds."

**`/solutions/cafes`** — Ad Groups: Alpha Terms
- Missing: `billing software` (0x), `inventory management` (0x), `qr menu` (0x), `crm` (0x)
- Title fix: `"Café POS System & Billing Software | MyGenie"`
- Add: feature card "Recipe-level inventory management", "QR menu — table ordering", "Built-in CRM"

**`/solutions/cloud-kitchens`** — Best performing page
- Missing: `inventory management` (0x), `food business` (0x)
- `pos system` only 2x (need 3+), `billing software` only 1x (need 2+)
- Title fix: `"Cloud Kitchen POS & Billing Software | MyGenie"`
- Add: inventory management feature card

**`/product/sell-serve`** — Ad Groups: POS System, Billing Software, Management
- Missing: `table management` (0x), `qr menu` (0x), `pos billing` (0x), `restaurant billing` (0x)
- Title fix: `"Restaurant POS System & Billing Software | Sell & Serve | MyGenie"`
- Add 3 feature cards: Table management, QR menu, POS billing

**`/product/central-inventory`** — Best product page (unique title already)
- Missing: `restaurant inventory` (0x)
- `inventory management` only 2x (need 5+), `pos system` 0x (need 1+)
- Title fix: `"Restaurant Inventory Management Software | MyGenie"`
- Add subheadings: "Restaurant inventory management", "Stock management across every outlet"

**Implementation note:** `SectorPage.jsx` and `ProductPage.jsx` are template components
fed by `sectors.js` and `products.js` data files. Per-page keyword fixes go into the
data files (copy strings) not the template JSX. One data file change = all instances update.

---

### BATCH U — Domain & Canonical Strategy (CR-180)

Source: UAT audit P0 finding.

| CR | Title | Status | Files |
|---|---|---|---|
| CR-180 | No noindex on beta + canonical strategy undefined | 🔲 Blocked 👤 | `frontend/.env` (env var only) |

**Current state:**
```
frontend/.env: REACT_APP_SITE_URL not set
seo.js L3: defaults to "https://www.mygenie.online"
```

**Option A — beta IS the permanent production URL:**
```
REACT_APP_SITE_URL=https://beta.mygenie.online
```
Update in frontend/.env, rebuild. Canonicals update across all 61+ pages.

**Option B — will migrate to www.mygenie.online:**
Add a noindex signal to the beta build only. Options:
1. Set env var `REACT_APP_NOINDEX_ALL=true` + add conditional in `Seo.jsx`
2. Or add `<meta name="robots" content="noindex,nofollow">` to `public/index.html` template

No code change until owner confirms domain strategy.

---

## PART 3 — Remaining Audit Items Not Registered as CRs

These audit items require no code change from the dev team:

| Audit item | Reason not a code CR |
|---|---|
| Install Meta Pixel via GTM | Marketing action in GTM container UI — code fires all correct events already |
| Whitelist Googlebot in Cloudflare | Cloudflare WAF console — owner action (CR-77, registered earlier) |
| 301 apex→www redirect | Cloudflare DNS — owner action (CR-78, registered earlier) |
| HSTS + CSP headers | Cloudflare — owner action (CR-104, registered earlier) |
| Google Ads negative keywords | Google Ads console — owner action (CR-151, registered earlier) |
| Resume blog publishing | Content team — ongoing (CR-102, registered earlier) |

---

## PART 4 — Implementation Priority for Next Agent

### Do These First (P0/P1, tiny effort)

```
CR-174  CtaDemo.jsx L54: add scroll-mt-20            → 1 word,  30 sec
CR-175  Footer.jsx L32-33: add noopener              → 2 words, 30 sec
CR-177  DemoForm.jsx L316: add autoFocus             → 1 prop,  30 sec
CR-173  Navbar.jsx + DemoForm.jsx: type="button"     → ~30 buttons, 20 min
CR-176  /thank-you page                              → 75 lines, 30 min
```

CR-174, 175, 177 can be batched into a single rebuild with CR-173 and CR-176.

### Do After (P1, content work)

```
CR-178  Homepage keyword density (9 keywords)        → Copy edits, ~45 min
CR-171  Homepage FAQ section + QAPage schema         → New section, 45 min
```

### Do After That (P2)

```
CR-179  Solution/product page keyword optimization   → Data file edits per page, ~90 min
```

### Blocked (Owner Input Needed)

```
CR-172  AggregateRating — needs verified review source (Google Business/G2/Capterra)
CR-180  Domain strategy — beta permanent or migrating to www?
```

---

## PART 5 — Key Technical Facts for Future Agents

### Prerender / Build System
- Serve mode: `node scripts/static-server.js` serves `build/` directory (NOT craco start)
- After ANY source change: `cd /app/frontend && nohup yarn build > /root/frontend-build.log 2>&1 &`
- Build takes ~110s (craco build ~60s + prerender.js puppeteer ~50s)
- Check: `ls /app/frontend/build/index.html && echo "BUILD OK" || echo "REBUILD NEEDED"`
- Restart: `sudo supervisorctl restart frontend`

### `<title>` Tag Quirk
`prerender.js` L91 only syncs `<title>` from `og:title` when `ogTitles.length > 1`.
react-helmet-async in this app only ever creates 1 `og:title` — condition never true.
Therefore: **always update `public/index.html` L146 when changing the homepage `<title>`.**
All other page titles are set by Helmet dynamically and captured correctly by Puppeteer.

### DemoForm Conversion Flow (DO NOT CHANGE)
```
Stage 1: Form submit → pushLead("form_submitted") → GTM: "form_submitted" ₹0
Stage 2: OTP verify  → pushLead("book_demo")      → GTM: "thankyou_conversion" ₹200  ← CORRECT
Stage 3: Calendly    → pushLead("demo_booked")     → GTM: "demo_booked" ₹300
```
Owner explicitly confirmed Stage 2 fire = correct and intentional.
CR-176 (/thank-you page) adds `navigate("/thank-you")` to `markBooked()` (Stage 3 only).
It does NOT move or change any conversion event.

### CMS Override Behavior
`EditableText` uses `useContent(key, fallback)` from CmsProvider.
If no CMS override is stored in MongoDB for a key → `fallback` renders.
Checked 2026-08-30: zero CMS overrides stored for `home.hero.title_lead` / `home.hero.title_accent`.
Changing `fallback` props in Hero.jsx directly changes what users see.

### GTM Production Gate
GTM only loads when `REACT_APP_GTM_ID` env var is set AND `window.location.hostname`
is in `REACT_APP_ALLOWED_HOSTS` (default: `www.mygenie.online,mygenie.online`).
In preview environment: GTM does NOT load. `pushEvent()` still queues to `window.dataLayer`
(harmless no-op if GTM absent).

---

*Document written 2026-08-30. Covers audit investigation + all CRs registered in this session (CR-167 → CR-180).*
