"""CR-59 regression tests.

Covers:
 1. `_sync_calendly_webhook` code guard — refuses to touch Calendly when the
    callback URL is a preview.emergentagent.com host, and skips silently when
    the URL is blank.
 2. Startup log assertion — after the most recent backend restart the log must
    contain the CR-40 "skipping" line (env now blank).
 3. `/api/calendly/webhook` endpoint signature verification + happy-path.
 4. Mongo update path when a valid invitee.created hits the webhook.
"""

import os
import sys
import json
import hmac
import hashlib
import time
import uuid
import asyncio
import importlib
import pathlib
from unittest.mock import patch, MagicMock

import pytest
import requests
from dotenv import dotenv_values


BACKEND_DIR = pathlib.Path("/app/backend")
sys.path.insert(0, str(BACKEND_DIR))

ENV = dotenv_values(BACKEND_DIR / ".env")
SIGNING_KEY = ENV["CALENDLY_WEBHOOK_SIGNING_KEY"]

# Use local backend URL for tests to avoid ingress complexity
BASE_URL = "http://localhost:8001"


def _sign(body: bytes, key: str = SIGNING_KEY, t: int | None = None) -> str:
    t = t if t is not None else int(time.time())
    signed = f"{t}.{body.decode()}"
    digest = hmac.new(key.encode(), signed.encode(), hashlib.sha256).hexdigest()
    return f"t={t},v1={digest}"


# ─── 1. CODE GUARD ────────────────────────────────────────────────────────────

class TestCr59CodeGuard:
    """Verify _sync_calendly_webhook refuses preview URLs and blank URLs."""

    def test_preview_url_short_circuits_before_httpx_call(self):
        """Guard must return early BEFORE any Calendly API call."""
        import server

        # Mock httpx.AsyncClient so any usage raises → proves it's never called
        boom = MagicMock(side_effect=AssertionError("httpx.AsyncClient must NOT be called"))

        with patch.dict(os.environ, {
            "CALENDLY_API_TOKEN": "fake-token",
            "CALENDLY_WEBHOOK_CALLBACK_URL": "https://mygenie-runtime.preview.emergentagent.com/api/calendly/webhook",
        }, clear=False), patch.object(server.httpx, "AsyncClient", boom):
            result = asyncio.get_event_loop().run_until_complete(server._sync_calendly_webhook())

        assert result is None
        boom.assert_not_called()

    def test_blank_callback_url_skips(self):
        """Blank CALENDLY_WEBHOOK_CALLBACK_URL must skip silently (CR-40 log)."""
        import server

        boom = MagicMock(side_effect=AssertionError("httpx must NOT be called when URL blank"))

        with patch.dict(os.environ, {
            "CALENDLY_API_TOKEN": "fake-token",
            "CALENDLY_WEBHOOK_CALLBACK_URL": "",
        }, clear=False), patch.object(server.httpx, "AsyncClient", boom):
            result = asyncio.get_event_loop().run_until_complete(server._sync_calendly_webhook())

        assert result is None
        boom.assert_not_called()

    def test_missing_api_token_skips(self):
        import server

        boom = MagicMock(side_effect=AssertionError("httpx must NOT be called"))

        env_patch = {"CALENDLY_WEBHOOK_CALLBACK_URL": "https://example.com/api/calendly/webhook"}
        # Ensure CALENDLY_API_TOKEN is absent
        with patch.dict(os.environ, env_patch, clear=False):
            os.environ.pop("CALENDLY_API_TOKEN", None)
            with patch.object(server.httpx, "AsyncClient", boom):
                result = asyncio.get_event_loop().run_until_complete(server._sync_calendly_webhook())

        assert result is None
        boom.assert_not_called()


# ─── 2. STARTUP LOG ───────────────────────────────────────────────────────────

class TestStartupLog:
    LOG = "/var/log/supervisor/backend.err.log"

    def test_latest_startup_shows_skip(self):
        with open(self.LOG, encoding="utf-8", errors="replace") as f:
            lines = f.readlines()

        # Find the LAST occurrence of any CR-40 log
        cr40_lines = [ln for ln in lines if "CR-40:" in ln]
        assert cr40_lines, "No CR-40 log line found at all"
        last = cr40_lines[-1]
        assert "not set — skipping" in last, (
            f"Latest CR-40 log did NOT indicate skip. Instead saw: {last!r}"
        )


# ─── 3. WEBHOOK ENDPOINT REGRESSION ───────────────────────────────────────────

