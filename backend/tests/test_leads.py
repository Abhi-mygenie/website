"""CR-7 — Internal Leads View backend integration tests.

Covers: auth gating, normalisation across the 3 collections, filters
(type/verified/paid/city/search/date), summary chips, and pagination.
Relies on the seed docs created by backend/scripts/seed_leads.py.
"""
import os
import subprocess
import sys
from pathlib import Path

import pytest
import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")
BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_USER, ADMIN_PASS = "admin", "admin123"


@pytest.fixture(scope="session", autouse=True)
def seed():
    script = Path(__file__).resolve().parents[1] / "scripts" / "seed_leads.py"
    subprocess.run([sys.executable, str(script)], check=True)


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{API}/cms/login", json={"username": ADMIN_USER, "password": ADMIN_PASS}, timeout=15)
    r.raise_for_status()
    return r.json()["token"]


def _get(token, **params):
    r = requests.get(f"{API}/cms/leads", headers={"Authorization": f"Bearer {token}"}, params=params, timeout=15)
    r.raise_for_status()
    return r.json()


def test_requires_auth():
    assert requests.get(f"{API}/cms/leads", timeout=15).status_code == 401


def test_returns_all_seed_leads(token):
    d = _get(token)
    names = {r["name"] for r in d["items"]}
    assert {"Ravi Kumar", "Sneha Patel", "Arjun Mehta", "Priya Singh"}.issubset(names)
    assert d["summary"]["total"] >= 4


def test_normalisation_fields(token):
    d = _get(token, type="demo")
    ravi = next(r for r in d["items"] if r["name"] == "Ravi Kumar")
    assert ravi["type"] == "demo"
    assert ravi["intent"] == "Demo"
    assert ravi["otp_verified"] is True
    assert ravi["paid"] is True
    assert "contacts/402209074834" in ravi["freshsales_url"]


def test_filter_verified_only(token):
    d = _get(token, verified="true")
    assert all(r["otp_verified"] is True for r in d["items"])
    assert "Ravi Kumar" in {r["name"] for r in d["items"]}
    assert "Sneha Patel" not in {r["name"] for r in d["items"]}


def test_filter_paid_only(token):
    d = _get(token, paid="true")
    names = {r["name"] for r in d["items"]}
    assert {"Ravi Kumar", "Arjun Mehta"}.issubset(names)
    assert all(r["paid"] for r in d["items"])


def test_filter_type_quote(token):
    d = _get(token, type="quote")
    assert all(r["type"] == "quote" for r in d["items"])
    assert "Arjun Mehta" in {r["name"] for r in d["items"]}


def test_search_city(token):
    d = _get(token, q="delhi")
    assert "Priya Singh" in {r["name"] for r in d["items"]}


def test_pagination(token):
    d = _get(token, page=1, page_size=2)
    assert len(d["items"]) <= 2
    assert d["page"] == 1
    assert d["pages"] >= 2


def test_summary_chips(token):
    s = _get(token)["summary"]
    assert s["demo_total"] >= 2
    assert s["verified"] >= 1
    assert s["paid"] >= 2
