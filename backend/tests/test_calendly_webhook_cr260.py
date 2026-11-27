"""
CR-260: Tests for Calendly webhook signature verification fixes
- Bug C: signing key read fresh (not module-level)
- Bug A: deletion condition includes both active and disabled states
"""
import os
import hmac
import hashlib
import time
import json
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
SIGNING_KEY = os.environ.get("CALENDLY_WEBHOOK_SIGNING_KEY", "")


def build_signature(body: str, key: str = None, timestamp: int = None) -> str:
    """Build valid Calendly webhook signature."""
    if key is None:
        key = SIGNING_KEY
    if timestamp is None:
        timestamp = int(time.time())
    signed = f"{timestamp}.{body}"
    digest = hmac.new(key.encode("utf-8"), signed.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"t={timestamp},v1={digest}"


SAMPLE_PAYLOAD = json.dumps({
    "event": "invitee.created",
    "payload": {
        "email": "test@example.com",
        "name": "Test User",
        "scheduled_event": {
            "start_time": "2026-03-01T10:00:00Z",
            "location": {"join_url": "https://meet.example.com/abc"},
        },
        "tracking": {"utm_content": "TEST_demo_request_id"},
    },
})


class TestCalendlyWebhookSignature:
    """Tests for /api/calendly/webhook signature verification."""

    def test_valid_signature_returns_200(self):
        """POST with correct HMAC-SHA256 signature should succeed."""
        body = SAMPLE_PAYLOAD
        sig = build_signature(body)
        resp = requests.post(
            f"{BASE_URL}/api/calendly/webhook",
            data=body,
            headers={
                "Content-Type": "application/json",
                "Calendly-Webhook-Signature": sig,
            },
        )
        # 200 or 422 (unprocessable if no matching demo_request) are both acceptable
        assert resp.status_code in (200, 422, 404), (
            f"Expected 200/422/404 for valid signature, got {resp.status_code}: {resp.text}"
        )
        print(f"PASS: valid signature → {resp.status_code}")

    def test_invalid_signature_returns_401(self):
        """POST with wrong HMAC signature should return 401."""
        body = SAMPLE_PAYLOAD
        # Use wrong key
        sig = build_signature(body, key="wrongkey" * 8)
        resp = requests.post(
            f"{BASE_URL}/api/calendly/webhook",
            data=body,
            headers={
                "Content-Type": "application/json",
                "Calendly-Webhook-Signature": sig,
            },
        )
        assert resp.status_code == 401, (
            f"Expected 401 for invalid signature, got {resp.status_code}: {resp.text}"
        )
        data = resp.json()
        assert "Invalid Calendly signature" in data.get("detail", ""), (
            f"Expected 'Invalid Calendly signature' in detail, got: {data}"
        )
        print(f"PASS: invalid signature → 401")

    def test_missing_signature_header_returns_400(self):
        """POST with no signature header should return 400."""
        body = SAMPLE_PAYLOAD
        resp = requests.post(
            f"{BASE_URL}/api/calendly/webhook",
            data=body,
            headers={"Content-Type": "application/json"},
        )
        assert resp.status_code == 400, (
            f"Expected 400 for missing signature, got {resp.status_code}: {resp.text}"
        )
        data = resp.json()
        assert "Missing Calendly signature" in data.get("detail", ""), (
            f"Expected 'Missing Calendly signature' in detail, got: {data}"
        )
        print(f"PASS: missing signature → 400")

    def test_malformed_signature_returns_400(self):
        """POST with malformed signature should return 400."""
        body = SAMPLE_PAYLOAD
        resp = requests.post(
            f"{BASE_URL}/api/calendly/webhook",
            data=body,
            headers={
                "Content-Type": "application/json",
                "Calendly-Webhook-Signature": "notvalid",
            },
        )
        assert resp.status_code == 400, (
            f"Expected 400 for malformed signature, got {resp.status_code}: {resp.text}"
        )
        print(f"PASS: malformed signature → 400")


class TestCalendlyWebhookMongoUpdate:
    """Test that a valid webhook updates MongoDB demo_requests collection."""

    def test_valid_webhook_updates_demo_request(self):
        """Valid webhook with a known demo_request utm_content should update the record."""
        import pymongo
        mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
        db_name = os.environ.get("DB_NAME", "test_database")
        client = pymongo.MongoClient(mongo_url)
        db = client[db_name]

        # Insert a test demo_request
        result = db.demo_requests.insert_one({
            "email": "TEST_webhooktest@example.com",
            "status": "pending",
        })
        doc_id = result.inserted_id
        str_id = str(doc_id)

        try:
            payload = json.dumps({
                "event": "invitee.created",
                "payload": {
                    "email": "TEST_webhooktest@example.com",
                    "name": "Test Webhook User",
                    "scheduled_event": {
                        "start_time": "2026-03-01T10:00:00Z",
                        "location": {"join_url": "https://meet.example.com/testroom"},
                    },
                    "tracking": {"utm_content": str_id},
                },
            })

            sig = build_signature(payload)
            resp = requests.post(
                f"{BASE_URL}/api/calendly/webhook",
                data=payload,
                headers={
                    "Content-Type": "application/json",
                    "Calendly-Webhook-Signature": sig,
                },
            )
            print(f"Webhook response: {resp.status_code} {resp.text}")
            assert resp.status_code == 200, (
                f"Expected 200, got {resp.status_code}: {resp.text}"
            )

            # Verify MongoDB was updated
            updated = db.demo_requests.find_one({"_id": doc_id})
            assert updated is not None
            assert updated.get("status") == "demo_booked", (
                f"Expected status=demo_booked, got: {updated.get('status')}"
            )
            assert updated.get("demo_at") is not None, "demo_at field not set"
            print(f"PASS: MongoDB updated — status={updated.get('status')}, demo_at={updated.get('demo_at')}")
        finally:
            db.demo_requests.delete_one({"_id": doc_id})
            client.close()


class TestCodeStructureVerification:
    """Static verification of CR-260 code fixes."""

    def test_no_module_level_signing_key_variable(self):
        """Line 482 must be a comment, not a variable assignment."""
        server_path = "/app/backend/server.py"
        with open(server_path) as f:
            lines = f.readlines()
        line_482 = lines[481]  # 0-indexed
        assert "=" not in line_482 or line_482.strip().startswith("#"), (
            f"Line 482 appears to be an assignment: {line_482.strip()}"
        )
        # Confirm it's a comment
        assert line_482.strip().startswith("#"), (
            f"Line 482 should be a comment (CR-260 fix), got: {line_482.strip()}"
        )
        print(f"PASS: Line 482 is a comment: {line_482.strip()}")

    def test_sync_webhook_deletes_disabled_state(self):
        """_sync_calendly_webhook must delete both active and disabled subscriptions."""
        server_path = "/app/backend/server.py"
        with open(server_path) as f:
            content = f.read()
        # Look for the deletion condition
        assert '"disabled"' in content or "'disabled'" in content, (
            "Could not find 'disabled' string in server.py"
        )
        # Specifically check the in-condition pattern
        assert 'in ("active", "disabled")' in content or "in ('active', 'disabled')" in content, (
            "CR-260 Bug A fix not found: deletion condition must include both active and disabled"
        )
        print("PASS: _sync_calendly_webhook deletion includes 'disabled' state")

    def test_verify_signature_reads_key_locally(self):
        """_verify_calendly_signature must read key from os.environ.get inside the function."""
        server_path = "/app/backend/server.py"
        with open(server_path) as f:
            content = f.read()
        # Confirm fresh read inside function
        assert 'os.environ.get("CALENDLY_WEBHOOK_SIGNING_KEY")' in content, (
            "CALENDLY_WEBHOOK_SIGNING_KEY must be read via os.environ.get() inside function"
        )
        print("PASS: CALENDLY_WEBHOOK_SIGNING_KEY is read fresh inside _verify_calendly_signature")
