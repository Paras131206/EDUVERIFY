"""
Unit and integration tests for Task C5: Monitoring intelligence.
Tests:
1. Batch profiling (generate_profile).
2. Schema drift (V028, V029, V030): removed column, new category, null rate jump.
3. Anomaly detection (V020): Deequ-style z-score spike on NRI share (z > 3) and IsolationForest.
4. Reconciliation (V022): per-program declared totals vs uploaded counts and reconcile_aggregate().
5. Rollover helper: rollover_preview and V034 for missing continuing students.
6. Full pipeline on data/demo/batch_4_anomaly_drift.csv.
"""

from pathlib import Path

import pandas as pd

from eduverify_engine.drift import detect_schema_drift
from eduverify_engine.models import BatchReport
from eduverify_engine.profile import generate_profile, infer_column_type
from eduverify_engine.reconcile import reconcile_aggregate, reconcile_batch
from eduverify_engine.rollover import check_rollover_missing, rollover_preview
from eduverify_engine.rules.context import RuleContext
from eduverify_engine.validate import validate_batch

REPO_ROOT = Path(__file__).resolve().parent.parent.parent


def test_infer_column_type():
    """Validates semantic column type inference."""
    int_series = pd.Series(["1", "2026", "42", "0"])
    float_series = pd.Series(["1.5", "0.02", "3.1415"])
    bool_series = pd.Series(["True", "False", "true", "false"])
    date_series = pd.Series(["2026-08-10", "2006-03-23", "1999-12-31"])
    str_series = pd.Series(["Computer Science", "Delhi College", "REC-001"])

    assert infer_column_type(int_series) == "integer"
    assert infer_column_type(float_series) == "float"
    assert infer_column_type(bool_series) == "boolean"
    assert infer_column_type(date_series) == "date"
    assert infer_column_type(str_series) == "string"


def test_batch_profile_generation():
    """Validates generation of profile metrics, category sets, and null rates."""
    csv_path = REPO_ROOT / "data" / "demo" / "batch_1_clean.csv"
    df = pd.read_csv(csv_path, dtype=str)
    ctx = RuleContext(repo_root=REPO_ROOT)

    profile = generate_profile(df, ctx)

    assert profile["row_count"] == len(df)
    assert "apaar_id" in profile["columns"]
    assert profile["inferred_types"]["dob"] == "date"
    assert profile["inferred_types"]["pwd"] == "boolean"
    assert "category" in profile["category_sets"]
    assert "GEN" in profile["category_sets"]["category"]

    metrics = profile["metrics"]
    assert metrics["rows_total"] == len(df)
    assert 0.0 <= metrics["null_rate"] <= 1.0
    assert 0.0 <= metrics["nri_share"] <= 1.0
    assert 0.0 <= metrics["supernumerary_share"] <= 1.0
    assert metrics["duplicate_rate"] == 0.0
    assert metrics["missing_id_rate"] == 0.0


def test_drift_and_anomaly_on_batch_4():
    """
    Core verification test for Task C5 requirement 6:
    - drift detects removed column (guardian_consent) and new category (SPORTS_QUOTA)
    - anomaly flags NRI share spike with z > 3
    """
    csv_path = REPO_ROOT / "data" / "demo" / "batch_4_anomaly_drift.csv"
    report = validate_batch(csv_path)

    assert isinstance(report, BatchReport)

    # 1. Schema Drift Checks
    drift_kinds = [d.kind for d in report.schema_drift]
    assert "COLUMN_REMOVED" in drift_kinds
    assert "NEW_CATEGORY" in drift_kinds

    # Verify removed column
    removed_drift = [d for d in report.schema_drift if d.kind == "COLUMN_REMOVED"]
    assert any(d.column == "guardian_consent" for d in removed_drift)
    assert any(i.rule_id == "V028" and i.field == "guardian_consent" for i in report.issues)

    # Verify new category value
    category_drift = [
        d for d in report.schema_drift if d.kind == "NEW_CATEGORY" and d.column == "category"
    ]
    assert len(category_drift) > 0
    assert "SPORTS_QUOTA" in category_drift[0].current
    assert any(i.rule_id == "V029" and i.field == "category" for i in report.issues)

    # 2. Anomaly Checks
    nri_anomalies = [a for a in report.anomalies if a.metric == "nri_share"]
    assert len(nri_anomalies) > 0
    nri_anom = nri_anomalies[0]
    assert nri_anom.method == "zscore"
    assert nri_anom.z > 3.0, f"Expected z > 3.0, got z={nri_anom.z}"
    assert nri_anom.value >= 0.35  # batch 4 has 40% NRI share vs ~4.5% baseline
    assert any(i.rule_id == "V020" and i.field == "nri_share" for i in report.issues)

    # Verify IsolationForest multivariate outlier
    iso_anomalies = [a for a in report.anomalies if a.method == "isolation_forest"]
    assert len(iso_anomalies) > 0


