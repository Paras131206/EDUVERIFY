import json
import re
from io import BytesIO

import openpyxl
import pytest

from eduverify_engine.models import (
    BatchReport,
    ColumnMapping,
    DuplicateCluster,
    DuplicateMember,
    IntakeSummary,
    Issue,
    ReconciliationRow,
    SchemaDrift,
    SuggestedFix,
)
from eduverify_engine.report import compare_reports, export_report


@pytest.fixture
def sample_before_report() -> BatchReport:
    return BatchReport(
        batch_id="test-batch-001",
        institution_aicte_id="1-100010001",
        engine_version="1.0.0",
        rule_catalog_version="1.0.0",
        rows_total=50,
        rows_valid=40,
        rows_warning=5,
        rows_error=5,
        quality_score=78.5,
        column_mapping=[
            ColumnMapping(
                source="PRN",
                target="institution_student_id",
                confidence=1.0,
                method="exact",
            ),
            ColumnMapping(
                source="APAAR No",
                target="apaar_id",
                confidence=0.95,
                method="sniffed",
            ),
        ],
        metrics={"completeness": {"full_name": 0.98, "apaar_id": 0.92, "dob": 1.0}},
        issues=[
            Issue(
                issue_id="ISS-001",
                row=3,
                rule_id="V002",
                field="apaar_id",
                severity="ERROR",
                priority="CRITICAL",
                confidence=1.0,
                bucket="AUTO_FLAG",
                message="APAAR 123456789012 invalid length",
                reason="APAAR 123456789012 must be 12 digits",
                evidence={"apaar": "123456789012"},
                suggested_fix=SuggestedFix(
                    value="123456789012", rationale="Corrected length", requires_approval=True
                ),
            ),
            Issue(
                issue_id="ISS-002",
                row=12,
                rule_id="V025",
                field="expected_graduation_year",
                severity="ERROR",
                priority="HIGH",
                confidence=1.0,
                bucket="AUTO_FLAG",
                message="Graduation year mismatch",
                reason="Expected 2030, got 2028",
                suggested_fix=SuggestedFix(
                    value=2030, rationale="Calculated from admission date", requires_approval=True
                ),
            ),
            Issue(
                issue_id="ISS-003",
                row=15,
                rule_id="V031",
                field="full_name",
                severity="INFO",
                priority="LOW",
                confidence=1.0,
                bucket="INFO",
                message="Name contains irregular spacing",
                reason="Multiple spaces between names",
            ),
        ],
        review_summary={"AUTO_FLAG": 2, "HUMAN_REVIEW": 0, "INFO": 1},
        priority_summary={"CRITICAL": 1, "HIGH": 1, "MEDIUM": 0, "LOW": 1},
        intake_summary=[
            IntakeSummary(
                program_code="UG-CSE",
                approved=120,
                enrolled=125,
                supernumerary=5,
                excess=5,
            )
        ],
        reconciliation=[
            ReconciliationRow(
                program_code="UG-CSE",
                declared=120,
                uploaded=125,
                delta=5,
                status="MISMATCH",
            )
        ],
        duplicate_clusters=[
            DuplicateCluster(
                cluster_id="CLUS-001",
                members=[
                    DuplicateMember(
                        row=4,
                        apaar_masked="9876****4321",
                        institution="1-100010001",
                        student_id="STU004",
                    ),
                    DuplicateMember(
                        row=8,
                        apaar_masked="9876****4321",
                        institution="1-100010001",
                        student_id="STU008",
                    ),
                ],
                score=0.95,
                matched_fields={"name": 0.95, "dob": 1.0},
                scope="INTRA",
                bucket="AUTO_FLAG",
            )
        ],
        schema_drift=[
            SchemaDrift(
                kind="NULL_RATE_JUMP",
                column="guardian_consent",
                previous=0.02,
                current=0.45,
            )
        ],
    )


