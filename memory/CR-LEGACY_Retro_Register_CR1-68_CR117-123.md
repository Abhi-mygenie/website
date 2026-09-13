# LEGACY CR RETRO-REGISTER — CR-1 … CR-68 (pre-register era) and CR-117 … CR-123

**Decision:** D-3 (owner, 2026-09-13) — full retro-registration. **State for all:** `LEGACY-CLOSED` (D-4 light evidence = code references / existing docs). Numbers not listed here (5, 6, 8, 9, 11–17, 22, 29, 31, 32, 34, 38, 46, 54–56, 61, 66, 69, 138) have no trace anywhere and are **unused — never reuse**.
**Source of titles:** code comments (`grep -rn 'CR-<n>'`), `IMPLEMENTATION_PLAN_CR35_36_37.md`, `HANDOVER_CR68_NEXT_AGENT.md`, `CR-117…123_*.md`. Purpose text is recovered, not original — treat as best-effort.

## CR-1 — Lead capture forms (demo / quote / contact) → Mongo + Freshsales (CR-1b)
**Prio (recovered):** P0 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:** none (doc-only)
**Docs:** none

## CR-2 — Attribution capture (UTM/click-ids/referrer) + server-side IP geolocation
**Prio (recovered):** P0 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:**
- `backend/geo.py:1:"""CR-2 — Best-effort server-side IP geolocation (city/region/country).`
- `backend/leads.py:4:`quotes`, `contact_messages`) captured by CR-1b / CR-2 / CR-4B. No new capture,`
- `frontend/src/lib/attribution.js:2: * CR-2 — Attribution & Data Capture (no-cost, client-side).`
- `frontend/src/lib/gtm.js:186: * Best-effort form fields; missing keys -> null (never omitted). Pulls click ids from CR-2.`
- `frontend/src/lib/gtm.js:233:    // attribution / click ids (CR-2) — full coverage (CR-3B #6, CR-33)`
**Docs:** none

## CR-3 — Client-side GTM + dataLayer for online conversions (CR-3A) + click-id coverage (CR-3B)
**Prio (recovered):** P0 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:**
- `frontend/src/lib/gtm.js:2: * CR-3 A — Client-side GTM + dataLayer (ONLINE conversions only).`
**Docs:** none

## CR-4 — Contact-messages capture extension (CR-4B)
**Prio (recovered):** P1 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:** none (doc-only)
**Docs:** none

## CR-7 — Internal Leads View — read-only sales triage (/leads)
**Prio (recovered):** P1 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:**
- `backend/leads.py:1:"""CR-7 — Internal Leads View (read-only sales triage).`
- `backend/server.py:928:# ----------------------- CR-7: Internal Leads View (read-only) -----------------------`
- `frontend/src/routes.js:50:  // CR-7 — Internal Leads View (CMS-auth gated, dashboard ENV-gated — CR-153)`
**Docs:** none

## CR-10 — Razorpay payment integration (payments.py)
**Prio (recovered):** P1 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:**
- `backend/payments.py:1:"""CR-10 — Razorpay payment integration.`
**Docs:** none

## CR-18 — Freshsales standard fields (state) + extra_fields guard + lifecycle/status ID mapping
**Prio (recovered):** P1 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:**
- `backend/freshsales.py:194:    CR-18: state added as standard field; extra_fields guard extended to also`
- `backend/freshsales.py:233:            # or immutable fields (country, lead_source_id). CR-18 extended guard.`
- `backend/server.py:174:    """Derive Freshsales lead_source_id from UTM params and click IDs (CR-18).`
- `backend/server.py:176:    Priority order matches CR-18 §4. IDs read from env (CR-26).`
- `backend/server.py:215:    Owner-confirmed mapping (2026-06-08, updated CR-18 2026-06-24, CR-25`
- `backend/server.py:219:      utm_term     -> cf_pos_satifcation_level + keyword (CR-18)`
- `backend/server.py:230:      CR-18 native: -> lead_source_id, country, keyword, medium, locale`
- `backend/server.py:258:    # ── CR-18: Creation-time snapshot fields (set-once — guard in upsert_contact) ──`
- … 1 more
**Docs:** none

## CR-19 — Ads Intelligence: Ad Spend CSV parsers, CRM Sync, Funnel (Phases 1–4, Journey webhook)
**Prio (recovered):** P1 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:**
- `backend/ad_spend.py:1:"""CR-19 Phase 3 — Ad Spend CSV parsers.`
- `backend/ad_spend.py:27:    # CR-19 Phase B`
- `backend/crm_sync.py:1:"""CR-19 — CRM Sync: Freshsales → MongoDB.`
- `backend/crm_sync.py:289:# ── Source Backfill (CR-19 historic: all paid-source leads) ──`
- `backend/funnel.py:1:"""CR-19 — Funnel aggregation queries (read-only).`
- `backend/funnel.py:341:            # CR-19 Phase 3: cost metrics`
- `backend/funnel.py:409:    """CR-19 Phase 4 — group by keyword (utm_term) or ad_set (utm_content).`
- `backend/server.py:951:# ── CR-19 Funnel endpoints ────────────────────────────────`
- … 5 more
**Docs:** none

