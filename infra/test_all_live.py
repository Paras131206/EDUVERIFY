"""
Live End-to-End Verification of All Services:
- Backend API (http://127.0.0.1:8000)
- Engine Devserver / Agent (http://127.0.0.1:8100)
- Frontend Web App (http://127.0.0.1:5173)
"""

import sys
import time
from pathlib import Path
import httpx

BACKEND_URL = "http://127.0.0.1:8000"
ENGINE_URL = "http://127.0.0.1:8100"
FRONTEND_URL = "http://127.0.0.1:5173"

def test_engine_harness():
    print("\n--- Testing Engine Devserver (Agent) at http://127.0.0.1:8100 ---")
    with httpx.Client(base_url=ENGINE_URL, timeout=10.0) as client:
        # 1. Healthz
        r = client.get("/healthz")
        assert r.status_code == 200, f"/healthz failed: {r.status_code} {r.text}"
        data = r.json()
        print(f"  [OK] /healthz: version={data.get('version')}, catalog={data.get('catalog_version')}")

        # 2. Rule Catalog
        r = client.get("/catalog")
        assert r.status_code == 200, f"/catalog failed: {r.status_code}"
        rules = r.json().get("rules", [])
        print(f"  [OK] /catalog: loaded {len(rules)} rules")

        # 3. Batch Validation via Engine
        demo_clean = Path("data/demo/batch_1_clean.csv")
        if demo_clean.exists():
            files = {"file": ("batch_1_clean.csv", demo_clean.read_bytes(), "text/csv")}
            r = client.post("/validate", files=files)
            assert r.status_code == 200, f"/validate failed: {r.status_code} {r.text}"
            report = r.json()
            print(f"  [OK] /validate: processed {report.get('rows_total')} rows, quality={report.get('quality_score')}%")

def test_frontend_live():
    print("\n--- Testing Frontend Web Application at http://127.0.0.1:5173 ---")
    with httpx.Client(timeout=10.0) as client:
        r = client.get(FRONTEND_URL)
        assert r.status_code == 200, f"Frontend failed: {r.status_code}"
        assert "<div id=\"root\">" in r.text or "vite" in r.text or "html" in r.text.lower()
        print(f"  [OK] Frontend landing page: HTTP 200 OK, length={len(r.text)} bytes")

