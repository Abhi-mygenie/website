"""Regression tests for the Freshsales CRM client.

These tests assert the CRITICAL safety guarantee: the CRM layer must never raise
or block lead capture. Network calls are not made here.
"""
import asyncio

import freshsales


def test_split_name_variants():
    assert freshsales._split_name("Rahul Sharma") == ("Rahul", "Sharma")
    assert freshsales._split_name("Madonna") == ("Madonna", "")
    assert freshsales._split_name("  Ana Maria De Souza ") == ("Ana", "Maria De Souza")
    assert freshsales._split_name("") == ("Lead", "")
    assert freshsales._split_name(None) == ("Lead", "")


def test_upsert_returns_none_when_disabled(monkeypatch):
    monkeypatch.setattr(freshsales, "BASE_URL", None)
    monkeypatch.setattr(freshsales, "API_KEY", None)
    result = asyncio.run(
        freshsales.upsert_contact(name="Test User", email="t@example.com", phone="+910000000000")
    )
    assert result is None


def test_lookup_returns_none_for_empty_email():
    assert asyncio.run(freshsales.lookup_contact_by_email(None)) is None
    assert asyncio.run(freshsales.lookup_contact_by_email("")) is None
