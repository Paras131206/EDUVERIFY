"""
Tests for security headers middleware in dev and production environments.
Complies with prompt B1 (HSTS, nosniff, frame-ancestors none, Referrer-Policy).
"""

from fastapi.testclient import TestClient


def test_security_headers_dev(client: TestClient):
    """Verifies security headers in development mode (no HSTS)."""
    resp = client.get("/healthz")
    assert resp.status_code == 200

    headers = resp.headers
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("Content-Security-Policy") == "frame-ancestors 'none';"
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "Strict-Transport-Security" not in headers


def test_hsts_header_in_production(client: TestClient, monkeypatch):
    """Verifies HSTS header is injected when ENV is production."""
    monkeypatch.setattr("app.middleware.settings.ENV", "production")

    resp = client.get("/healthz")
    assert resp.status_code == 200

    headers = resp.headers
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("Content-Security-Policy") == "frame-ancestors 'none';"
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "Strict-Transport-Security" in headers
    assert "max-age=31536000" in headers["Strict-Transport-Security"]
    assert "includeSubDomains" in headers["Strict-Transport-Security"]
