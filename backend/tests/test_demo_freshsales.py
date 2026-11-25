"""Tests for /api/demo-request endpoint and Freshsales CRM integration"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# Use unique phone numbers per test to avoid rate limiting
TEST_LEAD_1 = {
    "name": "Test Lead One",
    "phone": "9111111111",
    "email": "testlead1@example.com",
    "outlet_type": "restaurant",
    "otp_token": None,
    "hp": "",
    "elapsed_ms": 5000,
}

TEST_LEAD_2 = {
    "name": "Test Lead Two",
    "phone": "9222222222",
    "email": "testlead2@example.com",
    "outlet_type": "cafe",
    "otp_token": None,
    "hp": "",
    "elapsed_ms": 5000,
}


def test_demo_request_endpoint_reachable():
    """Verify /api/demo-request returns non-500 response"""
    resp = requests.post(f"{BASE_URL}/api/demo-request", json=TEST_LEAD_1, timeout=30)
    print(f"Status: {resp.status_code}, Body: {resp.text[:500]}")
    assert resp.status_code not in [500, 502, 503, 404], f"Unexpected status: {resp.status_code}"
    print("PASS: endpoint is reachable")


def test_demo_request_returns_200():
    """Verify lead submission returns 200"""
    lead = {**TEST_LEAD_1, "phone": "9888888881", "email": "testlead8881@example.com"}
    resp = requests.post(f"{BASE_URL}/api/demo-request", json=lead, timeout=30)
    print(f"Status: {resp.status_code}, Body: {resp.text[:500]}")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:200]}"
    data = resp.json()
    print(f"Response keys: {list(data.keys())}")
    print(f"freshsales_contact_id: {data.get('freshsales_contact_id')}")
    print("PASS: endpoint returned 200")


def test_demo_request_freshsales_contact_id():
    """Verify freshsales_contact_id is returned (CRM push happened)"""
    lead = {**TEST_LEAD_2, "phone": "9666666661", "email": "testlead6661@example.com"}
    resp = requests.post(f"{BASE_URL}/api/demo-request", json=lead, timeout=30)
    assert resp.status_code == 200, f"Got {resp.status_code}: {resp.text[:200]}"
    data = resp.json()
    print(f"freshsales_contact_id: {data.get('freshsales_contact_id')}")
    assert data.get("freshsales_contact_id") is not None, \
        "freshsales_contact_id is None — CRM push may have failed"
    print("PASS: freshsales_contact_id is present in response")


def test_backend_logs_show_freshsales_call():
    """Check backend logs show Freshsales API call (not 'skipping CRM')"""
    log_path = "/var/log/supervisor/backend.err.log"
    if not os.path.exists(log_path):
        pytest.skip(f"Log file not found: {log_path}")
    
    # Record timestamp before submission
    submit_time = time.time()
    
    # Submit a lead
    lead = {**TEST_LEAD_2, "phone": "9777777771", "email": "testlead7771@example.com"}
    resp = requests.post(f"{BASE_URL}/api/demo-request", json=lead, timeout=30)
    print(f"Submit status: {resp.status_code}")
    time.sleep(3)
    
    # Check logs for Freshsales call
    with open(log_path, "r") as f:
        content = f.read()
    
    has_freshsales_call = "myfreshworks.com" in content
    # Check for recent "skipping CRM" — but only lines AFTER the fix
    # (old ones from before fix are expected to exist)
    # Only look at lines from last 10 minutes (after the fix)
    import datetime
    now = datetime.datetime.utcnow()
    cutoff_str = (now - datetime.timedelta(minutes=10)).strftime("%Y-%m-%d %H:%M")
    lines = content.split("\n")
    recent_lines = [l for l in lines if cutoff_str[:13] in l or (len(l) > 16 and l[:16] >= cutoff_str)]
    recent_skip = [l for l in recent_lines if "skipping CRM" in l or "Freshsales not configured" in l]
    
    print(f"Has Freshsales API call in logs: {has_freshsales_call}")
    print(f"Recent 'skipping CRM' lines: {recent_skip}")
    
    assert has_freshsales_call, "No Freshsales API call found in logs at all"
    assert len(recent_skip) == 0, f"Recent 'skipping CRM' found: {recent_skip}"
    print("PASS: Freshsales API calls present, no recent 'skipping CRM' messages")
