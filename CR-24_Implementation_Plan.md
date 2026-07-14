# CR-24 — Ads Intelligence Platform
## Full Implementation Plan (G2 → G3)

**Date:** 2026-06-26  
**Phase:** G2 Planning → G3 Build  
**Total files:** 6 modified + 8 new

---

## BUILD ORDER

```
Phase 1 (no credentials, ~2 days):
  Step 1.1  backend/funnel.py          → 3 new query functions
  Step 1.2  backend/ad_spend.py        → extend SpendRow + 4 new parsers
  Step 1.3  backend/server.py          → 6 new routes + extend ad_spend handler
  Step 1.4  frontend LeadsView.jsx     → add tab bar
  Step 1.5  frontend components/ads/*  → 6 new panels (LandingPage, Device/City, Keyword, Creative, Executive, AI)

Phase 2 (no credentials, ~1 day):
  Step 2.1  backend/recommendations.py → rules engine
  Step 2.2  backend/server.py          → /cms/ads/recommendations endpoint

Phase 3 (needs META_ACCESS_TOKEN, ~1.5 days):
  Step 3.1  backend/ads_mcp.py         → Meta MCP client
  Step 3.2  backend/server.py          → /cms/ads/mcp/meta/sync endpoint

Phase 4 (needs GOOGLE_ADS_DEVELOPER_TOKEN, ~1.5 days):
  Step 4.1  backend/ads_mcp.py         → Google Ads MCP client
  Step 4.2  backend/server.py          → /cms/ads/mcp/google/sync endpoint

Phase 5 (Emergent LLM key available, ~0.5 days):
  Step 5.1  backend/recommendations.py → add LLM summary via Claude
```

---

## STEP 1.1 — `backend/funnel.py` — 3 New Query Functions

### Where to insert
After line 403 (end of `get_funnel_by_attribution`) before line 410 (`get_sync_status`).

### Helper functions to add (insert after line 407)

```python
def _landing_page(doc) -> str:
    """Extract landing page from attribution or fallback."""
    a = doc.get("attribution") or {}
    lp = a.get("landing_page") or ""
    # Normalise: strip query string, keep path only
    if lp and "?" in lp:
        lp = lp.split("?")[0]
    return lp.strip() or "/"


def _device(doc) -> str:
    """Extract device type from attribution."""
    a = doc.get("attribution") or {}
    return (a.get("device_type") or "unknown").lower()


def _city_val(doc) -> str:
    """Extract city."""
    geo = doc.get("geo") or {}
    return (doc.get("city") or geo.get("city") or "").strip()
```

### `get_funnel_by_landing_page()` — full function

```python
async def get_funnel_by_landing_page(db, date_from=None, date_to=None, source=None):
    """CR-24 — Funnel breakdown by landing page.
    Only includes new-website leads (attribution.landing_page present).
    Excludes backfilled_leads (they have no landing_page data).
    """
    # Load only new website leads (not backfilled) to avoid "/" noise
    rows = await _load_all(db, date_from, date_to, lead_type=None)
    rows = [r for r in rows if r.get("_lead_type") != "backfilled"]

    if source:
        rows = [r for r in rows if _source_label(r) == source]

    # Only rows that have a landing_page populated
    rows = [r for r in rows if _landing_page(r) not in ("", "/")]

    spend_map = await _get_spend_by_source(db)

    buckets: dict[str, list] = {}
    for r in rows:
        key = _landing_page(r)
        buckets.setdefault(key, []).append(r)

    result = []
    for lp, grp in sorted(buckets.items(), key=lambda x: -len(x[1])):
        lead_in        = len(grp)
        otp_verified   = sum(1 for r in grp if r.get("otp_verified") is True)
        demo_scheduled = sum(1 for r in grp if _in_stage(r.get("crm_status"), "demo_scheduled"))
        demo_given     = sum(1 for r in grp if _in_stage(r.get("crm_status"), "demo_given"))
        won            = sum(1 for r in grp if _in_stage(r.get("crm_status"), "won"))
        lost           = sum(1 for r in grp if _in_stage(r.get("crm_status"), "lost"))

        # Device split for this landing page
        mobile_count  = sum(1 for r in grp if _device(r) == "mobile")
        desktop_count = sum(1 for r in grp if _device(r) == "desktop")

        # Source split
        sources_in_grp = {}
        for r in grp:
            sl = _source_label(r)
            sources_in_grp[sl] = sources_in_grp.get(sl, 0) + 1

        result.append({
            "landing_page":    lp,
            "lead_in":         lead_in,
            "otp_verified":    otp_verified,
            "otp_rate":        _pct(otp_verified, lead_in),
            "demo_scheduled":  demo_scheduled,
            "schedule_rate":   _pct(demo_scheduled, lead_in),
            "demo_given":      demo_given,
            "given_rate":      _pct(demo_given, demo_scheduled),
            "won":             won,
            "won_rate":        _pct(won, demo_given),
            "lost":            lost,
            "lead_to_win_pct": _pct(won, lead_in),
            "mobile_pct":      _pct(mobile_count, lead_in),
            "desktop_pct":     _pct(desktop_count, lead_in),
            "source_split":    sources_in_grp,
        })

    return {"rows": result, "total_leads": len(rows)}
```

### `get_funnel_by_device()` — full function

```python
async def get_funnel_by_device(db, date_from=None, date_to=None, source=None):
    """CR-24 — Funnel breakdown by device type (mobile vs desktop)."""
    rows = await _load_all(db, date_from, date_to, lead_type=None)
    rows = [r for r in rows if r.get("_lead_type") != "backfilled"]
    if source:
        rows = [r for r in rows if _source_label(r) == source]

    buckets: dict[str, list] = {}
    for r in rows:
        key = _device(r)
        buckets.setdefault(key, []).append(r)

    result = []
    order = ["mobile", "desktop", "unknown"]
    for dev in order:
        if dev not in buckets:
            continue
        grp = buckets[dev]
        lead_in        = len(grp)
        otp_verified   = sum(1 for r in grp if r.get("otp_verified") is True)
        demo_scheduled = sum(1 for r in grp if _in_stage(r.get("crm_status"), "demo_scheduled"))
        demo_given     = sum(1 for r in grp if _in_stage(r.get("crm_status"), "demo_given"))
        won            = sum(1 for r in grp if _in_stage(r.get("crm_status"), "won"))
        lost           = sum(1 for r in grp if _in_stage(r.get("crm_status"), "lost"))
        result.append({
            "device":          dev,
            "lead_in":         lead_in,
            "otp_verified":    otp_verified,
            "otp_rate":        _pct(otp_verified, lead_in),
            "demo_scheduled":  demo_scheduled,
            "schedule_rate":   _pct(demo_scheduled, lead_in),
            "demo_given":      demo_given,
            "given_rate":      _pct(demo_given, demo_scheduled),
            "won":             won,
            "won_rate":        _pct(won, demo_given),
            "lost":            lost,
            "lead_to_win_pct": _pct(won, lead_in),
        })

    return {"rows": result, "total_leads": len(rows)}
```

### `get_funnel_by_city()` — full function

```python
async def get_funnel_by_city(db, date_from=None, date_to=None, source=None, top_n=20):
    """CR-24 — Funnel breakdown by city. Returns top_n cities by lead_in."""
    rows = await _load_all(db, date_from, date_to, lead_type=None)
    if source:
        rows = [r for r in rows if _source_label(r) == source]

    buckets: dict[str, list] = {}
    for r in rows:
        city = _city_val(r)
        if not city:
            city = "Unknown"
        buckets.setdefault(city, []).append(r)

    result = []
    for city, grp in sorted(buckets.items(), key=lambda x: -len(x[1]))[:top_n]:
        lead_in        = len(grp)
        otp_verified   = sum(1 for r in grp if r.get("otp_verified") is True)
        demo_scheduled = sum(1 for r in grp if _in_stage(r.get("crm_status"), "demo_scheduled"))
        won            = sum(1 for r in grp if _in_stage(r.get("crm_status"), "won"))
        lost           = sum(1 for r in grp if _in_stage(r.get("crm_status"), "lost"))
        result.append({
            "city":            city,
            "lead_in":         lead_in,
            "otp_verified":    otp_verified,
            "otp_rate":        _pct(otp_verified, lead_in),
            "demo_scheduled":  demo_scheduled,
            "schedule_rate":   _pct(demo_scheduled, lead_in),
            "won":             won,
            "lost":            lost,
            "lead_to_win_pct": _pct(won, lead_in),
        })

    return {"rows": result, "total_leads": len(rows)}
```

