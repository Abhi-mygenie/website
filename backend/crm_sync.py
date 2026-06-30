"""CR-19 — CRM Sync: Freshsales → MongoDB.

Pulls contacts at funnel stages 3-6 from Freshsales every 6 hours and writes
crm_status fields to demo_requests / quotes / contact_messages.
Historical contacts not in MongoDB are upserted to backfilled_leads collection.

Never raises — all exceptions are caught and logged so the scheduler never crashes.
"""
import asyncio
import json
import logging
import os
from datetime import datetime, timezone

import freshsales

logger = logging.getLogger(__name__)

# ── Stage status ID constants ──────────────────────────────────────────────
DEMO_SCHEDULED_ID = int(os.environ.get("FRESHSALES_STATUS_DEMO_BOOKED_ID") or 0)
DEMO_GIVEN_ID     = int(os.environ.get("FRESHSALES_STATUS_DEMO_GIVEN_ID") or 0)
WON_ID            = int(os.environ.get("FRESHSALES_STATUS_WON_ID") or 0)
LOST_ID           = int(os.environ.get("FRESHSALES_STATUS_LOST_ID") or 0)
SYNC_ENABLED      = os.environ.get("CRM_SYNC_ENABLED", "true").lower() == "true"

STAGE_STATUS_IDS = {
    "demo_scheduled": DEMO_SCHEDULED_ID,
    "demo_given":     DEMO_GIVEN_ID,
    "won":            WON_ID,
    "lost":           LOST_ID,
}

LIFECYCLE_MAP = json.loads(os.environ.get("FRESHSALES_LIFECYCLE_MAP", "{}")) or {
    403021121245: "lead",
    403021121246: "qualified",
    403021121247: "customer",
}
# Ensure keys are ints (JSON keys are strings)
LIFECYCLE_MAP = {int(k): v for k, v in LIFECYCLE_MAP.items()}

LOST_REASON_MAP = json.loads(os.environ.get("FRESHSALES_LOST_REASONS", "{}")) or {
    403021121249: "Not able to reach",
    403021121250: "Not interested",
    403021121251: "Budget",
    403021121252: "Lost to competitor",
    403025076872: "Small Set up",
    403025076881: "Personal reasons",
    403025081184: "Hotel only / small restaurant",
    403025085248: "Already using POS",
    403038210055: "Multiple Aggregator",
}
LOST_REASON_MAP = {int(k): v for k, v in LOST_REASON_MAP.items()}


def _lifecycle_label(stage_id):
    return LIFECYCLE_MAP.get(stage_id)


async def _update_lead_stage(db, contact_id, crm_status, lost_reason, lifecycle) -> bool:
    """Update crm_status fields on any collection with this freshsales_contact_id.
    Returns True if at least one doc was updated."""
    if not contact_id:
        return False
    update = {"$set": {
        "crm_status": crm_status,
        "crm_status_updated_at": datetime.now(timezone.utc).isoformat(),
        "crm_lost_reason": lost_reason,
        "crm_lifecycle_stage": lifecycle,
    }}
    matched = 0
    for col in (db.demo_requests, db.quotes, db.contact_messages):
        result = await col.update_many({"freshsales_contact_id": contact_id}, update)
        matched += result.matched_count
    return matched > 0


