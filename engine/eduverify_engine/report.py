"""
Report export and comparison for EduVerify Engine.
Frozen public API for export_report() and compare_reports().
Complies with USP 5 and Team C specifications.
"""

from __future__ import annotations

import io
import json
import re
from typing import Any

import openpyxl
from openpyxl.formatting.rule import CellIsRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

from .masking import mask_apaar
from .models import BatchReport, DQComparison

_APAAR_RE = re.compile(r"\b\d{12}\b")


def _mask_text_apaars(text: str | None) -> str:
    """Masks any 12-digit APAAR numbers within freeform text."""
    if not text:
        return ""
    return _APAAR_RE.sub(lambda m: mask_apaar(m.group(0)), str(text))


def _mask_evidence_dict(evidence: dict[str, Any]) -> dict[str, Any]:
    """Recursively masks APAAR numbers in evidence dictionary."""
    masked: dict[str, Any] = {}
    for k, v in evidence.items():
        if isinstance(v, str):
            if len(v) == 12 and v.isdigit():
                masked[k] = mask_apaar(v)
            elif "apaar" in k.lower():
                masked[k] = mask_apaar(v)
            else:
                masked[k] = _mask_text_apaars(v)
        elif isinstance(v, dict):
            masked[k] = _mask_evidence_dict(v)
        elif isinstance(v, list):
            masked[k] = [
                mask_apaar(item)
                if isinstance(item, str) and len(item) == 12 and item.isdigit()
                else item
                for item in v
            ]
        else:
            masked[k] = v
    return masked


def compare_reports(
    before: BatchReport,
    after: BatchReport,
    decisions: list[dict[str, Any]] | None = None,
) -> DQComparison:
    """
    Compares before and after BatchReports to compute quality improvement delta (USP 5).

    Returns DQComparison with:
    - rows_scanned: total rows scanned
    - errors_found: errors found in before batch
    - duplicates_found: duplicate clusters in before batch
    - resolved: issues resolved via accepted fix, dismissal, or duplicate merge
    - pending: remaining issues awaiting review in after batch
    - quality_score_before / after
    - per_rule_deltas and per_priority_deltas
    - per_column_completeness_before / after
    """
    defects_before = len(before.issues) + len(before.duplicate_clusters)
    defects_after = len(after.issues) + len(after.duplicate_clusters)

    # 1. Calculate resolved count
    if decisions:
        resolved_count = 0
        for d in decisions:
            action = str(
                d.get("decision") or d.get("action") or d.get("status") or d.get("resolution") or ""
            ).upper()
            if any(
                term in action
                for term in (
                    "ACCEPT",
                    "DISMISS",
                    "MERGE",
                    "RESOLV",
                    "SAME_PERSON",
                    "TRANSFER",
                    "EDIT",
                    "OVERRIDE",
                )
            ):
                resolved_count += 1
    else:
        resolved_count = max(0, defects_before - defects_after)

    # 2. Calculate pending count
    if decisions:
        if defects_after < defects_before:
            pending_count = defects_after
        else:
            pending_count = max(0, defects_before - resolved_count)
    else:
        pending_count = defects_after

    # 3. Per-rule issue counts delta (after - before)
    before_rules: dict[str, int] = {}
    for iss in before.issues:
        before_rules[iss.rule_id] = before_rules.get(iss.rule_id, 0) + 1
    after_rules: dict[str, int] = {}
    for iss in after.issues:
        after_rules[iss.rule_id] = after_rules.get(iss.rule_id, 0) + 1

    per_rule_deltas = {
        rule_id: after_rules.get(rule_id, 0) - before_rules.get(rule_id, 0)
        for rule_id in sorted(set(before_rules) | set(after_rules))
    }

    # 4. Per-priority counts delta (after - before)
    per_priority_deltas = {
        p: after.priority_summary.get(p, 0) - before.priority_summary.get(p, 0)
        for p in ("CRITICAL", "HIGH", "MEDIUM", "LOW")
    }

    # 5. Completeness deltas
    comp_before = before.metrics.get("completeness", {})
    comp_after = after.metrics.get("completeness", {})

    return DQComparison(
        rows_scanned=before.rows_total,
        errors_found=len(before.issues) if before.issues else before.rows_error,
        duplicates_found=len(before.duplicate_clusters),
        resolved=resolved_count,
        pending=pending_count,
        quality_score_before=round(before.quality_score, 2),
        quality_score_after=round(after.quality_score, 2),
        per_rule_deltas=per_rule_deltas,
        per_priority_deltas=per_priority_deltas,
        per_column_completeness_before=comp_before,
        per_column_completeness_after=comp_after,
    )


