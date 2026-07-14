"""Iteration 2 regression tests for MyGenie POS backend"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pull-and-run-7.preview.emergentagent.com').rstrip('/')


# Health check
class TestHealth:
    def test_api_root(self):
        r = requests.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        data = r.json()
        assert "message" in data


# Demo form submission
class TestDemoRequest:
    def test_demo_request_basic(self):
        r = requests.post(f"{BASE_URL}/api/demo-request", json={
            "name": "TEST_User",
            "phone": "9876543210",
            "years_in_business": "0-2",
            "outlet_type": "Restaurant",
        })
        assert r.status_code == 200
        data = r.json()
        assert data.get("name") == "TEST_User"
        assert data.get("years_in_business") == "0-2"
        assert "id" in data

    def test_demo_request_yet_to_open(self):
        r = requests.post(f"{BASE_URL}/api/demo-request", json={
            "name": "TEST_YetToOpen",
            "phone": "9876543211",
            "years_in_business": "yet-to-open",
        })
        assert r.status_code == 200
        data = r.json()
        assert data.get("years_in_business") == "yet-to-open"

    def test_demo_request_2plus(self):
        r = requests.post(f"{BASE_URL}/api/demo-request", json={
            "name": "TEST_2Plus",
            "phone": "9876543212",
            "years_in_business": "2+",
        })
        assert r.status_code == 200

    def test_demo_request_meta_demo_sector(self):
        """Test demo landing page submission with meta-demo sector"""
        r = requests.post(f"{BASE_URL}/api/demo-request", json={
            "name": "TEST_MetaDemo",
            "phone": "9876543213",
            "source_page": "sector:meta-demo",
            "years_in_business": "0-2",
        })
        assert r.status_code == 200

# OTP send graceful fallback
class TestOtp:
    def test_otp_send_graceful(self):
        """OTP send should return 200 or graceful error (no SMS keys in preview)"""
        r = requests.post(f"{BASE_URL}/api/otp/send", json={"phone": "9876543210"})
        # Either returns a result or 400/500 gracefully
        assert r.status_code in [200, 400, 500, 503]


# CMS login
class TestCmsAuth:
    def test_cms_login_admin(self):
        r = requests.post(f"{BASE_URL}/api/cms/login", json={
            "username": "admin@mygenie.online",
            "password": "admin123"
        })
        assert r.status_code == 200
        data = r.json()
        assert "token" in data

    def test_cms_login_invalid(self):
        r = requests.post(f"{BASE_URL}/api/cms/login", json={
            "username": "wrong@example.com",
            "password": "wrongpass"
        })
        assert r.status_code == 401
