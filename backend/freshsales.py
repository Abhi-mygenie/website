"""Freshsales Suite (Freshworks Neo) CRM client.

Best-effort lead sync: a website form submission creates/updates a Contact in
Freshsales. All calls are defensive — a CRM failure must NEVER block the lead
from being captured in MongoDB or surface an error to the visitor.

IMPORTANT — lifecycle stage limitation:
This Freshsales account silently ignores writes to `lifecycle_stage_id` /
`contact_status_id` via the contacts API (verified live: the fields stay null
even on create). We therefore signal lead state with TAGS, which ARE writable
and persist. The owner can map a tag -> lifecycle status with a simple
Freshsales Workflow (Admin > Workflows). See Freshsales_CRM_Integration.md.

Config (backend/.env):
  FRESHSALES_API_KEY            required to enable CRM push
  FRESHSALES_BASE_URL          e.g. https://mygenie-org.myfreshworks.com/crm/sales/api
  FRESHSALES_DEMO_BOOKED_TAG   tag applied when a demo is booked (default below)
"""
import os
import logging

import httpx

logger = logging.getLogger(__name__)

BASE_URL = os.environ.get("FRESHSALES_BASE_URL")
API_KEY = os.environ.get("FRESHSALES_API_KEY")
DEMO_BOOKED_TAG = os.environ.get("FRESHSALES_DEMO_BOOKED_TAG", "Demo Scheduled (Web)")
LEAD_LIFECYCLE_ID = os.environ.get("FRESHSALES_LIFECYCLE_LEAD_ID")
NEW_STATUS_ID = os.environ.get("FRESHSALES_STATUS_NEW_ID")
DEMO_BOOKED_LIFECYCLE_ID = os.environ.get("FRESHSALES_LIFECYCLE_DEMO_BOOKED_ID")
DEMO_BOOKED_STATUS_ID = os.environ.get("FRESHSALES_STATUS_DEMO_BOOKED_ID")


def is_enabled() -> bool:
    return bool(BASE_URL and API_KEY)


def _headers() -> dict:
    return {
        "Authorization": f"Token token={API_KEY}",
        "Content-Type": "application/json",
    }


def _split_name(full_name: str | None) -> tuple[str, str]:
    parts = (full_name or "").strip().split()
    if not parts:
        return ("Lead", "")
    if len(parts) == 1:
        return (parts[0], "")
    return (parts[0], " ".join(parts[1:]))


def _merge_tags(existing, *new) -> list:
    return list(dict.fromkeys([*(existing or []), *new]))


async def _request(method: str, path: str, **kwargs) -> httpx.Response:
    url = f"{BASE_URL.rstrip('/')}{path}"
    async with httpx.AsyncClient(timeout=10.0) as client:
        return await client.request(method, url, headers=_headers(), **kwargs)


def _first_contact(data) -> dict | None:
    contacts = []
    if isinstance(data, dict):
        c = data.get("contacts")
        if isinstance(c, dict):
            contacts = c.get("contacts", []) or []
        elif isinstance(c, list):
            contacts = c
    return contacts[0] if contacts else None


async def _lookup(value: str, field: str) -> dict | None:
    try:
        r = await _request(
            "GET", "/lookup", params={"q": value, "f": field, "entities": "contact"}
        )
        if r.status_code >= 400:
            logger.warning("Freshsales lookup(%s) %s: %s", field, r.status_code, r.text[:300])
            return None
        return _first_contact(r.json())
    except Exception as e:  # noqa: BLE001 - never let CRM break the request
        logger.warning("Freshsales lookup(%s) error: %s", field, e)
        return None


async def lookup_contact_by_email(email: str | None) -> dict | None:
    return await _lookup(email, "email") if email else None


async def lookup_contact_by_phone(phone: str | None) -> dict | None:
    """Find an existing contact by mobile number — the cross-form dedup key
    (forms make email optional, so phone is the reliable matcher)."""
    return await _lookup(phone, "mobile_number") if phone else None


async def _get_contact_tags(contact_id) -> list:
    try:
        r = await _request("GET", f"/contacts/{contact_id}")
        if r.status_code < 400:
            return (r.json().get("contact") or {}).get("tags") or []
    except Exception as e:  # noqa: BLE001
        logger.warning("Freshsales get-tags error: %s", e)
    return []


async def _create_contact(contact: dict) -> httpx.Response:
    """Create a contact; if custom fields are rejected, retry without them."""
    r = await _request("POST", "/contacts", json={"contact": contact})
    if r.status_code == 400 and contact.get("custom_field"):
        stripped = {k: v for k, v in contact.items() if k != "custom_field"}
        logger.info("Freshsales create retry without custom_field")
        r = await _request("POST", "/contacts", json={"contact": stripped})
    return r


