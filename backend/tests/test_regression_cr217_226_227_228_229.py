"""
Regression tests for CR-217, CR-226, CR-227, CR-228, CR-229
CR-217: Cloudflare cache headers on production static assets
CR-226: Cloudflare API cache bypass (DYNAMIC)
CR-227: Preview landing page H1 keyword fixes
CR-228: Petpooja hero rewrite
CR-229: Petpooja page content changes
"""
import pytest
import requests

PROD = "https://www.mygenie.online"
PREVIEW = "https://direct-react-app.preview.emergentagent.com"

# ── CR-217: Cloudflare cache on static assets ──────────────────────────────

class TestCR217CloudflareCache:
    """Cache-Control and CF-Cache-Status on static assets (production)"""

    def _check_asset(self, url):
        r = requests.get(url, timeout=20)
        return r

    def test_banner_webp_cache_control(self):
        r = self._check_asset(f"{PROD}/brand/banner.webp")
        assert r.status_code == 200
        cc = r.headers.get("cache-control", "")
        print(f"cache-control for banner.webp: {cc}")
        assert "max-age=2592000" in cc, f"Expected max-age=2592000, got: {cc}"

    def test_banner_webp_cf_cache_hit(self):
        r = self._check_asset(f"{PROD}/brand/banner.webp")
        cf = r.headers.get("cf-cache-status", "")
        print(f"CF-Cache-Status for banner.webp: {cf}")
        assert cf == "HIT", f"Expected HIT, got: {cf}"

    def test_banner_mobile_webp_cache_control(self):
        r = self._check_asset(f"{PROD}/brand/banner-mobile.webp")
        assert r.status_code == 200
        cc = r.headers.get("cache-control", "")
        print(f"cache-control for banner-mobile.webp: {cc}")
        assert "max-age=2592000" in cc, f"Expected max-age=2592000, got: {cc}"

    def test_banner_mobile_webp_cf_cache_hit(self):
        r = self._check_asset(f"{PROD}/brand/banner-mobile.webp")
        cf = r.headers.get("cf-cache-status", "")
        print(f"CF-Cache-Status for banner-mobile.webp: {cf}")
        assert cf == "HIT", f"Expected HIT, got: {cf}"

    def test_poppins_font_cache_control(self):
        r = self._check_asset(f"{PROD}/fonts/poppins-400.woff2")
        assert r.status_code == 200
        cc = r.headers.get("cache-control", "")
        print(f"cache-control for poppins-400.woff2: {cc}")
        assert "max-age=2592000" in cc, f"Expected max-age=2592000, got: {cc}"

    def test_poppins_font_cf_cache_hit(self):
        r = self._check_asset(f"{PROD}/fonts/poppins-400.woff2")
        cf = r.headers.get("cf-cache-status", "")
        print(f"CF-Cache-Status for poppins-400.woff2: {cf}")
        assert cf == "HIT", f"Expected HIT, got: {cf}"

    def test_js_main_cache_control(self):
        """Check first available main.*.js has max-age=2592000"""
        # Get homepage to find js chunk URL
        r = requests.get(f"{PROD}/", timeout=20)
        import re
        chunks = re.findall(r'/static/js/main\.[a-f0-9]+\.js', r.text)
        assert chunks, "Could not find main.*.js URL in homepage HTML"
        js_url = PROD + chunks[0]
        r2 = requests.get(js_url, timeout=20)
        cc = r2.headers.get("cache-control", "")
        print(f"cache-control for {chunks[0]}: {cc}")
        assert "max-age=2592000" in cc, f"Expected max-age=2592000, got: {cc}"

    def test_js_main_cf_cache_hit(self):
        r = requests.get(f"{PROD}/", timeout=20)
        import re
        chunks = re.findall(r'/static/js/main\.[a-f0-9]+\.js', r.text)
        assert chunks, "Could not find main.*.js URL in homepage HTML"
        js_url = PROD + chunks[0]
        r2 = requests.get(js_url, timeout=20)
        cf = r2.headers.get("cf-cache-status", "")
        print(f"CF-Cache-Status for {chunks[0]}: {cf}")
        assert cf == "HIT", f"Expected HIT, got: {cf}"


