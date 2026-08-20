"""
Diagnostic script: Dump raw Meta API response for Jun 21-26, 2026.
Run: python debug_meta_raw.py
"""
import os, json, httpx, asyncio
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

TOKEN   = os.environ.get("META_ACCESS_TOKEN", "")
ACCOUNT = os.environ.get("META_AD_ACCOUNT_ID", "")
BASE    = "https://graph.facebook.com/v21.0"

SINCE = "2026-06-21"
UNTIL = "2026-06-26"

async def fetch(level, fields, extra_params=None):
    url = f"{BASE}/act_{ACCOUNT}/insights"
    params = {
        "access_token":       TOKEN,
        "level":              level,
        "fields":             fields,
        "time_range[since]":  SINCE,
        "time_range[until]":  UNTIL,
        "limit":              200,
    }
    if extra_params:
        params.update(extra_params)
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.get(url, params=params)
        return r.json()

async def main():
    print("=" * 80)
    print(f"ACCOUNT: act_{ACCOUNT}")
    print(f"DATE RANGE: {SINCE} → {UNTIL}")
    print("=" * 80)

    # ── 1. Campaign level — spend + actions + conversions ──────────────────
    print("\n\n[1] CAMPAIGN LEVEL — actions + conversions")
    print("-" * 60)
    data = await fetch(
        "campaign",
        "campaign_id,campaign_name,spend,impressions,clicks,reach,frequency,actions,conversions,date_start,date_stop"
    )
    campaigns = data.get("data", [])
    print(f"  Total campaigns returned: {len(campaigns)}")
    for c in campaigns:
        print(f"\n  Campaign: {c.get('campaign_name')} (id={c.get('campaign_id')})")
        print(f"    spend={c.get('spend')}  impr={c.get('impressions')}  clicks={c.get('clicks')}")
        print(f"    date_start={c.get('date_start')}  date_stop={c.get('date_stop')}")
        actions = c.get("actions") or []
        conversions = c.get("conversions") or []
        print(f"    actions ({len(actions)} items):")
        for a in actions:
            print(f"      action_type={a.get('action_type')!r:60s}  value={a.get('value')}")
        print(f"    conversions ({len(conversions)} items):")
        for a in conversions:
            print(f"      action_type={a.get('action_type')!r:60s}  value={a.get('value')}")
    if data.get("error"):
        print(f"  ERROR: {data['error']}")

    # ── 2. Campaign level with action_breakdowns=action_type ─────────────
    print("\n\n[2] CAMPAIGN LEVEL + action_breakdowns=action_type (alternate)")
    print("-" * 60)
    data2 = await fetch(
        "campaign",
        "campaign_id,campaign_name,spend,actions,conversions",
        {"action_breakdowns": "action_type"}
    )
    for c in (data2.get("data") or []):
        print(f"\n  Campaign: {c.get('campaign_name')}")
        for a in (c.get("actions") or []):
            print(f"    action_type={a.get('action_type')!r:60s}  value={a.get('value')}")
    if data2.get("error"):
        print(f"  ERROR: {data2['error']}")

    # ── 3. Ad set level ────────────────────────────────────────────────────
    print("\n\n[3] AD SET LEVEL — spend + actions + targeting")
    print("-" * 60)
    adset_data = await fetch(
        "adset",
        "campaign_id,campaign_name,adset_id,adset_name,spend,impressions,clicks,actions,conversions,date_start,date_stop"
    )
    adsets = adset_data.get("data", [])
    print(f"  Total ad sets returned: {len(adsets)}")
    for a in adsets:
        print(f"\n  AdSet: {a.get('adset_name')} (id={a.get('adset_id')})")
        print(f"    campaign={a.get('campaign_name')}")
        print(f"    spend={a.get('spend')}  impr={a.get('impressions')}  clicks={a.get('clicks')}")
        acts = a.get("actions") or []
        convs = a.get("conversions") or []
        print(f"    actions ({len(acts)} items):")
        for x in acts:
            print(f"      {x.get('action_type')!r:60s}  value={x.get('value')}")
        print(f"    conversions ({len(convs)} items):")
        for x in convs:
            print(f"      {x.get('action_type')!r:60s}  value={x.get('value')}")
    if adset_data.get("error"):
        print(f"  ERROR: {adset_data['error']}")

    # ── 4. Ad set level WITH targeting (audience) info ────────────────────
    print("\n\n[4] AD SET TARGETING/AUDIENCE (from /adsets endpoint, NOT insights)")
    print("-" * 60)
    adsets_url = f"{BASE}/act_{ACCOUNT}/adsets"
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.get(adsets_url, params={
            "access_token": TOKEN,
            "fields": "id,name,status,effective_status,targeting,optimization_goal,billing_event",
            "limit": 50,
        })
        adset_meta = r.json()
    for a in (adset_meta.get("data") or []):
        print(f"\n  AdSet: {a.get('name')} (id={a.get('id')}) status={a.get('effective_status')}")
        tgt = a.get("targeting") or {}
        # Show geo, age, genders
        geo = tgt.get("geo_locations") or {}
        cities = geo.get("cities") or []
        countries = geo.get("countries") or []
        age_min = tgt.get("age_min")
        age_max = tgt.get("age_max")
        genders = tgt.get("genders")
        print(f"    geo: countries={countries} cities=[{', '.join(c.get('name','') for c in cities[:5])}]")
        print(f"    age: {age_min}-{age_max}  genders={genders}")
    if adset_meta.get("error"):
        print(f"  ERROR: {adset_meta['error']}")

    # ── 5. Ad level ────────────────────────────────────────────────────────
    print("\n\n[5] AD LEVEL — individual ad performance")
    print("-" * 60)
    ad_data = await fetch(
        "ad",
        "campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,clicks,actions,conversions,date_start,date_stop"
    )
    ads = ad_data.get("data", [])
    print(f"  Total ads returned: {len(ads)}")
    for a in ads:
        print(f"\n  Ad: {a.get('ad_name')} (id={a.get('ad_id')})")
        print(f"    adset={a.get('adset_name')}  campaign={a.get('campaign_name')}")
        print(f"    spend={a.get('spend')}  impr={a.get('impressions')}  clicks={a.get('clicks')}")
        acts = a.get("actions") or []
        convs = a.get("conversions") or []
        print(f"    actions ({len(acts)} items):")
        for x in acts:
            print(f"      {x.get('action_type')!r:60s}  value={x.get('value')}")
        if convs:
            print(f"    conversions ({len(convs)} items):")
            for x in convs:
                print(f"      {x.get('action_type')!r:60s}  value={x.get('value')}")
    if ad_data.get("error"):
        print(f"  ERROR: {ad_data['error']}")

    # ── 6. Placement breakdown ─────────────────────────────────────────────
    print("\n\n[6] CAMPAIGN LEVEL + placement breakdown")
    print("-" * 60)
    plc_data = await fetch(
        "campaign",
        "campaign_name,spend,impressions,clicks",
        {"breakdowns": "publisher_platform,platform_position"}
    )
    for row in (plc_data.get("data") or []):
        pub = row.get("publisher_platform", "")
        pos = row.get("platform_position", "")
        print(f"  {row.get('campaign_name'):40s}  platform={pub:15s} pos={pos:25s}  spend={row.get('spend'):8s}  impr={row.get('impressions')}")
    if plc_data.get("error"):
        print(f"  ERROR: {plc_data['error']}")

    print("\n\nDONE.")

asyncio.run(main())
