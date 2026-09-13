"""
Tests for MyGenie POS website form submissions:
- Demo Request (POST /api/demo-request)
- Contact/Message (POST /api/contact)
- Quote/Pricing (POST /api/quote)
- OTP Send (POST /api/otp/send)
- Demo Requests List (GET /api/demo-requests)
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# ------------------------------------------------------------------
# Demo Request
# ------------------------------------------------------------------
class TestDemoRequest:
    """POST /api/demo-request"""

    def test_valid_demo_submission(self):
        """Normal submission with elapsed_ms > 2000 should save and return id"""
        payload = {
            "name": "TEST_John Doe",
            "phone": "9876543210",
            "email": "test_john@example.com",
            "business_name": "TEST_Pizza Palace",
            "years_in_business": "2",
            "outlet_type": "QSR",
            "city": "Delhi",
            "hp": "",
            "elapsed_ms": 5000,
        }
        r = requests.post(f"{BASE_URL}/api/demo-request", json=payload, timeout=15)
        print(f"Demo submit status: {r.status_code}")
        print(f"Demo submit body: {r.text[:300]}")
        assert r.status_code == 200
        data = r.json()
        # saved should not be False
        assert data.get("saved") is not False, "saved was False — bot-filter triggered unexpectedly"
        assert "id" in data, f"Missing 'id' in response: {data}"

    def test_bot_protection_low_elapsed_ms(self):
        """Submission with elapsed_ms < 2000 should return saved:false"""
        payload = {
            "name": "Bot User",
            "phone": "9999999999",
            "email": "bot@example.com",
            "business_name": "Bot Biz",
            "years_in_business": "1",
            "hp": "",
            "elapsed_ms": 500,  # too fast -> bot
        }
        r = requests.post(f"{BASE_URL}/api/demo-request", json=payload, timeout=10)
        print(f"Bot-check status: {r.status_code}, body: {r.text[:200]}")
        assert r.status_code == 200
        data = r.json()
        assert data.get("saved") is False, f"Expected saved:false for bot, got: {data}"

    def test_honeypot_filled_returns_saved_false(self):
        """Honeypot field filled -> bot"""
        payload = {
            "name": "Bot User",
            "phone": "8888888888",
            "email": "bot2@example.com",
            "business_name": "Bot Biz",
            "years_in_business": "1",
            "hp": "I am a bot",
            "elapsed_ms": 5000,
        }
        r = requests.post(f"{BASE_URL}/api/demo-request", json=payload, timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data.get("saved") is False, f"Expected saved:false for honeypot, got: {data}"


# ------------------------------------------------------------------
# Contact / Message Form
# ------------------------------------------------------------------
class TestContactForm:
    """POST /api/contact"""

    def test_valid_contact_submission(self):
        payload = {
            "name": "TEST_Jane Smith",
            "phone": "9123456780",
            "email": "test_jane@example.com",
            "message": "I want to know more about your POS.",
            "hp": "",
            "elapsed_ms": 4000,
        }
        r = requests.post(f"{BASE_URL}/api/contact", json=payload, timeout=15)
        print(f"Contact submit status: {r.status_code}, body: {r.text[:300]}")
        assert r.status_code == 200


# ------------------------------------------------------------------
# Quote / Pricing Form
# ------------------------------------------------------------------
class TestQuoteForm:
    """POST /api/quote"""

    def test_valid_quote_submission(self):
        payload = {
            "name": "TEST_Raj Kumar",
            "phone": "9012345678",
            "email": "test_raj@example.com",
            "business_name": "TEST_Raj's Dhaba",
            "plan_id": "starter",
            "plan_name": "Starter Plan",
            "billing_cycle": "annual",
            "total_amount": 5999,
            "gst_amount": 1079.82,
            "total_with_gst": 7078.82,
            "hp": "",
            "elapsed_ms": 5000,
        }
        r = requests.post(f"{BASE_URL}/api/quote", json=payload, timeout=15)
        print(f"Quote submit status: {r.status_code}, body: {r.text[:300]}")
        assert r.status_code == 200
        data = r.json()
        assert data.get("saved") is not False, f"Quote not saved: {data}"


# ------------------------------------------------------------------
# OTP
# ------------------------------------------------------------------
class TestOtp:
    """POST /api/otp/send"""

    def test_otp_send_responds_200(self):
        """OTP send endpoint should respond 200 (SMS may not actually go in preview)"""
        payload = {"phone": "9876543210"}
        r = requests.post(f"{BASE_URL}/api/otp/send", json=payload, timeout=15)
        print(f"OTP send status: {r.status_code}, body: {r.text[:200]}")
        # 200 or 429 (rate limit) both acceptable; 500 is not
        assert r.status_code in [200, 429], f"Unexpected status: {r.status_code}"


# ------------------------------------------------------------------
# GET /api/demo-requests (leads dashboard)
# ------------------------------------------------------------------
class TestDemoRequestsList:
    """GET /api/demo-requests — known 500 issue due to corrupted probe doc"""

    def test_get_demo_requests(self):
        r = requests.get(f"{BASE_URL}/api/demo-requests", timeout=15)
        print(f"GET /api/demo-requests status: {r.status_code}")
        print(f"Body preview: {r.text[:300]}")
        # This is known to return 500 due to corrupted probe document
        if r.status_code == 500:
            print("KNOWN BUG: GET /api/demo-requests returns 500 — corrupted probe doc in MongoDB")
        assert r.status_code == 200, f"GET /api/demo-requests returned {r.status_code} — needs fix"
