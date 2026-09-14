"""
Production nginx fix verification tests for https://www.mygenie.online
CR-224: Nginx Trailing Slash Redirect Fix
Tests all non-homepage URLs return 200 directly (no 301 redirect)
"""
import pytest
import requests

BASE_URL = "https://www.mygenie.online"

# Disable redirects session
def no_redirect_get(url):
    return requests.get(url, allow_redirects=False, timeout=15)

def follow_redirect_get(url):
    return requests.get(url, allow_redirects=True, timeout=15)


class TestNonHomepageURLsDirect200:
    """All non-homepage URLs must return 200 directly with NO 301 redirect"""

    @pytest.mark.parametrize("path", [
        "/pricing",
        "/restaurant-billing-software",
        "/restaurant-pos-system",
        "/cloud-kitchen-pos",
        "/qsr-pos-system",
        "/restaurant-management-software",
        "/about",
        "/solutions/restaurants",
        "/solutions/cafes",
        "/blog",
        "/contact",
        "/ai",
        "/customers",
        "/demo",
        "/petpooja-alternative",
    ])
    def test_no_redirect_on_path(self, path):
        """Path must return 200 directly, not 301"""
        r = no_redirect_get(f"{BASE_URL}{path}")
        assert r.status_code == 200, f"{path} returned {r.status_code} (expected 200, no redirect)"


class TestTrailingSlashVersions:
    """Trailing slash versions must still return 200"""

    @pytest.mark.parametrize("path", [
        "/pricing/",
        "/restaurant-billing-software/",
        "/solutions/restaurants/",
    ])
    def test_trailing_slash_returns_200(self, path):
        r = follow_redirect_get(f"{BASE_URL}{path}")
        assert r.status_code == 200, f"{path} returned {r.status_code}"


class TestHomepage:
    def test_homepage_returns_200(self):
        r = follow_redirect_get(f"{BASE_URL}/")
        assert r.status_code == 200


class TestOldURLRewrites:
    """Old URL rewrites must 301 to new canonical URLs"""

    @pytest.mark.parametrize("old_path,expected_location_contains", [
        ("/about-us", "/about"),
        ("/blogs", "/blog"),
        ("/fine-dining", "/solutions/restaurants"),
        ("/contact-us", "/contact"),
    ])
    def test_old_url_redirects(self, old_path, expected_location_contains):
        r = no_redirect_get(f"{BASE_URL}{old_path}")
        assert r.status_code == 301, f"{old_path} returned {r.status_code} (expected 301)"
        location = r.headers.get("Location", "")
        assert expected_location_contains in location, \
            f"{old_path} redirect location '{location}' does not contain '{expected_location_contains}'"


class TestStaticAssets:
    """Static assets must return 200"""

    def test_brand_banner_webp(self):
        r = follow_redirect_get(f"{BASE_URL}/brand/banner.webp")
        assert r.status_code == 200, f"/brand/banner.webp returned {r.status_code}"

    def test_static_js_main_file(self):
        # Check a specific known JS file loads correctly
        r = follow_redirect_get(f"{BASE_URL}/static/js/main.aad795d7.js")
        assert r.status_code == 200, f"/static/js/main.aad795d7.js returned {r.status_code}"


class TestHTTPApexRedirect:
    """http://mygenie.online must redirect to https://www.mygenie.online"""

    def test_http_apex_redirects_to_https_www(self):
        r = requests.get("http://mygenie.online", allow_redirects=False, timeout=15)
        assert r.status_code in [301, 302, 307, 308], \
            f"http://mygenie.online returned {r.status_code} (expected redirect)"
        location = r.headers.get("Location", "")
        assert "https://www.mygenie.online" in location or "https://" in location, \
            f"Redirect location '{location}' not going to https"


class TestReactHTMLContent:
    """React app pages must serve actual HTML content"""

    def test_pricing_html_content(self):
        r = follow_redirect_get(f"{BASE_URL}/pricing")
        assert r.status_code == 200
        body = r.text
        assert "<title>" in body or "<html" in body, "Response does not contain HTML title/html tag"
        assert len(body) > 500, f"Response body too short ({len(body)} chars), likely empty"

    def test_pricing_meta_description(self):
        r = follow_redirect_get(f"{BASE_URL}/pricing")
        assert r.status_code == 200
        body = r.text
        assert "meta" in body.lower(), "No meta tags found in /pricing response"
