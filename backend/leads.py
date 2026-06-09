"""CR-7 — Internal Leads View (read-only sales triage).

Read/aggregate layer over the existing lead collections (`demo_requests`,
`quotes`, `contact_messages`) captured by CR-1b / CR-2 / CR-4B. No new capture,
no schema change, no writes. Normalises the three shapes into one row format,
applies filters, and paginates.

Lead volume on a marketing site is low, so we fetch + merge in memory.
"""
import os
from datetime import datetime, timezone

CLICK_IDS = ("gclid", "fbclid", "gbraid", "wbraid", "msclkid")
FETCH_CAP = 5000  # safety cap per collection


def _freshsales_contact_url(contact_id):
    """Derive the Freshsales UI contact URL from the API base URL."""
    if not contact_id:
        return None
    base = os.environ.get("FRESHSALES_BASE_URL") or ""
    # https://acct.myfreshworks.com/crm/sales/api -> .../crm/sales/contacts/<id>
    ui = base.rsplit("/api", 1)[0] if base.endswith("/api") else base
    if not ui:
        return None
    return f"{ui}/contacts/{contact_id}"


def _attr(doc):
    return doc.get("attribution") or {}


def _source(attr):
    return attr.get("last_utm_source") or attr.get("first_utm_source")


def _medium(attr):
    return attr.get("last_utm_medium") or attr.get("first_utm_medium")


def _campaign(attr):
    return attr.get("last_utm_campaign") or attr.get("first_utm_campaign")


def _is_paid(attr):
    return any(attr.get(k) for k in CLICK_IDS)


def _city(doc):
    geo = doc.get("geo") or {}
    return doc.get("city") or geo.get("city")


def _base_row(doc, lead_type):
    attr = _attr(doc)
    cid = doc.get("freshsales_contact_id")
    return {
        "id": doc.get("id"),
        "type": lead_type,
        "name": doc.get("name"),
        "phone": doc.get("phone"),
        "email": doc.get("email"),
        "city": _city(doc),
        "created_at": doc.get("created_at"),
        "source": _source(attr),
        "medium": _medium(attr),
        "campaign": _campaign(attr),
        "paid": _is_paid(attr),
        "gclid": attr.get("gclid"),
        "fbclid": attr.get("fbclid"),
        "device": attr.get("device_type"),
        "freshsales_contact_id": cid,
        "freshsales_url": _freshsales_contact_url(cid),
    }


def _normalise_demo(doc):
    row = _base_row(doc, "demo")
    verified = doc.get("otp_verified")
    biz = doc.get("business_name") or ""
    outlet = doc.get("outlet_type") or ""
    parts = [p for p in (biz, outlet) if p]
    if doc.get("status") == "demo_booked":
        parts.append("Demo booked")
    row.update({
        "otp_verified": bool(verified) if verified is not None else None,
        "intent": "Demo",
        "summary": " · ".join(parts) or "Demo request",
    })
    return row


def _normalise_quote(doc):
    row = _base_row(doc, "quote")
    plan = doc.get("plan_name") or ""
    total = doc.get("total_amount") or 0
    cycle = doc.get("billing_cycle") or ""
    is_buy = doc.get("intent") == "buy"
    summary = plan
    if total:
        summary += f" · ₹{int(total)}/{cycle}" if cycle else f" · ₹{int(total)}"
    row.update({
        "otp_verified": None,
        "intent": "Buy" if is_buy else "Quote",
        "summary": summary or "Quote",
    })
    return row


def _normalise_contact(doc):
    row = _base_row(doc, "contact")
    msg = (doc.get("message") or "").strip()
    if len(msg) > 120:
        msg = msg[:117] + "…"
    pref = doc.get("preferred_contact")
    row.update({
        "otp_verified": None,
        "intent": "Contact",
        "summary": msg or (f"Prefers {pref}" if pref else "Contact message"),
    })
    return row


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


async def query_leads(db, *, type=None, verified=None, paid=None, city=None,
                      date_from=None, date_to=None, q=None, page=1, page_size=25):
    """Return normalised, filtered, paginated lead rows + summary chips."""
    rows = []
    sources = [
        ("demo", db.demo_requests, _normalise_demo),
        ("quote", db.quotes, _normalise_quote),
        ("contact", db.contact_messages, _normalise_contact),
    ]
    for lead_type, coll, fn in sources:
        if type and type != lead_type:
            continue
        docs = await coll.find({}, {"_id": 0}).sort("created_at", -1).to_list(FETCH_CAP)
        rows.extend(fn(d) for d in docs)

    df = _parse_dt(date_from) if date_from else None
    dt_to = _parse_dt(date_to) if date_to else None
    ql = (q or "").strip().lower()
    cityl = (city or "").strip().lower()

    def keep(r):
        if verified is True and r.get("otp_verified") is not True:
            return False
        if paid is True and not r.get("paid"):
            return False
        if cityl and cityl not in (r.get("city") or "").lower():
            return False
        if ql:
            blob = " ".join(str(r.get(k) or "") for k in
                            ("name", "phone", "email", "city", "campaign", "summary")).lower()
            if ql not in blob:
                return False
        if df or dt_to:
            rdt = _parse_dt(r.get("created_at"))
            if rdt is None:
                return False
            if df and rdt < df:
                return False
            if dt_to and rdt > dt_to:
                return False
        return True

    filtered = [r for r in rows if keep(r)]
    filtered.sort(key=lambda r: r.get("created_at") or "", reverse=True)

    # Summary chips over the filtered set
    now = datetime.now(timezone.utc)
    today = now.date()
    today_count = sum(1 for r in filtered
                      if (_parse_dt(r.get("created_at")) or now).date() == today)
    demo_rows = [r for r in filtered if r["type"] == "demo"]
    verified_count = sum(1 for r in demo_rows if r.get("otp_verified") is True)
    paid_count = sum(1 for r in filtered if r.get("paid"))
    summary = {
        "total": len(filtered),
        "today": today_count,
        "demo_total": len(demo_rows),
        "verified": verified_count,
        "paid": paid_count,
    }

    total = len(filtered)
    page = max(1, page)
    start = (page - 1) * page_size
    paged = filtered[start:start + page_size]

    return {
        "items": paged,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": max(1, (total + page_size - 1) // page_size),
        "summary": summary,
    }
