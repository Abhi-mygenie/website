"""Phase E (GAP-17/18/19/20) + regression tests for CR-24 Ads Intelligence Platform."""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/cms/login", json={"username": "admin", "password": "admin123"})
    assert r.status_code == 200, f"Login failed: {r.text}"
    return r.json()["token"]

@pytest.fixture(scope="module")
def headers(token):
    return {"Authorization": f"Bearer {token}"}


# ── Recommendations endpoint ──────────────────────────────────────────────────

class TestRecommendations:
    def test_recommendations_returns_200(self, headers):
        r = requests.get(f"{BASE_URL}/api/cms/ads/recommendations", headers=headers)
        assert r.status_code == 200, r.text

    def test_recommendations_has_signal_count(self, headers):
        r = requests.get(f"{BASE_URL}/api/cms/ads/recommendations", headers=headers)
        data = r.json()
        assert "signal_count" in data
        assert isinstance(data["signal_count"], int)
        assert data["signal_count"] > 0, "Expected at least 1 signal"

    def test_lp_friction_signals_present(self, headers):
        r = requests.get(f"{BASE_URL}/api/cms/ads/recommendations", headers=headers)
        data = r.json()
        signals = data.get("signals", [])
        lp = [s for s in signals if s["type"] == "LP_FRICTION"]
        assert len(lp) >= 1, f"Expected LP_FRICTION signals, got: {[s['type'] for s in signals]}"

    def test_lp_friction_signal_data_fields(self, headers):
        r = requests.get(f"{BASE_URL}/api/cms/ads/recommendations", headers=headers)
        data = r.json()
        signals = data.get("signals", [])
        lp = [s for s in signals if s["type"] == "LP_FRICTION"]
        assert lp, "No LP_FRICTION signals found"
        d = lp[0]["data"]
        for field in ["ctr", "click_to_book_pct", "book_to_schedule_pct", "impressions", "clicks", "book_demo"]:
            assert field in d, f"Missing field '{field}' in LP_FRICTION data: {d}"

    def test_lp_friction_count_is_3(self, headers):
        """Expected: 3 LP_FRICTION signals per agent context."""
        r = requests.get(f"{BASE_URL}/api/cms/ads/recommendations", headers=headers)
        data = r.json()
        signals = data.get("signals", [])
        lp = [s for s in signals if s["type"] == "LP_FRICTION"]
        assert len(lp) == 3, f"Expected 3 LP_FRICTION signals, got {len(lp)}"

    def test_scale_signal_present(self, headers):
        """GAP-16 regression: SCALE signal should fire for Broad Targeting (CPL~516)."""
        r = requests.get(f"{BASE_URL}/api/cms/ads/recommendations", headers=headers)
        data = r.json()
        signals = data.get("signals", [])
        scale = [s for s in signals if s["type"] == "SCALE" and s.get("entity") == "adset"]
        assert len(scale) >= 1, f"Expected SCALE signal, got: {[s['type'] for s in signals]}"
        broad = [s for s in scale if "Broad" in s["name"]]
        assert broad, f"Expected SCALE signal for Broad Targeting, got: {[s['name'] for s in scale]}"

    def test_signal_type_count(self, headers):
        """Expected: SCALE=1, LP_FRICTION=3."""
        r = requests.get(f"{BASE_URL}/api/cms/ads/recommendations", headers=headers)
        data = r.json()
        signals = data.get("signals", [])
        from collections import Counter
        counts = Counter(s["type"] for s in signals)
        print(f"Signal counts: {dict(counts)}")
        assert counts.get("SCALE", 0) >= 1
        assert counts.get("LP_FRICTION", 0) == 3

    def test_weak_creative_not_fired(self, headers):
        """WEAK_CREATIVE should NOT fire since all CTRs > 0.7%."""
        r = requests.get(f"{BASE_URL}/api/cms/ads/recommendations", headers=headers)
        data = r.json()
        signals = data.get("signals", [])
        wc = [s for s in signals if s["type"] == "WEAK_CREATIVE"]
        assert len(wc) == 0, f"WEAK_CREATIVE should not fire, got: {[s['name'] for s in wc]}"

    def test_calendly_friction_not_fired(self, headers):
        """CALENDLY_FRICTION should NOT fire (Broad Targeting book_to_schedule=67% > 30%)."""
        r = requests.get(f"{BASE_URL}/api/cms/ads/recommendations", headers=headers)
        data = r.json()
        signals = data.get("signals", [])
        cf = [s for s in signals if s["type"] == "CALENDLY_FRICTION"]
        assert len(cf) == 0, f"CALENDLY_FRICTION should not fire, got: {[s['name'] for s in cf]}"

    def test_benchmark_in_message(self, headers):
        """GAP-19: LP_FRICTION message should reference benchmark (2.0%+)."""
        r = requests.get(f"{BASE_URL}/api/cms/ads/recommendations", headers=headers)
        data = r.json()
        signals = data.get("signals", [])
        lp = [s for s in signals if s["type"] == "LP_FRICTION"]
        assert lp
        msg = lp[0]["message"]
        assert "2.0" in msg or "2%" in msg, f"Benchmark value not found in LP_FRICTION message: {msg}"


# ── Phase D regressions ────────────────────────────────────────────────────────

class TestPhaseD:
    def test_adset_performance_no_filter(self, headers):
        r = requests.get(f"{BASE_URL}/api/cms/ads/adset-performance", headers=headers)
        assert r.status_code == 200
        data = r.json()
        adsets = data.get("adsets", data) if isinstance(data, dict) else data
        assert len(adsets) == 4, f"Expected 4 adsets, got {len(adsets)}: {data}"

    def test_adset_performance_date_filter_zero(self, headers):
        r = requests.get(
            f"{BASE_URL}/api/cms/ads/adset-performance",
            params={"date_from": "2023-01-01", "date_to": "2023-12-31"},
            headers=headers
        )
        assert r.status_code == 200
        data = r.json()
        adsets = data.get("adsets", data) if isinstance(data, dict) else data
        assert len(adsets) == 0, f"Expected 0 adsets for 2023, got {len(adsets)}"

    def test_placement_breakdown(self, headers):
        r = requests.get(f"{BASE_URL}/api/cms/ads/placement-breakdown", headers=headers)
        assert r.status_code == 200
        data = r.json()
        placements = data.get("placements", data) if isinstance(data, dict) else data
        assert len(placements) >= 15, f"Expected 15+ placements, got {len(placements)}"


# ── Phase B regression ─────────────────────────────────────────────────────────

class TestPhaseB:
    def test_ad_performance_6_ads(self, headers):
        r = requests.get(f"{BASE_URL}/api/cms/ads/ad-performance", headers=headers)
        assert r.status_code == 200
        data = r.json()
        ads = data.get("ads", data) if isinstance(data, dict) else data
        assert len(ads) == 6, f"Expected 6 ads, got {len(ads)}"


# ── Phase C regression ─────────────────────────────────────────────────────────

class TestPhaseC:
    def test_lead_quality_summary(self, headers):
        r = requests.get(f"{BASE_URL}/api/cms/leads/quality-summary", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert "total" in data or len(data) > 0, "Expected lead quality data"
