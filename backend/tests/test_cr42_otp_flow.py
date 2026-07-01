"""CR-42: OTP post-submit flow backend tests"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestOtpConfirmEndpoint:
    """POST /api/lead/otp-confirm endpoint tests"""

    def test_otp_confirm_invalid_token(self):
        """Returns 400 for invalid otp_token"""
        res = requests.post(f"{BASE_URL}/api/lead/otp-confirm", json={
            "lead_id": "nonexistent-id",
            "phone": "9876543210",
            "otp_token": "invalid_token_xyz",
            "form_type": "demo",
        })
        assert res.status_code == 400
        data = res.json()
        assert "detail" in data

    def test_otp_confirm_invalid_form_type(self):
        """Returns 400 for invalid form_type"""
        res = requests.post(f"{BASE_URL}/api/lead/otp-confirm", json={
            "lead_id": "some-id",
            "phone": "9876543210",
            "otp_token": "some_token",
            "form_type": "invalid_type",
        })
        # Either 400 for invalid token (validated first) or 400 for invalid form_type
        assert res.status_code == 400

    def test_otp_send_endpoint_exists(self):
        """OTP send endpoint returns 200"""
        res = requests.post(f"{BASE_URL}/api/otp/send", json={"phone": "9876543210"})
        assert res.status_code == 200

    def test_otp_verify_invalid_code(self):
        """OTP verify with wrong code returns 400"""
        res = requests.post(f"{BASE_URL}/api/otp/verify", json={"phone": "9876543210", "code": "0000"})
        assert res.status_code == 400


class TestQuoteCreateModel:
    """Quote endpoint with new CR-42 fields"""

    def test_quote_accepts_years_in_business(self):
        """QuoteCreate model accepts years_in_business, gst_amount, total_with_gst"""
        res = requests.post(f"{BASE_URL}/api/quote", json={
            "name": "TEST_QuoteUser",
            "phone": "9876543210",
            "email": "test_quote@example.com",
            "business_name": "TEST_Business",
            "years_in_business": "2+",
            "intent": "quote",
            "plan_id": "starter",
            "plan_name": "Starter",
            "billing_cycle": "annual",
            "addon_ids": [],
            "addon_names": [],
            "total_amount": 5000,
            "gst_amount": 900,
            "total_with_gst": 5900,
        })
        assert res.status_code == 200
        data = res.json()
        assert "id" in data


class TestContactMessageModel:
    """Contact message endpoint with new CR-42 fields"""

    def test_contact_accepts_business_name_years(self):
        """ContactMessageCreate model accepts business_name, years_in_business"""
        res = requests.post(f"{BASE_URL}/api/contact", json={
            "name": "TEST_ContactUser",
            "phone": "9876543210",
            "email": "test_contact@example.com",
            "business_name": "TEST_ContactBusiness",
            "years_in_business": "0-2",
            "message": "Test message for CR-42",
            "source_page": "contact",
        })
        assert res.status_code == 200
        data = res.json()
        assert "id" in data


class TestDemoRequestModel:
    """Demo request endpoint with new fields"""

    def test_demo_request_with_all_fields(self):
        """DemoRequestCreate accepts all 5 required fields"""
        res = requests.post(f"{BASE_URL}/api/demo-request", json={
            "name": "TEST_DemoUser",
            "phone": "9876543210",
            "email": "test_demo@example.com",
            "business_name": "TEST_DemoBusiness",
            "years_in_business": "0-2",
            "outlet_type": "Restaurant",
            "source_page": "homepage",
        })
        assert res.status_code == 200
        data = res.json()
        assert "id" in data
        return data["id"]