def test_drift_null_rate_jump_v030():
    """Verifies that jump > 3x or +10 percentage points in null rate triggers V030."""
    baseline_profile = {
        "columns": ["apaar_id", "email"],
        "inferred_types": {"apaar_id": "string", "email": "string"},
        "null_rates": {"apaar_id": 0.0, "email": 0.02},
        "category_sets": {},
        "row_count": 100,
        "metrics": {"missing_id_rate": 0.0},
    }

    # Current batch with 25% missing emails (+23 percentage points jump)
    curr_df = pd.DataFrame(
        {
            "apaar_id": [f"9000000000{i:02d}" for i in range(20)],
            "email": ["student@example.com" if i < 15 else "" for i in range(20)],
        }
    )

    ctx = RuleContext(previous_batch_profile=baseline_profile)
    issues, drift_events = detect_schema_drift(curr_df, ctx)

    null_drifts = [d for d in drift_events if d.kind == "NULL_RATE_JUMP" and d.column == "email"]
    assert len(null_drifts) > 0
    assert any(i.rule_id == "V030" and i.field == "email" for i in issues)


def test_reconcile_batch_v022():
    """Verifies intake reconciliation against declared totals and V022 issuance."""
    # Build declared totals DataFrame
    declared_df = pd.DataFrame(
        [
            {
                "institution_aicte_id": "1-100010001",
                "program_code": "UG-CSE",
                "academic_year": "2026-27",
                "declared_enrolment": 100,
                "declared_supernumerary": 5,
                "declared_nri": 3,
                "declared_oci": 0,
                "declared_fn": 0,
            },
            {
                "institution_aicte_id": "1-100010001",
                "program_code": "UG-ECE",
                "academic_year": "2026-27",
                "declared_enrolment": 60,
                "declared_supernumerary": 3,
                "declared_nri": 2,
                "declared_oci": 0,
                "declared_fn": 0,
            },
        ]
    )

    # Upload DataFrame: UG-CSE has 101 (within ±2% tolerance: delta +1 -> MATCH)
    # UG-ECE has 75 (exceeds tolerance: delta +15 -> MISMATCH & V022)
    records = []
    for _ in range(101):
        records.append({"program_code": "UG-CSE", "seat_type": "REGULAR"})
    for _ in range(75):
        records.append({"program_code": "UG-ECE", "seat_type": "REGULAR"})

    upload_df = pd.DataFrame(records)
    ctx = RuleContext(
        declared_totals=declared_df, academic_year="2026-27", institution_aicte_id="1-100010001"
    )

    issues, recon_rows = reconcile_batch(upload_df, ctx)

    assert len(recon_rows) == 2
    cse_row = next(r for r in recon_rows if r.program_code == "UG-CSE")
    ece_row = next(r for r in recon_rows if r.program_code == "UG-ECE")

    assert cse_row.status == "MATCH"
    assert ece_row.status == "MISMATCH"
    assert any(i.rule_id == "V022" and "UG-ECE" in i.message for i in issues)


