"""CR-24 Phase 3 — Official Meta Marketing API + Google Ads MCP clients.

Meta: Graph API v21.0 Ads Insights endpoint with proper pagination.
Google: MCP-based (placeholder until developer token provided).

Both clients graceful-degrade: if credentials are missing they return
{"enabled": false, "message": "..."} so the dashboard shows CSV-only mode.

NOTE on time_range: MUST use time_range[since] / time_range[until] as
separate URL params — NOT nested JSON. Nested JSON is silently ignored
by the Ads Insights API (known Graph API quirk).
"""
import logging
import os
from datetime import date, timedelta, datetime, timezone
import httpx

logger = logging.getLogger(__name__)

GRAPH_BASE      = "https://graph.facebook.com/v21.0"
META_TOKEN      = os.environ.get("META_ACCESS_TOKEN", "")
META_AD_ACCOUNT = os.environ.get("META_AD_ACCOUNT_ID", "")  # e.g. act_1234567890
META_APP_ID     = os.environ.get("META_APP_ID", "")
META_APP_SECRET = os.environ.get("META_APP_SECRET", "")
GOOGLE_TOKEN    = os.environ.get("GOOGLE_ADS_DEVELOPER_TOKEN", "")
GOOGLE_CUSTOMER = os.environ.get("GOOGLE_ADS_CUSTOMER_ID", "")


async def _exchange_long_lived_token(short_token: str) -> str:
    """Exchange a short-lived user token for a 60-day long-lived token.
    Returns the long-lived token, or the original token if exchange fails.
    """
    app_id     = os.environ.get("META_APP_ID", "")
    app_secret = os.environ.get("META_APP_SECRET", "")
    if not app_id or not app_secret:
        logger.warning("META_APP_ID or META_APP_SECRET not set — skipping token exchange")
        return short_token
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"{GRAPH_BASE}/oauth/access_token",
                params={
                    "grant_type":        "fb_exchange_token",
                    "client_id":         app_id,
                    "client_secret":     app_secret,
                    "fb_exchange_token": short_token,
                },
            )
            data = r.json()
            if "access_token" in data:
                logger.info("Token exchanged successfully. New expiry ~60 days.")
                return data["access_token"]
            logger.error("Token exchange failed: %s", data)
            return short_token
    except Exception as e:
        logger.error("Token exchange error: %s", e)
        return short_token


def get_status() -> dict:
    return {
        "meta": {
            "enabled":    bool(META_TOKEN and META_AD_ACCOUNT),
            "account_id": META_AD_ACCOUNT or None,
        },
        "google": {
            "enabled":     bool(GOOGLE_TOKEN and GOOGLE_CUSTOMER),
            "customer_id": GOOGLE_CUSTOMER or None,
        },
    }


# ── Meta Marketing API ────────────────────────────────────────────────────

async def _meta_insights(level: str, fields: str,
                         date_preset: str = None,
                         since: str = None, until: str = None,
                         breakdowns: str = None) -> list:
    """Fetch all pages of Meta Ads Insights.
    Pass either date_preset OR since+until (time_range).
    Optionally pass breakdowns (e.g. 'publisher_platform,platform_position').
    """
    url = f"{GRAPH_BASE}/act_{META_AD_ACCOUNT}/insights"
    params = {
        "access_token": META_TOKEN,
        "level":        level,
        "fields":       fields,
        "limit":        500,
    }
    if breakdowns:
        params["breakdowns"] = breakdowns
    if since and until:
        params["time_range[since]"] = since
        params["time_range[until]"] = until
    else:
        params["date_preset"] = date_preset or "last_year"

    all_rows = []
    async with httpx.AsyncClient(timeout=90) as client:
        while True:
            r = await client.get(url, params=params)
            if r.status_code != 200:
                try:
                    err = r.json()
                except Exception:
                    err = {"raw": r.text}
                raise RuntimeError(f"Meta API {r.status_code}: {err}")
            data = r.json()
            all_rows.extend(data.get("data", []))
            next_url = data.get("paging", {}).get("next")
            if not next_url:
                break
            url    = next_url
            params = {}
    return all_rows


