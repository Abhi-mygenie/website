"""CR-24 Phase 1 — Ads Intelligence backend tests.

Tests new endpoints:
  - GET /api/cms/funnel/by-landing-page
  - GET /api/cms/funnel/by-device
  - GET /api/cms/funnel/by-city
  - GET /api/cms/ads/executive-summary
  - GET /api/cms/ads/recommendations
  - GET /api/cms/ads/mcp/status

Also tests CSV detect_platform for new types.
"""
import pytest
import requests
import os
import sys

sys.path.insert(0, "/app/backend")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# ── Auth fixtures ──────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def token():
    res = requests.post(f"{BASE_URL}/api/cms/login", json={
        "username": "admin@mygenie.online",
        "password": "admin123"
    })
    assert res.status_code == 200, f"Login failed: {res.text}"
    return res.json()["token"]


@pytest.fixture(scope="module")
def auth(token):
    return {"Authorization": f"Bearer {token}"}


# ── New funnel endpoints ───────────────────────────────────────────────────

class TestFunnelByLandingPage:
    """GET /api/cms/funnel/by-landing-page"""

    def test_status_200(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/funnel/by-landing-page", headers=auth)
        assert r.status_code == 200

    def test_response_structure(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/funnel/by-landing-page", headers=auth)
        data = r.json()
        assert "rows" in data
        assert "total_leads" in data
        assert isinstance(data["rows"], list)
        assert isinstance(data["total_leads"], int)

    def test_row_fields_when_data_present(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/funnel/by-landing-page", headers=auth)
        rows = r.json().get("rows", [])
        if rows:
            row = rows[0]
            assert "landing_page" in row
            assert "lead_in" in row
            assert "won" in row

    def test_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/cms/funnel/by-landing-page")
        assert r.status_code in (401, 403)


class TestFunnelByDevice:
    """GET /api/cms/funnel/by-device"""

    def test_status_200(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/funnel/by-device", headers=auth)
        assert r.status_code == 200

    def test_response_structure(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/funnel/by-device", headers=auth)
        data = r.json()
        assert "rows" in data
        assert "total_leads" in data
        assert isinstance(data["rows"], list)

    def test_device_field_present(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/funnel/by-device", headers=auth)
        rows = r.json().get("rows", [])
        if rows:
            assert "device" in rows[0]

    def test_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/cms/funnel/by-device")
        assert r.status_code in (401, 403)


class TestFunnelByCity:
    """GET /api/cms/funnel/by-city"""

    def test_status_200(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/funnel/by-city", headers=auth)
        assert r.status_code == 200

    def test_response_structure(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/funnel/by-city", headers=auth)
        data = r.json()
        assert "rows" in data
        assert "total_leads" in data

    def test_top_n_param(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/funnel/by-city?top_n=5", headers=auth)
        data = r.json()
        assert len(data.get("rows", [])) <= 5

    def test_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/cms/funnel/by-city")
        assert r.status_code in (401, 403)


class TestExecutiveSummary:
    """GET /api/cms/ads/executive-summary"""

    def test_status_200(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/ads/executive-summary", headers=auth)
        assert r.status_code == 200

    def test_required_fields(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/ads/executive-summary", headers=auth)
        data = r.json()
        assert "total_leads" in data
        assert "won" in data
        assert "source_split" in data

    def test_total_leads_is_int(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/ads/executive-summary", headers=auth)
        data = r.json()
        assert isinstance(data["total_leads"], int)

    def test_spend_fields(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/ads/executive-summary", headers=auth)
        data = r.json()
        assert "total_spend" in data
        assert "blended_cpl" in data
        assert "blended_cp_win" in data

    def test_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/cms/ads/executive-summary")
        assert r.status_code in (401, 403)


class TestRecommendations:
    """GET /api/cms/ads/recommendations"""

    def test_status_200(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/ads/recommendations", headers=auth)
        assert r.status_code == 200

    def test_response_structure(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/ads/recommendations", headers=auth)
        data = r.json()
        assert "signal_count" in data
        assert "signals" in data
        assert "top_actions" in data
        assert isinstance(data["signals"], list)
        assert isinstance(data["top_actions"], list)

    def test_signal_count_matches_list(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/ads/recommendations", headers=auth)
        data = r.json()
        assert data["signal_count"] == len(data["signals"])

    def test_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/cms/ads/recommendations")
        assert r.status_code in (401, 403)


class TestMcpStatus:
    """GET /api/cms/ads/mcp/status"""

    def test_status_200(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/ads/mcp/status", headers=auth)
        assert r.status_code == 200

    def test_meta_disabled(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/ads/mcp/status", headers=auth)
        data = r.json()
        assert "meta" in data
        assert data["meta"]["enabled"] is False  # no token configured

    def test_google_disabled(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/ads/mcp/status", headers=auth)
        data = r.json()
        assert "google" in data
        assert data["google"]["enabled"] is False  # no token configured

    def test_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/cms/ads/mcp/status")
        assert r.status_code in (401, 403)


# ── detect_platform unit tests ────────────────────────────────────────────

class TestDetectPlatform:
    """Unit tests for ad_spend.detect_platform()"""

    def _csv(self, header):
        return header.encode("utf-8")

    def test_google_search_terms(self):
        from ad_spend import detect_platform
        content = b"Search term,Campaign,Ad group,Match type,Clicks,Impr.,Cost,Currency code\n"
        assert detect_platform(content) == "google_search_terms"

    def test_google_ads(self):
        from ad_spend import detect_platform
        content = b"Ad,Campaign,Ad group,Headline 1,Headline 2,Clicks,Impr.,Cost,Currency code\n"
        assert detect_platform(content) == "google_ads"

    def test_meta_ad(self):
        from ad_spend import detect_platform
        content = b"Campaign name,Ad set name,Ad name,Amount spent (INR),Impressions,Reach,Frequency\n"
        assert detect_platform(content) == "meta_ad"

    def test_meta_breakdown_placement(self):
        from ad_spend import detect_platform
        content = b"Campaign name,Ad set name,Placement,Amount spent (INR),Impressions\n"
        assert detect_platform(content) == "meta_breakdown"

    def test_meta_breakdown_age(self):
        from ad_spend import detect_platform
        content = b"Campaign name,Ad set name,Age,Gender,Amount spent (INR),Impressions\n"
        assert detect_platform(content) == "meta_breakdown"

    def test_meta_campaign(self):
        from ad_spend import detect_platform
        content = b"Campaign name,Ad set name,Amount spent (INR),Impressions\n"
        assert detect_platform(content) == "meta"


# ── Existing endpoint still works ─────────────────────────────────────────

class TestExistingFunnelEndpoints:
    """Smoke tests to ensure existing funnel endpoints still work."""

    def test_funnel_summary(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/funnel/summary", headers=auth)
        assert r.status_code == 200
        data = r.json()
        assert "lead_in" in data

    def test_funnel_by_source(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/funnel/by-source", headers=auth)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_funnel_by_attribution(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/funnel/by-attribution", headers=auth)
        assert r.status_code == 200
