"""CR-19 — Funnel aggregation queries (read-only).

Reads from demo_requests, quotes, contact_messages, and backfilled_leads.
No writes. Returns data for the funnel summary, by-source breakdown,
lost analysis, and sync status panels.
"""
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

FETCH_CAP = 10000


# ── Helpers ────────────────────────────────────────────────────────────────

def _parse_dt(value):
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str):
        try:
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except ValueError:
            return None
    return None


def _source_label(doc) -> str:
    """Derive a display source bucket from attribution or CRM fields.

    Backfilled (historic) contacts use first_source set by the old website:
      - "google", "google1", "Google"  → google_paid
      - "facebook", "fb", etc.         → meta
      - "website", "web"               → website
      - "chat"                         → chat
    New website leads use full UTM attribution.
    """
    a = doc.get("attribution") or {}
    src = (
        a.get("first_utm_source")
        or doc.get("first_source")
        or ""
    ).lower().strip()
    medium = (
        a.get("first_utm_medium")
        or a.get("last_utm_medium")
        or doc.get("first_medium")
        or ""
    ).lower()
    gclid  = a.get("gclid") or ""
    fbclid = a.get("fbclid") or doc.get("fbclid") or ""

    # Facebook / Meta
    if fbclid or "facebook" in src or "meta" in src or src in ("fb",):
        return "meta"

    # Google paid
    if gclid or "google" in src or medium in ("cpc", "ppc", "paid", "paidsearch"):
        return "google_paid"

    # Website / organic web traffic
    if src in ("website", "web"):
        return "website"

    # Chat / live-chat leads
    if src in ("chat", "livechat", "live_chat"):
        return "chat"

    if doc.get("backfilled") and not src:
        return "legacy"
    if src and src not in ("", "direct", "(direct)", "(none)"):
        return "other"
    return "direct"


SOURCE_LABELS = {
    "google_paid": "Google",
    "meta":        "Meta",
    "website":     "Website",
    "chat":        "Chat",
    "organic":     "Organic",
    "direct":      "Direct",
    "legacy":      "Legacy (pre-launch)",
    "other":       "Other",
}

# Stage counting: a lead counts for all stages it has PASSED THROUGH
STAGE_STATUSES = {
    "demo_scheduled": {"demo_scheduled", "demo_given", "won", "lost"},
    "demo_given":     {"demo_given", "won", "lost"},
    "won":            {"won"},
    "lost":           {"lost"},
}


def _in_stage(crm_status, stage) -> bool:
    return (crm_status or "") in STAGE_STATUSES.get(stage, set())


async def _load_all(db, date_from=None, date_to=None, lead_type=None):
    """Load all lead docs from the three collections + backfilled_leads.
    Applies date and type filters. Returns flat list of dicts."""
    df = _parse_dt(date_from) if date_from else None
    dt = _parse_dt(date_to)   if date_to   else None
    rows = []
    sources = []
    if not lead_type or lead_type == "demo":
        sources.append(("demo", db.demo_requests))
    if not lead_type or lead_type == "quote":
        sources.append(("quote", db.quotes))
    if not lead_type or lead_type == "contact":
        sources.append(("contact", db.contact_messages))
    # backfilled leads always included (they are demo leads from before go-live)
    if not lead_type or lead_type == "demo":
        sources.append(("backfilled", db.backfilled_leads))

    for ltype, coll in sources:
        # For backfilled_leads: only load contacts WITH attribution source.
        # The 282 no-source contacts (from generic sync) are organic/unknown leads
        # and must not pollute the paid-source ad performance funnel.
        query = {"first_source": {"$ne": None}} if ltype == "backfilled" else {}
        docs = await coll.find(query, {"_id": 0}).to_list(FETCH_CAP)
        for d in docs:
            d["_lead_type"] = ltype
            # date filter
            if df or dt:
                rdt = _parse_dt(d.get("created_at"))
                if rdt is None:
                    continue
                if df and rdt < df:
                    continue
                if dt and rdt > dt:
                    continue
            rows.append(d)
    return rows


def _pct(num, denom) -> float:
    if not denom:
        return 0.0
    return round(num / denom * 100, 1)


def _drop(from_count, to_count) -> float:
    if not from_count:
        return 0.0
    return round((from_count - to_count) / from_count * 100, 1)


# ── Public query functions ─────────────────────────────────────────────────

async def get_funnel_summary(db, date_from=None, date_to=None, lead_type=None, source=None):
    rows = await _load_all(db, date_from, date_to, lead_type)

    if source:
        rows = [r for r in rows if _source_label(r) == source]

    lead_in        = len(rows)
    # otp_verified: True for new website leads (MongoDB field) AND
    # backfilled leads marked via Freshsales cf_rooms="Yes" sync
    otp_verified   = sum(1 for r in rows if r.get("otp_verified") is True)
    demo_scheduled = sum(1 for r in rows if _in_stage(r.get("crm_status"), "demo_scheduled"))
    demo_given     = sum(1 for r in rows if _in_stage(r.get("crm_status"), "demo_given"))
    won            = sum(1 for r in rows if _in_stage(r.get("crm_status"), "won"))
    lost           = sum(1 for r in rows if _in_stage(r.get("crm_status"), "lost"))

    return {
        "lead_in":        lead_in,
        "otp_verified":   otp_verified,
        "demo_scheduled": demo_scheduled,
        "demo_given":     demo_given,
        "won":            won,
        "lost":           lost,
        "rates": {
            "otp_rate":      _pct(otp_verified, lead_in),
            "schedule_rate": _pct(demo_scheduled, lead_in),
            "given_rate":    _pct(demo_given, demo_scheduled),
            "won_rate":      _pct(won, demo_given),
            "lead_to_win":   _pct(won, lead_in),
            "lost_rate":     _pct(lost, lead_in),
        },
        "dropoff": {
            "after_lead":     _drop(lead_in, demo_scheduled),
            "after_schedule": _drop(demo_scheduled, demo_given),
            "after_given":    _drop(demo_given, won),
        },
    }