def _extract_actions(row) -> dict:
    """Extract 4 tracked pixel events from both 'actions' and 'conversions' arrays."""
    out = {"book_demo_count": 0, "schedule_count": 0, "demo_given_count": 0, "purchase_count": 0}
    for a in (row.get("actions") or []) + (row.get("conversions") or []):
        at = a.get("action_type", "").lower()
        v  = int(float(a.get("value", 0)))
        if "book demo" in at or "book_demo" in at:
            out["book_demo_count"] += v
        elif "demo given" in at or "demo_given" in at:
            out["demo_given_count"] += v
        elif at == "schedule_total" or "offsite_conversion.fb_pixel_custom.schedule" in at:
            out["schedule_count"] += v
        elif "purchase" in at:
            out["purchase_count"] += v
    return out


async def _get_last_sync_date(db, source: str) -> str | None:
    """Find the latest date_stop for a given source in ad_spend.
    Returns 'YYYY-MM-DD' string or None if no data exists."""
    doc = await db.ad_spend.find_one(
        {"source": source, "date_stop": {"$ne": None}},
        {"date_stop": 1},
        sort=[("date_stop", -1)]
    )
    if doc and doc.get("date_stop"):
        ds = doc["date_stop"]
        # Ensure it's a YYYY-MM-DD string (not None or garbage)
        return ds[:10] if isinstance(ds, str) and len(ds) >= 10 else None
    return None