async def _upsert_backfilled(db, contact, crm_status, lost_reason, lifecycle):
    """Create or update a lightweight backfilled_leads doc for historical contacts
    that have no MongoDB lead doc (old website had no DB)."""
    contact_id = contact.get("id")
    if not contact_id:
        return
    first = (contact.get("first_name") or "").strip()
    last  = (contact.get("last_name") or "").strip()
    name  = f"{first} {last}".strip()
    emails = contact.get("emails") or []
    email = emails[0].get("value") if emails else None
    cf = contact.get("custom_field") or {}
    doc_always = {
        "freshsales_contact_id": contact_id,
        "name": name,
        "phone": contact.get("mobile_number") or contact.get("work_number"),
        "email": email,
        "city": contact.get("city"),
        "crm_status": crm_status,
        "crm_status_updated_at": datetime.now(timezone.utc).isoformat(),
        "crm_lost_reason": lost_reason,
        "crm_lifecycle_stage": lifecycle,
        "created_at": contact.get("created_at"),
        "backfilled": True,
        "backfill_source": "freshsales",
    }
    # Attribution fields: only overwrite if the incoming value is non-null.
    # This prevents the regular (partial-response) sync from clobbering attribution
    # data written by the source_backfill job which fetches full contacts.
    attribution = {
        "first_source":   contact.get("first_source"),
        "first_medium":   contact.get("first_medium"),
        "first_campaign": contact.get("first_campaign"),
        "latest_source":  contact.get("latest_source"),
        "latest_medium":  contact.get("latest_medium"),
        "ad_set":         cf.get("cf_est_name"),
        "fbclid":         cf.get("cf_latitude"),
        "gclid":          cf.get("cf_pos_type"),  # CR-28: gclid in own field
        # CR-25: new attribution fields
        "ad_id":            cf.get("cf_self_delivery_take_away"),
        "adset_id":         cf.get("cf_inventory_used"),
        "placement":        cf.get("cf_complete_address"),
        "utm_id":           cf.get("cf_account_software_integrated"),
        "site_source_name": cf.get("cf_aggreator_management"),
        "event_id":         cf.get("cf_contact_person"),
    }
    # Use aggregation pipeline update so we can preserve existing non-null values
    await db.backfilled_leads.update_one(
        {"freshsales_contact_id": contact_id},
        [{"$set": {
            **doc_always,
            **{k: {"$ifNull": [f"${k}", v]} for k, v in attribution.items()},
        }}],
        upsert=True,
    )


async def _run(db, trigger: str) -> dict:
    """Core sync logic — shared by run_sync and run_backfill."""
    if not SYNC_ENABLED:
        logger.info("CRM sync disabled (CRM_SYNC_ENABLED=false)")
        return {"skipped": True}

    if not freshsales.is_enabled():
        logger.info("Freshsales not configured — skipping CRM sync")
        return {"skipped": True}

    started = datetime.now(timezone.utc)
    stats = {"fetched": 0, "matched": 0, "unmatched": 0, "errors": 0}

    for crm_status, status_id in STAGE_STATUS_IDS.items():
        if not status_id:
            logger.warning("Status ID not configured for stage=%s — skipping", crm_status)
            continue

        page = 1
        while True:
            try:
                resp = await freshsales.get_contacts_by_status(status_id, page)
            except Exception as e:
                logger.error("crm_sync fetch error stage=%s page=%d: %s", crm_status, page, e)
                stats["errors"] += 1
                break

            contacts = resp.get("contacts") or []
            if not contacts:
                break

            for contact in contacts:
                stats["fetched"] += 1
                contact_id = contact.get("id")
                lost_reason_id = contact.get("lost_reason_id")
                lost_reason = LOST_REASON_MAP.get(lost_reason_id) if lost_reason_id else None
                lifecycle = _lifecycle_label(contact.get("lifecycle_stage_id"))

                try:
                    matched = await _update_lead_stage(
                        db, contact_id, crm_status, lost_reason, lifecycle
                    )
                    if matched:
                        stats["matched"] += 1
                    else:
                        await _upsert_backfilled(db, contact, crm_status, lost_reason, lifecycle)
                        stats["unmatched"] += 1
                except Exception as e:
                    logger.error("crm_sync update error contact=%s: %s", contact_id, e)
                    stats["errors"] += 1

            if len(contacts) < 100:
                break

            page += 1
            await asyncio.sleep(2.0)  # rate limit guard — ~30 req/min safe margin

    ended = datetime.now(timezone.utc)
    duration = round((ended - started).total_seconds(), 2)
    log_entry = {
        **stats,
        "started_at": started.isoformat(),
        "ended_at": ended.isoformat(),
        "duration_s": duration,
        "trigger": trigger,
    }
    try:
        await db.crm_sync_log.insert_one(log_entry)
    except Exception as e:
        logger.error("crm_sync log write error: %s", e)

    logger.info("CRM sync complete trigger=%s stats=%s duration=%.1fs", trigger, stats, duration)
    return stats