async def upsert_contact(
    *,
    name: str,
    email: str | None = None,
    phone: str | None = None,
    external_id: str | None = None,
    city: str | None = None,
    job_title: str | None = None,
    work_number: str | None = None,
    custom_field: dict | None = None,
    tags: list | None = None,
    extra_fields: dict | None = None,
) -> int | None:
    """Create or update a Freshsales contact. Returns contact id or None.

    Custom fields MUST be sent under the singular ``custom_field`` key with
    ``cf_``-prefixed API names — Freshsales silently drops a plural
    ``custom_fields`` payload (see CR-1b). Standard fields (city, job_title,
    work_number) are sent at the top level.
    """
    if not is_enabled():
        logger.info("Freshsales not configured; skipping CRM push")
        return None
    try:
        cf = {k: v for k, v in (custom_field or {}).items() if v not in (None, "")}
        existing = await lookup_contact_by_email(email) if email else None
        if not existing and phone:
            # Fall back to phone (external_id = web_<phone>) so a returning
            # visitor is matched even when they omit/changed their email.
            existing = await lookup_contact_by_phone(phone)

        if existing:
            cid = existing.get("id")
            upd: dict = {}
            if phone:
                upd["mobile_number"] = phone
                upd["work_number"] = work_number or phone
            if city:
                upd["city"] = city
            if job_title:
                upd["job_title"] = job_title
            if cf:
                upd["custom_field"] = cf
            # Attribution / native fields. On an EXISTING contact we never
            # overwrite first-touch (`first_*`) — only refresh last-touch & co.
            if extra_fields:
                upd.update({
                    k: v for k, v in extra_fields.items()
                    if v not in (None, "") and not k.startswith("first_")
                })
            # Returning submitter — same contact matched across forms/visits.
            # Merge the new source tag(s) and flag 'Multi-Form' so sales can
            # spot high-intent repeat leads.
            upd["tags"] = _merge_tags(existing.get("tags"), *(tags or []), "Multi-Form")
            # NOTE: lifecycle/status are intentionally not written (account
            # ignores them); we never downgrade a progressing lead.
            if upd:
                r = await _request("PUT", f"/contacts/{cid}", json={"contact": upd})
                if r.status_code == 400 and "custom_field" in upd:
                    upd.pop("custom_field")
                    r = await _request("PUT", f"/contacts/{cid}", json={"contact": upd})
                if r.status_code >= 400:
                    logger.warning("Freshsales update %s: %s", r.status_code, r.text[:300])
            return cid

        first, last = _split_name(name)
        contact: dict = {"first_name": first, "last_name": last}
        if email:
            contact["email"] = email
        if phone:
            contact["mobile_number"] = phone
            contact["work_number"] = work_number or phone
        if city:
            contact["city"] = city
        if job_title:
            contact["job_title"] = job_title
        # This account marks External ID required on contacts; always send one.
        # Use web_<phone> as the cross-form dedup key (matches the CRM convention).
        contact["external_id"] = external_id or (f"web_{phone}" if phone else email)
        # Native lifecycle/status: this account's API accepts writes (they show
        # in the UI) but returns null on read, so we set them and trust the write.
        if LEAD_LIFECYCLE_ID:
            contact["lifecycle_stage_id"] = int(LEAD_LIFECYCLE_ID)
        if NEW_STATUS_ID:
            contact["contact_status_id"] = int(NEW_STATUS_ID)
        if tags:
            contact["tags"] = list(tags)
        if cf:
            contact["custom_field"] = cf
        # New contact — set both first-touch and last-touch attribution.
        if extra_fields:
            contact.update({k: v for k, v in extra_fields.items() if v not in (None, "")})

        r = await _create_contact(contact)
        if r.status_code >= 400:
            logger.warning("Freshsales create %s: %s", r.status_code, r.text[:400])
            return None
        data = r.json()
        c = data.get("contact") if isinstance(data, dict) else None
        return (c or {}).get("id")
    except Exception as e:  # noqa: BLE001
        logger.warning("Freshsales upsert error: %s", e)
        return None


async def mark_demo_booked(
    contact_id: int | None = None, email: str | None = None
) -> int | None:
    """Tag a contact as 'Demo booked' (merging with existing tags).

    Prefers the known Freshsales contact id (set at lead creation); falls back
    to an email lookup. Returns the contact id on success, else None.
    """
    if not is_enabled():
        return None
    try:
        cid = contact_id
        existing_tags: list = []
        if not cid and email:
            contact = await lookup_contact_by_email(email)
            if contact:
                cid = contact.get("id")
                existing_tags = contact.get("tags") or []
        if not cid:
            return None
        if not existing_tags:
            existing_tags = await _get_contact_tags(cid)
        merged = _merge_tags(existing_tags, DEMO_BOOKED_TAG)
        update: dict = {"tags": merged}
        # Also move the native lifecycle/status (write-only on this account).
        if DEMO_BOOKED_LIFECYCLE_ID:
            update["lifecycle_stage_id"] = int(DEMO_BOOKED_LIFECYCLE_ID)
        if DEMO_BOOKED_STATUS_ID:
            update["contact_status_id"] = int(DEMO_BOOKED_STATUS_ID)
        r = await _request("PUT", f"/contacts/{cid}", json={"contact": update})
        if r.status_code >= 400:
            logger.warning("Freshsales demo-booked %s: %s", r.status_code, r.text[:300])
            return None
        return cid
    except Exception as e:  # noqa: BLE001
        logger.warning("Freshsales demo-booked error: %s", e)
        return None