async def sync_meta(db, date_from: str = None, date_to: str = None) -> dict:
    """Pull Meta Ads data via official Graph API v21.0 and upsert into ad_spend.

    CR-36: Uses daily breakdowns with incremental sync.
    If date_from/date_to are provided, fetches that specific range.
    Otherwise calculates incremental range from last synced date.
    """
    token   = os.environ.get("META_ACCESS_TOKEN", "")
    account = os.environ.get("META_AD_ACCOUNT_ID", "")

    if not token or not account:
        return {
            "enabled": False,
            "message": "META_ACCESS_TOKEN or META_AD_ACCOUNT_ID not configured in backend/.env",
        }

    app_secret = os.environ.get("META_APP_SECRET", "")
    if app_secret:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                dbg = await client.get(
                    f"{GRAPH_BASE}/debug_token",
                    params={"input_token": token, "access_token": token},
                )
                dbg_data = dbg.json().get("data", {})
                exp = dbg_data.get("expires_at", 0)
                is_short = exp and (exp - datetime.now(timezone.utc).timestamp()) < 7200
            if is_short:
                long_lived = await _exchange_long_lived_token(token)
                if long_lived != token:
                    token = long_lived
                    os.environ["META_ACCESS_TOKEN"] = long_lived
                    logger.info("Short-lived token auto-extended to 60 days")
        except Exception as e:
            logger.warning("Token expiry check failed (non-critical): %s", e)

    global META_TOKEN, META_AD_ACCOUNT
    META_TOKEN      = token
    META_AD_ACCOUNT = account

    try:
        camp_status_url = f"{GRAPH_BASE}/act_{META_AD_ACCOUNT}/campaigns"
        camp_status_map   = {}   # camp_id → effective_status
        campaign_created_map = {}  # camp_id → "YYYY-MM-DD" created date (GAP-18)
        async with httpx.AsyncClient(timeout=30) as client:
            cs_r = await client.get(camp_status_url, params={
                "access_token": META_TOKEN,
                "fields":       "id,name,effective_status,status,created_time",
                "limit":        200,
            })
            for c in cs_r.json().get("data", []):
                camp_id = c["id"]
                camp_status_map[camp_id] = c.get("effective_status", "UNKNOWN")
                # Parse created_time ("2025-01-15T10:30:00+0000") → "YYYY-MM-DD"
                created_raw = c.get("created_time", "")
                if created_raw:
                    try:
                        ts = created_raw.replace("+0000", "+00:00")
                        campaign_created_map[camp_id] = datetime.fromisoformat(ts).strftime("%Y-%m-%d")
                    except (ValueError, TypeError):
                        pass

        # Fetch adset audience targeting metadata (age, geo, gender per adset)
        adset_targeting_map = {}
        async with httpx.AsyncClient(timeout=30) as client:
            tgt_r = await client.get(
                f"{GRAPH_BASE}/act_{META_AD_ACCOUNT}/adsets",
                params={
                    "access_token":  META_TOKEN,
                    "fields":        "id,name,effective_status,targeting,optimization_goal",
                    "limit":         200,
                }
            )
            for a in tgt_r.json().get("data", []):
                tgt = a.get("targeting") or {}
                geo = tgt.get("geo_locations") or {}
                adset_targeting_map[a["id"]] = {
                    "age_min":           tgt.get("age_min"),
                    "age_max":           tgt.get("age_max"),
                    "geo_countries":     geo.get("countries", []),
                    "geo_cities":        [c.get("name", "") for c in geo.get("cities", [])[:5]],
                    "gender_targeting":  tgt.get("genders"),
                    "optimization_goal": a.get("optimization_goal"),
                    "adset_status":      a.get("effective_status"),
                }

        PIXEL_EVENTS = (
            "offsite_conversion.fb_pixel_custom.Book demo",
            "offsite_conversion.fb_pixel_custom.Schedule",
            "offsite_conversion.fb_pixel_custom.Demo given",
            "offsite_conversion.fb_pixel_purchase",
        )

        campaign_fields = (
            "campaign_id,campaign_name,spend,impressions,clicks,reach,frequency,"
            "actions,conversions,cost_per_conversion"
        )
        adset_fields = (
            "campaign_id,campaign_name,adset_id,adset_name,spend,impressions,"
            "clicks,reach,frequency,actions,conversions"
        )
        ad_fields = (
            "campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,"
            "spend,impressions,clicks,reach,frequency,actions,conversions"
        )

        # CR-36: Always use time_range for daily breakdowns (incremental sync)
        if not date_from or not date_to:
            last_date = await _get_last_sync_date(db, "meta_api")
            if last_date:
                # Incremental: re-sync from last synced date (catches late data)
                date_from = last_date
                date_to = date.today().isoformat()
                logger.info("Meta incremental sync: %s to %s", date_from, date_to)
            else:
                # First sync (Option X): full history
                date_from = "2025-01-01"
                date_to = date.today().isoformat()
                logger.info("Meta full sync (first time): %s to %s", date_from, date_to)

        period_label = f"{date_from} to {date_to}"
        campaign_rows  = await _meta_insights("campaign", campaign_fields, since=date_from, until=date_to)
        adset_rows     = await _meta_insights("adset",    adset_fields,    since=date_from, until=date_to)
        ad_rows        = await _meta_insights("ad",       ad_fields,       since=date_from, until=date_to)
        placement_rows = await _meta_insights(
            "campaign", "campaign_name,spend,impressions,clicks",
            since=date_from, until=date_to,
            breakdowns="publisher_platform,platform_position",
        )
        # Apply pixel event extraction to raw API rows
        for row in campaign_rows:
            row.update(_extract_actions(row))
        for row in adset_rows:
            row.update(_extract_actions(row))
        for row in ad_rows:
            row.update(_extract_actions(row))

    except RuntimeError as e:
        logger.error("Meta API error: %s", e)
        return {"enabled": True, "error": str(e), "synced": 0}
    except Exception as e:
        logger.error("Meta sync unexpected error: %s", e)
        return {"enabled": True, "error": str(e), "synced": 0}

    now  = datetime.now(timezone.utc).isoformat()
    docs = []

    # Inject audience targeting data into all adset rows
    for row in adset_rows:
        tgt = adset_targeting_map.get(row.get("adset_id", ""), {})
        row.update(tgt)

    # Build ad_spend documents from campaign rows (aggregate level)
    for row in campaign_rows:
        spend = float(row.get("spend") or 0)
        if spend == 0:
            continue
        impr  = int(row.get("impressions") or 0)
        reach = int(row.get("reach") or 0) or None
        freq_raw = row.get("frequency")
        frequency = float(freq_raw) if freq_raw else (round(impr / reach, 2) if reach else None)
        camp_id  = row.get("campaign_id", "")
        eff_stat = camp_status_map.get(camp_id, "UNKNOWN")
        book_demo  = row.get("book_demo_count", 0)
        schedules  = row.get("schedule_count", 0)
        demo_given = row.get("demo_given_count", 0)
        purchases  = row.get("purchase_count", 0)
        docs.append({
            "source":              "meta_api",
            "level":               "campaign",
            "campaign":            row.get("campaign_name") or row.get("campaign_id"),
            "campaign_id":         camp_id,
            "effective_status":    eff_stat,
            "ad_set":              None,
            "ad_name":             None,
            "spend":               spend,
            "impressions":         impr,
            "clicks":              int(row.get("clicks") or 0) or None,
            "reach":               reach,
            "frequency":           frequency,
            "book_demo_count":     book_demo,
            "schedule_count":      schedules,
            "demo_given_count":    demo_given,
            "purchase_count":      purchases,
            "cost_per_book_demo":  round(spend / book_demo,  2) if book_demo  else None,
            "cost_per_schedule":   round(spend / schedules,  2) if schedules  else None,
            "cost_per_demo_given": round(spend / demo_given, 2) if demo_given else None,
            "cost_per_purchase":   round(spend / purchases,  2) if purchases  else None,
            "campaign_created_date": campaign_created_map.get(camp_id),
            "date_start":          row.get("date_start"),
            "date_stop":           row.get("date_stop"),
            "synced_at":           now,
        })

    # Ad-set level rows (with pixel events + audience targeting)
    for row in adset_rows:
        spend = float(row.get("spend") or 0)
        if spend == 0:
            continue
        impr      = int(row.get("impressions") or 0)
        reach     = int(row.get("reach") or 0) or None
        freq_raw  = row.get("frequency")
        frequency = float(freq_raw) if freq_raw else (round(impr / reach, 2) if reach else None)
        book_demo  = row.get("book_demo_count", 0)
        schedules  = row.get("schedule_count", 0)
        demo_given = row.get("demo_given_count", 0)
        purchases  = row.get("purchase_count", 0)
        adset_id   = row.get("adset_id", "")
        eff_stat   = row.get("adset_status") or camp_status_map.get(row.get("campaign_id", ""), "UNKNOWN")
        docs.append({
            "source":              "meta_api",
            "level":               "adset",
            "campaign":            row.get("campaign_name") or row.get("campaign_id"),
            "campaign_id":         row.get("campaign_id", ""),
            "ad_set":              row.get("adset_name") or adset_id,
            "adset_id":            adset_id,
            "effective_status":    eff_stat,
            "ad_name":             None,
            "spend":               spend,
            "impressions":         impr,
            "clicks":              int(row.get("clicks") or 0) or None,
            "reach":               reach,
            "frequency":           frequency,
            "book_demo_count":     book_demo,
            "schedule_count":      schedules,
            "demo_given_count":    demo_given,
            "purchase_count":      purchases,
            "cost_per_book_demo":  round(spend / book_demo,  2) if book_demo  else None,
            "cost_per_schedule":   round(spend / schedules,  2) if schedules  else None,
            "cost_per_demo_given": round(spend / demo_given, 2) if demo_given else None,
            "cost_per_purchase":   round(spend / purchases,  2) if purchases  else None,
            "age_min":             row.get("age_min"),
            "age_max":             row.get("age_max"),
            "geo_countries":       row.get("geo_countries", []),
            "geo_cities":          row.get("geo_cities", []),
            "gender_targeting":    row.get("gender_targeting"),
            "optimization_goal":   row.get("optimization_goal"),
            "campaign_created_date": campaign_created_map.get(row.get("campaign_id", "")),
            "date_start":          row.get("date_start"),
            "date_stop":           row.get("date_stop"),
            "synced_at":           now,
        })

    # Ad level rows (with pixel events for creative-level performance)
    for row in ad_rows:
        spend = float(row.get("spend") or 0)
        impr  = int(row.get("impressions") or 0)
        reach = int(row.get("reach") or 0) or None
        freq_raw  = row.get("frequency")
        frequency = float(freq_raw) if freq_raw else (round(impr / reach, 2) if reach else None)
        book_demo  = row.get("book_demo_count", 0)
        schedules  = row.get("schedule_count", 0)
        demo_given = row.get("demo_given_count", 0)
        purchases  = row.get("purchase_count", 0)
        docs.append({
            "source":              "meta_api",
            "level":               "ad",
            "campaign":            row.get("campaign_name") or row.get("campaign_id"),
            "campaign_id":         row.get("campaign_id", ""),
            "ad_set":              row.get("adset_name") or row.get("adset_id"),
            "adset_id":            row.get("adset_id", ""),
            "ad_name":             row.get("ad_name") or row.get("ad_id"),
            "ad_id":               row.get("ad_id", ""),
            "spend":               spend,
            "impressions":         impr,
            "clicks":              int(row.get("clicks") or 0) or None,
            "reach":               reach,
            "frequency":           frequency,
            "book_demo_count":     book_demo,
            "schedule_count":      schedules,
            "demo_given_count":    demo_given,
            "purchase_count":      purchases,
            "cost_per_book_demo":  round(spend / book_demo,  2) if book_demo  else None,
            "cost_per_schedule":   round(spend / schedules,  2) if schedules  else None,
            "date_start":          row.get("date_start"),
            "date_stop":           row.get("date_stop"),
            "synced_at":           now,
        })

    # Placement breakdown rows (publisher platform + position)
    for row in placement_rows:
        spend = float(row.get("spend") or 0)
        if spend == 0:
            continue
        impr   = int(row.get("impressions") or 0)
        clicks = int(row.get("clicks") or 0)
        docs.append({
            "source":             "meta_api",
            "level":              "placement",
            "campaign":           row.get("campaign_name", ""),
            "platform":           row.get("publisher_platform", "unknown"),
            "placement_position": row.get("platform_position", "unknown"),
            "spend":              spend,
            "impressions":        impr,
            "clicks":             clicks,
            "ctr":                round(clicks / impr * 100, 2) if impr else None,
            "synced_at":          now,
        })

    if docs:
        # CR-36: Incremental delete — only remove rows that overlap with the synced range
        await db.ad_spend.delete_many({
            "source": "meta_api",
            "date_start": {"$gte": date_from},
        })
        await db.ad_spend.insert_many(docs)
        logger.info("Meta API sync: upserted %d rows (campaigns=%d, adsets=%d, ads=%d)",
                    len(docs), len(campaign_rows), len(adset_rows), len(ad_rows))

    return {
        "enabled":    True,
        "synced":     len(docs),
        "campaigns":  len(campaign_rows),
        "adsets":     len(adset_rows),
        "ads":        len(ad_rows),
        "placements": len(placement_rows),
        "period":     period_label,
        "synced_at":  now,
    }