# ── CR-224: Quick smoke check (already fully tested in iteration_1) ─────────

class TestCR224NginxSmoke:
    """Quick smoke: key routes return 200 without redirect"""

    @pytest.mark.parametrize("path", ["/pricing", "/about", "/blog", "/contact", "/petpooja-alternative"])
    def test_no_redirect(self, path):
        r = requests.get(f"{PROD}{path}", allow_redirects=False, timeout=15)
        assert r.status_code == 200, f"{path} returned {r.status_code}, expected 200"

    def test_about_us_redirects_to_about(self):
        r = requests.get(f"{PROD}/about-us", allow_redirects=False, timeout=15)
        assert r.status_code == 301
        assert "/about" in r.headers.get("location", "")

    def test_blogs_redirects_to_blog(self):
        r = requests.get(f"{PROD}/blogs", allow_redirects=False, timeout=15)
        assert r.status_code == 301
        assert "/blog" in r.headers.get("location", "")


# ── CR-226: API endpoints must return DYNAMIC (not HIT) ───────────────────

class TestCR226APICacheBypass:
    """CF-Cache-Status must be DYNAMIC for API endpoints"""

    @pytest.mark.parametrize("path", ["/api/leads", "/api/otp/send", "/api/cms/content"])
    def test_api_cf_dynamic(self, path):
        r = requests.get(f"{PROD}{path}", timeout=15)
        cf = r.headers.get("cf-cache-status", "")
        print(f"CF-Cache-Status for {path}: {cf}")
        assert cf == "DYNAMIC", f"{path} CF-Cache-Status={cf}, expected DYNAMIC"


# ── CR-227: Preview landing page H1 keyword fixes ─────────────────────────

class TestCR227LandingH1:
    """H1 keyword fixes on preview pages"""

    def _html(self, path):
        r = requests.get(f"{PREVIEW}{path}", timeout=20)
        assert r.status_code == 200, f"{path} returned {r.status_code}"
        return r.text

    def test_pos_system_h1_contains_pos_system(self):
        html = self._html("/restaurant-pos-system")
        assert "POS system" in html or "pos system" in html.lower(), \
            "Expected 'POS system' in /restaurant-pos-system H1"

    def test_pos_system_h1_contains_software(self):
        html = self._html("/restaurant-pos-system")
        assert "software" in html.lower(), "Expected 'software' in /restaurant-pos-system page"

    def test_cloud_kitchen_h1_contains_management_software(self):
        html = self._html("/cloud-kitchen-pos")
        assert "management software" in html.lower(), \
            "Expected 'management software' in /cloud-kitchen-pos H1"

    def test_billing_software_feature_card_cafes_and_bars(self):
        html = self._html("/restaurant-billing-software")
        # & is encoded as &amp; in prerendered HTML
        assert ("Restaurants, cafes" in html and "bars" in html) or \
               ("Restaurants, cafes &amp; bars" in html) or \
               ("Restaurants, cafes and bars" in html), \
            "Expected 'Restaurants, cafes AND bars' in /restaurant-billing-software feature card"


# ── CR-228: Petpooja hero rewrite ─────────────────────────────────────────

class TestCR228PetpoojaHero:
    """Hero H1 and subheadline rewrite on /petpooja-alternative"""

    def _html(self):
        r = requests.get(f"{PREVIEW}/petpooja-alternative", timeout=20)
        assert r.status_code == 200
        return r.text

    def test_h1_no_honest_petpooja(self):
        html = self._html()
        assert "honest Petpooja alternative" not in html, \
            "Old H1 'honest Petpooja alternative' still present"

    def test_h1_contains_restaurant_os(self):
        html = self._html()
        assert "restaurant OS built for what billing software" in html, \
            "New H1 'restaurant OS built for what billing software' not found"

    def test_sub_no_petpooja_runs(self):
        html = self._html()
        assert "Petpooja runs 1.5 lakh" not in html, \
            "Old subheadline 'Petpooja runs 1.5 lakh' still present"

    def test_sub_contains_billing_software_and_os(self):
        html = self._html()
        assert "Billing software and a restaurant operating system are different things" in html, \
            "New subheadline not found"


