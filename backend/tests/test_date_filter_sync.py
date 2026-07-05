"""Tests for date filter fix — sync endpoint with date params + executive summary campaigns."""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/cms/login", json={"username": "admin", "password": "admin123"})
    if r.status_code != 200:
        pytest.skip(f"Auth failed: {r.status_code} {r.text}")
    return r.json().get("token")

@pytest.fixture(scope="module")
def h(token):
    return {"Authorization": f"Bearer {token}"}


# ── Executive Summary ──────────────────────────────────────────────────────

class TestExecutiveSummary:
    """GET /api/cms/ads/executive-summary"""

    def test_no_dates_returns_200(self, h):
        r = requests.get(f"{BASE_URL}/api/cms/ads/executive-summary", headers=h)
        assert r.status_code == 200, r.text

    def test_no_dates_has_campaigns_key(self, h):
        r = requests.get(f"{BASE_URL}/api/cms/ads/executive-summary", headers=h)
        data = r.json()
        assert "campaigns" in data, f"Missing 'campaigns' key: {data.keys()}"

    def test_campaigns_is_list(self, h):
        r = requests.get(f"{BASE_URL}/api/cms/ads/executive-summary", headers=h)
        assert isinstance(r.json()["campaigns"], list)

    def test_campaign_fields_present(self, h):
        r = requests.get(f"{BASE_URL}/api/cms/ads/executive-summary", headers=h)
        campaigns = r.json()["campaigns"]
        if not campaigns:
            pytest.skip("No campaign data — Meta sync not yet run")
        c = campaigns[0]
        for field in ("status", "book_demo_count", "schedule_count", "demo_given_count", "purchase_count"):
            assert field in c, f"Missing field '{field}' in campaign: {c.keys()}"

    def test_date_range_filter_returns_200(self, h):
        r = requests.get(
            f"{BASE_URL}/api/cms/ads/executive-summary",
            params={"date_from": "2026-06-21", "date_to": "2026-06-26"},
            headers=h
        )
        assert r.status_code == 200, r.text

    def test_date_range_filter_has_campaigns(self, h):
        r = requests.get(
            f"{BASE_URL}/api/cms/ads/executive-summary",
            params={"date_from": "2026-06-21", "date_to": "2026-06-26"},
            headers=h
        )
        assert "campaigns" in r.json()


# ── Sync Endpoint ─────────────────────────────────────────────────────────

class TestMetaSync:
    """POST /api/cms/ads/mcp/meta/sync"""

    def test_sync_no_dates_returns_200(self, h):
        # This will call Meta API, can be slow — use a short timeout for quick check
        r = requests.post(f"{BASE_URL}/api/cms/ads/mcp/meta/sync", headers=h, timeout=120)
        assert r.status_code == 200, r.text

    def test_sync_no_dates_has_enabled_field(self, h):
        r = requests.post(f"{BASE_URL}/api/cms/ads/mcp/meta/sync", headers=h, timeout=120)
        data = r.json()
        assert "enabled" in data

    def test_sync_no_dates_returns_synced_count(self, h):
        r = requests.post(f"{BASE_URL}/api/cms/ads/mcp/meta/sync", headers=h, timeout=120)
        data = r.json()
        if data.get("enabled"):
            assert "synced" in data, f"Missing 'synced' key: {data}"

    def test_sync_with_dates_returns_200(self, h):
        r = requests.post(
            f"{BASE_URL}/api/cms/ads/mcp/meta/sync",
            params={"date_from": "2026-06-21", "date_to": "2026-06-26"},
            headers=h,
            timeout=120
        )
        assert r.status_code == 200, r.text

    def test_sync_with_dates_has_period(self, h):
        r = requests.post(
            f"{BASE_URL}/api/cms/ads/mcp/meta/sync",
            params={"date_from": "2026-06-21", "date_to": "2026-06-26"},
            headers=h,
            timeout=120
        )
        data = r.json()
        if data.get("enabled") and not data.get("error"):
            assert "period" in data, f"Missing 'period' key: {data}"
            assert "2026-06-21" in data["period"], f"Period mismatch: {data['period']}"

    def test_sync_without_auth_returns_401(self):
        r = requests.post(f"{BASE_URL}/api/cms/ads/mcp/meta/sync", timeout=10)
        assert r.status_code == 401