async def _get_spend_by_source(db) -> dict:
    """Return spend per source — covers both CSV uploads and live API syncs."""
    result = {}

    # CSV uploads (google, meta, google_keywords, etc.)
    for source in ("google", "meta"):
        upload = await db.ad_spend_uploads.find_one(
            {"source": source}, {"_id": 0}, sort=[("uploaded_at", -1)]
        )
        if upload:
            pipeline = [
                {"$match": {"upload_id": upload["upload_id"]}},
                {"$group": {"_id": None, "total": {"$sum": "$spend"}}},
            ]
            agg = await db.ad_spend.aggregate(pipeline).to_list(1)
            result[source] = {
                "spend":        agg[0]["total"] if agg else 0.0,
                "period_start": upload.get("period_start"),
                "period_end":   upload.get("period_end"),
                "data_source":  "csv",
            }

    # Live API syncs — meta_api and google override CSV if present
    # IMPORTANT: only sum campaign-level rows to avoid triple-counting
    # (campaign + adset + ad all carry the same spend)
    for api_source, map_key, level_filter in (
        ("meta_api", "meta", "campaign"),
        ("google",   "google", "campaign"),
    ):
        match = {"source": api_source}
        if level_filter:
            match["level"] = level_filter
        agg_pipe = [
            {"$match": match},
            {"$group": {
                "_id": None,
                "total":      {"$sum": "$spend"},
                "date_start": {"$min": "$date_start"},
                "date_stop":  {"$max": "$date_stop"},
                "synced_at":  {"$max": "$synced_at"},
            }},
        ]
        agg = await db.ad_spend.aggregate(agg_pipe).to_list(1)
        if agg and agg[0]["total"]:
            result[map_key] = {
                "spend":        agg[0]["total"],
                "period_start": agg[0].get("date_start"),
                "period_end":   agg[0].get("date_stop"),
                "synced_at":    agg[0].get("synced_at"),
                "data_source":  "api",
            }

    return result


def _fmt_cost(spend: float, count: int) -> float | None:
    if not count or not spend:
        return None
    return round(spend / count, 0)


async def get_funnel_by_source(db, date_from=None, date_to=None, lead_type=None):
    rows = await _load_all(db, date_from, date_to, lead_type)
    spend_map = await _get_spend_by_source(db)

    # Map funnel source bucket → ad_spend source key
    SOURCE_TO_SPEND = {"google_paid": "google", "meta": "meta"}

    buckets: dict[str, list] = {}
    for r in rows:
        src = _source_label(r)
        buckets.setdefault(src, []).append(r)

    result = []
    order = ["google_paid", "meta", "website", "chat", "organic", "direct", "legacy", "other"]
    for src in order:
        if src not in buckets:
            continue
        grp = buckets[src]
        lead_in        = len(grp)
        otp_verified   = sum(1 for r in grp if r.get("otp_verified") is True)
        demo_scheduled = sum(1 for r in grp if _in_stage(r.get("crm_status"), "demo_scheduled"))
        demo_given     = sum(1 for r in grp if _in_stage(r.get("crm_status"), "demo_given"))
        won            = sum(1 for r in grp if _in_stage(r.get("crm_status"), "won"))
        lost           = sum(1 for r in grp if _in_stage(r.get("crm_status"), "lost"))

        spend_key = SOURCE_TO_SPEND.get(src)
        spend_info = spend_map.get(spend_key) if spend_key else None
        spend = spend_info["spend"] if spend_info else None

        result.append({
            "source":          src,
            "label":           SOURCE_LABELS.get(src, src),
            "lead_in":         lead_in,
            "otp_verified":    otp_verified,
            "otp_rate":        _pct(otp_verified, lead_in),
            "demo_scheduled":  demo_scheduled,
            "schedule_rate":   _pct(demo_scheduled, otp_verified or lead_in),
            "demo_given":      demo_given,
            "given_rate":      _pct(demo_given, demo_scheduled),
            "won":             won,
            "won_rate":        _pct(won, demo_given),
            "lost":            lost,
            "lead_to_win_pct": _pct(won, lead_in),
            # CR-19 Phase 3: cost metrics
            "spend":           spend,
            "spend_period":    f"{spend_info['period_start']} – {spend_info['period_end']}" if spend_info else None,
            "cpl":             _fmt_cost(spend, lead_in),
            "cp_sched":        _fmt_cost(spend, demo_scheduled),
            "cp_demo":         _fmt_cost(spend, demo_given),
            "cp_win":          _fmt_cost(spend, won),
        })

    return result


async def get_lost_breakdown(db, date_from=None, date_to=None):
    rows = await _load_all(db, date_from, date_to, None)
    lost_rows = [r for r in rows if (r.get("crm_status") or "") == "lost"]
    total = len(lost_rows)

    reason_counts: dict[str, int] = {}
    for r in lost_rows:
        reason = r.get("crm_lost_reason") or "Unknown"
        reason_counts[reason] = reason_counts.get(reason, 0) + 1

    reasons = sorted(
        [{"reason": k, "count": v, "pct": _pct(v, total)}
         for k, v in reason_counts.items()],
        key=lambda x: -x["count"],
    )

    # Average days to lost (created_at → crm_status_updated_at)
    days_list = []
    for r in lost_rows:
        t0 = _parse_dt(r.get("created_at"))
        t1 = _parse_dt(r.get("crm_status_updated_at"))
        if t0 and t1 and t1 > t0:
            days_list.append((t1 - t0).total_seconds() / 86400)
    avg_days = round(sum(days_list) / len(days_list), 1) if days_list else None

    return {
        "total_lost": total,
        "avg_days_to_lost": avg_days,
        "reasons": reasons,
    }


async def _get_spend_by_adset(db) -> dict:
    """Return total spend keyed by ad_set name: { "Restaurants_June": 18400.0, ... }"""
    pipeline = [
        {"$match": {"ad_set": {"$ne": None}}},
        {"$group": {"_id": "$ad_set", "total": {"$sum": "$spend"}}},
    ]
    docs = await db.ad_spend.aggregate(pipeline).to_list(1000)
    return {d["_id"]: d["total"] for d in docs if d["_id"]}


async def _get_spend_by_keyword(db) -> dict:
    """Return total spend keyed by keyword: { "restaurant pos": 18400.0, ... }
    Normalises to lowercase+trim for matching against lead utm_term."""
    pipeline = [
        {"$match": {"keyword": {"$ne": None}}},
        {"$group": {"_id": {"$toLower": {"$trim": {"input": "$keyword"}}},
                    "total": {"$sum": "$spend"}}},
    ]
    docs = await db.ad_spend.aggregate(pipeline).to_list(1000)
    return {d["_id"]: d["total"] for d in docs if d["_id"]}


