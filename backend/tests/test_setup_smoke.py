"""Setup smoke tests - core backend endpoints for MyGenie site (iteration 21)."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://genie-craco-fastapi.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def test_root(client):
    r = client.get(f"{BASE_URL}/api/")
    assert r.status_code == 200
    assert r.json() == {"message": "Hello World"}


def test_status_list(client):
    r = client.get(f"{BASE_URL}/api/status")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_demo_requests_list(client):
    r = client.get(f"{BASE_URL}/api/demo-requests")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_quotes_list(client):
    r = client.get(f"{BASE_URL}/api/quotes")
    assert r.status_code == 200
    assert isinstance(r.json(), list)