# ── CR-229: Petpooja page content changes ────────────────────────────────

class TestCR229PetpoojaContent:
    """7 content changes on /petpooja-alternative"""

    def _html(self):
        r = requests.get(f"{PREVIEW}/petpooja-alternative", timeout=20)
        assert r.status_code == 200
        return r.text

    def test_traditional_billing_software_present(self):
        html = self._html()
        assert "Traditional Billing Software" in html, \
            "'Traditional Billing Software' not found"

    def test_petpooja_starting_point_absent(self):
        html = self._html()
        assert "Petpooja&#x27;s starting point" not in html and \
               "Petpooja's starting point" not in html, \
            "'Petpooja's starting point' still present"

    def test_badge_switched_from_petpooja_count(self):
        html = self._html()
        count = html.count("Switched from Petpooja")
        print(f"'Switched from Petpooja' occurrences: {count}")
        assert count == 3, f"Expected 3x 'Switched from Petpooja', got {count}"

    def test_badge_renewed_after_year_one(self):
        html = self._html()
        assert "Renewed After Year One" in html, "'Renewed After Year One' badge not found"

    def test_badge_opened_2nd_outlet(self):
        html = self._html()
        assert "Opened 2nd Outlet on MyGenie" in html, "'Opened 2nd Outlet on MyGenie' badge not found"

    def test_badge_support_that_picks_up(self):
        html = self._html()
        assert "Support That Picks Up" in html, "'Support That Picks Up' badge not found"

    def test_ai_layer_billing_software_skips(self):
        html = self._html()
        assert "AI layer most billing software skips" in html, \
            "'AI layer most billing software skips' not found"

    def test_section_petpooja_absent(self):
        html = self._html()
        assert "section Petpooja doesn" not in html and \
               "section Petpooja doesn&#x27;t have" not in html, \
            "Old 'section Petpooja doesn't have' still present"

    def test_faq_choosing_mygenie(self):
        html = self._html()
        assert "choosing MyGenie" in html, "'choosing MyGenie' not found in FAQ heading"

    def test_faq_switching_from_petpooja_absent(self):
        html = self._html()
        assert "switching from Petpooja" not in html, \
            "'switching from Petpooja' still present in FAQ heading"

    def test_faq_q1_restaurant_opening_first_time(self):
        html = self._html()
        assert "restaurant opening for the first time" in html, \
            "New FAQ Q1 'restaurant opening for the first time' not found"

    def test_faq_q3_pricing_compare(self):
        html = self._html()
        assert "pricing compare to other restaurant POS" in html, \
            "New FAQ Q3 'pricing compare to other restaurant POS' not found"

    def test_getting_started_easier(self):
        html = self._html()
        assert "Getting started is easier than you think" in html, \
            "'Getting started is easier than you think' not found"

    def test_right_fit_present(self):
        html = self._html()
        assert "right fit for your restaurant" in html, \
            "'right fit for your restaurant' not found"

    def test_right_switch_absent(self):
        html = self._html()
        assert "right switch" not in html, "'right switch' still present"


# ── General Regression on Preview ────────────────────────────────────────

class TestGeneralRegressionPreview:
    """Homepage and key pages load correctly on preview"""

    @pytest.mark.parametrize("path", ["/", "/pricing", "/about", "/customers"])
    def test_pages_return_200(self, path):
        r = requests.get(f"{PREVIEW}{path}", timeout=20)
        assert r.status_code == 200, f"{path} returned {r.status_code}"

    def test_homepage_contains_mygenie(self):
        r = requests.get(f"{PREVIEW}/", timeout=20)
        assert "MyGenie" in r.text or "mygenie" in r.text.lower(), \
            "Homepage does not contain MyGenie brand text"

    def test_homepage_contains_html(self):
        r = requests.get(f"{PREVIEW}/", timeout=20)
        assert "<html" in r.text.lower(), "Homepage does not contain HTML"
