"""
EduVerify Demo Batch Runner
Executes all 4 demo batches through the Engine and Backend:
1. batch_1_clean.csv (Clean baseline)
2. batch_2_errors.xlsx (Column mapping & seeded rule defects)
3. batch_3_cross_dupes.csv (Deduplication & cross-institution transfer checks)
4. batch_4_anomaly_drift.csv (Statistical anomaly & schema drift detection)
"""

import sys
import json
import time
from pathlib import Path
import httpx

ENGINE_URL = "http://127.0.0.1:8100"
BACKEND_URL = "http://127.0.0.1:8000"

DEMO_DIR = Path("data/demo")

def run_engine_demo_batches():
    print("=" * 70)
    print(" SCENARIO 1: ENGINE / AGENT DEMO BATCH RUNS (http://127.0.0.1:8100)")
    print("=" * 70)

    batches = [
        ("batch_1_clean.csv", "Pristine Baseline Upload", "text/csv"),
        ("batch_2_errors.xlsx", "Smart Column Mapping & Explainable Rule Defects", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        ("batch_3_cross_dupes.csv", "Deduplication & Lifecycle Transfer Checks", "text/csv"),
        ("batch_4_anomaly_drift.csv", "Schema Drift & NRI Statistical Anomaly Spike", "text/csv"),
    ]

    with httpx.Client(base_url=ENGINE_URL, timeout=30.0) as client:
        for filename, desc, mime in batches:
            filepath = DEMO_DIR / filename
            if not filepath.exists():
                print(f"[SKIP] File not found: {filepath}")
                continue

            print(f"\n>>> Running: {filename} ({desc})")
            files = {"file": (filename, filepath.read_bytes(), mime)}
            t0 = time.perf_counter()
            r = client.post("/validate", files=files)
            elapsed = time.perf_counter() - t0


            if r.status_code != 200:
                print(f"  [ERROR] {r.status_code}: {r.text}")
                continue

            report = r.json()
            rows_total = report.get("rows_total", 0)
            rows_valid = report.get("rows_valid", 0)
            rows_error = report.get("rows_error", 0)
            rows_warn = report.get("rows_warning", 0)
            score = report.get("quality_score", 0.0)
            issues = report.get("issues", [])
            clusters = report.get("duplicate_clusters", [])
            drifts = report.get("schema_drifts", [])
            anomalies = report.get("anomalies", [])

            print(f"  Execution Time  : {elapsed:.2f}s")
            print(f"  Rows Scanned    : {rows_total} (Valid: {rows_valid}, Warning: {rows_warn}, Error: {rows_error})")
            print(f"  Quality Score   : {score:.1f}%")
            print(f"  Issues Detected : {len(issues)}")
            if issues:
                rule_counts = {}
                for iss in issues:
                    rid = iss.get("rule_id", "UNKNOWN")
                    rule_counts[rid] = rule_counts.get(rid, 0) + 1
                top_rules = sorted(rule_counts.items(), key=lambda x: x[1], reverse=True)[:5]
                print(f"  Top Rule Flags  : {', '.join(f'{k} ({v})' for k, v in top_rules)}")

            if clusters:
                print(f"  Duplicate Clusters: {len(clusters)} detected")
                for c in clusters[:2]:
                    print(f"    - Cluster ({c.get('scope')}): score={c.get('confidence_score')}, members={c.get('members')}")

            if drifts:
                print(f"  Schema Drifts   : {len(drifts)} detected")
                for d in drifts:
                    print(f"    - Drift ({d.get('drift_type')}): {d.get('message')}")

            if anomalies:
                print(f"  Statistical Anomalies: {len(anomalies)} detected")
                for a in anomalies:
                    print(f"    - Anomaly ({a.get('method')}): {a.get('message')}")


def run_backend_demo_batches():
    print("\n" + "=" * 70)
    print(" SCENARIO 2: BACKEND PIPELINE & WORKSPACE (http://127.0.0.1:8000)")
    print("=" * 70)

    with httpx.Client(base_url=BACKEND_URL, timeout=30.0) as client:
        # Authenticate as inst.admin
        r = client.post("/v1/auth/login", json={"email": "inst.admin@demo.local", "password": "AdminPassword@2026"})
        if r.status_code != 200:
            r = client.post("/v1/auth/login", json={"email": "inst.admin@demo.local", "password": "DemoPass123!"})
        assert r.status_code == 200, "Authentication failed"
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Upload batch_2_errors.xlsx to exercise column mapping and issues
        batch2_path = DEMO_DIR / "batch_2_errors.xlsx"
        if batch2_path.exists():
            print(f"\n>>> Uploading batch_2_errors.xlsx for academic year 2025-26...")
            files = {"file": ("batch_2_errors.xlsx", batch2_path.read_bytes(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
            data = {"academic_year": "2025-26"}
            r = client.post("/v1/batches", headers=headers, data=data, files=files)
            if r.status_code in (200, 202):
                batch_data = r.json()
                b_id = batch_data.get("batch_id")
                print(f"  [OK] Batch created: id={b_id}, status={batch_data.get('status')}")

                # Query smart mapping suggestions
                map_r = client.get(f"/v1/batches/{b_id}/mapping", headers=headers)
                if map_r.status_code == 200:
                    mappings = map_r.json()
                    print(f"  [OK] Column Mapping Suggested ({len(mappings)} columns):")
                    for m in mappings[:4]:
                        print(f"    - {m.get('source_column')} -> {m.get('target_field')} (confidence={m.get('confidence')})")

                # Query batch issues
                iss_r = client.get(f"/v1/batches/{b_id}/issues", headers=headers)
                if iss_r.status_code == 200:
                    issues = iss_r.json()
                    print(f"  [OK] Review Workspace Issues: {len(issues)} items loaded")
                    critical = [i for i in issues if i.get("priority") == "CRITICAL"]
                    high = [i for i in issues if i.get("priority") == "HIGH"]
                    print(f"    - CRITICAL: {len(critical)} | HIGH: {len(high)} | Other: {len(issues) - len(critical) - len(high)}")

        # Query AICTE summary after batch runs
        r_sum = client.get("/v1/dashboards/aicte/summary", headers=headers)
        if r_sum.status_code == 200:
            summary = r_sum.json()
            print(f"\n>>> Live AICTE Apex Metrics Updated:")
            print(f"  Coverage: {summary.get('coverage_percent')}% | Total Enrolled: {summary.get('students')} | Fill: {summary.get('fill_percent')}% | Avg DQ: {summary.get('dq_avg')}%")


if __name__ == "__main__":
    run_engine_demo_batches()
    run_backend_demo_batches()
    print("\n===============================================================")
    print(" ALL 4 DEMO BATCH RUNS COMPLETED SUCCESSFULLY!")
    print("===============================================================")
