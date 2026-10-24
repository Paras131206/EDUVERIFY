"""
Tests for /healthz endpoint and middleware behavior.
"""

import pytest
from app.logging import PIIFilter
from app.main import app
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    return TestClient(app)


def test_healthz_endpoint(client):
    response = client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("ok", "degraded")
    assert data["version"] == "0.1.0"
    assert "engine_version" in data
    assert "db" in data


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("ok", "degraded")
    assert data["version"] == "0.1.0"
    assert "engine_version" in data
    assert "db" in data


def test_request_id_middleware(client):
    custom_id = "test-request-id-12345"
    response = client.get("/healthz", headers={"X-Request-ID": custom_id})
    assert response.status_code == 200
    assert response.headers.get("X-Request-ID") == custom_id
    assert "X-Process-Time" in response.headers


def test_pii_logging_filter():
    pii_filter = PIIFilter()

    # Test APAAR masking
    raw_msg = "Student 123456789012 submitted batch"
    masked = pii_filter._sanitize_text(raw_msg)
    assert "1234****9012" in masked
    assert "123456789012" not in masked

    # Test email masking
    email_msg = "Contact email is student.test@domain.com"
    masked_email = pii_filter._sanitize_text(email_msg)
    assert "@domain.com" in masked_email
    assert "student.test" not in masked_email

    # Test mobile masking
    mobile_msg = "User mobile is 9876543210"
    masked_mobile = pii_filter._sanitize_text(mobile_msg)
    assert "98****3210" in masked_mobile
    assert "9876543210" not in masked_mobile
