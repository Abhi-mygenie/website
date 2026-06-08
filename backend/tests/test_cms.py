"""CR-6 CMS backend integration tests.

Covers: login, me, content draft/publish/discard, media upload + serve.
"""
import os
import io
import pytest
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load REACT_APP_BACKEND_URL from frontend/.env
load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_USER = "admin"
ADMIN_PASS = "admin123"
EDITOR_USER = "editor"
EDITOR_PASS = "editor123"
HERO_BADGE_KEY = "home.hero.badge"
HERO_BADGE_ORIGINAL = "The Hospitality Operating System"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def token(session):
    r = session.post(f"{API}/cms/login", json={"username": ADMIN_USER, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 20
    assert data.get("user") == ADMIN_USER
    return data["token"]


@pytest.fixture(scope="session")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---- Auth ----
class TestAuth:
    def test_login_wrong_password(self, session):
        r = session.post(f"{API}/cms/login", json={"username": ADMIN_USER, "password": "wrong"}, timeout=10)
        assert r.status_code == 401

    def test_login_team_user(self, session):
        r = session.post(f"{API}/cms/login", json={"username": EDITOR_USER, "password": EDITOR_PASS}, timeout=10)
        assert r.status_code == 200
        assert "token" in r.json()

    def test_me_with_token(self, session, auth_headers):
        r = session.get(f"{API}/cms/me", headers=auth_headers, timeout=10)
        assert r.status_code == 200
        assert r.json().get("user") == ADMIN_USER

    def test_me_without_token(self, session):
        r = requests.get(f"{API}/cms/me", timeout=10)
        assert r.status_code == 401

    def test_me_with_invalid_token(self, session):
        r = requests.get(f"{API}/cms/me", headers={"Authorization": "Bearer notavalidtoken"}, timeout=10)
        assert r.status_code == 401


# ---- Content workflow ----
class TestContentWorkflow:
    TEST_KEY = "test.qa.cr6_marker"
    TEST_VAL_DRAFT = "TEST_CR6_DRAFT_VALUE"
    TEST_VAL_PUBLISHED = "TEST_CR6_PUBLISHED_VALUE"

    def test_put_creates_draft(self, session, auth_headers):
        r = session.put(
            f"{API}/cms/content",
            json={"key": self.TEST_KEY, "type": "text", "value": self.TEST_VAL_DRAFT},
            headers=auth_headers, timeout=10,
        )
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_draft_visible_only_to_admin(self, session, auth_headers):
        # admin draft endpoint sees it
        r = session.get(f"{API}/cms/content/draft", headers=auth_headers, timeout=10)
        assert r.status_code == 200
        body = r.json()
        assert "content" in body and "has_draft" in body
        assert body["content"].get(self.TEST_KEY) == self.TEST_VAL_DRAFT
        assert body["has_draft"] is True

        # public endpoint does NOT see draft
        r2 = requests.get(f"{API}/cms/content", timeout=10)
        assert r2.status_code == 200
        public = r2.json()
        assert public.get(self.TEST_KEY) != self.TEST_VAL_DRAFT

    def test_draft_requires_auth(self):
        r = requests.get(f"{API}/cms/content/draft", timeout=10)
        assert r.status_code == 401

    def test_publish_promotes_draft(self, session, auth_headers):
        # set value, publish, ensure public matches
        session.put(
            f"{API}/cms/content",
            json={"key": self.TEST_KEY, "type": "text", "value": self.TEST_VAL_PUBLISHED},
            headers=auth_headers, timeout=10,
        )
        r = session.post(f"{API}/cms/publish", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert "published" in r.json()

        r2 = requests.get(f"{API}/cms/content", timeout=10)
        assert r2.status_code == 200
        assert r2.json().get(self.TEST_KEY) == self.TEST_VAL_PUBLISHED

    def test_discard_reverts_draft(self, session, auth_headers):
        # Make a new draft different from published
        new_draft = "TEST_CR6_TO_BE_DISCARDED"
        session.put(
            f"{API}/cms/content",
            json={"key": self.TEST_KEY, "type": "text", "value": new_draft},
            headers=auth_headers, timeout=10,
        )
        # confirm draft visible
        d = session.get(f"{API}/cms/content/draft", headers=auth_headers, timeout=10).json()
        assert d["content"].get(self.TEST_KEY) == new_draft

        r = session.post(f"{API}/cms/discard", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True

        # after discard, draft value reverts to published value
        d2 = session.get(f"{API}/cms/content/draft", headers=auth_headers, timeout=10).json()
        assert d2["content"].get(self.TEST_KEY) == self.TEST_VAL_PUBLISHED

        # public unchanged
        pub = requests.get(f"{API}/cms/content", timeout=10).json()
        assert pub.get(self.TEST_KEY) == self.TEST_VAL_PUBLISHED

    def test_put_requires_auth(self):
        r = requests.put(f"{API}/cms/content", json={"key": "x", "type": "text", "value": "y"}, timeout=10)
        assert r.status_code == 401

    def test_publish_requires_auth(self):
        r = requests.post(f"{API}/cms/publish", timeout=10)
        assert r.status_code == 401


# ---- Media ----
PNG_BYTES = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4"
    "890000000d49444154789c63f8cf000000030001c1bdf8000000004945"
    "4e44ae426082"
)


class TestMedia:
    def test_upload_and_serve(self, auth_headers):
        files = {"file": ("test.png", io.BytesIO(PNG_BYTES), "image/png")}
        r = requests.post(f"{API}/cms/media", files=files, headers=auth_headers, timeout=20)
        assert r.status_code == 200, r.text
        url = r.json().get("url")
        assert url and url.startswith("/api/cms/media/")
        # serve back
        r2 = requests.get(f"{BASE_URL}{url}", timeout=15)
        assert r2.status_code == 200
        assert r2.headers.get("content-type", "").startswith("image/")
        assert len(r2.content) > 0

    def test_upload_rejects_unsupported_ext(self, auth_headers):
        files = {"file": ("bad.exe", io.BytesIO(b"MZ"), "application/octet-stream")}
        r = requests.post(f"{API}/cms/media", files=files, headers=auth_headers, timeout=15)
        assert r.status_code == 400

    def test_upload_requires_auth(self):
        files = {"file": ("test.png", io.BytesIO(PNG_BYTES), "image/png")}
        r = requests.post(f"{API}/cms/media", files=files, timeout=15)
        assert r.status_code == 401

    def test_media_not_found(self):
        r = requests.get(f"{API}/cms/media/nonexistent_xyz.png", timeout=10)
        assert r.status_code == 404


# ---- Meta ----
class TestMeta:
    def test_meta_requires_auth(self):
        r = requests.get(f"{API}/cms/meta", timeout=10)
        assert r.status_code == 401

    def test_meta_returns_publish_info(self, session, auth_headers):
        # Force a publish by writing a unique draft value, then publish.
        unique_val = "TEST_META_PUBLISH_MARKER"
        session.put(
            f"{API}/cms/content",
            json={"key": "test.qa.meta_marker", "type": "text", "value": unique_val},
            headers=auth_headers, timeout=10,
        )
        session.post(f"{API}/cms/publish", headers=auth_headers, timeout=15)
        r = session.get(f"{API}/cms/meta", headers=auth_headers, timeout=10)
        assert r.status_code == 200
        body = r.json()
        # meta should now contain last_published fields
        assert "last_published_at" in body
        assert "last_published_by" in body
        assert body["last_published_by"] == ADMIN_USER


# ---- Cleanup + Reset hero badge to original (per agent_to_agent_context_note) ----
class TestCleanup:
    def test_zz_reset_hero_badge_to_original(self, session, auth_headers):
        # Set hero badge draft back to original and publish, in case earlier tests/smokes mutated it.
        session.put(
            f"{API}/cms/content",
            json={"key": HERO_BADGE_KEY, "type": "text", "value": HERO_BADGE_ORIGINAL},
            headers=auth_headers, timeout=10,
        )
        r = session.post(f"{API}/cms/publish", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        pub = requests.get(f"{API}/cms/content", timeout=10).json()
        assert pub.get(HERO_BADGE_KEY) == HERO_BADGE_ORIGINAL

    def test_zz_cleanup_test_marker(self, session, auth_headers):
        # Best effort: clear our test key by setting to empty string and publishing.
        session.put(
            f"{API}/cms/content",
            json={"key": TestContentWorkflow.TEST_KEY, "type": "text", "value": ""},
            headers=auth_headers, timeout=10,
        )
        session.put(
            f"{API}/cms/content",
            json={"key": "test.qa.meta_marker", "type": "text", "value": ""},
            headers=auth_headers, timeout=10,
        )
        session.post(f"{API}/cms/publish", headers=auth_headers, timeout=10)