async def run_sync(db) -> dict:
    """Scheduled 6-hour sync. Never raises."""
    try:
        return await _run(db, "scheduled")
    except Exception as e:
        logger.error("crm_sync run_sync unhandled error: %s", e)
        return {"error": str(e)}


async def run_otp_backfill(db) -> dict:
    """Mark backfilled paid contacts as otp_verified=True using Freshsales cf_rooms='Yes'.
    Runs a single filtered_search (cf_rooms=Yes + source filter) and bulk-updates MongoDB.
    CR-40: Also adds 'OTP-Verified' tag to each matched Freshsales contact."""
    try:
        if not freshsales.is_enabled():
            return {"skipped": True}

        all_source_vals = [v for _, vals in _SOURCE_BUCKETS for v in vals]
        otp_ids: set[int] = set()
        page = 1
        while True:
            data = await _fs_search([
                {"attribute": "cf_rooms", "operator": "is_in", "value": ["Yes"]},
                {"attribute": "first_source", "operator": "is_in", "value": all_source_vals},
            ], page=page)
            contacts = data.get("contacts") or []
            for c in contacts:
                cid = c.get("id")
                if cid:
                    otp_ids.add(int(cid))
            if len(contacts) < 100:
                break
            page += 1
            await asyncio.sleep(2.0)

        logger.info("otp_backfill: %d paid contacts with cf_rooms=Yes", len(otp_ids))

        if otp_ids:
            result = await db.backfilled_leads.update_many(
                {"freshsales_contact_id": {"$in": list(otp_ids)}},
                {"$set": {"otp_verified": True}},
            )
            logger.info("otp_backfill: marked %d contacts as otp_verified=True", result.modified_count)

            # CR-40: Tag each matched contact with "OTP-Verified" in Freshsales
            tagged = 0
            tag_errors = 0
            for cid in otp_ids:
                try:
                    existing_tags = await freshsales._get_contact_tags(cid)
                    if "OTP-Verified" not in existing_tags:
                        merged = freshsales._merge_tags(existing_tags, "OTP-Verified")
                        r = await freshsales._request(
                            "PUT", f"/contacts/{cid}",
                            json={"contact": {"tags": merged}},
                        )
                        if r.status_code < 400:
                            tagged += 1
                        else:
                            logger.warning("otp_backfill tag: contact %d returned %d", cid, r.status_code)
                            tag_errors += 1
                    await asyncio.sleep(2.0)
                except Exception as e:
                    logger.error("otp_backfill tag: contact %d error: %s", cid, e)
                    tag_errors += 1

            logger.info("otp_backfill: tagged %d contacts with OTP-Verified (%d errors)", tagged, tag_errors)
            return {
                "found_in_freshsales": len(otp_ids),
                "marked_in_db": result.modified_count,
                "tagged_in_freshsales": tagged,
                "tag_errors": tag_errors,
            }
        return {"found_in_freshsales": 0, "marked_in_db": 0, "tagged_in_freshsales": 0, "tag_errors": 0}

    except Exception as e:
        logger.error("otp_backfill: error: %s", e)
        return {"error": str(e)}
    """One-time historical backfill (all contacts at stages 3-6). Never raises."""
    try:
        return await _run(db, "backfill")
    except Exception as e:
        logger.error("crm_sync run_backfill unhandled error: %s", e)
        return {"error": str(e)}


# ── Source Backfill (CR-19 historic: all paid-source leads) ──

_BACKFILL_FROM = os.environ.get("BACKFILL_DATE_FROM", "2025-07-01")
_BACKFILL_TO   = os.environ.get("BACKFILL_DATE_TO", "")  # empty = no cutoff

