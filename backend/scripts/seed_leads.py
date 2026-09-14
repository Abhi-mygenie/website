"""Seed a handful of realistic test leads across the 3 collections so the CR-7
Leads View + filters can be exercised. Idempotent: clears prior seed docs
(id prefix 'seed_') before inserting. Run: python3 backend/scripts/seed_leads.py
"""
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
db = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]

now = datetime.now(timezone.utc)
iso = lambda d: d.isoformat()


def attr(paid=False, src="google", camp="pos-india"):
    a = {
        "first_utm_source": src, "first_utm_medium": "cpc" if paid else "organic",
        "first_utm_campaign": camp, "last_utm_source": src,
        "last_utm_medium": "cpc" if paid else "organic", "last_utm_campaign": camp,
        "device_type": "mobile", "os": "Android", "browser": "Chrome",
    }
    if paid:
        a["gclid"] = "EAIaIQ-test-123"
    return a


for c in ("demo_requests", "quotes", "contact_messages"):
    db[c].delete_many({"id": {"$regex": "^seed_"}})

demos = [
    {"id": "seed_d1", "name": "Ravi Kumar", "phone": "9111100001", "email": "ravi@cafe.in",
     "city": "Mumbai", "business_name": "Brew Bar", "outlet_type": "Cafe",
     "otp_verified": True, "freshsales_contact_id": 402209074834,
     "attribution": attr(paid=True), "created_at": iso(now - timedelta(hours=2))},
    {"id": "seed_d2", "name": "Sneha Patel", "phone": "9111100003", "email": None,
     "city": "Ahmedabad", "business_name": "Spice Hub", "outlet_type": "Fine Dining",
     "otp_verified": False, "freshsales_contact_id": None,
     "attribution": attr(paid=False), "created_at": iso(now - timedelta(days=2))},
]
quotes = [
    {"id": "seed_q1", "name": "Arjun Mehta", "phone": "9111100010", "email": "arjun@biz.in",
     "city": "Pune", "intent": "buy", "plan_id": "pro", "plan_name": "Pro",
     "billing_cycle": "annual", "total_amount": 11988, "freshsales_contact_id": 402209074900,
     "attribution": attr(paid=True, src="facebook", camp="retargeting"),
     "created_at": iso(now - timedelta(hours=6))},
]
# add an fbclid-paid quote
quotes[0]["attribution"]["fbclid"] = "fb-test-987"
contacts = [
    {"id": "seed_c1", "name": "Priya Singh", "phone": "9111100020", "email": "priya@x.in",
     "city": "Delhi", "message": "Need integration with my existing kitchen display system.",
     "preferred_contact": "whatsapp", "freshsales_contact_id": 402209074908,
     "attribution": attr(paid=False, src="(direct)", camp=None),
     "created_at": iso(now - timedelta(days=5))},
]

db.demo_requests.insert_many(demos)
db.quotes.insert_many(quotes)
db.contact_messages.insert_many(contacts)
print(f"Seeded {len(demos)} demos, {len(quotes)} quotes, {len(contacts)} contacts.")