### `get_executive_summary()` — full function

```python
async def get_executive_summary(db, date_from=None, date_to=None):
    """CR-24 — Blended ad performance summary card."""
    rows       = await _load_all(db, date_from, date_to, lead_type=None)
    spend_map  = await _get_spend_by_source(db)

    total_leads     = len(rows)
    otp_verified    = sum(1 for r in rows if r.get("otp_verified") is True)
    demo_scheduled  = sum(1 for r in rows if _in_stage(r.get("crm_status"), "demo_scheduled"))
    demo_given      = sum(1 for r in rows if _in_stage(r.get("crm_status"), "demo_given"))
    won             = sum(1 for r in rows if _in_stage(r.get("crm_status"), "won"))
    lost            = sum(1 for r in rows if _in_stage(r.get("crm_status"), "lost"))

    total_spend = sum(v["spend"] for v in spend_map.values() if v.get("spend"))

    # Source split
    source_buckets: dict[str, list] = {}
    for r in rows:
        sl = _source_label(r)
        source_buckets.setdefault(sl, []).append(r)

    source_split = []
    SOURCE_TO_SPEND = {"google_paid": "google", "meta": "meta"}
    for src, grp in sorted(source_buckets.items(), key=lambda x: -len(x[1])):
        spend_key  = SOURCE_TO_SPEND.get(src)
        src_spend  = spend_map.get(spend_key, {}).get("spend") if spend_key else None
        src_won    = sum(1 for r in grp if _in_stage(r.get("crm_status"), "won"))
        source_split.append({
            "source":  src,
            "label":   SOURCE_LABELS.get(src, src),
            "leads":   len(grp),
            "won":     src_won,
            "spend":   src_spend,
            "pct_leads": _pct(len(grp), total_leads),
        })

    # Top / worst campaign from ad_spend
    pipeline_top = [
        {"$group": {
            "_id": "$campaign",
            "spend": {"$sum": "$spend"},
            "source": {"$first": "$source"},
        }},
        {"$sort": {"spend": -1}},
        {"$limit": 20},
    ]
    campaign_docs = await db.ad_spend.aggregate(pipeline_top).to_list(20)

    return {
        "total_leads":    total_leads,
        "otp_verified":   otp_verified,
        "otp_rate":       _pct(otp_verified, total_leads),
        "demo_scheduled": demo_scheduled,
        "demo_given":     demo_given,
        "won":            won,
        "lost":           lost,
        "total_spend":    total_spend,
        "blended_cpl":    _fmt_cost(total_spend, total_leads),
        "blended_cp_demo":_fmt_cost(total_spend, demo_given),
        "blended_cp_win": _fmt_cost(total_spend, won),
        "source_split":   source_split,
        "campaigns":      [{"name": d["_id"], "spend": d["spend"], "source": d["source"]} for d in campaign_docs],
        "spend_periods":  {k: v.get("spend_period") for k, v in spend_map.items()},
    }
```

---

## STEP 1.2 — `backend/ad_spend.py` — Extend SpendRow + 4 New Parsers

### SpendRow extension (replace existing dataclass at line 18)

```python
@dataclass
class SpendRow:
    campaign:     str
    ad_set:       Optional[str]
    spend:        float
    impressions:  Optional[int]
    clicks:       Optional[int]
    meta_results: Optional[int]   # Meta's own "Results" — NOT used for CPL
    currency:     str = "INR"
    # CR-19 Phase B — Google keywords
    keyword:      Optional[str] = None
    # CR-24 — new optional fields
    search_term:  Optional[str] = None   # actual user query (Search Terms report)
    match_type:   Optional[str] = None   # Exact | Phrase | Broad
    headline:     Optional[str] = None   # ad copy headline (Ad report)
    placement:    Optional[str] = None   # Facebook Feed | Instagram Reels | Stories
    age_range:    Optional[str] = None   # 18-24 | 25-34 | 35-44 | 45-54 | 55+
    gender:       Optional[str] = None   # male | female | unknown
    reach:        Optional[int] = None   # unique people reached (Meta)
    frequency:    Optional[float] = None # impressions / reach (fatigue signal)
    ad_name:      Optional[str] = None   # individual ad name (Meta ad-level)
```

### `detect_platform()` extension (replace function at line 70)

```python
def detect_platform(content: bytes) -> str:
    """Return platform key based on column headers."""
    text, _ = _strip_bom(content)
    sample = "\n".join(text.splitlines()[:10]).lower()

    # Google Search Terms: has "search term" column
    if "search term" in sample and ("campaign" in sample or "ad group" in sample):
        return "google_search_terms"
    # Google Ads (ad copy level): has "final url" or "ad type" or "headline 1"
    if ("headline 1" in sample or "final url" in sample or "ad type" in sample) and "campaign" in sample:
        return "google_ads"
    # Meta breakdown (placement/demographic): has "breakdown" style columns
    if "amount spent" in sample and ("placement" in sample or "age" in sample or "gender" in sample):
        return "meta_breakdown"
    # Meta ad-level: has "ad name" AND "reach" AND "frequency"
    if "amount spent" in sample and "reach" in sample and "frequency" in sample:
        return "meta_ad"
    # Existing: Meta campaign/adset
    if "amount spent" in sample:
        return "meta"
    # Keywords report — check BEFORE campaign
    if "keyword" in sample and ("ad group" in sample or "match type" in sample):
        return "google_keywords"
    if "campaign status" in sample:
        return "google"
    return "unknown"
```

### `parse_google_search_terms_csv()` — new function (add after line 261)

```python
def parse_google_search_terms_csv(content: bytes, period_start: str, period_end: str) -> ParseResult:
    """Parse Google Ads Search Terms Performance report.
    Expected columns: Search term, Campaign, Ad group, Match type, Clicks, Impr., Cost, Currency code.
    This gives ACTUAL user queries (not bid keywords) — key for negative keyword identification.
    """
    text, delimiter = _strip_bom(content)
    lines = text.splitlines()

    # Find header row containing "Search term"
    header_idx = None
    for i, line in enumerate(lines):
        cols_lower = [c.strip().lower() for c in line.split(delimiter)]
        if "search term" in cols_lower and "campaign" in cols_lower:
            header_idx = i
            break

    if header_idx is None:
        raise ValueError(
            "Could not locate header row. Expected a row containing 'Search term' and 'Campaign'."
        )

    cleaned = "\n".join(lines[header_idx:])
    reader  = csv.DictReader(io.StringIO(cleaned), delimiter=delimiter)
    result  = ParseResult(
        source="google_search_terms",
        period_start=period_start,
        period_end=period_end,
    )

    for row in reader:
        st = (row.get("Search term") or "").strip()
        campaign = (row.get("Campaign") or "").strip()
        if not st or st.lower() in ("total", "", "--"):
            continue
        if not campaign or campaign.lower() in ("total", ""):
            continue

        spend = _to_float(row.get("Cost", "0"))
        if spend == 0:
            continue

        currency = (row.get("Currency code") or "INR").strip()
        match_type = (row.get("Match type") or "").strip() or None

        r = SpendRow(
            campaign=campaign,
            ad_set=(row.get("Ad group") or "").strip() or None,
            spend=spend,
            impressions=_to_int(row.get("Impr.", "")),
            clicks=_to_int(row.get("Clicks", "")),
            meta_results=None,
            currency=currency,
            keyword=(row.get("Search term") or "").strip() or None,  # keyword = actual search term here
            search_term=st,
            match_type=match_type,
        )
        result.rows.append(r)
        result.total_spend += spend

    result.row_count = len(result.rows)
    if result.row_count == 0:
        raise ValueError("No non-zero spend search terms found in Google Ads Search Terms CSV")

    logger.info("parse_google_search_terms_csv: %d rows, total=%.2f", result.row_count, result.total_spend)
    return result
```

### `parse_google_ads_csv()` — new function (ad copy level)

