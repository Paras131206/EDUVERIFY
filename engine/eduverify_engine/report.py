"""
Report export and comparison for EduVerify Engine.
Frozen public API for export_report() and compare_reports().
"""

import io
import json
from typing import Any

import openpyxl
from openpyxl.styles import Font, PatternFill

from .models import BatchReport, DQComparison


def compare_reports(
    before: BatchReport,
    after: BatchReport,
    decisions: list[dict[str, Any]] | None = None,
) -> DQComparison:
    """
    Compares before and after BatchReports to compute quality improvement delta (USP 5).
    """
    err_before = before.rows_error + before.rows_warning
    err_after = after.rows_error + after.rows_warning
    resolved_count = max(0, err_before - err_after)
    pending_count = after.rows_error + after.rows_warning

    # Per-rule issue counts delta
    before_rules: dict[str, int] = {}
    for iss in before.issues:
        before_rules[iss.rule_id] = before_rules.get(iss.rule_id, 0) + 1
    after_rules: dict[str, int] = {}
    for iss in after.issues:
        after_rules[iss.rule_id] = after_rules.get(iss.rule_id, 0) + 1

    per_rule_deltas = {
        rule_id: after_rules.get(rule_id, 0) - before_rules.get(rule_id, 0)
        for rule_id in set(before_rules) | set(after_rules)
    }

    # Per-priority counts delta
    per_priority_deltas = {
        p: after.priority_summary.get(p, 0) - before.priority_summary.get(p, 0)
        for p in ("CRITICAL", "HIGH", "MEDIUM", "LOW")
    }

    comp_before = before.metrics.get("completeness", {})
    comp_after = after.metrics.get("completeness", {})

    return DQComparison(
        rows_scanned=before.rows_total,
        errors_found=before.rows_error,
        duplicates_found=len(before.duplicate_clusters),
        resolved=resolved_count,
        pending=pending_count,
        quality_score_before=before.quality_score,
        quality_score_after=after.quality_score,
        per_rule_deltas=per_rule_deltas,
        per_priority_deltas=per_priority_deltas,
        per_column_completeness_before=comp_before,
        per_column_completeness_after=comp_after,
    )


def export_report(report: BatchReport | DQComparison, fmt: str = "json") -> bytes:
    """
    Exports BatchReport or DQComparison to JSON bytes or formatted Excel XLSX bytes.
    """
    if fmt.lower() == "json":
        return json.dumps(report.model_dump(), indent=2).encode("utf-8")

    if fmt.lower() == "xlsx":
        wb = openpyxl.Workbook()
        ws_summary = wb.active
        ws_summary.title = "Summary"

        header_font = Font(bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")

        if isinstance(report, BatchReport):
            # Summary sheet
            ws_summary.append(["Metric", "Value"])
            summary_rows = [
                ["Batch ID", report.batch_id],
                ["Institution AICTE ID", report.institution_aicte_id],
                ["Quality Score", report.quality_score],
                ["Total Rows", report.rows_total],
                ["Valid Rows", report.rows_valid],
                ["Warning Rows", report.rows_warning],
                ["Error Rows", report.rows_error],
                ["Engine Version", report.engine_version],
                ["Catalog Version", report.rule_catalog_version],
            ]
            for row in summary_rows:
                ws_summary.append(row)

            # Issues sheet
            ws_issues = wb.create_sheet(title="Issues")
            issue_headers = [
                "Row",
                "Rule ID",
                "Field",
                "Severity",
                "Priority",
                "Bucket",
                "Message",
                "Reason",
                "Suggested Fix",
            ]
            ws_issues.append(issue_headers)
            for cell in ws_issues[1]:
                cell.font = header_font
                cell.fill = header_fill

            for iss in report.issues:
                fix_val = iss.suggested_fix.value if iss.suggested_fix else ""
                ws_issues.append(
                    [
                        iss.row or "",
                        iss.rule_id,
                        iss.field,
                        iss.severity,
                        iss.priority,
                        iss.bucket,
                        iss.message,
                        iss.reason,
                        str(fix_val),
                    ]
                )

        output = io.BytesIO()
        wb.save(output)
        return output.getvalue()

    raise ValueError(f"Unsupported export format: {fmt} (supported: 'json', 'xlsx')")