async def get_funnel_by_attribution(db, dimension="keyword", date_from=None,
                                     date_to=None, source=None):
    """CR-19 Phase 4 — group by keyword (utm_term) or ad_set (utm_content).
    Only includes leads where the chosen dimension field is populated (new data only).
    """
    if dimension not in ("keyword", "ad_set"):
        return {"error": "dimension must be 'keyword' or 'ad_set'"}

    rows = await _load_all(db, date_from, date_to, lead_type=None)

    # Map dimension to the attribution key
    attr_key = "utm_term" if dimension == "keyword" else "utm_content"

    # Keep only leads with the dimension populated
    def _dim_val(doc):
        a = doc.get("attribution") or {}
        v = a.get(attr_key) or ""
        return v.strip() if isinstance(v, str) else ""

    rows = [r for r in rows if _dim_val(r)]

    # Optional source filter
    if source:
        rows = [r for r in rows if _source_label(r) == source]

    # Spend lookup for ad_set or keyword dimension
    spend_map = {}
    if dimension == "ad_set":
        spend_map = await _get_spend_by_adset(db)
    elif dimension == "keyword":
        spend_map = await _get_spend_by_keyword(db)

    # Group by dimension value
    buckets: dict[str, list] = {}
    for r in rows:
        key = _dim_val(r)
        buckets.setdefault(key, []).append(r)

    result = []
    for key, grp in buckets.items():
        lead_in        = len(grp)
        demo_scheduled = sum(1 for r in grp if _in_stage(r.get("crm_status"), "demo_scheduled"))
        demo_given     = sum(1 for r in grp if _in_stage(r.get("crm_status"), "demo_given"))
        won            = sum(1 for r in grp if _in_stage(r.get("crm_status"), "won"))
        lost           = sum(1 for r in grp if _in_stage(r.get("crm_status"), "lost"))

        # Source — if all leads in group share one source, show it; else "mixed"
        sources_in_grp = {_source_label(r) for r in grp}
        src_label = SOURCE_LABELS.get(next(iter(sources_in_grp)), "Other") \
                    if len(sources_in_grp) == 1 else "Mixed"

        spend = spend_map.get(key.lower().strip()) if dimension == "keyword" else spend_map.get(key)

        result.append({
            "value":          key,
            "source":         src_label,
            "lead_in":        lead_in,
            "demo_scheduled": demo_scheduled,
            "schedule_rate":  _pct(demo_scheduled, lead_in),
            "demo_given":     demo_given,
            "given_rate":     _pct(demo_given, demo_scheduled),
            "won":            won,
            "won_rate":       _pct(won, demo_given),
            "lost":           lost,
            "lead_to_win_pct": _pct(won, lead_in),
            "spend":          spend,
            "cpl":            _fmt_cost(spend, lead_in),
            "cp_sched":       _fmt_cost(spend, demo_scheduled),
            "cp_demo":        _fmt_cost(spend, demo_given),
            "cp_win":         _fmt_cost(spend, won),
        })

    result.sort(key=lambda x: -x["lead_in"])

    return {
        "dimension":        dimension,
        "rows":             result,
        "total_new_leads":  len(rows),
        "note":             "Shows only leads with UTM attribution data (post go-live)",
    }


# ── CR-24 Phase 1 helpers ──────────────────────────────────────────────────

def _landing_page(doc) -> str:
    a = doc.get("attribution") or {}
    lp = a.get("landing_page") or ""
    if lp and "?" in lp:
        lp = lp.split("?")[0]
    return lp.strip() or "/"


def _device(doc) -> str:
    a = doc.get("attribution") or {}
    return (a.get("device_type") or "unknown").lower()


def _city_val(doc) -> str:
    geo = doc.get("geo") or {}
    return (doc.get("city") or geo.get("city") or "").strip()


async def get_funnel_by_landing_page(db, date_from=None, date_to=None, source=None):
    """CR-24 — Funnel breakdown by landing page."""
    rows = await _load_all(db, date_from, date_to, lead_type=None)
    rows = [r for r in rows if r.get("_lead_type") != "backfilled"]
    if source:
        rows = [r for r in rows if _source_label(r) == source]
    rows = [r for r in rows if _landing_page(r) not in ("",)]

    buckets: dict[str, list] = {}
    for r in rows:
        buckets.setdefault(_landing_page(r), []).append(r)

    result = []
    for lp, grp in sorted(buckets.items(), key=lambda x: -len(x[1])):
        lead_in        = len(grp)
        otp_verified   = sum(1 for r in grp if r.get("otp_verified") is True)
        demo_scheduled = sum(1 for r in grp if _in_stage(r.get("crm_status"), "demo_scheduled"))
        demo_given     = sum(1 for r in grp if _in_stage(r.get("crm_status"), "demo_given"))
        won            = sum(1 for r in grp if _in_stage(r.get("crm_status"), "won"))
        lost           = sum(1 for r in grp if _in_stage(r.get("crm_status"), "lost"))
        mobile_count   = sum(1 for r in grp if _device(r) == "mobile")
        desktop_count  = sum(1 for r in grp if _device(r) == "desktop")
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


async def get_funnel_by_device(db, date_from=None, date_to=None, source=None):
    """CR-24 — Funnel breakdown by device type."""
    rows = await _load_all(db, date_from, date_to, lead_type=None)
    backfilled_count = sum(1 for r in rows if r.get("_lead_type") == "backfilled")
    rows = [r for r in rows if r.get("_lead_type") != "backfilled"]
    if source:
        rows = [r for r in rows if _source_label(r) == source]

    buckets: dict[str, list] = {}
    for r in rows:
        buckets.setdefault(_device(r), []).append(r)

    result = []
    for dev in ["mobile", "desktop", "unknown"]:
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

    return {"rows": result, "total_leads": len(rows), "backfilled_excluded": backfilled_count}


async def get_funnel_by_city(db, date_from=None, date_to=None, source=None, top_n=20):
    """CR-24 — Funnel breakdown by city, top N."""
    rows = await _load_all(db, date_from, date_to, lead_type=None)
    if source:
        rows = [r for r in rows if _source_label(r) == source]

    buckets: dict[str, list] = {}
    for r in rows:
        city = _city_val(r) or "Unknown"
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