```python
def parse_google_ads_csv(content: bytes, period_start: str, period_end: str) -> ParseResult:
    """Parse Google Ads Ad Performance report.
    Expected columns: Ad, Campaign, Ad group, Headline 1, Headline 2, Headline 3,
                     Clicks, Impr., Cost, CTR, Currency code.
    """
    text, delimiter = _strip_bom(content)
    lines = text.splitlines()

    header_idx = None
    for i, line in enumerate(lines):
        cols_lower = [c.strip().lower() for c in line.split(delimiter)]
        if ("headline 1" in cols_lower or "final url" in cols_lower) and "campaign" in cols_lower:
            header_idx = i
            break

    if header_idx is None:
        raise ValueError(
            "Could not locate header. Expected 'Headline 1' or 'Final URL' and 'Campaign' columns."
        )

    cleaned = "\n".join(lines[header_idx:])
    reader  = csv.DictReader(io.StringIO(cleaned), delimiter=delimiter)
    result  = ParseResult(source="google_ads", period_start=period_start, period_end=period_end)

    for row in reader:
        campaign = (row.get("Campaign") or "").strip()
        if not campaign or campaign.lower() in ("total", "", "--"):
            continue

        spend = _to_float(row.get("Cost", "0"))
        if spend == 0:
            continue

        # Combine headlines into one string for display
        h1 = (row.get("Headline 1") or "").strip()
        h2 = (row.get("Headline 2") or "").strip()
        headline = " | ".join(p for p in [h1, h2] if p) or None

        currency = (row.get("Currency code") or "INR").strip()
        r = SpendRow(
            campaign=campaign,
            ad_set=(row.get("Ad group") or "").strip() or None,
            spend=spend,
            impressions=_to_int(row.get("Impr.", "")),
            clicks=_to_int(row.get("Clicks", "")),
            meta_results=None,
            currency=currency,
            headline=headline,
            ad_name=(row.get("Ad") or "").strip() or None,
        )
        result.rows.append(r)
        result.total_spend += spend

    result.row_count = len(result.rows)
    if result.row_count == 0:
        raise ValueError("No non-zero spend ads found in Google Ads Ad Performance CSV")

    logger.info("parse_google_ads_csv: %d rows, total=%.2f", result.row_count, result.total_spend)
    return result
```

### `parse_meta_ad_csv()` — new function (Meta ad-level with reach/frequency)

```python
def parse_meta_ad_csv(content: bytes) -> ParseResult:
    """Parse Meta Ads Manager Ad-level report with Reach and Frequency.
    Expected columns: Campaign name, Ad set name, Ad name, Amount spent, Impressions,
                     Reach, Frequency, Clicks, Results.
    Frequency = Impressions / Reach — key signal for creative fatigue (threshold: 4.0).
    """
    text, delimiter = _strip_bom(content)
    reader  = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    result  = ParseResult(source="meta_ad", period_start=None, period_end=None)
    headers = reader.fieldnames or []

    spend_col = next((h for h in headers if "amount spent" in h.lower()), None)
    if not spend_col:
        raise ValueError("Could not find 'Amount spent' column in Meta Ad CSV")

    for row in reader:
        campaign = (row.get("Campaign name") or "").strip()
        if not campaign or campaign.lower() in ("total", ""):
            continue

        if result.period_start is None:
            result.period_start = (row.get("Reporting starts") or "").strip() or None
            result.period_end   = (row.get("Reporting ends") or "").strip() or None

        spend = _to_float(row.get(spend_col, "0"))
        reach_raw = row.get("Reach", "")
        freq_raw  = row.get("Frequency", "")

        reach     = _to_int(reach_raw)
        # Frequency may be pre-calculated in the export OR compute from impressions/reach
        frequency = None
        if freq_raw and freq_raw.strip() not in ("", "-", "--"):
            try:
                frequency = float(freq_raw.replace(",", "").strip())
            except ValueError:
                pass
        if frequency is None:
            impr = _to_int(row.get("Impressions", ""))
            if impr and reach and reach > 0:
                frequency = round(impr / reach, 2)

        ad_name = (row.get("Ad name") or "").strip() or None

        r = SpendRow(
            campaign=campaign,
            ad_set=(row.get("Ad set name") or "").strip() or None,
            spend=spend,
            impressions=_to_int(row.get("Impressions", "")),
            clicks=None,
            meta_results=_to_int(row.get("Results", "")),
            reach=reach,
            frequency=frequency,
            ad_name=ad_name,
        )
        result.rows.append(r)
        result.total_spend += spend

    result.row_count = len(result.rows)
    if result.row_count == 0:
        raise ValueError("No data rows found in Meta Ad CSV")

    logger.info("parse_meta_ad_csv: %d rows, total=%.2f", result.row_count, result.total_spend)
    return result
```

### `parse_meta_breakdown_csv()` — new function (placement/demographic)

```python
def parse_meta_breakdown_csv(content: bytes) -> ParseResult:
    """Parse Meta Ads Manager breakdown report (Placement or Age/Gender).
    Expected columns: Campaign name, Ad set name, Breakdown column (Placement/Age/Gender),
                     Amount spent, Impressions, Results.
    Detects breakdown type from headers automatically.
    """
    text, delimiter = _strip_bom(content)
    reader  = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    result  = ParseResult(source="meta_breakdown", period_start=None, period_end=None)
    headers = reader.fieldnames or []

    spend_col = next((h for h in headers if "amount spent" in h.lower()), None)
    if not spend_col:
        raise ValueError("Could not find 'Amount spent' column in Meta Breakdown CSV")

    # Detect breakdown dimension
    has_placement = any("placement" in h.lower() for h in headers)
    has_age       = any(h.lower() in ("age", "age range") for h in headers)
    has_gender    = any("gender" in h.lower() for h in headers)

    placement_col = next((h for h in headers if "placement" in h.lower()), None)
    age_col       = next((h for h in headers if h.lower() in ("age", "age range")), None)
    gender_col    = next((h for h in headers if "gender" in h.lower()), None)

    for row in reader:
        campaign = (row.get("Campaign name") or "").strip()
        if not campaign or campaign.lower() in ("total", ""):
            continue

        if result.period_start is None:
            result.period_start = (row.get("Reporting starts") or "").strip() or None
            result.period_end   = (row.get("Reporting ends") or "").strip() or None

        spend = _to_float(row.get(spend_col, "0"))

        placement = (row.get(placement_col) or "").strip() if placement_col else None
        age_range = (row.get(age_col) or "").strip()       if age_col       else None
        gender    = (row.get(gender_col) or "").strip()    if gender_col    else None

        r = SpendRow(
            campaign=campaign,
            ad_set=(row.get("Ad set name") or "").strip() or None,
            spend=spend,
            impressions=_to_int(row.get("Impressions", "")),
            clicks=None,
            meta_results=_to_int(row.get("Results", "")),
            placement=placement or None,
            age_range=age_range or None,
            gender=gender or None,
        )
        result.rows.append(r)
        result.total_spend += spend

    result.row_count = len(result.rows)
    if result.row_count == 0:
        raise ValueError("No data rows found in Meta Breakdown CSV")

    logger.info("parse_meta_breakdown_csv: %d rows, total=%.2f", result.row_count, result.total_spend)
    return result
```

### Extend `parse_csv()` dispatch (replace existing function at line 264)

```python
def parse_csv(content: bytes, period_start: str = "", period_end: str = "") -> ParseResult:
    """Auto-detect platform and parse. Supports 7 report types."""
    platform = detect_platform(content)
    if platform == "google_search_terms":
        if not period_start or not period_end:
            raise ValueError("period_start and period_end are required for Google Ads Search Terms CSV")
        return parse_google_search_terms_csv(content, period_start, period_end)
    if platform == "google_ads":
        if not period_start or not period_end:
            raise ValueError("period_start and period_end are required for Google Ads Ad Performance CSV")
        return parse_google_ads_csv(content, period_start, period_end)
    if platform == "meta_ad":
        return parse_meta_ad_csv(content)
    if platform == "meta_breakdown":
        return parse_meta_breakdown_csv(content)
    if platform == "meta":
        return parse_meta_csv(content)
    if platform == "google_keywords":
        if not period_start or not period_end:
            raise ValueError("period_start and period_end are required for Google Ads Keywords CSV")
        return parse_google_keywords_csv(content, period_start, period_end)
    if platform == "google":
        if not period_start or not period_end:
            raise ValueError("period_start and period_end are required for Google Ads CSV")
        return parse_google_csv(content, period_start, period_end)
    raise ValueError(
        "Unrecognised CSV format. Supported: Google Campaign, Keywords, Search Terms, Ad Performance; "
        "Meta Campaign+AdSet, Ad (with Reach/Frequency), Placement/Demographic breakdown."
    )
```

---

## STEP 1.3 — `backend/server.py` — New Routes

### Imports to add (after line 33 `import funnel as funnel_module`)

```python
import recommendations as recommendations_module
import ads_mcp as ads_mcp_module
```

### Extend ad_spend upload handler (after line 904 `"meta_results": r.meta_results,`)
Add new optional fields to the docs list comprehension:

```python
docs = [
    {
        "upload_id":    upload_id,
        "source":       result.source,
        "period_start": result.period_start,
        "period_end":   result.period_end,
        "campaign":     r.campaign,
        "ad_set":       r.ad_set,
        "keyword":      r.keyword,
        "search_term":  r.search_term,   # NEW
        "match_type":   r.match_type,    # NEW
        "headline":     r.headline,      # NEW
        "placement":    r.placement,     # NEW
        "age_range":    r.age_range,     # NEW
        "gender":       r.gender,        # NEW
        "reach":        r.reach,         # NEW
        "frequency":    r.frequency,     # NEW
        "ad_name":      r.ad_name,       # NEW
        "spend":        r.spend,
        "impressions":  r.impressions,
        "clicks":       r.clicks,
        "meta_results": r.meta_results,
        "currency":     r.currency,
        "uploaded_by":  admin,
        "uploaded_at":  now,
    }
    for r in result.rows
]
```

### New funnel endpoints (add after line 832 `/cms/funnel/lost` handler)

```python
@api_router.get("/cms/funnel/by-landing-page")
async def cms_funnel_by_landing_page(
    admin: str = Depends(cms_auth.get_current_admin),
    date_from: str | None = None,
    date_to: str | None = None,
    source: str | None = None,
):
    return await funnel_module.get_funnel_by_landing_page(
        db, date_from=date_from, date_to=date_to, source=source
    )


@api_router.get("/cms/funnel/by-device")
async def cms_funnel_by_device(
    admin: str = Depends(cms_auth.get_current_admin),
    date_from: str | None = None,
    date_to: str | None = None,
    source: str | None = None,
):
    return await funnel_module.get_funnel_by_device(
        db, date_from=date_from, date_to=date_to, source=source
    )


@api_router.get("/cms/funnel/by-city")
async def cms_funnel_by_city(
    admin: str = Depends(cms_auth.get_current_admin),
    date_from: str | None = None,
    date_to: str | None = None,
    source: str | None = None,
    top_n: int = 20,
):
    return await funnel_module.get_funnel_by_city(
        db, date_from=date_from, date_to=date_to, source=source, top_n=top_n
    )


@api_router.get("/cms/ads/executive-summary")
async def cms_ads_executive_summary(
    admin: str = Depends(cms_auth.get_current_admin),
    date_from: str | None = None,
    date_to: str | None = None,
):
    return await funnel_module.get_executive_summary(db, date_from=date_from, date_to=date_to)


@api_router.get("/cms/ads/recommendations")
async def cms_ads_recommendations(
    admin: str = Depends(cms_auth.get_current_admin),
    use_llm: bool = False,
):
    return await recommendations_module.get_recommendations(db, use_llm=use_llm)
```

### MCP sync endpoints (Phase 3 & 4 — add after recommendations endpoint)

```python
@api_router.post("/cms/ads/mcp/meta/sync")
async def cms_ads_mcp_meta_sync(admin: str = Depends(cms_auth.get_current_admin)):
    """Pull live Meta Ads data via Meta MCP and store in ad_spend collection."""
    result = await ads_mcp_module.sync_meta(db)
    return result


@api_router.post("/cms/ads/mcp/google/sync")
async def cms_ads_mcp_google_sync(admin: str = Depends(cms_auth.get_current_admin)):
    """Pull live Google Ads data via Google Ads MCP and store in ad_spend collection."""
    result = await ads_mcp_module.sync_google(db)
    return result


@api_router.get("/cms/ads/mcp/status")
async def cms_ads_mcp_status(admin: str = Depends(cms_auth.get_current_admin)):
    """Return MCP connection status for Meta and Google."""
    return ads_mcp_module.get_status()
```

---

## STEP 2.1 — `backend/recommendations.py` — NEW FILE

```python
"""CR-24 — Ads Intelligence Recommendations Engine.

Phase 1: Rules-based signals (SCALE / PAUSE / BLOCK / FATIGUED / REVIEW).
Phase 2: LLM summary via Emergent key (Claude).

Rules:
  SCALE    keyword/campaign: cp_win < median cp_win AND won >= 2
  PAUSE    campaign:         spend > 22000 AND demos == 0
  BLOCK    keyword:          spend > 1000 AND otp_rate < 20%
  FATIGUED creative/ad:      frequency > 4.0 (Meta ad-level upload)
  REVIEW   campaign:         spend > 5000 AND schedule_rate < 10%
"""
import logging
import os
from datetime import datetime, timezone

import funnel as funnel_module

logger = logging.getLogger(__name__)

BLOCK_SPEND_THRESHOLD   = 1000    # INR — min spend to flag a keyword as BLOCK candidate
BLOCK_OTP_THRESHOLD     = 20      # % — OTP rate below this = junk traffic
PAUSE_SPEND_THRESHOLD   = 22000   # INR — spend with 0 demos triggers PAUSE
REVIEW_SPEND_THRESHOLD  = 5000    # INR — spend with low demo rate triggers REVIEW
SCALE_MIN_WON           = 2       # minimum won count to qualify for SCALE signal
FATIGUE_FREQUENCY       = 4.0     # Meta frequency above this = FATIGUED


# ── Helpers ────────────────────────────────────────────────────────────────

def _median(values: list[float]) -> float | None:
    if not values:
        return None
    s = sorted(v for v in values if v is not None)
    if not s:
        return None
    mid = len(s) // 2
    return s[mid] if len(s) % 2 else (s[mid - 1] + s[mid]) / 2


# ── Rules engine ───────────────────────────────────────────────────────────

async def _keyword_signals(db) -> list[dict]:
    """Generate signals from keyword funnel data."""
    data = await funnel_module.get_funnel_by_attribution(db, dimension="keyword")
    rows = data.get("rows", [])
    if not rows:
        return []

    signals = []
    cp_wins = [r["cp_win"] for r in rows if r.get("cp_win") is not None]
    median_cp_win = _median(cp_wins)

    for r in rows:
        kw      = r.get("value", "")
        spend   = r.get("spend") or 0
        won     = r.get("won", 0)
        otp_rate = r.get("schedule_rate", 100)  # using schedule_rate as quality proxy
        cp_win  = r.get("cp_win")
        demos   = r.get("demo_scheduled", 0)

        # BLOCK — high spend, very low quality
        if spend >= BLOCK_SPEND_THRESHOLD and otp_rate < BLOCK_OTP_THRESHOLD:
            signals.append({
                "type":    "BLOCK",
                "entity":  "keyword",
                "name":    kw,
                "message": f"₹{int(spend):,} spent, only {otp_rate}% demo rate. Add as negative keyword.",
                "data":    {"spend": spend, "otp_rate": otp_rate, "won": won},
                "priority": 1,
            })

        # SCALE — efficient path to win
        elif (cp_win is not None and median_cp_win is not None
              and cp_win < median_cp_win and won >= SCALE_MIN_WON):
            signals.append({
                "type":    "SCALE",
                "entity":  "keyword",
                "name":    kw,
                "message": f"CP-Win ₹{int(cp_win):,} — {round((1 - cp_win/median_cp_win)*100)}% below median. Scale this keyword.",
                "data":    {"spend": spend, "won": won, "cp_win": cp_win, "median_cp_win": median_cp_win},
                "priority": 2,
            })

    return signals


async def _campaign_signals(db) -> list[dict]:
    """Generate signals from campaign ad_spend data cross-referenced with funnel."""
    # Get all campaigns from ad_spend
    pipeline = [
        {"$group": {
            "_id":    "$campaign",
            "spend":  {"$sum": "$spend"},
            "source": {"$first": "$source"},
        }},
        {"$sort": {"spend": -1}},
        {"$limit": 50},
    ]
    campaign_docs = await db.ad_spend.aggregate(pipeline).to_list(50)
    if not campaign_docs:
        return []

    # Get funnel by attribution (ad_set dimension as proxy)
    funnel_data = await funnel_module.get_funnel_by_attribution(db, dimension="ad_set")
    funnel_map  = {r["value"]: r for r in funnel_data.get("rows", [])}

    signals = []
    for doc in campaign_docs:
        campaign = doc["_id"]
        spend    = doc["spend"]
        f        = funnel_map.get(campaign, {})
        demos    = f.get("demo_scheduled", 0)
        schedule_rate = f.get("schedule_rate", 0)

        # PAUSE — lots of spend, zero demos
        if spend >= PAUSE_SPEND_THRESHOLD and demos == 0:
            signals.append({
                "type":    "PAUSE",
                "entity":  "campaign",
                "name":    campaign,
                "message": f"₹{int(spend):,} spent with 0 demos. Review immediately.",
                "data":    {"spend": spend, "demos": 0},
                "priority": 1,
            })

        # REVIEW — spend with low demo rate
        elif spend >= REVIEW_SPEND_THRESHOLD and schedule_rate < 10 and demos < 3:
            signals.append({
                "type":    "REVIEW",
                "entity":  "campaign",
                "name":    campaign,
                "message": f"₹{int(spend):,} spent. Demo rate only {schedule_rate}%. Review targeting.",
                "data":    {"spend": spend, "demos": demos, "schedule_rate": schedule_rate},
                "priority": 2,
            })

    return signals


async def _creative_signals(db) -> list[dict]:
    """Generate creative fatigue signals from Meta ad-level data (frequency)."""
    # Only meta_ad uploads have frequency data
    docs = await db.ad_spend.find(
        {"source": "meta_ad", "frequency": {"$gt": FATIGUE_FREQUENCY}},
        {"_id": 0, "ad_name": 1, "campaign": 1, "ad_set": 1, "frequency": 1, "reach": 1, "spend": 1}
    ).to_list(50)

    signals = []
    for doc in docs:
        ad_name   = doc.get("ad_name") or doc.get("ad_set") or "Unknown Ad"
        frequency = doc.get("frequency", 0)
        signals.append({
            "type":    "FATIGUED",
            "entity":  "creative",
            "name":    ad_name,
            "message": f"Frequency {frequency:.1f}x — creative saturation. Refresh or rotate ad.",
            "data":    {"frequency": frequency, "reach": doc.get("reach"), "spend": doc.get("spend"), "campaign": doc.get("campaign")},
            "priority": 2,
        })

    return signals


# ── LLM Summary (Phase 2) ─────────────────────────────────────────────────

async def _llm_summary(signals: list[dict]) -> tuple[str | None, list[str]]:
    """Generate LLM-powered recommendation summary via Emergent LLM key."""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        llm_key = os.environ.get("LLM_API_KEY", "")
        if not llm_key or not signals:
            return None, []

        signal_text = "\n".join(
            f"- [{s['type']}] {s['entity'].upper()} '{s['name']}': {s['message']}"
            for s in signals[:15]  # cap at 15 signals
        )
        prompt = (
            "You are an ads performance analyst for MyGenie, a POS software company targeting Indian restaurants.\n\n"
            f"Current signals from our ad accounts:\n{signal_text}\n\n"
            "In 3 short sentences, summarise the key findings and the top 3 specific actions to take today. "
            "Be direct, use Indian Rupee amounts, and prioritise revenue impact."
        )

        chat = LlmChat(
            api_key=llm_key,
            session_id="ads_recommendations",
            system_message="You are a concise, data-driven Google and Meta Ads analyst.",
        ).with_model("anthropic", "claude-sonnet-4-5")

        response = await chat.send_message(UserMessage(text=prompt))
        summary_text = response.text if hasattr(response, "text") else str(response)

        # Extract top 3 actions (look for numbered list in response)
        lines = [l.strip() for l in summary_text.split("\n") if l.strip()]
        actions = [l for l in lines if l and (l[0].isdigit() or l.startswith("-"))][:3]

        return summary_text, actions

    except Exception as e:
        logger.error("LLM recommendation summary failed: %s", e)
        return None, []


# ── Public API ─────────────────────────────────────────────────────────────

async def get_recommendations(db, use_llm: bool = False) -> dict:
    """Run all rules engines and optionally generate LLM summary."""
    keyword_sigs  = await _keyword_signals(db)
    campaign_sigs = await _campaign_signals(db)
    creative_sigs = await _creative_signals(db)

    all_signals = sorted(
        keyword_sigs + campaign_sigs + creative_sigs,
        key=lambda s: (s["priority"], -s["data"].get("spend", 0))
    )

    llm_summary = None
    top_actions: list[str] = []

    if use_llm and all_signals:
        llm_summary, top_actions = await _llm_summary(all_signals)

    # Auto top_actions from rules if no LLM
    if not top_actions:
        top_actions = [s["message"] for s in all_signals[:3]]

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "signal_count": len(all_signals),
        "signals":      all_signals,
        "llm_summary":  llm_summary,
        "top_actions":  top_actions,
        "mcp_live":     False,  # updated to True when MCP connected
    }
```