# Known source values in Freshsales "Original source" field → canonical bucket
_SOURCE_BUCKETS_DEFAULT = [
    ("google",   ["google", "google1", "Google", "Google "]),
    ("facebook", ["facebook", "facebook-SiteLink", "fb", "Facebook"]),
    ("website",  ["website", "Website", "web", "Web"]),
    ("chat",     ["chat", "Chat", "livechat", "live_chat"]),
]
_raw_buckets = os.environ.get("FRESHSALES_SOURCE_BUCKETS", "")
if _raw_buckets:
    _SOURCE_BUCKETS = [(k, v) for k, v in json.loads(_raw_buckets).items()]
else:
    _SOURCE_BUCKETS = _SOURCE_BUCKETS_DEFAULT

_STATUS_ID_TO_STAGE = {
    int(os.environ.get("FRESHSALES_STATUS_DEMO_BOOKED_ID") or 0): "demo_scheduled",
    int(os.environ.get("FRESHSALES_STATUS_DEMO_GIVEN_ID") or 0):  "demo_given",
    int(os.environ.get("FRESHSALES_STATUS_WON_ID") or 0):         "won",
    int(os.environ.get("FRESHSALES_STATUS_LOST_ID") or 0):        "lost",
}

def _parse_date(dt_str: str | None) -> str | None:
    return dt_str[:10] if dt_str else None


async def _fs_search(filter_rules: list, page: int = 1, per_page: int = 100) -> dict:
    """Thin wrapper around Freshsales filtered_search with rate-limit handling."""
    import httpx
    headers = {"Authorization": f"Token token={freshsales.API_KEY}", "Content-Type": "application/json"}
    payload = {"filter_rule": filter_rules, "page": page, "per_page": per_page,
               "sort": "created_at", "sort_type": "asc"}
    for attempt in range(3):
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.post(f"{freshsales.BASE_URL.rstrip('/')}/filtered_search/contact",
                                  headers=headers, json=payload)
        if r.status_code == 429:
            wait = int(r.headers.get("Retry-After", 60))
            logger.warning("source_backfill: 429 — waiting %ds", wait)
            await asyncio.sleep(wait)
            continue
        return r.json()
    return {}


async def _build_stage_map() -> dict[int, str]:
    """Pass 1: build {contact_id → stage_label} for the ~213 contacts already at funnel stages.
    Runs 4 lightweight filtered_search queries (one per stage). No individual GETs."""
    stage_map: dict[int, str] = {}
    all_source_vals = [v for _, vals in _SOURCE_BUCKETS for v in vals]
    for status_id, stage_label in _STATUS_ID_TO_STAGE.items():
        if not status_id:
            continue
        page = 1
        while True:
            data = await _fs_search([
                {"attribute": "first_source", "operator": "is_in", "value": all_source_vals},
                {"attribute": "contact_status_id", "operator": "is_in", "value": [str(status_id)]},
            ], page=page)
            contacts = data.get("contacts") or []
            for c in contacts:
                cid = c.get("id")
                if cid:
                    stage_map[int(cid)] = stage_label
            if len(contacts) < 100:
                break
            page += 1
            await asyncio.sleep(2.0)
        logger.info("source_backfill stage_map: stage=%s contacts=%d",
                    stage_label, sum(1 for v in stage_map.values() if v == stage_label))
        await asyncio.sleep(1.5)
    return stage_map


async def _fetch_all_with_source() -> list[dict]:
    """Pass 2: fetch ALL contacts that have any paid source (no stage filter).
    Each contact is tagged with _bucket ('google' or 'facebook')."""
    all_contacts: list[dict] = []
    seen_ids: set[int] = set()
    for bucket, source_vals in _SOURCE_BUCKETS:
        page = 1
        bucket_count = 0
        while True:
            data = await _fs_search([
                {"attribute": "first_source", "operator": "is_in", "value": source_vals},
            ], page=page)
            contacts = data.get("contacts") or []
            for c in contacts:
                cid = c.get("id")
                if cid and int(cid) not in seen_ids:
                    c["_bucket"] = bucket
                    all_contacts.append(c)
                    seen_ids.add(int(cid))
                    bucket_count += 1
            if len(contacts) < 100:
                break
            page += 1
            await asyncio.sleep(2.0)
        logger.info("source_backfill all_source: bucket=%s fetched=%d", bucket, bucket_count)
        await asyncio.sleep(1.5)
    return all_contacts