# ── Google Ads API (OAuth refresh token flow) ────────────────────────────

# Mapping Google Ads conversion action names → our schema fields
def _conversion_field(action_name: str) -> str | None:
    """Map a Google Ads conversion action name to the ad_spend field it represents."""
    lower = action_name.lower()
    if any(k in lower for k in ("book demo", "submit lead", "book a demo", "bookdemo")):
        return "book_demo_count"
    if any(k in lower for k in ("book appointment", "demo_booked", "schedule", "book_appoint")):
        return "schedule_count"
    if any(k in lower for k in ("demo given", "demo_given", "demogiven")):
        return "demo_given_count"
    if any(k in lower for k in ("purchase", "bought", "won", "sale")):
        return "purchase_count"
    return None  # unmapped — ignore


def _run_google_ads_sync(refresh_token: str, customer_id: str,
                         date_from: str | None, date_to: str | None) -> list:
    """Synchronous Google Ads API call (runs in thread pool).
    CR-37: Returns daily-granularity rows with date_start/date_stop fields.
    Uses all_conversions segmented by conversion_action_name for accurate
    per-funnel-stage breakdown instead of the aggregated metrics.conversions."""
    from google.ads.googleads.client import GoogleAdsClient

    config = {
        "developer_token": os.environ.get("GOOGLE_ADS_DEVELOPER_TOKEN", ""),
        "client_id":       os.environ.get("GOOGLE_ADS_CLIENT_ID", ""),
        "client_secret":   os.environ.get("GOOGLE_ADS_CLIENT_SECRET", ""),
        "refresh_token":   refresh_token,
        "use_proto_plus":  True,
    }
    client = GoogleAdsClient.load_from_dict(config)
    ga_svc = client.get_service("GoogleAdsService")

    date_clause = (
        f"segments.date BETWEEN '{date_from}' AND '{date_to}'"
        if date_from and date_to
        else "segments.date DURING LAST_30_DAYS"
    )
    now = datetime.now(timezone.utc).isoformat()

    # ── helpers ──────────────────────────────────────────────────────────────
    def _empty_conv() -> dict:
        return {"book_demo_count": 0, "schedule_count": 0,
                "demo_given_count": 0, "purchase_count": 0}

    def _accumulate_conv(store: dict, action_name: str, value: float):
        field = _conversion_field(action_name)
        if field:
            store[field] = store.get(field, 0) + round(value)

    # ── Campaign level ────────────────────────────────────────────────────
    # CR-37: added segments.date for daily granularity
    base: dict[str, dict] = {}
    q_c_base = f"""
        SELECT campaign.id, campaign.name, segments.date,
               metrics.cost_micros, metrics.clicks, metrics.impressions
        FROM campaign
        WHERE {date_clause}
          AND campaign.status != 'REMOVED'
          AND metrics.cost_micros > 0
    """
    try:
        for batch in ga_svc.search_stream(customer_id=customer_id, query=q_c_base):
            for row in batch.results:
                dt = row.segments.date
                key = f"{row.campaign.name}|{dt}"
                if key not in base:
                    base[key] = {
                        "campaign_name": row.campaign.name,
                        "campaign_id": str(row.campaign.id),
                        "date": dt,
                        "spend":       round(row.metrics.cost_micros / 1_000_000, 2),
                        "clicks":      int(row.metrics.clicks),
                        "impressions": int(row.metrics.impressions),
                        **_empty_conv(),
                    }
                else:
                    base[key]["spend"]       += round(row.metrics.cost_micros / 1_000_000, 2)
                    base[key]["clicks"]      += int(row.metrics.clicks)
                    base[key]["impressions"] += int(row.metrics.impressions)
    except Exception as e:
        logger.error("Google Ads campaign base query failed: %s", e)

    # Query 1b: per-action conversions using all_conversions
    q_c_conv = f"""
        SELECT campaign.name, segments.date,
               segments.conversion_action_name,
               metrics.all_conversions
        FROM campaign
        WHERE {date_clause}
          AND campaign.status != 'REMOVED'
          AND metrics.all_conversions > 0
    """
    try:
        for batch in ga_svc.search_stream(customer_id=customer_id, query=q_c_conv):
            for row in batch.results:
                dt = row.segments.date
                key = f"{row.campaign.name}|{dt}"
                if key in base:
                    _accumulate_conv(base[key],
                                     row.segments.conversion_action_name,
                                     row.metrics.all_conversions)
    except Exception as e:
        logger.error("Google Ads campaign conv query failed: %s", e)

    campaign_docs = [
        {
            "source": "google", "level": "campaign",
            "campaign": v["campaign_name"], "campaign_id": v["campaign_id"],
            "ad_set": "", "ad_name": "",
            "spend": v["spend"], "clicks": v["clicks"], "impressions": v["impressions"],
            "book_demo_count":  v["book_demo_count"],
            "schedule_count":   v["schedule_count"],
            "demo_given_count": v["demo_given_count"],
            "purchase_count":   v["purchase_count"],
            "publisher_platform": "google", "audience": "",
            "campaign_created_date": "",
            "date_start": v["date"],
            "date_stop":  v["date"],
            "synced_at": now,
        }
        for v in base.values()
    ]

    # ── Ad Group (AdSet) level ────────────────────────────────────────────
    adgroups: dict[str, dict] = {}
    q_ag_base = f"""
        SELECT campaign.name, ad_group.id, ad_group.name, segments.date,
               metrics.cost_micros, metrics.clicks, metrics.impressions
        FROM ad_group
        WHERE {date_clause}
          AND campaign.status != 'REMOVED'
          AND metrics.cost_micros > 0
    """
    try:
        for batch in ga_svc.search_stream(customer_id=customer_id, query=q_ag_base):
            for row in batch.results:
                dt = row.segments.date
                key = f"{row.campaign.name}|{row.ad_group.name}|{dt}"
                if key not in adgroups:
                    adgroups[key] = {
                        "campaign":    row.campaign.name,
                        "ad_set":      row.ad_group.name,
                        "ad_set_id":   str(row.ad_group.id),
                        "date":        dt,
                        "spend":       round(row.metrics.cost_micros / 1_000_000, 2),
                        "clicks":      int(row.metrics.clicks),
                        "impressions": int(row.metrics.impressions),
                        **_empty_conv(),
                    }
                else:
                    adgroups[key]["spend"]       += round(row.metrics.cost_micros / 1_000_000, 2)
                    adgroups[key]["clicks"]      += int(row.metrics.clicks)
                    adgroups[key]["impressions"] += int(row.metrics.impressions)
    except Exception as e:
        logger.error("Google Ads ad_group base query failed: %s", e)

    q_ag_conv = f"""
        SELECT campaign.name, ad_group.name, segments.date,
               segments.conversion_action_name,
               metrics.all_conversions
        FROM ad_group
        WHERE {date_clause}
          AND campaign.status != 'REMOVED'
          AND metrics.all_conversions > 0
    """
    try:
        for batch in ga_svc.search_stream(customer_id=customer_id, query=q_ag_conv):
            for row in batch.results:
                dt = row.segments.date
                key = f"{row.campaign.name}|{row.ad_group.name}|{dt}"
                if key in adgroups:
                    _accumulate_conv(adgroups[key],
                                     row.segments.conversion_action_name,
                                     row.metrics.all_conversions)
    except Exception as e:
        logger.error("Google Ads ad_group conv query failed: %s", e)

    adgroup_docs = [
        {
            "source": "google", "level": "adset",
            "campaign": v["campaign"], "ad_set": v["ad_set"], "ad_set_id": v["ad_set_id"],
            "ad_name": "",
            "spend": v["spend"], "clicks": v["clicks"], "impressions": v["impressions"],
            "book_demo_count":  v["book_demo_count"],
            "schedule_count":   v["schedule_count"],
            "demo_given_count": v["demo_given_count"],
            "purchase_count":   v["purchase_count"],
            "publisher_platform": "google", "audience": "",
            "date_start": v["date"],
            "date_stop":  v["date"],
            "synced_at": now,
        }
        for v in adgroups.values()
    ]

    # ── Ad level ──────────────────────────────────────────────────────────
    ads: dict[str, dict] = {}
    q_ad_base = f"""
        SELECT campaign.name, ad_group.name, segments.date,
               ad_group_ad.ad.id, ad_group_ad.ad.name,
               metrics.cost_micros, metrics.clicks, metrics.impressions
        FROM ad_group_ad
        WHERE {date_clause}
          AND ad_group_ad.status != 'REMOVED'
          AND metrics.cost_micros > 0
    """
    try:
        for batch in ga_svc.search_stream(customer_id=customer_id, query=q_ad_base):
            for row in batch.results:
                dt = row.segments.date
                key = f"{row.ad_group_ad.ad.id}|{dt}"
                if key not in ads:
                    ads[key] = {
                        "campaign":    row.campaign.name,
                        "ad_set":      row.ad_group.name,
                        "ad_name":     row.ad_group_ad.ad.name or f"Ad {row.ad_group_ad.ad.id}",
                        "date":        dt,
                        "spend":       round(row.metrics.cost_micros / 1_000_000, 2),
                        "clicks":      int(row.metrics.clicks),
                        "impressions": int(row.metrics.impressions),
                        **_empty_conv(),
                    }
                else:
                    ads[key]["spend"]       += round(row.metrics.cost_micros / 1_000_000, 2)
                    ads[key]["clicks"]      += int(row.metrics.clicks)
                    ads[key]["impressions"] += int(row.metrics.impressions)
    except Exception as e:
        logger.error("Google Ads ad base query failed: %s", e)

    q_ad_conv = f"""
        SELECT campaign.name, ad_group.name, segments.date,
               ad_group_ad.ad.id,
               segments.conversion_action_name,
               metrics.all_conversions
        FROM ad_group_ad
        WHERE {date_clause}
          AND ad_group_ad.status != 'REMOVED'
          AND metrics.all_conversions > 0
    """
    try:
        for batch in ga_svc.search_stream(customer_id=customer_id, query=q_ad_conv):
            for row in batch.results:
                dt = row.segments.date
                key = f"{row.ad_group_ad.ad.id}|{dt}"
                if key in ads:
                    _accumulate_conv(ads[key],
                                     row.segments.conversion_action_name,
                                     row.metrics.all_conversions)
    except Exception as e:
        logger.error("Google Ads ad conv query failed: %s", e)

    ad_docs = [
        {
            "source": "google", "level": "ad",
            "campaign": v["campaign"], "ad_set": v["ad_set"], "ad_name": v["ad_name"],
            "spend": v["spend"], "clicks": v["clicks"], "impressions": v["impressions"],
            "book_demo_count":  v["book_demo_count"],
            "schedule_count":   v["schedule_count"],
            "demo_given_count": v["demo_given_count"],
            "purchase_count":   v["purchase_count"],
            "publisher_platform": "google", "audience": "",
            "date_start": v["date"],
            "date_stop":  v["date"],
            "synced_at": now,
        }
        for v in ads.values()
    ]

    return campaign_docs + adgroup_docs + ad_docs


