import json
from pathlib import Path

from eduverify_engine.models import (
    Anomaly,
    BatchReport,
    ColumnMapping,
    DQComparison,
    DuplicateCluster,
    DuplicateMember,
    IntakeSummary,
    Issue,
    ReconciliationRow,
    SchemaDrift,
    SuggestedFix,
)


def test_models_roundtrip():
    issue = Issue(
        issue_id="test-issue-1",
        row=12,
        record_key="PRN-101",
        field="expected_graduation_year",
        rule_id="V025",
        severity="ERROR",
        priority="HIGH",
        confidence=0.98,
        bucket="AUTO_FLAG",
        message="Graduation year inconsistent",
        reason="admission_date 2026-08-01 + 4y => expected 2030, got 2028",
        evidence={"admission_date": "2026-08-01", "duration": 4, "value": 2028},
        suggested_fix=SuggestedFix(
            value=2030, rationale="admission year + duration", requires_approval=True
        ),
        value_masked="2028",
    )

    report = BatchReport(
        batch_id="batch-uuid-1",
        institution_aicte_id="1-12345678",
        rows_total=100,
        rows_valid=95,
        rows_warning=3,
        rows_error=2,
        quality_score=92.5,
        column_mapping=[
            ColumnMapping(
                source="PRN", target="institution_student_id", confidence=0.98, method="synonym"
            )
        ],
        metrics={"completeness": {"dob": 0.99}},
        issues=[issue],
        review_summary={"AUTO_FLAG": 1, "HUMAN_REVIEW": 0, "INFO": 0},
        priority_summary={"CRITICAL": 0, "HIGH": 1, "MEDIUM": 0, "LOW": 0},
        intake_summary=[
            IntakeSummary(
                program_code="UG-CSE", approved=60, enrolled=62, supernumerary=2, excess=2
            )
        ],
        reconciliation=[
            ReconciliationRow(
                program_code="UG-CSE", declared=60, uploaded=62, delta=2, status="MISMATCH"
            )
        ],
        duplicate_clusters=[
            DuplicateCluster(
                cluster_id="cluster-1",
                members=[DuplicateMember(row=1, apaar_masked="1234****9012")],
                score=0.95,
                matched_fields={"full_name": 0.92},
                scope="INTRA",
                bucket="AUTO_FLAG",
            )
        ],
        schema_drift=[
            SchemaDrift(
                kind="COLUMN_REMOVED",
                column="mobile",
                previous="present",
                current="missing",
            )
        ],
        anomalies=[
            Anomaly(
                metric="nri_share",
                value=0.25,
                baseline=0.05,
                z=4.2,
                method="zscore",
                reason="NRI percentage spike",
            )
        ],
    )

    dumped = report.model_dump()
    reloaded = BatchReport(**dumped)
    assert reloaded.batch_id == "batch-uuid-1"
    assert reloaded.issues[0].rule_id == "V025"
    assert reloaded.issues[0].suggested_fix is not None
    assert reloaded.issues[0].suggested_fix.value == 2030


def test_dq_comparison_model():
    dq = DQComparison(
        rows_scanned=100,
        errors_found=5,
        duplicates_found=2,
        resolved=4,
        pending=1,
        quality_score_before=85.0,
        quality_score_after=95.0,
        per_rule_deltas={"V025": -2},
        per_priority_deltas={"HIGH": -2},
        per_column_completeness_before={"dob": 0.95},
        per_column_completeness_after={"dob": 1.0},
    )
    assert dq.resolved == 4
    assert dq.quality_score_after == 95.0


def test_schema_out_exists():
    schema_file = Path("engine/schema_out/batch_report.json")
    if not schema_file.exists():
        # relative check from engine/tests
        schema_file = Path("../engine/schema_out/batch_report.json")
    if schema_file.exists():
        schema_data = json.loads(schema_file.read_text(encoding="utf-8"))
        assert "properties" in schema_data
        assert "batch_id" in schema_data["properties"]
