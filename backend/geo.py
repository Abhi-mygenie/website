"""CR-2 — Best-effort server-side IP geolocation (city/region/country).

Derives the visitor's city from their IP (via ipapi.co, keyless HTTPS) so leads
that don't include a typed city still get one in the CRM. Strictly best-effort:
any failure/timeout/private-IP returns {} and NEVER blocks lead capture.
"""
import os
import ipaddress
import logging

import httpx

logger = logging.getLogger(__name__)

GEO_TIMEOUT = float(os.environ.get("GEO_TIMEOUT", "2.0"))
GEO_BASE_URL = os.environ.get("GEO_BASE_URL", "https://ipwho.is")


def _is_public(ip: str | None) -> bool:
    if not ip:
        return False
    try:
        obj = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return not (obj.is_private or obj.is_loopback or obj.is_link_local or obj.is_reserved)


async def lookup_city(ip: str | None) -> dict:
    """Return {city, region, country} for a public IP, else {} (never raises).

    Uses ipwho.is (keyless HTTPS, no datacenter-IP block).
    """
    if not _is_public(ip):
        return {}
    try:
        async with httpx.AsyncClient(timeout=GEO_TIMEOUT) as client:
            r = await client.get(f"{GEO_BASE_URL}/{ip}")
        if r.status_code != 200:
            return {}
        d = r.json()
        if not d.get("success", True):
            return {}
        return {
            "city": d.get("city"),
            "region": d.get("region"),
            "country": d.get("country"),
        }
    except Exception as e:  # noqa: BLE001 - geo must never break lead capture
        logger.warning("geo lookup error: %s", e)
        return {}
