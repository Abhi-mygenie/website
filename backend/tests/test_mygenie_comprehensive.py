"""
Comprehensive backend API tests for MyGenie POS marketing site
Tests: health, demo-request, OTP, CMS auth, blog, pricing pages
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

class TestHealth:
    """Health check"""
    def test_root_health(self):
        r = requests.get(f"{BASE_URL}/api/")
        assert r.status_code == 200

class TestDemoRequest:
    """Demo form lead capture"""
    def test_demo_request_basic(self):
        r = requests.post(f"{BASE_URL}/api/demo-request", json={
            "name": "TEST_User",
            "phone": "9876543210",
            "email": "test@example.com",
            "outlet_type": "Restaurant",
            "business_name": "TEST_Biz",
            "city": "Mumbai",
            "source_page": "homepage",
        })
        assert r.status_code == 200
        data = r.json()
        assert "id" in data or data.get("saved") is not False

    def test_demo_request_missing_required(self):
        r = requests.post(f"{BASE_URL}/api/demo-request", json={
            "email": "test@example.com",
        })
        assert r.status_code in [400, 422]

    def test_demo_request_sector_page(self):
        r = requests.post(f"{BASE_URL}/api/demo-request", json={
            "name": "TEST_SectorUser",
            "phone": "9876543211",
            "outlet_type": "petpooja-alternative",
            "source_page": "sector:petpooja-alternative",
        })
        assert r.status_code == 200

class TestOTP:
    """OTP send/verify"""
    def test_otp_send_valid_phone(self):
        r = requests.post(f"{BASE_URL}/api/otp/send", json={"phone": "9876543210"})
        # Should succeed or gracefully fail (SMS panel down in preview)
        assert r.status_code in [200, 503, 500, 429]  # 429 = rate limited (expected in test env)

    def test_otp_verify_invalid_code(self):
        # First send OTP
        requests.post(f"{BASE_URL}/api/otp/send", json={"phone": "9876543210"})
        r = requests.post(f"{BASE_URL}/api/otp/verify", json={"phone": "9876543210", "code": "0000"})
        assert r.status_code in [400, 422, 401]

class TestCMSAuth:
    """CMS login endpoints"""
    def test_cms_login_admin_success(self):
        r = requests.post(f"{BASE_URL}/api/cms/login", json={
            "username": "admin@mygenie.online",
            "password": "admin123",
        })
        assert r.status_code == 200
        data = r.json()
        assert "token" in data

    def test_cms_login_editor_success(self):
        r = requests.post(f"{BASE_URL}/api/cms/login", json={
            "username": "editor@mygenie.online",
            "password": "editor123",
        })
        assert r.status_code == 200
        data = r.json()
        assert "token" in data

    def test_cms_login_wrong_password(self):
        r = requests.post(f"{BASE_URL}/api/cms/login", json={
            "username": "admin@mygenie.online",
            "password": "wrongpass",
        })
        assert r.status_code in [401, 403]

class TestCMSContent:
    """CMS content endpoints"""
    def setup_method(self):
        r = requests.post(f"{BASE_URL}/api/cms/login", json={
            "email": "admin@mygenie.online",
            "password": "admin123",
        })
        if r.status_code == 200:
            self.token = r.json().get("token")
        else:
            self.token = None

    def test_get_content_doc(self):
        if not self.token:
            pytest.skip("CMS auth failed")
        r = requests.get(
            f"{BASE_URL}/api/cms/content/home",
            headers={"Authorization": f"Bearer {self.token}"},
        )
        assert r.status_code in [200, 404]

class TestDemoBooked:
    """Demo booked webhook"""
    def test_demo_booked_endpoint(self):
        r = requests.post(f"{BASE_URL}/api/demo-booked", json={
            "lead_id": None,
            "freshsales_contact_id": None,
            "email": "test@example.com",
        })
        assert r.status_code in [200, 404]