@pytest.fixture
def sample_after_report() -> BatchReport:
    return BatchReport(
        batch_id="test-batch-001-v2",
        institution_aicte_id="1-100010001",
        engine_version="1.0.0",
        rule_catalog_version="1.0.0",
        rows_total=50,
        rows_valid=48,
        rows_warning=1,
        rows_error=1,
        quality_score=94.2,
        metrics={"completeness": {"full_name": 1.0, "apaar_id": 1.0, "dob": 1.0}},
        issues=[
            Issue(
                issue_id="ISS-003",
                row=15,
                rule_id="V031",
                field="full_name",
                severity="INFO",
                priority="LOW",
                confidence=1.0,
                bucket="INFO",
                message="Name contains irregular spacing",
                reason="Multiple spaces between names",
            )
        ],
        review_summary={"AUTO_FLAG": 0, "HUMAN_REVIEW": 0, "INFO": 1},
        priority_summary={"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 1},
        duplicate_clusters=[],
    )


def test_compare_reports_without_explicit_decisions(sample_before_report, sample_after_report):
    cmp = compare_reports(sample_before_report, sample_after_report)

    assert cmp.rows_scanned == 50
    assert cmp.errors_found == 3
    assert cmp.duplicates_found == 1
    # 4 defects before (3 issues + 1 dup), 1 issue after -> 3 resolved
    assert cmp.resolved == 3
    assert cmp.pending == 1
    assert cmp.quality_score_before == 78.5
    assert cmp.quality_score_after == 94.2
    assert cmp.per_priority_deltas["CRITICAL"] == -1
    assert cmp.per_priority_deltas["HIGH"] == -1
    assert cmp.per_priority_deltas["LOW"] == 0
    assert cmp.per_rule_deltas["V002"] == -1
    assert cmp.per_rule_deltas["V025"] == -1
    assert cmp.per_rule_deltas["V031"] == 0
    assert cmp.per_column_completeness_after["apaar_id"] == 1.0


def test_compare_reports_with_decisions(sample_before_report, sample_after_report):
    decisions = [
        {"action": "ACCEPT_FIX", "rule_id": "V002", "row": 3},
        {"action": "ACCEPT_FIX", "rule_id": "V025", "row": 12},
        {"action": "MERGE_DUPLICATE", "cluster_id": "CLUS-001"},
    ]
    cmp = compare_reports(sample_before_report, sample_after_report, decisions=decisions)
    assert cmp.resolved == 3
    assert cmp.pending == 1


def test_export_report_json(sample_before_report):
    raw_json = export_report(sample_before_report, fmt="json")
    assert isinstance(raw_json, bytes)
    parsed = json.loads(raw_json.decode("utf-8"))
    assert parsed["batch_id"] == "test-batch-001"
    assert parsed["quality_score"] == 78.5
    assert len(parsed["issues"]) == 3


def test_export_report_xlsx_all_sheets_and_masking(sample_before_report):
    raw_xlsx = export_report(sample_before_report, fmt="xlsx")
    assert isinstance(raw_xlsx, bytes)

    wb = openpyxl.load_workbook(BytesIO(raw_xlsx))
    expected_sheets = [
        "Summary",
        "Issues",
        "Duplicates",
        "Intake",
        "Reconciliation",
        "Drift & Anomalies",
        "Column mapping",
    ]
    assert wb.sheetnames == expected_sheets

    # Verify Summary sheet content
    ws_summary = wb["Summary"]
    assert ws_summary.cell(row=1, column=1).value == "EduVerify Data Quality Assessment Summary"

    # Verify Issues sheet and sorting
    ws_issues = wb["Issues"]
    headers = [cell.value for cell in ws_issues[1]]
    assert headers == [
        "Row",
        "Priority",
        "Severity",
        "Rule ID",
        "Field",
        "Bucket",
        "Message",
        "Reason",
        "Evidence",
        "Suggested Fix",
        "Decision",
    ]
    # Row 2 should be CRITICAL, Row 3 HIGH, Row 4 LOW
    assert ws_issues.cell(row=2, column=2).value == "CRITICAL"
    assert ws_issues.cell(row=3, column=2).value == "HIGH"
    assert ws_issues.cell(row=4, column=2).value == "LOW"

    # CRITICAL check: Masked APAAR only! No raw 12-digit APAAR anywhere in the workbook
    raw_12digit_re = re.compile(r"(?<!\d)\d{12}(?!\d)")
    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        for row in ws.iter_rows(values_only=True):
            for cell_val in row:
                if cell_val is not None:
                    cell_str = str(cell_val)
                    matches = raw_12digit_re.findall(cell_str)
                    assert len(matches) == 0, (
                        f"Unmasked 12-digit APAAR {matches} found in sheet '{sheet_name}', cell text: '{cell_str}'"
                    )


def test_export_dq_comparison_xlsx(sample_before_report, sample_after_report):
    cmp = compare_reports(sample_before_report, sample_after_report)
    raw_xlsx = export_report(cmp, fmt="xlsx")
    assert isinstance(raw_xlsx, bytes)

    wb = openpyxl.load_workbook(BytesIO(raw_xlsx))
    assert "Summary" in wb.sheetnames
    ws_summary = wb["Summary"]
    assert "Comparison" in str(ws_summary.cell(row=1, column=1).value)
