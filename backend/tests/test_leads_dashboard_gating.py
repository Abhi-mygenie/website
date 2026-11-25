"""
Tests for CR-153: ENV-gated lead dashboard (LEADS_DASHBOARD_ENABLED)
All tests in a single class to run on the same xdist worker (sequential via loadscope).
Phases: enabled=true, enabled=false (503 checks), reset to true.
"""
import pytest
import requests
import os
import subprocess
import time
import re

BASE_URL = "http://localhost:8001"
ENV_PATH = "/app/backend/.env"


def wait_for_backend(max_wait=15):
    """Poll until backend responds or timeout."""
    for _ in range(max_wait):
        try:
            r = requests.get(f"{BASE_URL}/api/cms/config", timeout=2)
            if r.status_code < 500:
                return True
        except Exception:
            pass
        time.sleep(1)
    return False


def get_admin_token():
    resp = requests.post(f"{BASE_URL}/api/cms/login", json={"username": "admin", "password": "admin123"}, timeout=10)
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return resp.json()["token"]


def set_leads_enabled(value: str):
    with open(ENV_PATH, "r") as f:
        content = f.read()
    content = re.sub(r"LEADS_DASHBOARD_ENABLED=.*", f"LEADS_DASHBOARD_ENABLED={value}", content)
    with open(ENV_PATH, "w") as f:
        f.write(content)
    subprocess.run(["sudo", "supervisorctl", "restart", "backend"], check=True, capture_output=True)
    assert wait_for_backend(15), "Backend did not come back up after restart"


class TestLeadsDashboardGating:
    """All 3 phases in one class so xdist loadscope runs them sequentially on one worker."""

    # ── Phase 1: LEADS_DASHBOARD_ENABLED=true (baseline) ──────────────────────

    def test_01_config_leads_enabled_true(self):
        resp = requests.get(f"{BASE_URL}/api/cms/config", timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        assert "leads_enabled" in data
        assert data["leads_enabled"] is True

    def test_02_funnel_summary_200_when_enabled(self):
        token = get_admin_token()
        resp = requests.get(f"{BASE_URL}/api/cms/funnel/summary",
                            headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

    def test_03_leads_200_when_enabled(self):
        token = get_admin_token()
        resp = requests.get(f"{BASE_URL}/api/cms/leads",
                            headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

    # ── Phase 2: Set LEADS_DASHBOARD_ENABLED=false then test ─────────────────

    def test_04_disable_leads_dashboard(self):
        """Toggle the feature flag to false and restart."""
        set_leads_enabled("false")

    def test_05_config_returns_leads_enabled_false(self):
        resp = requests.get(f"{BASE_URL}/api/cms/config", timeout=10)
        assert resp.status_code == 200
        assert resp.json().get("leads_enabled") is False

    def test_06_funnel_summary_503_when_disabled(self):
        token = get_admin_token()
        resp = requests.get(f"{BASE_URL}/api/cms/funnel/summary",
                            headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert resp.status_code == 503
        assert resp.json().get("detail") == "Dashboard disabled"

    def test_07_leads_503_when_disabled(self):
        token = get_admin_token()
        resp = requests.get(f"{BASE_URL}/api/cms/leads",
                            headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert resp.status_code == 503

    def test_08_ads_mcp_status_503_when_disabled(self):
        token = get_admin_token()
        resp = requests.get(f"{BASE_URL}/api/cms/ads/mcp/status",
                            headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert resp.status_code == 503

    def test_09_sync_status_503_when_disabled(self):
        token = get_admin_token()
        resp = requests.get(f"{BASE_URL}/api/cms/sync/status",
                            headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert resp.status_code == 503

    # Category B — must NOT return 503

    def test_10_cms_me_not_503(self):
        token = get_admin_token()
        resp = requests.get(f"{BASE_URL}/api/cms/me",
                            headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert resp.status_code != 503, f"Category B /cms/me got 503 — should not be affected"
        assert resp.status_code == 200

    def test_11_cms_content_draft_not_503(self):
        token = get_admin_token()
        resp = requests.get(f"{BASE_URL}/api/cms/content/draft",
                            headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert resp.status_code != 503, f"Category B /cms/content/draft got 503"

    def test_12_cms_publish_not_503(self):
        token = get_admin_token()
        resp = requests.post(f"{BASE_URL}/api/cms/publish",
                             headers={"Authorization": f"Bearer {token}"},
                             json={}, timeout=10)
        assert resp.status_code != 503, f"Category B /cms/publish got 503"

    # Public endpoints — always work

    def test_13_public_cms_content_200(self):
        resp = requests.get(f"{BASE_URL}/api/cms/content", timeout=10)
        assert resp.status_code == 200

    def test_14_public_config_200_with_leads_field(self):
        resp = requests.get(f"{BASE_URL}/api/cms/config", timeout=10)
        assert resp.status_code == 200
        assert "leads_enabled" in resp.json()

    def test_15_public_login_200(self):
        resp = requests.post(f"{BASE_URL}/api/cms/login",
                             json={"username": "admin", "password": "admin123"}, timeout=10)
        assert resp.status_code == 200
        assert "token" in resp.json()

    def test_16_demo_request_not_blocked(self):
        resp = requests.post(f"{BASE_URL}/api/demo-request", json={
            "name": "Test User",
            "phone": "9999999999",
            "email": "test@example.com",
            "sector": "restaurant"
        }, timeout=10)
        assert resp.status_code != 503, f"Lead capture must not be blocked: got {resp.status_code}"

    # ── Phase 3: Reset to true and verify recovery ────────────────────────────

    def test_17_re_enable_leads_dashboard(self):
        """Reset LEADS_DASHBOARD_ENABLED=true and restart."""
        set_leads_enabled("true")

    def test_18_config_leads_enabled_true_after_reset(self):
        resp = requests.get(f"{BASE_URL}/api/cms/config", timeout=10)
        assert resp.status_code == 200
        assert resp.json().get("leads_enabled") is True

    def test_19_funnel_summary_200_after_reset(self):
        token = get_admin_token()
        resp = requests.get(f"{BASE_URL}/api/cms/funnel/summary",
                            headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert resp.status_code == 200, f"Expected 200 after reset, got {resp.status_code}: {resp.text}"