async def get_executive_summary(db, date_from=None, date_to=None, status=None):
    """CR-24 — Blended ad performance summary card."""
    rows      = await _load_all(db, date_from, date_to, lead_type=None)
    spend_map = await _get_spend_by_source(db)

    total_leads    = len(rows)
    otp_verified   = sum(1 for r in rows if r.get("otp_verified") is True)
    demo_scheduled = sum(1 for r in rows if _in_stage(r.get("crm_status"), "demo_scheduled"))
    demo_given     = sum(1 for r in rows if _in_stage(r.get("crm_status"), "demo_given"))
    won            = sum(1 for r in rows if _in_stage(r.get("crm_status"), "won"))
    lost           = sum(1 for r in rows if _in_stage(r.get("crm_status"), "lost"))

    total_spend = sum(v.get("spend") or 0 for v in spend_map.values())

    source_buckets: dict[str, list] = {}
    for r in rows:
        source_buckets.setdefault(_source_label(r), []).append(r)

    SOURCE_TO_SPEND = {"google_paid": "google", "meta": "meta"}
    source_split = []
    for src, grp in sorted(source_buckets.items(), key=lambda x: -len(x[1])):
        spend_key = SOURCE_TO_SPEND.get(src)
        src_spend = spend_map.get(spend_key, {}).get("spend") if spend_key else None
        src_won   = sum(1 for r in grp if _in_stage(r.get("crm_status"), "won"))
        source_split.append({
            "source":    src,
            "label":     SOURCE_LABELS.get(src, src),
            "leads":     len(grp),
            "won":       src_won,
            "spend":     src_spend,
            "pct_leads": _pct(len(grp), total_leads),
        })

    campaign_match = {"source": {"$in": ["meta_api", "google"]}, "level": "campaign"}
    if status:
        campaign_match.update(_status_filter(status))
    pipeline_top = [
        {"$match": campaign_match},
        {"$group": {
            "_id":              "$campaign",
            "spend":            {"$sum": "$spend"},
            "impressions":      {"$sum": "$impressions"},
            "clicks":           {"$sum": "$clicks"},
            "book_demo_count":  {"$sum": "$book_demo_count"},
            "schedule_count":   {"$sum": "$schedule_count"},
            "demo_given_count": {"$sum": "$demo_given_count"},
            "purchase_count":   {"$sum": "$purchase_count"},
            "effective_status": {"$last": "$effective_status"},
            "source":           {"$last": "$source"},
        }},
        {"$sort": {"spend": -1}},
        {"$limit": 25},
    ]
    campaign_docs = await db.ad_spend.aggregate(pipeline_top).to_list(25)

    return {
        "total_leads":     total_leads,
        "otp_verified":    otp_verified,
        "otp_rate":        _pct(otp_verified, total_leads),
        "demo_scheduled":  demo_scheduled,
        "demo_given":      demo_given,
        "won":             won,
        "lost":            lost,
        "total_spend":     total_spend,
        "blended_cpl":     _fmt_cost(total_spend, total_leads),
        "blended_cp_demo": _fmt_cost(total_spend, demo_given),
        "blended_cp_win":  _fmt_cost(total_spend, won),
        "source_split":    source_split,
        "campaigns": [
            {
                "name":              d["_id"],
                "status":            d.get("effective_status", "ACTIVE"),
                "spend":             d["spend"],
                "impressions":       d.get("impressions") or 0,
                "clicks":            d.get("clicks") or 0,
                "ctr":               round(d["clicks"] / d["impressions"] * 100, 2) if d.get("impressions") and d.get("clicks") else None,
                "cpc":               round(d["spend"] / d["clicks"], 2)           if d.get("clicks") else None,
                "cpm":               round(d["spend"] / d["impressions"] * 1000, 2) if d.get("impressions") else None,
                # 4 pixel events
                "book_demo_count":   d.get("book_demo_count", 0),
                "schedule_count":    d.get("schedule_count", 0),
                "demo_given_count":  d.get("demo_given_count", 0),
                "purchase_count":    d.get("purchase_count", 0),
                # cost per event
                "cost_per_book_demo":  round(d["spend"] / d["book_demo_count"], 0)  if d.get("book_demo_count")  else None,
                "cost_per_schedule":   round(d["spend"] / d["schedule_count"], 0)   if d.get("schedule_count")   else None,
                "cost_per_demo_given": round(d["spend"] / d["demo_given_count"], 0) if d.get("demo_given_count") else None,
                "cost_per_purchase":   round(d["spend"] / d["purchase_count"], 0)   if d.get("purchase_count")   else None,
                "source": d.get("source", "meta_api"),
            }
            for d in campaign_docs
        ],
        "spend_periods": {k: v.get("spend_period") for k, v in spend_map.items()},
    }


async def get_sync_status(db):
    try:
        doc = await db.crm_sync_log.find_one(
            {}, {"_id": 0}, sort=[("started_at", -1)]
        )
    except Exception as e:
        logger.error("funnel get_sync_status error: %s", e)
        doc = None
    if not doc:
        return {
            "last_sync_at": None,
            "last_sync_trigger": None,
            "contacts_updated": 0,
            "errors": 0,
            "sync_enabled": bool(
                __import__("os").environ.get("CRM_SYNC_ENABLED", "true").lower() == "true"
            ),
        }
    return {
        "last_sync_at":      doc.get("started_at"),
        "last_sync_trigger": doc.get("trigger"),
        "contacts_updated":  doc.get("matched", 0),
        "errors":            doc.get("errors", 0),
        "sync_enabled":      True,
    }