---

## STEP 3.1 — `backend/ads_mcp.py` — NEW FILE (Meta + Google MCP clients)

```python
"""CR-24 — Ads MCP Clients.

Phase 3: Meta Ads MCP (https://mcp.facebook.com/ads)
Phase 4: Google Ads MCP (https://github.com/googleads/google-ads-mcp)

Both clients are graceful-degrading: if credentials are missing, they return
{"enabled": false} and the dashboard shows CSV-only mode.
"""
import logging
import os
import httpx
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

META_MCP_BASE    = "https://mcp.facebook.com/ads"
META_TOKEN       = os.environ.get("META_ACCESS_TOKEN", "")
META_AD_ACCOUNT  = os.environ.get("META_AD_ACCOUNT_ID", "")  # format: act_XXXXXXXXX
GOOGLE_TOKEN     = os.environ.get("GOOGLE_ADS_DEVELOPER_TOKEN", "")
GOOGLE_CUSTOMER  = os.environ.get("GOOGLE_ADS_CUSTOMER_ID", "")


def get_status() -> dict:
    return {
        "meta": {
            "enabled":    bool(META_TOKEN and META_AD_ACCOUNT),
            "account_id": META_AD_ACCOUNT or None,
        },
        "google": {
            "enabled":    bool(GOOGLE_TOKEN and GOOGLE_CUSTOMER),
            "customer_id": GOOGLE_CUSTOMER or None,
        },
    }


# ── Meta MCP ──────────────────────────────────────────────────────────────

async def _meta_call(tool: str, params: dict) -> dict:
    """Call Meta MCP tool via HTTP. Raises httpx.HTTPStatusError on failure."""
    headers = {
        "Authorization": f"Bearer {META_TOKEN}",
        "Content-Type":  "application/json",
    }
    payload = {"tool": tool, "params": params}
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(META_MCP_BASE, headers=headers, json=payload)
        r.raise_for_status()
        return r.json()


async def sync_meta(db) -> dict:
    """Pull Meta campaign + adset + ad insights via MCP and upsert into ad_spend."""
    if not META_TOKEN or not META_AD_ACCOUNT:
        return {"enabled": False, "message": "META_ACCESS_TOKEN or META_AD_ACCOUNT_ID not configured"}

    try:
        # Fetch campaigns
        campaigns_resp = await _meta_call("get_campaigns", {
            "ad_account_id": META_AD_ACCOUNT,
            "fields": ["id", "name", "status", "daily_budget"],
        })
        campaigns = campaigns_resp.get("data", [])

        # Fetch insights (last 30 days)
        insights_resp = await _meta_call("get_insights", {
            "ad_account_id": META_AD_ACCOUNT,
            "level": "ad",
            "date_preset": "last_30d",
            "fields": ["campaign_name", "adset_name", "ad_name", "spend",
                       "impressions", "reach", "frequency", "actions"],
        })
        insights = insights_resp.get("data", [])

        # Store in ad_spend with source="meta_mcp"
        now = datetime.now(timezone.utc).isoformat()
        docs = []
        for row in insights:
            spend = float(row.get("spend") or 0)
            if spend == 0:
                continue
            impr  = int(row.get("impressions") or 0)
            reach = int(row.get("reach") or 0)
            freq  = float(row.get("frequency") or 0) or (impr / reach if reach else None)
            docs.append({
                "source":       "meta_mcp",
                "campaign":     row.get("campaign_name"),
                "ad_set":       row.get("adset_name"),
                "ad_name":      row.get("ad_name"),
                "spend":        spend,
                "impressions":  impr,
                "reach":        reach,
                "frequency":    round(freq, 2) if freq else None,
                "synced_at":    now,
            })

        if docs:
            # Delete stale MCP data and replace
            await db.ad_spend.delete_many({"source": "meta_mcp"})
            await db.ad_spend.insert_many(docs)

        return {"enabled": True, "synced": len(docs), "campaigns": len(campaigns)}

    except Exception as e:
        logger.error("Meta MCP sync failed: %s", e)
        return {"enabled": True, "error": str(e), "synced": 0}


# ── Google Ads MCP ────────────────────────────────────────────────────────

async def sync_google(db) -> dict:
    """Pull Google Ads data via MCP GAQL query and upsert into ad_spend."""
    if not GOOGLE_TOKEN or not GOOGLE_CUSTOMER:
        return {"enabled": False, "message": "GOOGLE_ADS_DEVELOPER_TOKEN or GOOGLE_ADS_CUSTOMER_ID not configured"}

    # NOTE: Google Ads MCP server must be running locally or as a sidecar.
    # Endpoint: http://localhost:8080 (default for googleads/google-ads-mcp)
    google_mcp_base = os.environ.get("GOOGLE_ADS_MCP_URL", "http://localhost:8080")

    try:
        query = """
            SELECT
              campaign.name,
              ad_group.name,
              segments.keyword.text,
              segments.keyword.match_type,
              metrics.clicks,
              metrics.impressions,
              metrics.cost_micros
            FROM keyword_view
            WHERE segments.date DURING LAST_30_DAYS
              AND metrics.cost_micros > 0
        """
        headers = {
            "developer-token": GOOGLE_TOKEN,
            "Content-Type": "application/json",
        }
        payload = {
            "tool":   "search",
            "params": {"customer_id": GOOGLE_CUSTOMER, "query": query},
        }
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(f"{google_mcp_base}/tools", headers=headers, json=payload)
            r.raise_for_status()
            data = r.json()

        rows = data.get("results", [])
        now = datetime.now(timezone.utc).isoformat()
        docs = []
        for row in rows:
            cost_micros = int(row.get("metrics", {}).get("cost_micros", 0))
            if cost_micros == 0:
                continue
            spend = round(cost_micros / 1_000_000, 2)
            kw    = row.get("segments", {}).get("keyword", {})
            docs.append({
                "source":     "google_mcp",
                "campaign":   row.get("campaign", {}).get("name"),
                "ad_set":     row.get("ad_group", {}).get("name"),
                "keyword":    kw.get("text"),
                "match_type": kw.get("match_type"),
                "spend":      spend,
                "clicks":     int(row.get("metrics", {}).get("clicks", 0)),
                "impressions":int(row.get("metrics", {}).get("impressions", 0)),
                "synced_at":  now,
            })

        if docs:
            await db.ad_spend.delete_many({"source": "google_mcp"})
            await db.ad_spend.insert_many(docs)

        return {"enabled": True, "synced": len(docs)}

    except Exception as e:
        logger.error("Google Ads MCP sync failed: %s", e)
        return {"enabled": True, "error": str(e), "synced": 0}
```