async def sync_google(db, date_from: str | None = None, date_to: str | None = None) -> dict:
    """Pull Google Ads data using stored OAuth refresh token and upsert into ad_spend.
    CR-37: Incremental sync with daily granularity and date_start/date_stop fields."""
    import asyncio

    dev_token   = os.environ.get("GOOGLE_ADS_DEVELOPER_TOKEN", "")
    customer_id = os.environ.get("GOOGLE_ADS_CUSTOMER_ID", "")

    if not dev_token or not customer_id:
        return {"enabled": False, "message": "GOOGLE_ADS_DEVELOPER_TOKEN or GOOGLE_ADS_CUSTOMER_ID not set"}

    # Load refresh token from DB
    token_doc = await db.google_ads_tokens.find_one({"user_id": "admin", "active": True})
    if not token_doc or not token_doc.get("refresh_token"):
        return {"enabled": False, "message": "Google Ads not connected — click 'Connect Google Ads' first"}

    refresh_token = token_doc["refresh_token"]

    # CR-37: Calculate incremental date range if not explicitly provided
    if not date_from or not date_to:
        last_date = await _get_last_sync_date(db, "google")
        if last_date:
            date_from = last_date
            date_to = date.today().isoformat()
            logger.info("Google incremental sync: %s to %s", date_from, date_to)
        else:
            date_from = "2025-01-01"
            date_to = date.today().isoformat()
            logger.info("Google full sync (first time): %s to %s", date_from, date_to)

    try:
        # Run synchronous Google Ads client in thread pool
        loop = asyncio.get_event_loop()
        docs = await loop.run_in_executor(
            None,
            _run_google_ads_sync,
            refresh_token,
            customer_id,
            date_from,
            date_to,
        )

        if docs:
            # CR-37: Incremental delete — only remove rows that overlap with synced range
            await db.ad_spend.delete_many({
                "source": "google",
                "date_start": {"$gte": date_from},
            })
            await db.ad_spend.insert_many(docs)

        campaigns = len({d["campaign"] for d in docs if d["level"] == "campaign"})
        adsets    = len({d["ad_set"]   for d in docs if d["level"] == "adset"})
        ads       = len([d            for d in docs if d["level"] == "ad"])
        return {
            "enabled":   True,
            "synced":    len(docs),
            "campaigns": campaigns,
            "adsets":    adsets,
            "ads":       ads,
            "period":    f"{date_from} to {date_to}",
        }

    except Exception as e:
        logger.error("Google Ads sync failed: %s", e)
        return {"enabled": True, "error": str(e), "synced": 0}