async def run_source_backfill(db) -> dict:
    """Pull ALL Google/Facebook paid contacts (Jul 2025–Jun 2026) regardless of funnel stage.
    Two-pass: stage map first, then full source pull. No individual contact GETs needed.
    Existing contacts with full attribution data are preserved via $ifNull. Never raises."""
    try:
        if not freshsales.is_enabled():
            return {"skipped": True, "reason": "Freshsales not configured"}

        started = datetime.now(timezone.utc)
        logger.info("source_backfill v2: starting")

        # Pass 1 — who's at which funnel stage
        stage_map = await _build_stage_map()
        logger.info("source_backfill v2: stage_map has %d contacts", len(stage_map))

        # Pass 2 — all paid source contacts (no stage filter)
        all_contacts = await _fetch_all_with_source()
        logger.info("source_backfill v2: %d total source contacts fetched", len(all_contacts))

        # Date filter (API date filter broken — do it in Python)
        def _in_date_range(c):
            d = _parse_date(c.get("created_at")) or ""
            if _BACKFILL_FROM and d < _BACKFILL_FROM:
                return False
            if _BACKFILL_TO and d > _BACKFILL_TO:
                return False
            return True

        in_range = [c for c in all_contacts if _in_date_range(c)]
        logger.info("source_backfill v2: %d contacts in range %s–%s",
                    len(in_range), _BACKFILL_FROM or "(no start)", _BACKFILL_TO or "(no end)")

        stats = {"total_source": len(all_contacts), "in_range": len(in_range),
                 "upserted": 0, "errors": 0}

        now_str = datetime.now(timezone.utc).isoformat()

        for i, c in enumerate(in_range):
            cid = int(c.get("id"))
            bucket = c.get("_bucket", "unknown")  # "google" or "facebook"

            # Basic identity fields from partial response
            emails = c.get("emails") or []
            email  = emails[0].get("value") if emails else c.get("email")
            first  = (c.get("first_name") or "").strip()
            last   = (c.get("last_name") or "").strip()

            crm_status = stage_map.get(cid)   # None for pre-funnel contacts

            # Fields that should ALWAYS be written (non-attribution)
            always = {
                "freshsales_contact_id": cid,
                "name":        f"{first} {last}".strip() or None,
                "phone":       c.get("mobile_number") or c.get("work_number"),
                "email":       email,
                "city":        c.get("city"),
                "crm_status":  crm_status,
                "crm_status_updated_at": now_str,
                "created_at":  c.get("created_at"),
                "backfilled":  True,
                "backfill_source": "freshsales_source_backfill",
            }

            # Attribution: preserve existing non-null values (previous full-contact backfill data)
            # For new contacts first_source comes from the bucket label
            attribution = {
                "first_source":   bucket,       # inferred from filter bucket
                "first_medium":   None,          # full GET data preserved via $ifNull if already set
                "first_campaign": None,
                "latest_source":  None,
                "latest_medium":  None,
            }

            try:
                # Aggregation pipeline update: $ifNull preserves existing non-null attribution
                await db.backfilled_leads.update_one(
                    {"freshsales_contact_id": cid},
                    [{"$set": {
                        **always,
                        "first_source":   {"$ifNull": ["$first_source",   attribution["first_source"]]},
                        "first_medium":   {"$ifNull": ["$first_medium",   attribution["first_medium"]]},
                        "first_campaign": {"$ifNull": ["$first_campaign", attribution["first_campaign"]]},
                        "latest_source":  {"$ifNull": ["$latest_source",  attribution["latest_source"]]},
                        "latest_medium":  {"$ifNull": ["$latest_medium",  attribution["latest_medium"]]},
                    }}],
                    upsert=True,
                )
                stats["upserted"] += 1
            except Exception as e:
                logger.error("source_backfill: upsert error contact=%s: %s", cid, e)
                stats["errors"] += 1

            if (i + 1) % 50 == 0:
                logger.info("source_backfill v2: progress %d/%d upserted=%d errors=%d",
                            i + 1, len(in_range), stats["upserted"], stats["errors"])

        ended = datetime.now(timezone.utc)
        stats["duration_s"] = round((ended - started).total_seconds(), 2)

        await db.crm_sync_log.insert_one({
            **stats, "started_at": started.isoformat(),
            "ended_at": ended.isoformat(), "trigger": "source_backfill_v2",
        })

        logger.info("source_backfill v2: complete stats=%s", stats)
        return stats

    except Exception as e:
        logger.error("source_backfill v2: unhandled error: %s", e)
        return {"error": str(e)}