class TestCalendlyWebhookEndpoint:
    URL = f"{BASE_URL}/api/calendly/webhook"

    def test_valid_signature_canceled_event_ignored(self):
        body = json.dumps({"event": "invitee.canceled"}).encode()
        headers = {
            "Content-Type": "application/json",
            "Calendly-Webhook-Signature": _sign(body),
        }
        r = requests.post(self.URL, data=body, headers=headers, timeout=10)
        assert r.status_code == 200
        j = r.json()
        assert j.get("status") == "ignored"

    def test_invalid_signature_returns_401(self):
        body = json.dumps({"event": "invitee.created"}).encode()
        # Bad key → wrong digest
        bad_sig = _sign(body, key="wrongkey")
        headers = {
            "Content-Type": "application/json",
            "Calendly-Webhook-Signature": bad_sig,
        }
        r = requests.post(self.URL, data=body, headers=headers, timeout=10)
        assert r.status_code == 401

    def test_missing_signature_returns_400(self):
        body = json.dumps({"event": "invitee.created"}).encode()
        r = requests.post(
            self.URL, data=body, headers={"Content-Type": "application/json"}, timeout=10
        )
        assert r.status_code == 400

    def test_valid_invitee_created_no_match_returns_ok_null(self):
        payload = {
            "event": "invitee.created",
            "payload": {
                "email": "cr59-nomatch-test@example.invalid",
                "tracking": {},
                "scheduled_event": {
                    "start_time": "2026-07-20T10:00:00.000000Z",
                    "end_time": "2026-07-20T10:45:00.000000Z",
                    "location": {
                        "join_url": "https://calendly.com/events/FAKE-UUID/google_meet"
                    },
                },
            },
        }
        body = json.dumps(payload).encode()
        headers = {
            "Content-Type": "application/json",
            "Calendly-Webhook-Signature": _sign(body),
        }
        r = requests.post(self.URL, data=body, headers=headers, timeout=30)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j.get("status") == "ok"
        # No matching CRM contact → freshsales_contact_id should be null
        assert j.get("freshsales_contact_id") in (None, 0), (
            f"Expected null freshsales_contact_id (no CRM match) but got {j!r}"
        )


# ─── 4. MONGO UPDATE PATH ─────────────────────────────────────────────────────

class TestMongoUpdatePath:
    URL = f"{BASE_URL}/api/calendly/webhook"
    LEAD_ID = f"cr59-test-lead-{uuid.uuid4().hex[:8]}"

    @pytest.fixture()
    def mongo_db(self):
        # Use the same DB handle the running app uses (same auth context)
        import server
        yield server.db

    def _run(self, coro):
        return asyncio.get_event_loop().run_until_complete(coro)

    def test_invitee_created_updates_mongo(self, mongo_db):
        # Seed test doc
        seed = {
            "id": self.LEAD_ID,
            "email": None,
            "status": "otp_verified",
            "phone": "9999900000",
            "name": "CR59 Test",
        }
        try:
            # Note: MongoDB appuser has readWrite but no delete permission on
            # test_database (verified 2026-07-14). We use a unique per-run
            # LEAD_ID and mark the doc as cleaned via $set on teardown.
            self._run(mongo_db.demo_requests.update_one(
                {"id": self.LEAD_ID}, {"$set": seed}, upsert=True
            ))

            payload = {
                "event": "invitee.created",
                "payload": {
                    "email": "cr59-nomatch-test@example.invalid",
                    "tracking": {"utm_term": self.LEAD_ID},
                    "scheduled_event": {
                        "start_time": "2026-07-20T10:00:00.000000Z",
                        "end_time": "2026-07-20T10:45:00.000000Z",
                        "location": {
                            "join_url": "https://calendly.com/events/FAKE-UUID/google_meet"
                        },
                    },
                },
            }
            body = json.dumps(payload).encode()
            headers = {
                "Content-Type": "application/json",
                "Calendly-Webhook-Signature": _sign(body),
            }
            r = requests.post(self.URL, data=body, headers=headers, timeout=30)
            assert r.status_code == 200, r.text

            doc = self._run(mongo_db.demo_requests.find_one({"id": self.LEAD_ID}))
            assert doc is not None
            assert doc.get("status") == "demo_booked", f"status={doc.get('status')!r}"
            assert doc.get("demo_at") == "20 Jul 2026, 3:30 PM IST", (
                f"demo_at={doc.get('demo_at')!r}"
            )
            assert doc.get("meet_link") == "FAKE-UUID/google_meet", (
                f"meet_link={doc.get('meet_link')!r}"
            )
            assert doc.get("meet_link_full") == "https://calendly.com/events/FAKE-UUID/google_meet"
        finally:
            # Best-effort cleanup: mark doc as cleaned (mongo user lacks
            # delete permission on test_database).
            try:
                self._run(mongo_db.demo_requests.update_one(
                    {"id": self.LEAD_ID},
                    {"$set": {"cr59_test_cleaned": True, "status": "cr59_test_cleanup"}}
                ))
            except Exception:
                pass
