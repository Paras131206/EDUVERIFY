"""
Institutional and affiliation rules for EduVerify:
V019: program_code not approved for institution/year
V033: Record references institution not affiliated to degree-awarding body
V035: Batch institution does not match authenticated uploader
"""

import pandas as pd

from ..models import Issue
from .context import RuleContext
from .registry import make_issue, rule


@rule("V019")
def validate_v019_program_approval(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """
    V019: program_code not approved for institution/year.
    Verifies that the program code is in the approved AICTE master list for this institution and year.
    """
    issues: list[Issue] = []
    if "program_code" not in df.columns:
        return issues

    for idx, row in enumerate(ctx.get_records(df)):
        row_num = int(idx) + 2
        rec_key = str(row.get("institution_student_id", f"row-{row_num}"))
        prog_code = str(row.get("program_code", "")).strip()
        if not prog_code or prog_code.lower() in ("nan", "none", "null"):
            continue

        inst_id = str(row.get("institution_aicte_id", ctx.institution_aicte_id)).strip()
        ay = str(row.get("academic_year", ctx.academic_year)).strip()

        # Check intake master or program master
        intake_rec = ctx.get_intake_record(prog_code, inst_id, ay)
        prog_master_rec = ctx.get_program(prog_code)

        if prog_master_rec is None:
            issues.append(
                make_issue(
                    rule_id="V019",
                    ctx=ctx,
                    row=row_num,
                    record_key=rec_key,
                    field="program_code",
                    message=f"Unknown program code '{prog_code}'",
                    reason=f"Program code '{prog_code}' does not exist in AICTE central programs directory.",
                    evidence={"program_code": prog_code},
                    severity="ERROR",
                    priority="HIGH",
                    bucket="AUTO_FLAG",
                    confidence=1.0,
                )
            )
        elif not ctx.intake.empty and intake_rec is None:
            issues.append(
                make_issue(
                    rule_id="V019",
                    ctx=ctx,
                    row=row_num,
                    record_key=rec_key,
                    field="program_code",
                    message=f"Program '{prog_code}' not approved for institution '{inst_id}' in {ay}",
                    reason=(
                        f"Program code '{prog_code}' is valid centrally, but is not approved in AICTE intake master "
                        f"for institution '{inst_id}' in academic year {ay}."
                    ),
                    evidence={
                        "program_code": prog_code,
                        "institution_aicte_id": inst_id,
                        "academic_year": ay,
                    },
                    severity="ERROR",
                    priority="HIGH",
                    bucket="AUTO_FLAG",
                    confidence=1.0,
                )
            )

    return issues


@rule("V033")
def validate_v033_dab_affiliation(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """
    V033: Record references institution not affiliated to degree-awarding body.
    Cross-checks institution's affiliated_dab_id against institutions and degree_awarding_bodies master.
    """
    issues: list[Issue] = []
    raw_records = ctx.get_records(ctx.raw_df) if ctx.raw_df is not None else None

    for idx, row in enumerate(ctx.get_records(df)):
        row_num = int(idx) + 2
        rec_key = str(row.get("institution_student_id", f"row-{row_num}"))
        inst_id = str(row.get("institution_aicte_id", ctx.institution_aicte_id)).strip()

        inst_rec = ctx.get_institution(inst_id)
        actual_dab = str(inst_rec.get("affiliated_dab_id", "")).strip() if inst_rec else ""

        # Check raw_df or working_df for stated DAB
        stated_dab = ""
        for col in ["affiliated_dab_id", "degree_awarding_body", "university_id", "dab_id"]:
            if raw_records is not None and ctx.raw_df is not None and col in ctx.raw_df.columns:
                val = str(raw_records[idx].get(col, "")).strip()
                if val and val.lower() not in ("nan", "none", "null"):
                    stated_dab = val
                    break
            elif col in row:
                val = str(row.get(col, "")).strip()
                if val and val.lower() not in ("nan", "none", "null"):
                    stated_dab = val
                    break

        if not inst_rec or not actual_dab:
            issues.append(
                make_issue(
                    rule_id="V033",
                    ctx=ctx,
                    row=row_num,
                    record_key=rec_key,
                    field="institution_aicte_id",
                    message=f"Institution '{inst_id}' has no recognized degree-awarding body affiliation",
                    reason=f"Institution AICTE ID '{inst_id}' is not recognized as affiliated to an accredited degree-awarding body.",
                    evidence={"institution_aicte_id": inst_id},
                    severity="ERROR",
                    priority="HIGH",
                    bucket="AUTO_FLAG",
                    confidence=1.0,
                )
            )
        elif stated_dab and actual_dab and stated_dab.upper() != actual_dab.upper():
            issues.append(
                make_issue(
                    rule_id="V033",
                    ctx=ctx,
                    row=row_num,
                    record_key=rec_key,
                    field="affiliated_dab_id",
                    message=f"Institution not affiliated to stated degree-awarding body '{stated_dab}'",
                    reason=(
                        f"Institution '{inst_id}' is affiliated to '{actual_dab}' according to AICTE accreditation records, "
                        f"which conflicts with uploaded body '{stated_dab}'."
                    ),
                    evidence={
                        "institution_aicte_id": inst_id,
                        "accredited_dab_id": actual_dab,
                        "stated_dab_id": stated_dab,
                    },
                    severity="ERROR",
                    priority="HIGH",
                    bucket="AUTO_FLAG",
                    confidence=1.0,
                )
            )

    return issues


@rule("V035")
def validate_v035_batch_institution_mismatch(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """
    V035: Batch institution does not match authenticated uploader.
    Ensures records only contain data for the authenticated institution.
    """
    issues: list[Issue] = []
    auth_inst = ctx.authenticated_institution_id
    if not auth_inst or "institution_aicte_id" not in df.columns:
        return issues

    for idx, row in enumerate(ctx.get_records(df)):
        row_num = int(idx) + 2
        rec_key = str(row.get("institution_student_id", f"row-{row_num}"))
        row_inst = str(row.get("institution_aicte_id", "")).strip()

        if row_inst and row_inst.lower() not in ("nan", "none", "null"):
            if row_inst != auth_inst:
                issues.append(
                    make_issue(
                        rule_id="V035",
                        ctx=ctx,
                        row=row_num,
                        record_key=rec_key,
                        field="institution_aicte_id",
                        message=f"Record cites institution '{row_inst}', differing from uploader '{auth_inst}'",
                        reason=(
                            f"Student row cites institution AICTE ID '{row_inst}', which does not match "
                            f"the authenticated uploader institution '{auth_inst}'."
                        ),
                        evidence={
                            "record_institution": row_inst,
                            "authenticated_institution": auth_inst,
                        },
                        severity="ERROR",
                        priority="CRITICAL",
                        bucket="AUTO_FLAG",
                        confidence=1.0,
                    )
                )

    return issues