async def get_lead_quality_breakdown(db) -> dict:
    """Score every lead across quality dimensions and return breakdown by source."""
    try:
        rows = await _load_all(db)

        def _score(r) -> int:
            score = 0
            if r.get("otp_verified") is True:
                score += 3
            status = (r.get("crm_status") or "").lower()
            if _in_stage(status, "demo_scheduled"):
                score += 2
            if _in_stage(status, "demo_given"):
                score += 3
            if _in_stage(status, "won"):
                score += 5
            if r.get("business_name") and str(r.get("business_name")).strip():
                score += 1
            a = r.get("attribution") or {}
            city = (a.get("city") or r.get("city") or "").strip()
            if city:
                score += 1
            return score

        def _bucket(score: int) -> str:
            if score >= 10:
                return "Won"
            if score >= 6:
                return "High Intent"
            if score >= 3:
                return "Qualified"
            return "Unqualified"

        buckets = {"Unqualified": 0, "Qualified": 0, "High Intent": 0, "Won": 0}
        source_data: dict = {}

        for r in rows:
            score  = _score(r)
            bucket = _bucket(score)
            buckets[bucket] = buckets.get(bucket, 0) + 1

            src = _source_label(r)
            if src not in source_data:
                source_data[src] = {"source": src, "total": 0,
                                    "Unqualified": 0, "Qualified": 0,
                                    "High Intent": 0, "Won": 0, "score_sum": 0}
            source_data[src]["total"]  += 1
            source_data[src][bucket]   += 1
            source_data[src]["score_sum"] += score

        sources = []
        for s in sorted(source_data.values(), key=lambda x: x["total"], reverse=True):
            total = s["total"] or 1
            s["avg_score"]   = round(s["score_sum"] / total, 1)
            s["quality_pct"] = round((s["High Intent"] + s["Won"]) / total * 100, 1)
            del s["score_sum"]
            sources.append(s)

        total = len(rows)
        return {
            "total_leads":  total,
            "buckets":      buckets,
            "quality_rate": round((buckets["High Intent"] + buckets["Won"]) / total * 100, 1) if total else 0,
            "sources":      sources,
        }
    except Exception as e:
        logger.error("get_lead_quality_breakdown error: %s", e)
        return {"total_leads": 0, "buckets": {}, "quality_rate": 0, "sources": [], "error": str(e)}



# ── Meta Ads Intelligence Queries ──────────────────────────────────────────


def _date_filter_match(date_from: str | None, date_to: str | None) -> dict:
    """Build a MongoDB $match for synced_at within the given date range."""
    if not date_from or not date_to:
        return {}
    try:
        since = datetime.fromisoformat(date_from).replace(tzinfo=timezone.utc)
        until = datetime.fromisoformat(date_to).replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
        return {"synced_at": {"$gte": since.isoformat(), "$lte": until.isoformat()}}
    except Exception:
        return {}


def _status_filter(status: str | None) -> dict:
    """Return a MongoDB match clause for effective_status filtering."""
    if status and status.lower() == "active":
        return {"$or": [{"effective_status": "ACTIVE"}, {"effective_status": None}]}
    return {}


async def get_adset_performance(db, date_from: str = None, date_to: str = None, status: str = None) -> dict:
    """Return ad set level data from Meta API + Google Ads with pixel events."""
    try:
        match: dict = {"source": {"$in": ["meta_api", "google"]}, "level": "adset"}
        if status:
            match.update(_status_filter(status))
        if date_from and date_to:
            match["$or"] = [
                {"date_start": {"$gte": date_from, "$lte": date_to}},
                {"source": "google"},  # Google data: no date_start, always include
            ]
        elif date_from:
            match["$or"] = [
                {"date_start": {"$gte": date_from}},
                {"source": "google"},
            ]
        elif date_to:
            match["$or"] = [
                {"date_start": {"$lte": date_to}},
                {"source": "google"},
            ]
        rows = await db.ad_spend.find(match, {"_id": 0}).sort("spend", -1).to_list(200)

        result = []
        for r in rows:
            spend      = float(r.get("spend") or 0)
            book_demo  = int(r.get("book_demo_count") or 0)
            schedule   = int(r.get("schedule_count") or 0)
            demo_given = int(r.get("demo_given_count") or 0)
            purchase   = int(r.get("purchase_count") or 0)
            clicks     = int(r.get("clicks") or 0)
            impr       = int(r.get("impressions") or 0)

            # Audience label
            age_min = r.get("age_min")
            age_max = r.get("age_max")
            countries = r.get("geo_countries") or []
            cities    = r.get("geo_cities") or []
            audience_label = ""
            if age_min and age_max:
                audience_label += f"{age_min}-{age_max}"
            elif age_min:
                audience_label += f"{age_min}+"
            if countries:
                audience_label += (" · " if audience_label else "") + ", ".join(countries[:3])
            elif cities:
                audience_label += (" · " if audience_label else "") + ", ".join(cities[:2])

            result.append({
                "adset_name":          r.get("ad_set", "Unknown"),
                "adset_id":            r.get("adset_id", ""),
                "campaign":            r.get("campaign", ""),
                "campaign_id":         r.get("campaign_id", ""),
                "effective_status":    r.get("effective_status", "ACTIVE"),
                "source_platform":     "Google" if r.get("source") == "google" else "Meta",
                "spend":               spend,
                "impressions":         impr,
                "clicks":              clicks,
                "ctr":                 round(clicks / impr * 100, 2) if impr else 0,
                "cpc":                 round(spend / clicks, 2) if clicks else None,
                "frequency":           r.get("frequency"),
                "book_demo_count":     book_demo,
                "schedule_count":      schedule,
                "demo_given_count":    demo_given,
                "purchase_count":      purchase,
                "cost_per_book_demo":  round(spend / book_demo, 2) if book_demo else None,
                "cost_per_schedule":   round(spend / schedule, 2) if schedule else None,
                # Audience
                "age_min":             age_min,
                "age_max":             age_max,
                "geo_countries":       countries,
                "geo_cities":          cities,
                "audience_label":      audience_label or "All audiences",
                "gender_targeting":    r.get("gender_targeting"),
                "optimization_goal":   r.get("optimization_goal"),
                "date_start":          r.get("date_start"),
                "date_stop":           r.get("date_stop"),
                "synced_at":           r.get("synced_at"),
            })

        return {"adsets": result, "count": len(result)}
    except Exception as e:
        logger.error("get_adset_performance error: %s", e)
        return {"adsets": [], "count": 0, "error": str(e)}