## CR-20 — /petpooja-alternative standalone Google Ads landing page
**Prio (recovered):** P0 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:**
- `frontend/src/routes.js:52:  // CR-20 — Petpooja comparison landing page (Google Ads, standalone)`
- `frontend/src/data/vsp.js:1:// CR-20 — /petpooja-alternative`
**Docs:** none

## CR-21 — /demo standalone landing page (CR-21-E) + landing-source tag in CRM
**Prio (recovered):** P0 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:**
- `backend/server.py:329:    # Fix CR-21: tag the landing page source so sales can filter by origin in CRM`
- `frontend/src/routes.js:54:  // CR-21-E — Demo landing page (cold/Meta ad traffic, standalone)`
**Docs:** none

## CR-23 — Google Meet link + scheduled time pushed to Freshsales
**Prio (recovered):** P2 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:**
- `backend/freshsales.py:403:        # CR-23: Google Meet link + scheduled time`
**Docs:** none

## CR-25 — New attribution custom fields (cf_*) in Freshsales sync
**Prio (recovered):** P1 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:**
- `backend/crm_sync.py:106:        # CR-25: new attribution fields`
- `backend/crm_sync.py:642:                    # CR-25 fields`
- `backend/funnel.py:1192:        # Also aggregate by utm_id (numeric campaign ID from CR-25)`
- `backend/funnel.py:1278:        # CRM outcomes by adset_id (from CR-25)`
- `backend/funnel.py:1337:        # CRM outcomes by ad_id (from CR-25)`
- `backend/server.py:215:    Owner-confirmed mapping (2026-06-08, updated CR-18 2026-06-24, CR-25`
- `backend/server.py:221:      utm_ad       -> cf_contact_person ("Ad Name / Event ID") (CR-25: moved from cf_demo_fixed which was dropdown)`
- `backend/server.py:231:      CR-25 cf:    -> cf_inventory_used (adset_id), cf_complete_address`
- … 2 more
**Docs:** none

## CR-26 — Freshsales Source Sync — pull all contacts with first_source
**Prio (recovered):** P1 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:**
- `backend/crm_sync.py:510:# ── CR-26: Source Sync — pull ALL contacts where first_source is not null ──────`
- `backend/server.py:176:    Priority order matches CR-18 §4. IDs read from env (CR-26).`
- `backend/server.py:1415:    """CR-26: Pull all contacts where first_source is not null. Fills attribution gaps."""`
- `backend/server.py:1421:# ── CR-26: Lead Delete (MongoDB only) ────────────────────────────`
**Docs:** none

## CR-27 — Attribution stitching endpoints (Phase G) + CampaignTable UI
**Prio (recovered):** P1 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:**
- `backend/funnel.py:1083:# ── CR-27 Phase G: Attribution Stitching ───────────────────────────`
- `backend/server.py:1226:# ── CR-27 Phase G: Attribution Stitching endpoints ───────────────────────�`
- `frontend/src/components/ads/CampaignTable.jsx:105:                  {/* CRM Attribution (CR-27) */}`
**Docs:** none

## CR-28 — gclid in its own Freshsales field + cross-channel funnel (Phase I)
**Prio (recovered):** P1 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:**
- `backend/crm_sync.py:105:        "gclid":          cf.get("cf_pos_type"),  # CR-28: gclid in own field`
- `backend/crm_sync.py:641:                    "gclid":            cf.get("cf_pos_type"),  # CR-28`
- `backend/funnel.py:1392:# ── CR-28 Phase I: Cross-Channel Comparison ──────────────────────────`
- `backend/server.py:295:        cf["cf_pos_type"] = _trunc(a.get("gclid"))  # CR-28: gclid in own field (was polluting latest_source)`
**Docs:** none

## CR-33 — Full click-id coverage in gtm.js attribution push
**Prio (recovered):** P1 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:**
- `frontend/src/lib/gtm.js:233:    // attribution / click ids (CR-2) — full coverage (CR-3B #6, CR-33)`
**Docs:** none

## CR-35 — Patch 3 lost leads into demo_requests (Atlas quota incident) — one-time data fix
**Prio (recovered):** P0 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:** none (doc-only)
**Docs:** `IMPLEMENTATION_PLAN_CR35_36_37.md`

