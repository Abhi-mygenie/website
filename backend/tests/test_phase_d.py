"""Phase D tests: GAP-13, GAP-14, GAP-16 validation"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/cms/login", json={"username": "admin", "password": "admin123"})
    assert r.status_code == 200, f"Login failed: {r.text}"
    return r.json()["token"]

@pytest.fixture(scope="module")
def auth(token):
    return {"Authorization": f"Bearer {token}"}


# GAP-16: recommendations returns signals
class TestGAP16:
    def test_recommendations_returns_signals(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/ads/recommendations", headers=auth)
        assert r.status_code == 200
        data = r.json()
        print(f"signal_count={data.get('signal_count')}, signals={len(data.get('signals', []))}")
        assert "signal_count" in data
        assert "signals" in data
        assert data["signal_count"] > 0, "Expected >0 signals (GAP-16 fix should produce signals from meta_api data)"

    def test_recommendations_has_adset_entity(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/ads/recommendations", headers=auth)
        assert r.status_code == 200
        signals = r.json().get("signals", [])
        adset_signals = [s for s in signals if s.get("entity") == "adset"]
        print(f"adset signals: {len(adset_signals)}, types: {set(s['type'] for s in adset_signals)}")
        assert len(adset_signals) > 0, "Expected adset entity signals from _meta_api_signals()"

    def test_recommendations_signal_types(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/ads/recommendations", headers=auth)
        signals = r.json().get("signals", [])
        types = {s["type"] for s in signals}
        print(f"Signal types found: {types}")
        valid_types = {"SCALE", "REVIEW", "PAUSE", "TOO_EARLY", "BLOCK", "FATIGUED"}
        assert types & valid_types, f"No valid signal types found. Got: {types}"


# GAP-14: date filter for adset-performance
class TestGAP14AdsetPerformance:
    def test_adset_2025_data_returns_results(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/ads/adset-performance",
                         params={"date_from": "2025-01-01", "date_to": "2025-12-31"}, headers=auth)
        assert r.status_code == 200
        data = r.json()
        count = data.get("count", 0)
        print(f"adset count for 2025: {count}")
        assert count > 0, "Expected adsets for 2025 date range"

    def test_adset_2023_data_returns_empty(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/ads/adset-performance",
                         params={"date_from": "2023-01-01", "date_to": "2023-12-31"}, headers=auth)
        assert r.status_code == 200
        data = r.json()
        count = data.get("count", 0)
        print(f"adset count for 2023: {count}")
        assert count == 0, f"Expected 0 adsets for 2023, got {count}"


# GAP-14: date filter for ad-performance
class TestGAP14AdPerformance:
    def test_ad_2025_data_returns_results(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/ads/ad-performance",
                         params={"date_from": "2025-01-01", "date_to": "2025-12-31"}, headers=auth)
        assert r.status_code == 200
        data = r.json()
        count = data.get("count", 0)
        print(f"ad count for 2025: {count}")
        assert count > 0, "Expected ads for 2025 date range"

    def test_ad_2023_data_returns_empty(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/ads/ad-performance",
                         params={"date_from": "2023-01-01", "date_to": "2023-12-31"}, headers=auth)
        assert r.status_code == 200
        data = r.json()
        count = data.get("count", 0)
        print(f"ad count for 2023: {count}")
        assert count == 0, f"Expected 0 ads for 2023, got {count}"


# Existing functionality
class TestExisting:
    def test_executive_summary(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/ads/executive-summary", headers=auth)
        assert r.status_code == 200
        data = r.json()
        assert "total_leads" in data or "campaigns" in data

    def test_placement_breakdown(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/ads/placement-breakdown", headers=auth)
        assert r.status_code == 200
        data = r.json()
        assert "placements" in data

    def test_lead_quality_summary(self, auth):
        r = requests.get(f"{BASE_URL}/api/cms/leads/quality-summary", headers=auth)
        assert r.status_code == 200
        data = r.json()
        print(f"lead quality: {data.get('total_leads')} leads")
        assert "total_leads" in data