# ── CR-26: Source Sync — pull ALL contacts where first_source is not null ──────

SOURCE_SYNC_AFTER_DATE = os.environ.get("SOURCE_SYNC_AFTER_DATE", "2025-07-01")
SOURCE_SYNC_SCHEDULED_AFTER_DATE = os.environ.get("SOURCE_SYNC_SCHEDULED_AFTER_DATE", "2026-06-20")

NEW_STATUS_ID = int(os.environ.get("FRESHSALES_STATUS_NEW_ID") or 0)

_ALL_STATUS_TO_STAGE = {
    **_STATUS_ID_TO_STAGE,
    NEW_STATUS_ID: "new",
}


async def run_source_sync(db, after_date: str | None = None) -> dict:
    """Pull all Freshsales contacts where first_source is not empty, created after cutoff date.
    For contacts missing attribution in MongoDB, do individual GET to fetch full data.
    Never raises."""
    try:
        if not freshsales.is_enabled():
            return {"skipped": True, "reason": "Freshsales not configured"}

        cutoff = after_date or SOURCE_SYNC_AFTER_DATE
        started = datetime.now(timezone.utc)
        logger.info("source_sync: starting — contacts with first_source after %s", cutoff)

        # Pass 1: discover contacts with non-empty first_source created after cutoff
        all_contacts: list[dict] = []
        seen_ids: set[int] = set()
        page = 1
        while True:
            data = await _fs_search([
                {"attribute": "first_source", "operator": "is_not_null", "value": ""},
                {"attribute": "created_at", "operator": "is_after", "value": cutoff},
            ], page=page, per_page=100)
            contacts = data.get("contacts") or []
            for c in contacts:
                cid = c.get("id")
                if cid and int(cid) not in seen_ids:
                    all_contacts.append(c)
                    seen_ids.add(int(cid))
            if len(contacts) < 100:
                break
            page += 1
            await asyncio.sleep(2.0)

        logger.info("source_sync: discovered %d contacts with first_source after %s", len(all_contacts), cutoff)

        # Pass 2: find which contacts are missing attribution in MongoDB
        existing_with_source = set()
        cursor = db.backfilled_leads.find(
            {"first_source": {"$nin": [None, ""]}},
            {"freshsales_contact_id": 1}
        )
        async for doc in cursor:
            fid = doc.get("freshsales_contact_id")
            if fid:
                existing_with_source.add(int(fid))

        gap_contacts = [c for c in all_contacts if int(c["id"]) not in existing_with_source]
        logger.info("source_sync: %d contacts missing attribution in MongoDB (gap)", len(gap_contacts))

        stats = {
            "discovered": len(all_contacts),
            "already_have": len(existing_with_source),
            "gap": len(gap_contacts),
            "synced": 0,
            "errors": 0,
        }

        now_str = datetime.now(timezone.utc).isoformat()

        # Pass 3: individual GET for gap contacts to get full data (cf_ fields + native attribution)
        import httpx
        headers = {"Authorization": f"Token token={freshsales.API_KEY}"}

        for i, c in enumerate(gap_contacts):
            cid = int(c["id"])
            try:
                async with httpx.AsyncClient(timeout=20.0) as client:
                    r = await client.get(
                        f"{freshsales.BASE_URL.rstrip('/')}/contacts/{cid}",
                        headers=headers,
                    )
                if r.status_code == 429:
                    wait = int(r.headers.get("Retry-After", 60))
                    logger.warning("source_sync: 429 at contact %d — waiting %ds", cid, wait)
                    await asyncio.sleep(wait)
                    continue
                if r.status_code != 200:
                    logger.warning("source_sync: GET contact %d returned %d", cid, r.status_code)
                    stats["errors"] += 1
                    continue

                full_contact = r.json().get("contact", {})
                cf = full_contact.get("custom_field", {})
                status_id = full_contact.get("contact_status_id")
                crm_status = _ALL_STATUS_TO_STAGE.get(status_id)
                lost_reason_id = full_contact.get("lost_reason_id")
                lost_reason = LOST_REASON_MAP.get(lost_reason_id) if lost_reason_id else None
                lifecycle = _lifecycle_label(full_contact.get("lifecycle_stage_id"))

                emails = full_contact.get("emails") or []
                email = emails[0].get("value") if emails else full_contact.get("email")
                first = (full_contact.get("first_name") or "").strip()
                last = (full_contact.get("last_name") or "").strip()

                doc_always = {
                    "freshsales_contact_id": cid,
                    "name": f"{first} {last}".strip() or None,
                    "phone": full_contact.get("mobile_number") or full_contact.get("work_number"),
                    "email": email,
                    "city": full_contact.get("city"),
                    "crm_status": crm_status,
                    "crm_status_updated_at": now_str,
                    "crm_lost_reason": lost_reason,
                    "crm_lifecycle_stage": lifecycle,
                    "created_at": full_contact.get("created_at"),
                    "backfilled": True,
                    "backfill_source": "source_sync",
                }

                attribution = {
                    "first_source":     full_contact.get("first_source"),
                    "first_medium":     full_contact.get("first_medium"),
                    "first_campaign":   full_contact.get("first_campaign"),
                    "latest_source":    full_contact.get("latest_source"),
                    "latest_medium":    full_contact.get("latest_medium"),
                    "latest_campaign":  full_contact.get("latest_campaign"),
                    "keyword":          full_contact.get("keyword"),
                    "ad_set":           cf.get("cf_est_name"),
                    "fbclid":           cf.get("cf_latitude"),
                    "gclid":            cf.get("cf_pos_type"),  # CR-28
                    # CR-25 fields
                    "ad_id":            cf.get("cf_self_delivery_take_away"),
                    "adset_id":         cf.get("cf_inventory_used"),
                    "placement":        cf.get("cf_complete_address"),
                    "utm_id":           cf.get("cf_account_software_integrated"),
                    "site_source_name": cf.get("cf_aggreator_management"),
                    "event_id":         cf.get("cf_contact_person"),
                }

                await db.backfilled_leads.update_one(
                    {"freshsales_contact_id": cid},
                    [{"$set": {
                        **doc_always,
                        **{k: {"$ifNull": [f"${k}", v]} for k, v in attribution.items()},
                    }}],
                    upsert=True,
                )
                stats["synced"] += 1

            except Exception as e:
                logger.error("source_sync: error contact %d: %s", cid, e)
                stats["errors"] += 1

            # Rate limit: 2s between individual GETs
            await asyncio.sleep(2.0)

            if (i + 1) % 20 == 0:
                logger.info("source_sync: progress %d/%d synced=%d errors=%d",
                            i + 1, len(gap_contacts), stats["synced"], stats["errors"])

        ended = datetime.now(timezone.utc)
        stats["duration_s"] = round((ended - started).total_seconds(), 2)

        await db.crm_sync_log.insert_one({
            **stats, "started_at": started.isoformat(),
            "ended_at": ended.isoformat(), "trigger": "source_sync",
        })

        logger.info("source_sync: complete stats=%s", stats)
        return stats

    except Exception as e:
        logger.error("source_sync: unhandled error: %s", e)
        return {"error": str(e)}