---

## STEP 1.4 — `frontend/src/pages/LeadsView.jsx` — Tab Bar

### Add imports (after line 12 `import AdSpendUpload`)

```jsx
import AdsIntelTab from "../components/ads/AdsIntelTab";
```

### Add tab state (after line 162 `const [funnelFilters, setFunnelFilters]...`)

```jsx
const [activeTab, setActiveTab] = useState("funnel"); // "funnel" | "ads"
```

### Replace header section (lines 300–321) — add tab bar inside header

```jsx
<header className="border-b border-slate-200 bg-white sticky top-0 z-10">
  <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
    <div>
      <h1 className="text-xl font-semibold text-slate-800" data-testid="leads-title">
        {activeTab === "ads" ? "Ads Intelligence" : "Leads"}
      </h1>
      <p className="text-sm text-slate-500">
        {activeTab === "ads"
          ? "Campaign · keyword · creative · landing page performance"
          : "Read-only sales triage — Demo, Quote/Buy & Contact"}
      </p>
    </div>
    <div className="flex items-center gap-3">
      {/* Tab switcher */}
      <div data-testid="leads-tab-bar" className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold">
        <button
          data-testid="tab-funnel-leads"
          onClick={() => setActiveTab("funnel")}
          className={`px-4 py-2 transition-colors ${activeTab === "funnel"
            ? "bg-slate-900 text-white"
            : "bg-white text-slate-500 hover:bg-slate-50"}`}
        >
          Leads & Funnel
        </button>
        <button
          data-testid="tab-ads-intel"
          onClick={() => setActiveTab("ads")}
          className={`px-4 py-2 transition-colors border-l border-slate-200 ${activeTab === "ads"
            ? "bg-slate-900 text-white"
            : "bg-white text-slate-500 hover:bg-slate-50"}`}
        >
          Ads Intelligence
        </button>
      </div>
      {/* Existing action buttons */}
      {activeTab === "funnel" && (<>
        <button data-testid="leads-refresh" onClick={() => load(page)} ...>Refresh</button>
        <button data-testid="leads-export-csv" onClick={exportCsv} ...>Export CSV</button>
      </>)}
      <button data-testid="leads-signout" onClick={signOut} ...><LogOut /></button>
    </div>
  </div>
</header>
```

### Wrap existing `<main>` content in conditional + add Ads tab (lines 323–end)

```jsx
<main className="mx-auto max-w-7xl px-6 py-6 flex flex-col gap-6">
  {activeTab === "funnel" ? (
    <>
      {/* ALL EXISTING CONTENT — unchanged */}
      {/* Funnel filter bar, FunnelPanel, FunnelBySource, AttributionBreakdown, LostPanel, SyncStatus, AdSpendUpload, Summary chips, Leads table */}
    </>
  ) : (
    <AdsIntelTab token={token} />
  )}
</main>
```

---

## STEP 1.5 — `frontend/src/components/ads/` — 6 New Components

### `AdsIntelTab.jsx` — container that orchestrates all ads panels

```jsx
import { useState, useEffect, useCallback } from "react";
import ExecutiveSummary from "./ExecutiveSummary";
import KeywordIntelTable from "./KeywordIntelTable";
import MetaCreativeTable from "./MetaCreativeTable";
import LandingPagePanel from "./LandingPagePanel";
import DeviceCityPanel from "./DeviceCityPanel";
import AiRecommendations from "./AiRecommendations";

const API = process.env.REACT_APP_BACKEND_URL;

export default function AdsIntelTab({ token }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [summary,  setSummary]  = useState(null);
  const [loading,  setLoading]  = useState(true);

  const h = { Authorization: `Bearer ${token}` };

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (dateFrom) p.set("date_from", dateFrom);
      if (dateTo)   p.set("date_to", dateTo);
      const r = await fetch(`${API}/api/cms/ads/executive-summary?${p}`, { headers: h });
      if (r.ok) setSummary(await r.json());
    } finally { setLoading(false); }
  }, [token, dateFrom, dateTo]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  return (
    <div className="flex flex-col gap-6" data-testid="ads-intel-tab">
      {/* Date filter bar */}
      <section className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Period</span>
        <input type="date" data-testid="ads-filter-date-from"
          value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm" />
        <span className="text-slate-400">→</span>
        <input type="date" data-testid="ads-filter-date-to"
          value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm" />
        <button onClick={loadSummary}
          className="rounded bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
          Apply
        </button>
      </section>

      <ExecutiveSummary data={summary} loading={loading} />
      <AiRecommendations token={token} />
      <KeywordIntelTable token={token} dateFrom={dateFrom} dateTo={dateTo} />
      <MetaCreativeTable token={token} dateFrom={dateFrom} dateTo={dateTo} />
      <LandingPagePanel token={token} dateFrom={dateFrom} dateTo={dateTo} />
      <DeviceCityPanel  token={token} dateFrom={dateFrom} dateTo={dateTo} />
    </div>
  );
}
```

### `ExecutiveSummary.jsx` — blended KPI cards