async def get_ad_performance(db, date_from: str = None, date_to: str = None, status: str = None) -> dict:
    """Return individual ad-level data from Meta API + Google Ads with ROI signals."""
    try:
        match: dict = {"source": {"$in": ["meta_api", "google"]}, "level": "ad"}
        if status:
            match.update(_status_filter(status))
        if date_from and date_to:
            match["$or"] = [
                {"date_start": {"$gte": date_from, "$lte": date_to}},
                {"source": "google"},
            ]
        elif date_from:
            match["$or"] = [
                {"date_start": {"$gte": date_from}},
                {"source": "google"},
            ]
        elif date_to:
            match["$or"] = [
                {"date_start": {"$lte": date_to}},
                {"source": "google"},
            ]
        rows = await db.ad_spend.find(match, {"_id": 0}).sort("spend", -1).to_list(500)

        result = []
        for r in rows:
            spend     = float(r.get("spend") or 0)
            book_demo = int(r.get("book_demo_count") or 0)
            schedule  = int(r.get("schedule_count") or 0)
            clicks    = int(r.get("clicks") or 0)
            impr      = int(r.get("impressions") or 0)
            freq      = r.get("frequency")

            total_convs = book_demo + schedule
            if spend <= 500 and total_convs >= 1:
                roi_signal = "HIGH ROI"
            elif spend <= 2000 and total_convs >= 1:
                roi_signal = "GOOD"
            elif spend >= 1000 and total_convs == 0:
                roi_signal = "LOW ROI"
            elif spend >= 500 and total_convs == 0:
                roi_signal = "REVIEW"
            else:
                roi_signal = "MONITOR"

            result.append({
                "ad_name":            r.get("ad_name", "Unknown"),
                "ad_id":              r.get("ad_id", ""),
                "adset_name":         r.get("ad_set", ""),
                "adset_id":           r.get("adset_id", ""),
                "campaign":           r.get("campaign", ""),
                "campaign_id":        r.get("campaign_id", ""),
                "source_platform":    "Google" if r.get("source") == "google" else "Meta",
                "spend":              spend,
                "impressions":        impr,
                "clicks":             clicks,
                "ctr":                round(clicks / impr * 100, 2) if impr else 0,
                "cpc":                round(spend / clicks, 2) if clicks else None,
                "frequency":          float(freq) if freq else None,
                "book_demo_count":    book_demo,
                "schedule_count":     schedule,
                "demo_given_count":   int(r.get("demo_given_count") or 0),
                "purchase_count":     int(r.get("purchase_count") or 0),
                "cost_per_book_demo": round(spend / book_demo, 2) if book_demo else None,
                "cost_per_schedule":  round(spend / schedule, 2) if schedule else None,
                "roi_signal":         roi_signal,
                "date_start":         r.get("date_start"),
                "date_stop":          r.get("date_stop"),
                "synced_at":          r.get("synced_at"),
            })

        return {"ads": result, "count": len(result)}
    except Exception as e:
        logger.error("get_ad_performance error: %s", e)
        return {"ads": [], "count": 0, "error": str(e)}


async def get_placement_breakdown(db, date_from: str = None, date_to: str = None, status: str = None) -> dict:
    """Return placement-level spend breakdown from Meta API (platform + position)."""
    try:
        placement_match = {"source": "meta_api", "level": "placement"}
        if status:
            placement_match.update(_status_filter(status))
        rows = await db.ad_spend.find(
            placement_match,
            {"_id": 0}
        ).to_list(500)

        if not rows:
            return {"placements": [], "platforms": [], "total_spend": 0}

        total_spend = sum(float(r.get("spend") or 0) for r in rows)

        # Aggregate by platform + position
        agg: dict = {}
        for r in rows:
            platform = r.get("platform", "unknown")
            position = r.get("placement_position", "unknown")
            key = f"{platform}|{position}"
            if key not in agg:
                agg[key] = {
                    "platform":           platform,
                    "placement_position": position,
                    "spend":              0.0,
                    "impressions":        0,
                    "clicks":             0,
                }
            agg[key]["spend"]       += float(r.get("spend") or 0)
            agg[key]["impressions"] += int(r.get("impressions") or 0)
            agg[key]["clicks"]      += int(r.get("clicks") or 0)

        placements = []
        for item in sorted(agg.values(), key=lambda x: x["spend"], reverse=True):
            impr   = item["impressions"]
            clicks = item["clicks"]
            spend  = item["spend"]
            placements.append({
                **item,
                "spend":           round(spend, 2),
                "ctr":             round(clicks / impr * 100, 2) if impr else 0,
                "cpc":             round(spend / clicks, 2) if clicks else None,
                "pct_of_budget":   round(spend / total_spend * 100, 1) if total_spend else 0,
            })

        # Platform-level summary
        platform_totals: dict = {}
        for p in placements:
            plat = p["platform"]
            if plat not in platform_totals:
                platform_totals[plat] = {"platform": plat, "spend": 0.0, "impressions": 0, "clicks": 0, "count": 0}
            platform_totals[plat]["spend"]       += p["spend"]
            platform_totals[plat]["impressions"] += p["impressions"]
            platform_totals[plat]["clicks"]      += p["clicks"]
            platform_totals[plat]["count"]       += 1

        platforms = sorted(platform_totals.values(), key=lambda x: x["spend"], reverse=True)

        return {
            "placements":  placements,
            "platforms":   platforms,
            "total_spend": round(total_spend, 2),
        }
    except Exception as e:
        logger.error("get_placement_breakdown error: %s", e)
        return {"placements": [], "platforms": [], "total_spend": 0, "error": str(e)}


# ── CR-27 Phase G: Attribution Stitching ──────────────────────────────────────

import re

def _normalise_campaign_name(name: str) -> str:
    """Strip ' - Copy', ' - Copy 2', ' (copy)' etc. for fuzzy matching."""
    if not name:
        return ""
    return re.sub(r"\s*-\s*Copy\s*\d*$", "", name, flags=re.IGNORECASE).strip()


async def _aggregate_crm_by_field(db, field: str, date_from=None, date_to=None):
    """Aggregate backfilled_leads by a given field → {value: {leads, demo_scheduled, ...}}."""
    match = {field: {"$nin": [None, ""]}}
    if date_from:
        match["created_at"] = {"$gte": date_from}
    if date_to:
        match.setdefault("created_at", {})["$lte"] = date_to + "T23:59:59"

    pipeline = [
        {"$match": match},
        {"$group": {
            "_id": f"${field}",
            "leads": {"$sum": 1},
            "demo_scheduled": {"$sum": {"$cond": [{"$in": ["$crm_status", ["demo_scheduled", "demo_given", "won"]]}, 1, 0]}},
            "demo_given": {"$sum": {"$cond": [{"$in": ["$crm_status", ["demo_given", "won"]]}, 1, 0]}},
            "won": {"$sum": {"$cond": [{"$eq": ["$crm_status", "won"]}, 1, 0]}},
            "lost": {"$sum": {"$cond": [{"$eq": ["$crm_status", "lost"]}, 1, 0]}},
        }},
    ]
    results = await db.backfilled_leads.aggregate(pipeline).to_list(5000)
    return {r["_id"]: r for r in results}