## CR-36 — Meta Ads daily breakdown incremental sync (ads_mcp.py)
**Prio (recovered):** P1 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:**
- `backend/ads_mcp.py:153:    CR-36: Uses daily breakdowns with incremental sync.`
- `backend/ads_mcp.py:256:        # CR-36: Always use time_range for daily breakdowns (incremental sync)`
- `backend/ads_mcp.py:450:        # CR-36: Incremental delete — only remove rows that overlap with the synced range`
- `backend/funnel.py:226:    CR-36/37: accepts optional date_from/date_to to filter by date_start/date_stop."""`
- `backend/funnel.py:262:        # CR-36/37: filter by date range when provided`
- `backend/funnel.py:280:        # CR-36: Always override CSV when API data exists (even if 0 for this date range)`
**Docs:** none

## CR-37 — Google Ads daily-granularity rows (segments.date)
**Prio (recovered):** P1 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:**
- `backend/ads_mcp.py:491:    CR-37: Returns daily-granularity rows with date_start/date_stop fields.`
- `backend/ads_mcp.py:524:    # CR-37: added segments.date for daily granularity`
- `backend/ads_mcp.py:747:    CR-37: Incremental sync with daily granularity and date_start/date_stop fields."""`
- `backend/ads_mcp.py:763:    # CR-37: Calculate incremental date range if not explicitly provided`
- `backend/ads_mcp.py:788:            # CR-37: Incremental delete — only remove rows that overlap with synced range`
**Docs:** none

## CR-67 — Funnel: Payment Awaited + Payment Received count as won
**Prio (recovered):** P2 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:**
- `backend/crm_sync.py:23:# CR-67: Payment Awaited + Payment Received count as "won" in funnel`
- `backend/crm_sync.py:29:# CR-67: Each stage maps to a list of Freshsales status IDs.`
- `backend/crm_sync.py:311:    # CR-67: Payment Awaited + Payment Received → "won"`
- `backend/funnel.py:89:# CR-67: "won" includes payment_awaited + payment_received`
- `backend/funnel.py:168:    CR-67: payment_awaited/payment_received sit between demo_given and won."""`
- `backend/funnel.py:211:            "given_rate":    _pct(demo_given, lead_in),  # CR-67: % of leads, not % of scheduled`
- `backend/funnel.py:336:            "given_rate":      _pct(demo_given, lead_in),  # CR-67: % of leads`
- `backend/funnel.py:467:            "given_rate":     _pct(demo_given, lead_in),  # CR-67: % of leads`
- … 3 more
**Docs:** none

## CR-68 — Churned Clients Dashboard (/api/cms/churn-report + ChurnPanel.jsx) — closed 2026-07-28, iteration_21
**Prio (recovered):** P1 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:**
- `backend/server.py:1001:# ── CR-68: Churned Clients Dashboard ────────────────────────────�`
**Docs:** `HANDOVER_CR68_NEXT_AGENT.md`

## CR-117 — Prerender snapshot pollution (head/state leaking between routes)
**Prio (recovered):** P1 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:** none (doc-only)
**Docs:** `CR-117_ImpactAnalysis.md`, `CR-117_Line_By_Line_Plan.md`, `CR-117_Prerender_Snapshot_Pollution.md`

## CR-118 — Poppins blocking CSS → FCP fix
**Prio (recovered):** P1 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:**
- `frontend/scripts/prerender.js:85:        // ── NEW 3: remove googleapis.com links (CR-118: Poppins now self-hosted) ─────`
**Docs:** `CR-118_ImpactAnalysis.md`, `CR-118_Line_By_Line_Plan.md`, `CR-118_Poppins_Blocking_CSS_FCP.md`

## CR-119 — Trust logos resize to 128px
**Prio (recovered):** P2 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:** none (doc-only)
**Docs:** `CR-119_ImpactAnalysis.md`, `CR-119_Line_By_Line_Plan.md`, `CR-119_Trust_Logos_Resize_128px.md`

## CR-120 — EditableImage missing width/height (Hero + Logo) — CLS
**Prio (recovered):** P1 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:** none (doc-only)
**Docs:** `CR-120_EditableImage_Width_Height.md`, `CR-120_ImpactAnalysis.md`, `CR-120_Line_By_Line_Plan.md`

## CR-121 — Sitemap missing hub pages
**Prio (recovered):** P1 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:** none (doc-only)
**Docs:** `CR-121_CR-122_Line_By_Line_Plan.md`, `CR-121_ImpactAnalysis.md`, `CR-121_Sitemap_Missing_Hub_Pages.md`

## CR-122 — Sitemap stale lastmod dates
**Prio (recovered):** P2 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:** none (doc-only)
**Docs:** `CR-121_CR-122_Line_By_Line_Plan.md`, `CR-122_ImpactAnalysis.md`, `CR-122_Sitemap_Stale_Lastmod_Dates.md`

## CR-123 — Blog markdown images missing width/height
**Prio (recovered):** P2 · **State:** LEGACY-CLOSED · **Registered:** 2026-09-13 (retro)
**Code references:** none (doc-only)
**Docs:** `CR-123_Blog_Markdown_Images_Missing_Dims.md`

