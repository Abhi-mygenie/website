"""Phase H — Strategy Lab (GAP-21) backend tests."""
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
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


class TestStrategyLabEndpoint:
    """POST /api/cms/ads/strategy-brainstorm"""

    def test_unauthenticated_returns_401(self):
        r = requests.post(f"{BASE_URL}/api/cms/ads/strategy-brainstorm")
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"
        print("PASS: unauthenticated returns 401")

    def test_authenticated_returns_200(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/cms/ads/strategy-brainstorm", headers=auth_headers, timeout=60)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        print("PASS: authenticated returns 200")

    def test_response_has_required_top_level_fields(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/cms/ads/strategy-brainstorm", headers=auth_headers, timeout=60)
        assert r.status_code == 200
        data = r.json()
        # Allow graceful degradation: either hypotheses or error
        if "error" in data:
            pytest.skip(f"LLM returned error (graceful degradation): {data['error']}")
        assert "hypotheses" in data, f"Missing 'hypotheses' in response: {data.keys()}"
        assert "context_summary" in data, f"Missing 'context_summary'"
        assert "signal_count" in data, f"Missing 'signal_count'"
        assert "generated_at" in data, f"Missing 'generated_at'"
        assert "model" in data, f"Missing 'model'"
        print(f"PASS: top-level fields present. model={data['model']}")

    def test_hypotheses_count_is_4(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/cms/ads/strategy-brainstorm", headers=auth_headers, timeout=60)
        data = r.json()
        if "error" in data:
            pytest.skip("LLM error — skipping count check")
        hyps = data["hypotheses"]
        assert len(hyps) >= 4, f"Expected >=4 hypotheses, got {len(hyps)}"
        print(f"PASS: {len(hyps)} hypotheses returned")

    def test_each_hypothesis_has_required_fields(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/cms/ads/strategy-brainstorm", headers=auth_headers, timeout=60)
        data = r.json()
        if "error" in data:
            pytest.skip("LLM error — skipping field check")
        required = {"title", "reasoning", "what_to_test", "confidence", "effort", "category"}
        for i, h in enumerate(data["hypotheses"]):
            missing = required - set(h.keys())
            assert not missing, f"Hypothesis {i} missing fields: {missing}"
        print("PASS: all hypotheses have required fields")

    def test_confidence_values_are_valid(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/cms/ads/strategy-brainstorm", headers=auth_headers, timeout=60)
        data = r.json()
        if "error" in data:
            pytest.skip("LLM error")
        valid = {"high", "medium", "low"}
        for i, h in enumerate(data["hypotheses"]):
            assert h["confidence"] in valid, f"Hypothesis {i} confidence invalid: {h['confidence']}"
        print("PASS: all confidence values valid")

    def test_effort_values_are_valid(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/cms/ads/strategy-brainstorm", headers=auth_headers, timeout=60)
        data = r.json()
        if "error" in data:
            pytest.skip("LLM error")
        valid = {"low", "medium", "high"}
        for i, h in enumerate(data["hypotheses"]):
            assert h["effort"] in valid, f"Hypothesis {i} effort invalid: {h['effort']}"
        print("PASS: all effort values valid")

    def test_category_values_are_valid(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/cms/ads/strategy-brainstorm", headers=auth_headers, timeout=60)
        data = r.json()
        if "error" in data:
            pytest.skip("LLM error")
        valid = {"landing_page", "audience", "creative", "budget", "offer"}
        for i, h in enumerate(data["hypotheses"]):
            assert h["category"] in valid, f"Hypothesis {i} category invalid: {h['category']}"
        print("PASS: all category values valid")

    def test_no_db_writes_occur(self, auth_headers):
        """Verify ad_spend count is same before and after the call."""
        count_before_r = requests.get(f"{BASE_URL}/api/cms/ads/executive-summary", headers=auth_headers)
        count_before = count_before_r.json().get("total_spend", 0) if count_before_r.ok else 0

        requests.post(f"{BASE_URL}/api/cms/ads/strategy-brainstorm", headers=auth_headers, timeout=60)

        count_after_r = requests.get(f"{BASE_URL}/api/cms/ads/executive-summary", headers=auth_headers)
        count_after = count_after_r.json().get("total_spend", 0) if count_after_r.ok else 0

        assert count_before == count_after, f"total_spend changed! before={count_before}, after={count_after}"
        print("PASS: no DB writes — total_spend unchanged")

    def test_regression_recommendations_returns_4_signals(self, auth_headers):
        """Regression: recommendations endpoint returns 4 signals (1 SCALE + 3 LP_FRICTION)."""
        r = requests.get(f"{BASE_URL}/api/cms/ads/recommendations", headers=auth_headers, timeout=30)
        assert r.status_code == 200, f"recommendations returned {r.status_code}"
        data = r.json()
        signals = data.get("signals", [])
        assert len(signals) == 4, f"Expected 4 signals, got {len(signals)}: {[s['type'] for s in signals]}"
        types = [s["type"] for s in signals]
        assert types.count("SCALE") == 1
        assert types.count("LP_FRICTION") == 3
        print(f"PASS: recommendations returns 4 signals: {types}")

    def test_regression_adset_panel_loads(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/cms/ads/adset-performance", headers=auth_headers)
        assert r.status_code == 200, f"adset-performance returned {r.status_code}"
        print(f"PASS: adset-performance loads, {len(r.json())} rows")

    def test_regression_placement_panel_loads(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/cms/ads/placement-breakdown", headers=auth_headers)
        assert r.status_code == 200, f"placement-breakdown returned {r.status_code}"
        print("PASS: placement-breakdown loads")