def _match_campaign(crm_key, spend_rows):
    """Multi-key campaign match: exact → campaign_id → fuzzy."""
    # Build lookup maps
    by_name = {}
    by_id = {}
    for row in spend_rows:
        name = row.get("campaign") or ""
        by_name[name] = row
        by_name[name.lower()] = row
        cid = row.get("campaign_id")
        if cid:
            by_id[str(cid)] = row

    # 1. Exact match
    if crm_key in by_name:
        return by_name[crm_key]
    # 2. Campaign ID match (Google leads have numeric IDs)
    if str(crm_key) in by_id:
        return by_id[str(crm_key)]
    # 3. Fuzzy (strip " - Copy")
    norm = _normalise_campaign_name(crm_key)
    for name, row in by_name.items():
        if _normalise_campaign_name(name) == norm and norm:
            return row
    return None


def _match_adset(crm_doc, spend_rows):
    """Multi-key adset match: adset_id → ad_set name."""
    by_id = {}
    by_name = {}
    for row in spend_rows:
        sid = row.get("adset_id")
        if sid:
            by_id[str(sid)] = row
        sname = row.get("ad_set") or ""
        if sname:
            by_name[sname] = row

    adset_id = crm_doc.get("_id_adset_id")
    if adset_id and str(adset_id) in by_id:
        return by_id[str(adset_id)]
    ad_set = crm_doc.get("_id")
    if ad_set and ad_set in by_name:
        return by_name[ad_set]
    return None


def _match_ad(crm_doc, spend_rows):
    """Multi-key ad match: ad_id → keyword (utm_term=ad name)."""
    by_id = {}
    by_name = {}
    for row in spend_rows:
        aid = row.get("ad_id")
        if aid:
            by_id[str(aid)] = row
        aname = row.get("ad_name") or ""
        if aname:
            by_name[aname] = row

    ad_id = crm_doc.get("_id_ad_id")
    if ad_id and str(ad_id) in by_id:
        return by_id[str(ad_id)]
    keyword = crm_doc.get("_id")
    if keyword and keyword in by_name:
        return by_name[keyword]
    return None


async def get_attribution_by_campaign(db, date_from=None, date_to=None):
    """Join CRM outcomes with ad spend at campaign level."""
    try:
        # CRM outcomes by campaign
        crm_data = await _aggregate_crm_by_field(db, "first_campaign", date_from, date_to)

        # Also aggregate by utm_id (numeric campaign ID from CR-25)
        crm_by_utm_id = await _aggregate_crm_by_field(db, "utm_id", date_from, date_to)

        # Ad spend campaigns
        spend_rows = await db.ad_spend.find(
            {"level": "campaign"},
            {"_id": 0}
        ).to_list(500)

        # Build result: start from ad_spend campaigns, enrich with CRM
        rows = []
        matched_crm_keys = set()

        for sr in spend_rows:
            name = sr.get("campaign", "")
            cid = sr.get("campaign_id", "")
            spend = sr.get("spend", 0)

            # Find CRM match
            crm = crm_data.get(name) or crm_data.get(cid)
            if not crm and cid:
                crm = crm_data.get(str(cid))
            if not crm:
                # Fuzzy
                norm = _normalise_campaign_name(name)
                for k, v in crm_data.items():
                    if _normalise_campaign_name(str(k)) == norm and norm:
                        crm = v
                        break
            if not crm and cid:
                crm = crm_by_utm_id.get(str(cid))

            if crm:
                matched_crm_keys.add(crm["_id"])

            leads = crm["leads"] if crm else 0
            won = crm["won"] if crm else 0

            rows.append({
                "campaign": name,
                "campaign_id": cid,
                "source": sr.get("source", ""),
                "spend": round(spend, 2),
                "impressions": sr.get("impressions", 0),
                "clicks": sr.get("clicks", 0),
                "crm_leads": leads,
                "crm_demo_scheduled": crm["demo_scheduled"] if crm else 0,
                "crm_demo_given": crm["demo_given"] if crm else 0,
                "crm_won": won,
                "crm_lost": crm["lost"] if crm else 0,
                "crm_cpl": round(spend / leads, 2) if leads and spend else None,
                "crm_cp_won": round(spend / won, 2) if won and spend else None,
            })

        # Add CRM-only campaigns (leads exist but no ad_spend)
        for k, crm in crm_data.items():
            if k not in matched_crm_keys:
                rows.append({
                    "campaign": str(k),
                    "campaign_id": "",
                    "source": "crm_only",
                    "spend": 0,
                    "impressions": 0,
                    "clicks": 0,
                    "crm_leads": crm["leads"],
                    "crm_demo_scheduled": crm["demo_scheduled"],
                    "crm_demo_given": crm["demo_given"],
                    "crm_won": crm["won"],
                    "crm_lost": crm["lost"],
                    "crm_cpl": None,
                    "crm_cp_won": None,
                })

        rows.sort(key=lambda r: r.get("crm_leads", 0), reverse=True)
        return {"rows": rows}

    except Exception as e:
        logger.error("get_attribution_by_campaign error: %s", e)
        return {"rows": [], "error": str(e)}


async def get_attribution_by_adset(db, date_from=None, date_to=None):
    """Join CRM outcomes with ad spend at ad set level."""
    try:
        # CRM outcomes by ad_set name (from utm_content)
        crm_by_name = await _aggregate_crm_by_field(db, "ad_set", date_from, date_to)
        # CRM outcomes by adset_id (from CR-25)
        crm_by_id = await _aggregate_crm_by_field(db, "adset_id", date_from, date_to)

        # Ad spend adsets
        spend_rows = await db.ad_spend.find(
            {"level": "adset"},
            {"_id": 0}
        ).to_list(500)

        rows = []
        matched_crm_keys = set()

        for sr in spend_rows:
            ad_set = sr.get("ad_set", "")
            adset_id = sr.get("adset_id", "")
            spend = sr.get("spend", 0)

            crm = None
            if adset_id:
                crm = crm_by_id.get(str(adset_id))
            if not crm and ad_set:
                crm = crm_by_name.get(ad_set)

            if crm:
                matched_crm_keys.add(crm["_id"])

            leads = crm["leads"] if crm else 0
            won = crm["won"] if crm else 0

            rows.append({
                "ad_set": ad_set,
                "adset_id": adset_id,
                "campaign": sr.get("campaign", ""),
                "source": sr.get("source", ""),
                "spend": round(spend, 2),
                "impressions": sr.get("impressions", 0),
                "clicks": sr.get("clicks", 0),
                "crm_leads": leads,
                "crm_demo_scheduled": crm["demo_scheduled"] if crm else 0,
                "crm_demo_given": crm["demo_given"] if crm else 0,
                "crm_won": won,
                "crm_lost": crm["lost"] if crm else 0,
                "crm_cpl": round(spend / leads, 2) if leads and spend else None,
                "crm_cp_won": round(spend / won, 2) if won and spend else None,
            })

        rows.sort(key=lambda r: r.get("crm_leads", 0), reverse=True)
        return {"rows": rows}

    except Exception as e:
        logger.error("get_attribution_by_adset error: %s", e)
        return {"rows": [], "error": str(e)}