def export_report(report: BatchReport | DQComparison, fmt: str = "json") -> bytes:
    """
    Exports BatchReport or DQComparison to JSON bytes or formatted Excel XLSX bytes.
    Sheets:
    1. Summary
    2. Issues (sorted by priority, with reason/evidence/suggested fix/decision)
    3. Duplicates
    4. Intake
    5. Reconciliation
    6. Drift & Anomalies
    7. Column mapping
    Conditional formatting by priority. Masked APAAR only.
    """
    if fmt.lower() == "json":
        return json.dumps(report.model_dump(), indent=2, default=str).encode("utf-8")

    if fmt.lower() != "xlsx":
        raise ValueError(f"Unsupported export format: {fmt} (supported: 'json', 'xlsx')")

    wb = openpyxl.Workbook()

    # Styling palettes
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
    section_font = Font(name="Calibri", size=11, bold=True, color="1F4E79")
    section_fill = PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid")
    bold_font = Font(name="Calibri", size=10, bold=True)
    regular_font = Font(name="Calibri", size=10)

    thin_border = Border(
        left=Side(style="thin", color="D3D3D3"),
        right=Side(style="thin", color="D3D3D3"),
        top=Side(style="thin", color="D3D3D3"),
        bottom=Side(style="thin", color="D3D3D3"),
    )

    priority_fills = {
        "CRITICAL": PatternFill(start_color="FFC7CE", end_color="FFC7CE", fill_type="solid"),
        "HIGH": PatternFill(start_color="FFEB9C", end_color="FFEB9C", fill_type="solid"),
        "MEDIUM": PatternFill(start_color="FFF2CC", end_color="FFF2CC", fill_type="solid"),
        "LOW": PatternFill(start_color="E2EFDA", end_color="E2EFDA", fill_type="solid"),
    }
    priority_fonts = {
        "CRITICAL": Font(name="Calibri", size=10, bold=True, color="9C0006"),
        "HIGH": Font(name="Calibri", size=10, bold=True, color="9C6500"),
        "MEDIUM": Font(name="Calibri", size=10, bold=True, color="7F6000"),
        "LOW": Font(name="Calibri", size=10, bold=True, color="385723"),
    }

    # -------------------------------------------------------------
    # Sheet 1: Summary
    # -------------------------------------------------------------
    ws_summary = wb.active
    assert ws_summary is not None
    ws_summary.title = "Summary"

    if isinstance(report, BatchReport):
        ws_summary.append(["EduVerify Data Quality Assessment Summary"])
        ws_summary.cell(row=1, column=1).font = Font(
            name="Calibri", size=14, bold=True, color="1F4E79"
        )
        ws_summary.append([])

        ws_summary.append(["Batch Overview Metric", "Value"])
        header_row = ws_summary.max_row
        for col_idx in (1, 2):
            cell = ws_summary.cell(row=header_row, column=col_idx)
            cell.font = header_font
            cell.fill = header_fill

        summary_rows = [
            ["Batch ID", report.batch_id],
            ["Institution AICTE ID", report.institution_aicte_id],
            ["Quality Score", f"{report.quality_score:.2f}%"],
            ["Total Rows Scanned", report.rows_total],
            ["Valid Rows (Clean)", report.rows_valid],
            ["Warning Rows", report.rows_warning],
            ["Error Rows", report.rows_error],
            ["Engine Version", report.engine_version],
            ["Rule Catalog Version", report.rule_catalog_version],
        ]
        for row in summary_rows:
            ws_summary.append(row)
            for col_idx in (1, 2):
                c = ws_summary.cell(row=ws_summary.max_row, column=col_idx)
                c.font = regular_font
                c.border = thin_border

        ws_summary.append([])
        ws_summary.append(["Review Routing Summary", "Count"])
        r_row = ws_summary.max_row
        for col_idx in (1, 2):
            c = ws_summary.cell(row=r_row, column=col_idx)
            c.font = section_font
            c.fill = section_fill

        for bucket in ("AUTO_FLAG", "HUMAN_REVIEW", "INFO"):
            ws_summary.append([bucket, report.review_summary.get(bucket, 0)])
            for col_idx in (1, 2):
                c = ws_summary.cell(row=ws_summary.max_row, column=col_idx)
                c.font = regular_font
                c.border = thin_border

        ws_summary.append([])
        ws_summary.append(["Defect Priority Breakdown", "Count"])
        p_row = ws_summary.max_row
        for col_idx in (1, 2):
            c = ws_summary.cell(row=p_row, column=col_idx)
            c.font = section_font
            c.fill = section_fill

        for prio in ("CRITICAL", "HIGH", "MEDIUM", "LOW"):
            ws_summary.append([prio, report.priority_summary.get(prio, 0)])
            cur_r = ws_summary.max_row
            ws_summary.cell(row=cur_r, column=1).font = priority_fonts.get(prio, regular_font)
            ws_summary.cell(row=cur_r, column=1).fill = priority_fills.get(prio, PatternFill())
            ws_summary.cell(row=cur_r, column=1).border = thin_border
            c2 = ws_summary.cell(row=cur_r, column=2)
            c2.font = regular_font
            c2.border = thin_border

        comp = report.metrics.get("completeness", {})
        if comp:
            ws_summary.append([])
            ws_summary.append(["Column Completeness Metric", "Completeness Ratio"])
            c_row = ws_summary.max_row
            for col_idx in (1, 2):
                c = ws_summary.cell(row=c_row, column=col_idx)
                c.font = section_font
                c.fill = section_fill
            for col_name, ratio in comp.items():
                ws_summary.append([col_name, f"{float(ratio) * 100:.1f}%"])
                for col_idx in (1, 2):
                    c = ws_summary.cell(row=ws_summary.max_row, column=col_idx)
                    c.font = regular_font
                    c.border = thin_border

    elif isinstance(report, DQComparison):
        ws_summary.append(["EduVerify Data Quality Comparison (Before vs After)"])
        ws_summary.cell(row=1, column=1).font = Font(
            name="Calibri", size=14, bold=True, color="1F4E79"
        )
        ws_summary.append([])

        ws_summary.append(["Comparison Metric", "Value"])
        h_row = ws_summary.max_row
        for col_idx in (1, 2):
            c = ws_summary.cell(row=h_row, column=col_idx)
            c.font = header_font
            c.fill = header_fill

        score_delta = round(report.quality_score_after - report.quality_score_before, 2)
        score_delta_str = f"+{score_delta:.2f}%" if score_delta > 0 else f"{score_delta:.2f}%"
        comp_rows = [
            ["Rows Scanned", report.rows_scanned],
            ["Errors Found (Initial)", report.errors_found],
            ["Duplicates Found (Initial)", report.duplicates_found],
            ["Resolved Defects (Accepted / Dismissed / Merged)", report.resolved],
            ["Pending Defects (Awaiting Review)", report.pending],
            ["Quality Score (Before)", f"{report.quality_score_before:.2f}%"],
            ["Quality Score (After)", f"{report.quality_score_after:.2f}%"],
            ["Quality Score Delta", score_delta_str],
        ]
        for row in comp_rows:
            ws_summary.append(row)
            for col_idx in (1, 2):
                c = ws_summary.cell(row=ws_summary.max_row, column=col_idx)
                c.font = regular_font
                c.border = thin_border

        if report.per_priority_deltas:
            ws_summary.append([])
            ws_summary.append(["Priority", "Issue Count Delta (After - Before)"])
            p_row = ws_summary.max_row
            for col_idx in (1, 2):
                c = ws_summary.cell(row=p_row, column=col_idx)
                c.font = section_font
                c.fill = section_fill
            for prio in ("CRITICAL", "HIGH", "MEDIUM", "LOW"):
                delta_val = report.per_priority_deltas.get(prio, 0)
                ws_summary.append([prio, delta_val])
                cur_r = ws_summary.max_row
                ws_summary.cell(row=cur_r, column=1).font = priority_fonts.get(prio, regular_font)
                ws_summary.cell(row=cur_r, column=1).fill = priority_fills.get(prio, PatternFill())
                ws_summary.cell(row=cur_r, column=1).border = thin_border
                c2 = ws_summary.cell(row=cur_r, column=2)
                c2.font = regular_font
                c2.border = thin_border

        if report.per_rule_deltas:
            ws_summary.append([])
            ws_summary.append(["Rule ID", "Delta (After - Before)"])
            r_row = ws_summary.max_row
            for col_idx in (1, 2):
                c = ws_summary.cell(row=r_row, column=col_idx)
                c.font = section_font
                c.fill = section_fill
            for r_id, d_val in sorted(report.per_rule_deltas.items()):
                ws_summary.append([r_id, d_val])
                for col_idx in (1, 2):
                    c = ws_summary.cell(row=ws_summary.max_row, column=col_idx)
                    c.font = regular_font
                    c.border = thin_border

        if report.per_column_completeness_before or report.per_column_completeness_after:
            ws_summary.append([])
            ws_summary.append(["Column", "Completeness Before", "Completeness After"])
            c_row = ws_summary.max_row
            for col_idx in (1, 2, 3):
                c = ws_summary.cell(row=c_row, column=col_idx)
                c.font = section_font
                c.fill = section_fill
            all_cols = sorted(
                set(report.per_column_completeness_before)
                | set(report.per_column_completeness_after)
            )
            for col_name in all_cols:
                cb = report.per_column_completeness_before.get(col_name, 0.0)
                ca = report.per_column_completeness_after.get(col_name, 0.0)
                ws_summary.append([col_name, f"{float(cb) * 100:.1f}%", f"{float(ca) * 100:.1f}%"])
                for col_idx in (1, 2, 3):
                    c = ws_summary.cell(row=ws_summary.max_row, column=col_idx)
                    c.font = regular_font
                    c.border = thin_border

    # -------------------------------------------------------------
    # Sheet 2: Issues
    # -------------------------------------------------------------
    ws_issues = wb.create_sheet(title="Issues")
    issue_headers = [
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
    ws_issues.append(issue_headers)
    for col_idx, _ in enumerate(issue_headers, start=1):
        cell = ws_issues.cell(row=1, column=col_idx)
        cell.font = header_font
        cell.fill = header_fill

    if isinstance(report, BatchReport):
        prio_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        sorted_issues = sorted(
            report.issues,
            key=lambda x: (prio_order.get(x.priority, 99), x.row or 0),
        )

        for iss in sorted_issues:
            row_display = iss.row if iss.row is not None else "Batch"
            fix_val = ""
            if iss.suggested_fix:
                val = iss.suggested_fix.value
                if "apaar" in iss.field.lower() and isinstance(val, str):
                    fix_val = mask_apaar(val)
                else:
                    fix_val = str(val)

            clean_evidence = _mask_evidence_dict(iss.evidence) if iss.evidence else {}
            ev_str = json.dumps(clean_evidence, default=str) if clean_evidence else ""

            safe_msg = _mask_text_apaars(iss.message)
            safe_reason = _mask_text_apaars(iss.reason)

            ws_issues.append(
                [
                    row_display,
                    iss.priority,
                    iss.severity,
                    iss.rule_id,
                    iss.field,
                    iss.bucket,
                    safe_msg,
                    safe_reason,
                    ev_str,
                    fix_val,
                    "PENDING",
                ]
            )
            cur_r = ws_issues.max_row
            prio_cell = ws_issues.cell(row=cur_r, column=2)
            prio_cell.font = priority_fonts.get(iss.priority, bold_font)
            prio_cell.fill = priority_fills.get(iss.priority, PatternFill())

            for c_idx in range(1, len(issue_headers) + 1):
                c = ws_issues.cell(row=cur_r, column=c_idx)
                if c_idx != 2:
                    c.font = regular_font
                c.border = thin_border

        # Add openpyxl dynamic conditional formatting rule for Priority column (Col B)
        if len(sorted_issues) > 0:
            max_r = max(2, ws_issues.max_row)
            prio_range = f"B2:B{max_r}"
            for p_name, fill_obj in priority_fills.items():
                font_obj = priority_fonts[p_name]
                ws_issues.conditional_formatting.add(
                    prio_range,
                    CellIsRule(
                        operator="equal",
                        formula=[f'"{p_name}"'],
                        stopIfTrue=False,
                        fill=fill_obj,
                        font=font_obj,
                    ),
                )

    elif isinstance(report, DQComparison):
        ws_issues.append(
            [
                "N/A",
                "INFO",
                "INFO",
                "COMPARISON",
                "All",
                "INFO",
                "Refer to Summary sheet for comparison metrics and deltas",
                "",
                "",
                "",
                "RESOLVED",
            ]
        )

    # -------------------------------------------------------------
    # Sheet 3: Duplicates
    # -------------------------------------------------------------
    ws_dups = wb.create_sheet(title="Duplicates")
    dup_headers = [
        "Cluster ID",
        "Scope",
        "Bucket",
        "Score",
        "Record Count",
        "Matched Fields",
        "Member Records (Masked)",
    ]
    ws_dups.append(dup_headers)
    for col_idx in range(1, len(dup_headers) + 1):
        c = ws_dups.cell(row=1, column=col_idx)
        c.font = header_font
        c.fill = header_fill

    if isinstance(report, BatchReport):
        for clus in report.duplicate_clusters:
            mf_str = ", ".join(f"{k}: {v:.2f}" for k, v in clus.matched_fields.items())
            members_str = "; ".join(
                f"Row {m.row or 'Snapshot'}: {m.apaar_masked} ({m.student_id or 'No ID'}, {m.institution or report.institution_aicte_id})"
                for m in clus.members
            )
            ws_dups.append(
                [
                    clus.cluster_id,
                    clus.scope,
                    clus.bucket,
                    f"{clus.score:.2f}",
                    len(clus.members),
                    mf_str,
                    members_str,
                ]
            )
            cur_r = ws_dups.max_row
            for c_idx in range(1, len(dup_headers) + 1):
                c = ws_dups.cell(row=cur_r, column=c_idx)
                c.font = regular_font
                c.border = thin_border

    # -------------------------------------------------------------
    # Sheet 4: Intake
    # -------------------------------------------------------------
    ws_intake = wb.create_sheet(title="Intake")
    intake_headers = [
        "Program Code",
        "Approved Intake",
        "Enrolled Count",
        "Supernumerary Count",
        "Excess Count",
        "Compliance Status",
    ]
    ws_intake.append(intake_headers)
    for col_idx in range(1, len(intake_headers) + 1):
        c = ws_intake.cell(row=1, column=col_idx)
        c.font = header_font
        c.fill = header_fill

    if isinstance(report, BatchReport):
        for item in report.intake_summary:
            status = "EXCEEDED" if item.excess > 0 else "COMPLIANT"
            ws_intake.append(
                [
                    item.program_code,
                    item.approved,
                    item.enrolled,
                    item.supernumerary,
                    item.excess,
                    status,
                ]
            )
            cur_r = ws_intake.max_row
            for c_idx in range(1, len(intake_headers) + 1):
                c = ws_intake.cell(row=cur_r, column=c_idx)
                c.font = regular_font
                c.border = thin_border
            if status == "EXCEEDED":
                status_c = ws_intake.cell(row=cur_r, column=6)
                status_c.font = priority_fonts["CRITICAL"]
                status_c.fill = priority_fills["CRITICAL"]

    # -------------------------------------------------------------
    # Sheet 5: Reconciliation
    # -------------------------------------------------------------
    ws_recon = wb.create_sheet(title="Reconciliation")
    recon_headers = [
        "Program Code",
        "Declared Total",
        "Uploaded Total",
        "Delta",
        "Status",
    ]
    ws_recon.append(recon_headers)
    for col_idx in range(1, len(recon_headers) + 1):
        c = ws_recon.cell(row=1, column=col_idx)
        c.font = header_font
        c.fill = header_fill

    if isinstance(report, BatchReport):
        for r in report.reconciliation:
            ws_recon.append(
                [
                    r.program_code,
                    r.declared,
                    r.uploaded,
                    r.delta,
                    r.status,
                ]
            )
            cur_r = ws_recon.max_row
            for c_idx in range(1, len(recon_headers) + 1):
                c = ws_recon.cell(row=cur_r, column=c_idx)
                c.font = regular_font
                c.border = thin_border
            if r.status == "MISMATCH":
                st_c = ws_recon.cell(row=cur_r, column=5)
                st_c.font = priority_fonts["HIGH"]
                st_c.fill = priority_fills["HIGH"]

    # -------------------------------------------------------------
    # Sheet 6: Drift & Anomalies
    # -------------------------------------------------------------
    ws_drift = wb.create_sheet(title="Drift & Anomalies")
    ws_drift.append(["Schema Drift Events"])
    ws_drift.cell(row=1, column=1).font = section_font
    ws_drift.cell(row=1, column=1).fill = section_fill

    drift_headers = ["Kind", "Affected Column", "Previous Value", "Current Value", "Message"]
    ws_drift.append(drift_headers)
    for col_idx in range(1, len(drift_headers) + 1):
        c = ws_drift.cell(row=2, column=col_idx)
        c.font = header_font
        c.fill = header_fill

    if isinstance(report, BatchReport):
        for d in report.schema_drift:
            msg = f"{d.kind} detected on column '{d.column}'"
            ws_drift.append(
                [
                    d.kind,
                    d.column,
                    str(d.previous),
                    str(d.current),
                    msg,
                ]
            )
            cur_r = ws_drift.max_row
            for c_idx in range(1, len(drift_headers) + 1):
                c = ws_drift.cell(row=cur_r, column=c_idx)
                c.font = regular_font
                c.border = thin_border

        ws_drift.append([])
        anom_header_row = ws_drift.max_row + 1
        ws_drift.append(["Statistical Monitoring Anomalies"])
        ws_drift.cell(row=anom_header_row, column=1).font = section_font
        ws_drift.cell(row=anom_header_row, column=1).fill = section_fill

        anom_headers = ["Metric", "Current Value", "Baseline Mean", "Z-Score", "Method", "Reason"]
        ws_drift.append(anom_headers)
        sub_hdr_row = ws_drift.max_row
        for col_idx in range(1, len(anom_headers) + 1):
            c = ws_drift.cell(row=sub_hdr_row, column=col_idx)
            c.font = header_font
            c.fill = header_fill

        for a in report.anomalies:
            ws_drift.append(
                [
                    a.metric,
                    f"{a.value:.4f}",
                    f"{a.baseline:.4f}",
                    f"{a.z:.2f}",
                    a.method,
                    a.reason,
                ]
            )
            cur_r = ws_drift.max_row
            for c_idx in range(1, len(anom_headers) + 1):
                c = ws_drift.cell(row=cur_r, column=c_idx)
                c.font = regular_font
                c.border = thin_border

    # -------------------------------------------------------------
    # Sheet 7: Column mapping
    # -------------------------------------------------------------
    ws_map = wb.create_sheet(title="Column mapping")
    map_headers = [
        "Source Header",
        "Canonical Target Field",
        "Confidence",
        "Method",
    ]
    ws_map.append(map_headers)
    for col_idx in range(1, len(map_headers) + 1):
        c = ws_map.cell(row=1, column=col_idx)
        c.font = header_font
        c.fill = header_fill

    if isinstance(report, BatchReport):
        for m in report.column_mapping:
            ws_map.append(
                [
                    m.source,
                    m.target,
                    f"{m.confidence:.2f}",
                    m.method.upper(),
                ]
            )
            cur_r = ws_map.max_row
            for c_idx in range(1, len(map_headers) + 1):
                c = ws_map.cell(row=cur_r, column=c_idx)
                c.font = regular_font
                c.border = thin_border

    # Auto-adjust column widths across all sheets
    for ws in wb.worksheets:
        for col in ws.columns:
            max_len = 0
            col_letter = get_column_letter(int(col[0].column or 1))
            for cell in col:
                val = cell.value
                if val is not None:
                    max_len = max(max_len, len(str(val)))
            ws.column_dimensions[col_letter].width = min(max(max_len + 3, 12), 65)
            # Align top for clean viewing
            for cell in col:
                cell.alignment = Alignment(vertical="top")

    output = io.BytesIO()
    wb.save(output)
    return output.getvalue()