```jsx
export default function ExecutiveSummary({ data, loading }) {
  if (loading) return <div data-testid="exec-summary-loading" className="h-28 rounded-xl border border-slate-200 bg-slate-100 animate-pulse" />;
  if (!data)   return null;

  const cards = [
    { label: "Total Spend",    value: data.total_spend  ? `₹${Number(data.total_spend).toLocaleString("en-IN")}` : "—",  color: "text-amber-600" },
    { label: "Total Leads",    value: data.total_leads ?? "—",  color: "text-slate-800" },
    { label: "Blended CPL",    value: data.blended_cpl  ? `₹${Number(data.blended_cpl).toLocaleString("en-IN")}` : "—",  color: "text-blue-600" },
    { label: "CP Demo",        value: data.blended_cp_demo ? `₹${Number(data.blended_cp_demo).toLocaleString("en-IN")}` : "—", color: "text-violet-600" },
    { label: "CP Win",         value: data.blended_cp_win  ? `₹${Number(data.blended_cp_win).toLocaleString("en-IN")}` : "—",  color: "text-emerald-600" },
    { label: "Won",            value: data.won ?? "—",      color: "text-emerald-700" },
  ];

  return (
    <section data-testid="executive-summary">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Executive Summary</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(c => (
          <div key={c.label} data-testid={`exec-card-${c.label.toLowerCase().replace(/\s+/g,"-")}`}
            className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
            <div className="text-[10px] uppercase tracking-widest text-slate-400">{c.label}</div>
            <div className={`mt-1 text-xl font-bold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>
      {/* Source split */}
      {data.source_split?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {data.source_split.map(s => (
            <div key={s.source} data-testid={`source-split-${s.source}`}
              className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${s.source === "google_paid" ? "bg-blue-500" : s.source === "meta" ? "bg-indigo-500" : "bg-slate-400"}`} />
              <span className="font-semibold text-slate-700">{s.label}</span>
              <span className="text-slate-500">{s.leads} leads</span>
              {s.spend && <span className="text-amber-600">₹{Number(s.spend).toLocaleString("en-IN")}</span>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
```

### `KeywordIntelTable.jsx` — keyword signals with SCALE/BLOCK/REVIEW badges

```jsx
import { useState, useEffect, useCallback } from "react";
const API = process.env.REACT_APP_BACKEND_URL;

const SIGNAL_BADGE = {
  SCALE:  { cls: "bg-emerald-100 text-emerald-700 border border-emerald-200", label: "SCALE" },
  BLOCK:  { cls: "bg-red-100 text-red-700 border border-red-200",             label: "BLOCK" },
  REVIEW: { cls: "bg-amber-100 text-amber-700 border border-amber-200",       label: "REVIEW" },
};

function computeSignal(row, medianCpWin) {
  const { spend = 0, schedule_rate = 100, won = 0, cp_win } = row;
  if (spend >= 1000 && schedule_rate < 20) return "BLOCK";
  if (cp_win != null && medianCpWin != null && cp_win < medianCpWin && won >= 2) return "SCALE";
  if (spend >= 5000 && schedule_rate < 10) return "REVIEW";
  return null;
}

export default function KeywordIntelTable({ token, dateFrom, dateTo }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ dimension: "keyword" });
      if (dateFrom) p.set("date_from", dateFrom);
      if (dateTo)   p.set("date_to", dateTo);
      const r = await fetch(`${API}/api/cms/funnel/by-attribution?${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setData(await r.json());
    } finally { setLoading(false); }
  }, [token, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const rows = data?.rows || [];
  const cpWins    = rows.map(r => r.cp_win).filter(v => v != null);
  const medianCpWin = cpWins.length
    ? cpWins.sort((a,b) => a-b)[Math.floor(cpWins.length/2)]
    : null;

  return (
    <section data-testid="keyword-intel-table">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
        Google Keyword Intelligence
      </h2>
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Keyword","Signal","Leads","Demo %","Won","CPL","CP Win","Spend"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                No keyword data yet. Add utm_term to your Google Ads URLs.
              </td></tr>
            )}
            {!loading && rows.map((r, i) => {
              const signal = computeSignal(r, medianCpWin);
              const badge  = signal ? SIGNAL_BADGE[signal] : null;
              return (
                <tr key={i} data-testid={`keyword-row-${i}`}
                  className={`hover:bg-slate-50 ${signal === "BLOCK" ? "bg-red-50/30" : signal === "SCALE" ? "bg-emerald-50/30" : ""}`}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700 max-w-[200px] truncate">{r.value}</td>
                  <td className="px-4 py-3">
                    {badge
                      ? <span data-testid={`signal-badge-${signal.toLowerCase()}`}
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>{badge.label}</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 font-semibold">{r.lead_in}</td>
                  <td className="px-4 py-3 text-slate-600">{r.schedule_rate}%</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">{r.won || 0}</td>
                  <td className="px-4 py-3">{r.cpl ? `₹${Number(r.cpl).toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-4 py-3 font-semibold">{r.cp_win ? `₹${Number(r.cp_win).toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-4 py-3 text-amber-700">{r.spend ? `₹${Number(r.spend).toLocaleString("en-IN")}` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

### `MetaCreativeTable.jsx` — Meta ad/creative with FATIGUED badge

```jsx
import { useState, useEffect, useCallback } from "react";
const API = process.env.REACT_APP_BACKEND_URL;

export default function MetaCreativeTable({ token, dateFrom, dateTo }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Uses "ad" dimension → utm_ad field (ad name)
      const p = new URLSearchParams({ dimension: "ad_set" });
      if (dateFrom) p.set("date_from", dateFrom);
      if (dateTo)   p.set("date_to", dateTo);
      const r = await fetch(`${API}/api/cms/funnel/by-attribution?${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setData(await r.json());
    } finally { setLoading(false); }
  }, [token, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  // Also load creative fatigue signals
  const [fatigued, setFatigued] = useState([]);
  useEffect(() => {
    fetch(`${API}/api/cms/ads/recommendations`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setFatigued(d.signals.filter(s => s.type === "FATIGUED").map(s => s.name));
      })
      .catch(() => {});
  }, [token]);

  const rows = data?.rows || [];

  return (
    <section data-testid="meta-creative-table">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
        Meta Ad Set Intelligence
      </h2>
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Ad Set","Signal","Leads","Demo %","Won","CPL","CP Win","Spend"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                No Meta ad set data. Add utm_content to your Meta ad URLs.
              </td></tr>
            )}
            {!loading && rows.map((r, i) => {
              const isFatigued = fatigued.includes(r.value);
              return (
                <tr key={i} data-testid={`meta-row-${i}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700 max-w-[200px] truncate">{r.value}</td>
                  <td className="px-4 py-3">
                    {isFatigued
                      ? <span data-testid="signal-badge-fatigued"
                          className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">FATIGUED</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 font-semibold">{r.lead_in}</td>
                  <td className="px-4 py-3">{r.schedule_rate}%</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">{r.won || 0}</td>
                  <td className="px-4 py-3">{r.cpl ? `₹${Number(r.cpl).toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-4 py-3 font-semibold">{r.cp_win ? `₹${Number(r.cp_win).toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-4 py-3 text-amber-700">{r.spend ? `₹${Number(r.spend).toLocaleString("en-IN")}` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

### `LandingPagePanel.jsx`

```jsx
import { useState, useEffect, useCallback } from "react";
const API = process.env.REACT_APP_BACKEND_URL;

export default function LandingPagePanel({ token, dateFrom, dateTo }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (dateFrom) p.set("date_from", dateFrom);
      if (dateTo)   p.set("date_to", dateTo);
      const r = await fetch(`${API}/api/cms/funnel/by-landing-page?${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setData(await r.json());
    } finally { setLoading(false); }
  }, [token, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const rows = data?.rows || [];

  return (
    <section data-testid="landing-page-panel">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Landing Page Performance</h2>
      {loading && <div className="h-24 rounded-xl border border-slate-200 bg-slate-100 animate-pulse" />}
      {!loading && rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
          No landing page data yet. Data populates as new leads come in with UTM tracking.
        </div>
      )}
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.map((r, i) => (
            <div key={i} data-testid={`lp-card-${r.landing_page.replace(/\//g, "-")}`}
              className="bg-white border border-slate-200 rounded-xl px-4 py-4 shadow-sm">
              <div className="font-mono text-xs text-indigo-600 font-bold truncate">{r.landing_page}</div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-slate-800">{r.lead_in}</div>
                  <div className="text-[10px] text-slate-400 uppercase">Leads</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-indigo-700">{r.demo_scheduled}</div>
                  <div className="text-[10px] text-slate-400 uppercase">Demos</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-emerald-600">{r.won}</div>
                  <div className="text-[10px] text-slate-400 uppercase">Won</div>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-slate-400 text-center">
                {r.otp_rate}% OTP · {r.mobile_pct}% mobile · {r.lead_to_win_pct}% Lead→Win
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
```

### `DeviceCityPanel.jsx`

```jsx
import { useState, useEffect, useCallback } from "react";
const API = process.env.REACT_APP_BACKEND_URL;

export default function DeviceCityPanel({ token, dateFrom, dateTo }) {
  const [deviceData, setDeviceData] = useState(null);
  const [cityData,   setCityData]   = useState(null);
  const [loading,    setLoading]    = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const h = { Authorization: `Bearer ${token}` };
    const p = new URLSearchParams();
    if (dateFrom) p.set("date_from", dateFrom);
    if (dateTo)   p.set("date_to", dateTo);
    const [d, c] = await Promise.allSettled([
      fetch(`${API}/api/cms/funnel/by-device?${p}`, { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/api/cms/funnel/by-city?${p}`, { headers: h }).then(r => r.ok ? r.json() : null),
    ]);
    if (d.status === "fulfilled") setDeviceData(d.value);
    if (c.status === "fulfilled") setCityData(c.value);
    setLoading(false);
  }, [token, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  return (
    <section data-testid="device-city-panel" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Device */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Device Performance</h3>
        {loading && <div className="h-16 bg-slate-100 animate-pulse rounded-lg" />}
        {!loading && (deviceData?.rows || []).map((r, i) => (
          <div key={i} data-testid={`device-row-${r.device}`} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${r.device === "mobile" ? "bg-blue-500" : "bg-slate-400"}`} />
              <span className="text-sm font-medium capitalize text-slate-700">{r.device}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>{r.lead_in} leads</span>
              <span className="text-indigo-600">{r.demo_scheduled} demos</span>
              <span className="text-emerald-600 font-semibold">{r.won} won</span>
              <span>{r.otp_rate}% OTP</span>
            </div>
          </div>
        ))}
      </div>

      {/* Top cities */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Top Cities</h3>
        {loading && <div className="h-16 bg-slate-100 animate-pulse rounded-lg" />}
        {!loading && (cityData?.rows || []).slice(0, 10).map((r, i) => (
          <div key={i} data-testid={`city-row-${r.city.toLowerCase()}`}
            className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <span className="text-sm text-slate-700">{r.city}</span>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>{r.lead_in} leads</span>
              <span className="text-emerald-600 font-semibold">{r.won} won</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

### `AiRecommendations.jsx`

```jsx
import { useState, useEffect, useCallback } from "react";
const API = process.env.REACT_APP_BACKEND_URL;

const SIGNAL_STYLES = {
  SCALE:    { bg: "bg-emerald-50 border-emerald-200", badge: "bg-emerald-100 text-emerald-700", icon: "↑" },
  PAUSE:    { bg: "bg-red-50 border-red-200",         badge: "bg-red-100 text-red-700",         icon: "⏸" },
  BLOCK:    { bg: "bg-red-50 border-red-200",         badge: "bg-red-100 text-red-700",         icon: "⊘" },
  FATIGUED: { bg: "bg-orange-50 border-orange-200",   badge: "bg-orange-100 text-orange-700",   icon: "↻" },
  REVIEW:   { bg: "bg-amber-50 border-amber-200",     badge: "bg-amber-100 text-amber-700",     icon: "!" },
};

export default function AiRecommendations({ token }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [llmBusy, setLlmBusy] = useState(false);

  const load = useCallback(async (useLlm = false) => {
    useLlm ? setLlmBusy(true) : setLoading(true);
    try {
      const p = useLlm ? "?use_llm=true" : "";
      const r = await fetch(`${API}/api/cms/ads/recommendations${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setData(await r.json());
    } finally { useLlm ? setLlmBusy(false) : setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const signals = data?.signals || [];

  return (
    <section data-testid="ai-recommendations">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          AI Recommendations
        </h2>
        <button
          data-testid="generate-ai-summary-btn"
          onClick={() => load(true)}
          disabled={llmBusy}
          className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          {llmBusy ? "Generating…" : "Generate AI Summary"}
        </button>
      </div>

      {/* LLM summary */}
      {data?.llm_summary && (
        <div data-testid="llm-summary" className="mb-4 bg-slate-900 text-slate-100 rounded-xl p-4 text-sm leading-relaxed">
          {data.llm_summary}
        </div>
      )}

      {/* Top actions */}
      {data?.top_actions?.length > 0 && (
        <div className="mb-4 bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Top Actions</p>
          {data.top_actions.map((a, i) => (
            <div key={i} className="flex items-start gap-2 py-1">
              <span className="text-emerald-500 font-bold text-xs mt-0.5">{i+1}.</span>
              <span className="text-sm text-slate-700">{a}</span>
            </div>
          ))}
        </div>
      )}

      {/* Signal cards */}
      {loading && <div className="h-20 rounded-xl border border-slate-200 bg-slate-100 animate-pulse" />}
      {!loading && signals.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
          No signals yet. Upload ad spend data to generate recommendations.
        </div>
      )}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {signals.map((s, i) => {
            const style = SIGNAL_STYLES[s.type] || SIGNAL_STYLES.REVIEW;
            return (
              <div key={i} data-testid={`signal-card-${s.type.toLowerCase()}-${i}`}
                className={`rounded-xl border p-4 ${style.bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${style.badge}`}>
                    {style.icon} {s.type}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide">{s.entity}</span>
                </div>
                <p className="text-xs font-semibold text-slate-800 truncate">{s.name}</p>
                <p className="text-xs text-slate-600 mt-1">{s.message}</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
```

---

## ENVIRONMENT VARIABLES TO ADD (`backend/.env`)

```
# CR-24 Meta MCP (Phase 3 — owner provides)
META_ACCESS_TOKEN=
META_AD_ACCOUNT_ID=

# CR-24 Google Ads MCP (Phase 4 — owner provides)
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_CUSTOMER_ID=
GOOGLE_ADS_MCP_URL=http://localhost:8080
```

---

## ACCEPTANCE CRITERIA

### Backend
- [ ] `GET /api/cms/funnel/by-landing-page` returns rows with `landing_page`, `lead_in`, `otp_rate`, `schedule_rate`, `won`, `mobile_pct`
- [ ] `GET /api/cms/funnel/by-device` returns rows for `mobile` and `desktop`
- [ ] `GET /api/cms/funnel/by-city` returns top 20 cities with lead counts
- [ ] `GET /api/cms/ads/executive-summary` returns blended CPL, CP-Win, source split
- [ ] `GET /api/cms/ads/recommendations` returns signals even with no MCP tokens
- [ ] New CSV parsers detect and parse Search Terms, Ad Copy, Meta Ad-level, Meta Breakdown CSVs
- [ ] Existing CSV parsers (Google Campaign, Keywords, Meta Campaign+AdSet) unaffected
- [ ] All 5 new endpoints return 401 without JWT token
- [ ] `ads_mcp.py` returns `{"enabled": false}` when no tokens configured

### Frontend
- [ ] Tab bar shows "Leads & Funnel" and "Ads Intelligence" tabs
- [ ] Switching tabs does not unmount existing funnel data
- [ ] `AdsIntelTab` renders all 6 panels
- [ ] `KeywordIntelTable` shows SCALE badge when CP-Win < median and won >= 2
- [ ] `KeywordIntelTable` shows BLOCK badge when spend > 1000 and OTP rate < 20%
- [ ] `MetaCreativeTable` shows FATIGUED badge when creative appears in signals
- [ ] `AiRecommendations` shows signal cards even when LLM summary is null
- [ ] "Generate AI Summary" button calls `?use_llm=true` and shows response
- [ ] `LandingPagePanel` shows cards per landing page
- [ ] `DeviceCityPanel` shows mobile vs desktop rows and top 10 cities
- [ ] `ExecutiveSummary` shows 6 KPI cards and source split

---

## FILE CHECKLIST

```
✅ MODIFY:
  backend/funnel.py         + _landing_page(), _device(), _city_val() helpers
                            + get_funnel_by_landing_page()
                            + get_funnel_by_device()
                            + get_funnel_by_city()
                            + get_executive_summary()

  backend/ad_spend.py       + extend SpendRow (8 new optional fields)
                            + extend detect_platform() (4 new types)
                            + parse_google_search_terms_csv()
                            + parse_google_ads_csv()
                            + parse_meta_ad_csv()
                            + parse_meta_breakdown_csv()
                            + extend parse_csv() dispatch

  backend/server.py         + import recommendations, ads_mcp
                            + extend ad_spend upload docs dict
                            + GET /cms/funnel/by-landing-page
                            + GET /cms/funnel/by-device
                            + GET /cms/funnel/by-city
                            + GET /cms/ads/executive-summary
                            + GET /cms/ads/recommendations
                            + POST /cms/ads/mcp/meta/sync
                            + POST /cms/ads/mcp/google/sync
                            + GET /cms/ads/mcp/status

  backend/.env              + 5 new optional keys (empty values OK)

  frontend/LeadsView.jsx    + import AdsIntelTab
                            + activeTab state
                            + tab bar in header
                            + conditional render in main

✅ CREATE:
  backend/ads_mcp.py
  backend/recommendations.py
  frontend/src/components/ads/AdsIntelTab.jsx
  frontend/src/components/ads/ExecutiveSummary.jsx
  frontend/src/components/ads/KeywordIntelTable.jsx
  frontend/src/components/ads/MetaCreativeTable.jsx
  frontend/src/components/ads/LandingPagePanel.jsx
  frontend/src/components/ads/DeviceCityPanel.jsx
  frontend/src/components/ads/AiRecommendations.jsx
```

---

*Implementation plan complete. Ready for G3 build on owner approval.*
*Prepared by E1, Emergent Labs — 2026-06-26*