async def get_attribution_by_ad(db, date_from=None, date_to=None):
    """Join CRM outcomes with ad spend at individual ad level."""
    try:
        # CRM outcomes by keyword (utm_term = ad name in Meta context)
        crm_by_keyword = await _aggregate_crm_by_field(db, "keyword", date_from, date_to)
        # CRM outcomes by ad_id (from CR-25)
        crm_by_id = await _aggregate_crm_by_field(db, "ad_id", date_from, date_to)

        # Ad spend ads
        spend_rows = await db.ad_spend.find(
            {"level": "ad"},
            {"_id": 0}
        ).to_list(500)

        rows = []
        matched_crm_keys = set()

        for sr in spend_rows:
            ad_name = sr.get("ad_name", "")
            ad_id = sr.get("ad_id", "")
            spend = sr.get("spend", 0)

            crm = None
            if ad_id:
                crm = crm_by_id.get(str(ad_id))
            if not crm and ad_name:
                crm = crm_by_keyword.get(ad_name)

            if crm:
                matched_crm_keys.add(crm["_id"])

            leads = crm["leads"] if crm else 0
            won = crm["won"] if crm else 0

            rows.append({
                "ad_name": ad_name,
                "ad_id": ad_id,
                "ad_set": sr.get("ad_set", ""),
                "campaign": sr.get("campaign", ""),
                "source": sr.get("source", ""),
                "spend": round(spend, 2),
                "impressions": sr.get("impressions", 0),
                "clicks": sr.get("clicks", 0),
                "crm_leads": leads,
                "crm_demo_scheduled": crm["demo_scheduled"] if crm else 0,
                "crm_demo_given": crm["demo_given"] if crm else 0,
                "crm_won": won,
                "crm_lost": crm["lost"] if crm else 0,
                "crm_cpl": round(spend / leads, 2) if leads and spend else None,
                "crm_cp_won": round(spend / won, 2) if won and spend else None,
            })

        rows.sort(key=lambda r: r.get("crm_leads", 0), reverse=True)
        return {"rows": rows}

    except Exception as e:
        logger.error("get_attribution_by_ad error: %s", e)
        return {"rows": [], "error": str(e)}


# ── CR-28 Phase I: Cross-Channel Comparison ───────────────────────────────────

async def get_cross_channel_summary(db, date_from=None, date_to=None):
    """Aggregate attribution data by source platform (Meta vs Google vs others)."""
    try:
        attr_data = await get_attribution_by_campaign(db, date_from=date_from, date_to=date_to)
        rows = attr_data.get("rows", [])

        channels = {}
        for r in rows:
            src = r.get("source", "")
            if "meta" in src:
                key = "Meta"
            elif "google" in src:
                key = "Google"
            elif src == "crm_only":
                key = "CRM Only"
            else:
                key = src or "Other"

            if key not in channels:
                channels[key] = {
                    "channel": key,
                    "campaigns": 0,
                    "spend": 0,
                    "impressions": 0,
                    "clicks": 0,
                    "crm_leads": 0,
                    "crm_demo_scheduled": 0,
                    "crm_demo_given": 0,
                    "crm_won": 0,
                    "crm_lost": 0,
                }
            ch = channels[key]
            ch["campaigns"] += 1
            ch["spend"] += r.get("spend", 0)
            ch["impressions"] += r.get("impressions", 0)
            ch["clicks"] += r.get("clicks", 0)
            ch["crm_leads"] += r.get("crm_leads", 0)
            ch["crm_demo_scheduled"] += r.get("crm_demo_scheduled", 0)
            ch["crm_demo_given"] += r.get("crm_demo_given", 0)
            ch["crm_won"] += r.get("crm_won", 0)
            ch["crm_lost"] += r.get("crm_lost", 0)

        result = []
        for ch in channels.values():
            spend = ch["spend"]
            leads = ch["crm_leads"]
            won = ch["crm_won"]
            sched = ch["crm_demo_scheduled"]
            given = ch["crm_demo_given"]
            clicks = ch["clicks"]
            impr = ch["impressions"]
            result.append({
                **ch,
                "spend": round(spend, 2),
                "ctr": round(clicks / impr * 100, 2) if impr else 0,
                "cpc": round(spend / clicks, 2) if clicks else None,
                "crm_cpl": round(spend / leads, 2) if leads and spend else None,
                "crm_cp_scheduled": round(spend / sched, 2) if sched and spend else None,
                "crm_cp_demo_given": round(spend / given, 2) if given and spend else None,
                "crm_cp_won": round(spend / won, 2) if won and spend else None,
                "lead_to_won_pct": round(won / leads * 100, 1) if leads else 0,
                "demo_to_won_pct": round(won / given * 100, 1) if given else 0,
            })

        result.sort(key=lambda x: x["crm_leads"], reverse=True)

        # Determine winners per metric
        if len(result) >= 2:
            metrics = ["crm_cpl", "crm_cp_scheduled", "crm_cp_demo_given", "crm_cp_won", "ctr", "lead_to_won_pct", "crm_leads", "crm_won"]
            winners = {}
            for m in metrics:
                vals = [(r["channel"], r.get(m)) for r in result if r.get(m) is not None and r.get(m) > 0]
                if len(vals) >= 2:
                    if m in ("crm_cpl", "crm_cp_scheduled", "crm_cp_demo_given", "crm_cp_won"):
                        winners[m] = min(vals, key=lambda x: x[1])[0]  # lower is better
                    else:
                        winners[m] = max(vals, key=lambda x: x[1])[0]  # higher is better
        else:
            winners = {}

        return {"channels": result, "winners": winners}

    except Exception as e:
        logger.error("get_cross_channel_summary error: %s", e)
        return {"channels": [], "winners": {}, "error": str(e)}