def test_reconcile_aggregate():
    """Verifies aggregate reconciliation for AGGREGATE_ONLY institutions."""
    declared = [
        {"program_code": "UG-CSE", "declared_enrolment": 120},
        {"program_code": "UG-ME", "declared_enrolment": 60},
    ]
    submission = [
        {"program_code": "UG-CSE", "enrolled": 121},  # Match
        {"program_code": "UG-ME", "enrolled": 80},  # Mismatch
    ]

    issues, rows = reconcile_aggregate(declared, submission)

    assert len(rows) == 2
    assert rows[0].status == "MATCH"
    assert rows[1].status == "MISMATCH"
    assert len(issues) == 1
    assert issues[0].rule_id == "V022"
    assert "UG-ME" in issues[0].message


def test_rollover_preview_advancement():
    """Verifies that rollover_preview increments year_of_study and excludes final-year students."""
    prev_records = pd.DataFrame(
        [
            # Continuing student: year 1 UG -> should roll over to year 2
            {
                "apaar_id": "111111111111",
                "institution_student_id": "STU-001",
                "full_name": "Aarav Sharma",
                "program_code": "UG-CSE",
                "course_level": "UG",
                "academic_year": "2025-26",
                "year_of_study": 1,
                "enrolment_status": "ACTIVE",
            },
            # Final year student: year 4 UG in 4-year degree -> should graduate, NOT roll over
            {
                "apaar_id": "222222222222",
                "institution_student_id": "STU-002",
                "full_name": "Priya Patel",
                "program_code": "UG-CSE",
                "course_level": "UG",
                "academic_year": "2025-26",
                "year_of_study": 4,
                "enrolment_status": "ACTIVE",
            },
            # Inactive student: WITHDRAWN -> should NOT roll over
            {
                "apaar_id": "333333333333",
                "institution_student_id": "STU-003",
                "full_name": "Rohan Gupta",
                "program_code": "UG-CSE",
                "course_level": "UG",
                "academic_year": "2025-26",
                "year_of_study": 2,
                "enrolment_status": "WITHDRAWN",
            },
        ]
    )

    programs = pd.DataFrame([{"program_code": "UG-CSE", "duration_years": 4}])

    preview_df = rollover_preview(prev_records, programs)

    assert len(preview_df) == 1
    rolled_student = preview_df.iloc[0]
    assert rolled_student["institution_student_id"] == "STU-001"
    assert rolled_student["year_of_study"] == 2
    assert rolled_student["academic_year"] == "2026-27"
    assert rolled_student["admission_type"] == "CONTINUING"


def test_rollover_missing_v034():
    """Verifies that continuing active students absent from new batch trigger V034."""
    prev_records = pd.DataFrame(
        [
            {
                "apaar_id": "111111111111",
                "institution_student_id": "STU-001",
                "full_name": "Aarav Sharma",
                "program_code": "UG-CSE",
                "academic_year": "2025-26",
                "year_of_study": 1,
                "enrolment_status": "ACTIVE",
            },
            {
                "apaar_id": "222222222222",
                "institution_student_id": "STU-002",
                "full_name": "Priya Patel",
                "program_code": "UG-CSE",
                "academic_year": "2025-26",
                "year_of_study": 2,
                "enrolment_status": "ACTIVE",
            },
        ]
    )

    # Current batch only contains STU-001 (STU-002 is missing without withdrawal)
    curr_df = pd.DataFrame(
        [
            {
                "apaar_id": "111111111111",
                "institution_student_id": "STU-001",
                "full_name": "Aarav Sharma",
                "academic_year": "2026-27",
                "year_of_study": 2,
            }
        ]
    )

    ctx = RuleContext(academic_year="2026-27", previous_year_records=prev_records)
    issues = check_rollover_missing(curr_df, ctx)

    v034_issues = [i for i in issues if i.rule_id == "V034"]
    assert len(v034_issues) == 1
    assert "Priya Patel" in v034_issues[0].message
    assert v034_issues[0].severity == "WARN"
    assert v034_issues[0].bucket == "HUMAN_REVIEW"