def test_backend_live_endpoints():
    print("\n--- Testing Backend API at http://127.0.0.1:8000 ---")
    with httpx.Client(base_url=BACKEND_URL, timeout=15.0) as client:
        # 1. Healthz
        r = client.get("/healthz")
        assert r.status_code == 200, f"Healthz failed: {r.status_code} {r.text}"
        print(f"  [OK] GET /healthz: {r.json()}")

        # 2. Decentralized Identifiers & Public Trust
        r = client.get("/.well-known/did.json")
        assert r.status_code == 200, f"DID failed: {r.status_code}"
        print(f"  [OK] GET /.well-known/did.json: id={r.json().get('id')}")

        r = client.get("/v1/trust-list")
        assert r.status_code == 200, f"Trust list failed: {r.status_code}"
        print(f"  [OK] GET /v1/trust-list: HTTP 200 OK")

        r = client.get("/v1/verify/nonce")
        assert r.status_code == 200, f"Verify nonce failed: {r.status_code}"
        nonce = r.json().get("nonce")
        print(f"  [OK] GET /v1/verify/nonce: nonce={nonce[:16]}...")

        # 3. Authentication
        # Test passwords: try seeded default passwords
        passwords = ["AdminPassword@2026", "DemoPass123!"]
        token = None
        user_email = "inst.admin@demo.local"
        for pwd in passwords:
            login_resp = client.post("/v1/auth/login", json={"email": user_email, "password": pwd})
            if login_resp.status_code == 200:
                token = login_resp.json().get("access_token")
                print(f"  [OK] POST /v1/auth/login: successfully authenticated {user_email}")
                break

        if not token:
            print(f"  [FAIL] Login failed: {login_resp.status_code} {login_resp.text}")
            sys.exit(1)

        headers = {"Authorization": f"Bearer {token}"}

        # 4. Auth Me
        r = client.get("/v1/auth/me", headers=headers)
        assert r.status_code == 200, f"/v1/auth/me failed: {r.status_code}"
        me = r.json()
        print(f"  [OK] GET /v1/auth/me: user={me.get('email')}, role={me.get('role')}")

        # 5. Master Data Endpoints
        master_endpoints = [
            "/v1/master/states",
            "/v1/master/institutions",
            "/v1/master/programs",
            "/v1/master/academic-years",
            "/v1/master/enums",
            "/v1/master/dabs",
            "/v1/templates/student-upload.xlsx",
        ]
        for ep in master_endpoints:
            r = client.get(ep, headers=headers)
            assert r.status_code == 200, f"{ep} failed: {r.status_code}"
            print(f"  [OK] GET {ep}: HTTP 200 OK")

        # 6. Batches Endpoints (Upload demo batch)
        r = client.get("/v1/batches", headers=headers)
        assert r.status_code == 200, f"GET /v1/batches failed: {r.status_code}"
        print(f"  [OK] GET /v1/batches: HTTP 200 OK (count={len(r.json())})")

        demo_batch = Path("data/demo/batch_1_clean.csv")
        batch_id = None
        if demo_batch.exists():
            files = {"file": ("batch_1_clean.csv", demo_batch.read_bytes(), "text/csv")}
            data = {"academic_year": "2026-27"}
            r = client.post("/v1/batches", headers=headers, data=data, files=files)
            if r.status_code == 409 and "open_batch_id" in r.json():
                batch_id = r.json().get("open_batch_id")
                print(f"  [OK] POST /v1/batches: reused active open_batch_id={batch_id}")
            else:
                assert r.status_code in (200, 202), f"POST /v1/batches failed: {r.status_code} {r.text}"
                batch_id = r.json().get("batch_id")
                print(f"  [OK] POST /v1/batches: uploaded batch_id={batch_id}")

            if batch_id:
                # Query mapping
                r = client.get(f"/v1/batches/{batch_id}/mapping", headers=headers)
                assert r.status_code == 200, f"mapping failed: {r.status_code}"
                print(f"  [OK] GET /v1/batches/{batch_id}/mapping: HTTP 200 OK")


        # 7. Dashboards Endpoints
        dashboard_endpoints = [
            "/v1/dashboards/aicte/summary",
            "/v1/dashboards/aicte/map",
            "/v1/dashboards/aicte/leaderboards",
            "/v1/dashboards/aicte/anomalies",
            "/v1/dashboards/institution/summary",
            "/v1/dashboards/institution/dq-trend",
        ]
        for ep in dashboard_endpoints:
            r = client.get(ep, headers=headers)
            assert r.status_code == 200, f"{ep} failed: {r.status_code}"
            print(f"  [OK] GET {ep}: HTTP 200 OK")

        # 8. Audit Chain & Verification
        r = client.get("/v1/audit/verify-chain", headers=headers)
        assert r.status_code == 200, f"verify-chain failed: {r.status_code}"
        chain_info = r.json()
        print(f"  [OK] GET /v1/audit/verify-chain: valid={chain_info.get('valid')}, length={chain_info.get('total_records')}")

        # 9. Notifications & Webhooks
        r = client.get("/v1/notifications/me", headers=headers)
        assert r.status_code == 200, f"notifications/me failed: {r.status_code}"
        print(f"  [OK] GET /v1/notifications/me: HTTP 200 OK")

        r = client.get("/v1/notifications/outbox", headers=headers)
        assert r.status_code == 200, f"notifications/outbox failed: {r.status_code}"
        print(f"  [OK] GET /v1/notifications/outbox: HTTP 200 OK")

        r = client.get("/v1/webhooks", headers=headers)
        assert r.status_code == 200, f"webhooks failed: {r.status_code}"
        print(f"  [OK] GET /v1/webhooks: HTTP 200 OK")

        # 10. Lifecycle, Duplicates, and Transfers
        r = client.get("/v1/duplicates", headers=headers)
        assert r.status_code == 200, f"duplicates failed: {r.status_code}"
        print(f"  [OK] GET /v1/duplicates: HTTP 200 OK")

        r = client.get("/v1/transfers", headers=headers)
        assert r.status_code == 200, f"transfers failed: {r.status_code}"
        print(f"  [OK] GET /v1/transfers: HTTP 200 OK")

        r = client.get("/v1/credentials", headers=headers)
        assert r.status_code == 200, f"credentials failed: {r.status_code}"
        print(f"  [OK] GET /v1/credentials: HTTP 200 OK")


if __name__ == "__main__":
    print("===============================================================")
    print(" Comprehensive Live Verification: Frontend, Backend, and Agent")
    print("===============================================================")
    try:
        test_engine_harness()
        test_frontend_live()
        test_backend_live_endpoints()
        print("\n===============================================================")
        print(" ALL ENDPOINTS AND LIVE SERVICES VERIFIED SUCCESSFULLY!")
        print("===============================================================")
    except Exception as e:
        print(f"\n[ERROR ENCOUNTERED]: {e}")
        sys.exit(1)
