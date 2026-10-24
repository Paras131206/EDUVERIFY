"""
Quota, consent, and lifecycle rules for EduVerify:
V014: Quota and nationality inconsistent
V015: Invalid seat type and scheme combination
V018: Consent missing or minor lacking guardian consent
V021: Invalid lifecycle transition
"""

import logging
from typing import Any

import pandas as pd

from ..models import Issue
from ..normalize import normalize_date
from .context import RuleContext
from .registry import make_issue, rule

logger = logging.getLogger(__name__)


def _is_truthy(val: Any) -> bool:
    """Helper to check if a boolean or string field is True."""
    if val is True:
        return True
    if val is False or val is None:
        return False
    s = str(val).strip().lower()
    return s in ("true", "1", "yes", "y", "t", "haan", "sahi")


@rule("V014")
def validate_v014_quota_nationality(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """
    V014: Quota and nationality inconsistent.
    Ensures student quota, nationality, and NRI/OCI/FN flags do not contradict.
    """
    issues: list[Issue] = []

    for idx, row in df.iterrows():
        row_num = int(idx) + 2
        rec_key = str(row.get("institution_student_id", f"row-{row_num}"))

        quota = str(row.get("quota", "NONE")).strip().upper()
        nationality = str(row.get("nationality", "IN")).strip().upper()
        nri_status = _is_truthy(row.get("nri_status"))
        oci_status = _is_truthy(row.get("oci_status"))
        fn_status = _is_truthy(row.get("fn_status"))

        # Inconsistencies:
        reasons: list[str] = []

        # 1. Quota is NRI but NRI status is False
        if quota == "NRI" and not nri_status:
            reasons.append(f"quota is '{quota}' but nri_status is False")
        elif quota != "NRI" and nri_status and quota not in ("NONE", "CIWG"):
            reasons.append(f"nri_status is True but quota is set to '{quota}'")

        # 2. Indian national claiming Foreign National (FN) or OCI status
        if nationality == "IN" and fn_status:
            reasons.append(
                "Indian national (nationality='IN') cannot hold Foreign National (FN) status"
            )
        if nationality == "IN" and quota == "FN":
            reasons.append("Indian national cannot be enrolled under FN quota")
        if nationality == "IN" and oci_status:
            reasons.append("Indian citizen cannot hold OCI (Overseas Citizen of India) status")

        # 3. Foreign national claiming NRI status
        if nationality != "IN" and nri_status:
            reasons.append(
                f"NRI status is only applicable to Indian citizens residing abroad, but nationality is '{nationality}'"
            )

        if reasons:
            issues.append(
                make_issue(
                    rule_id="V014",
                    ctx=ctx,
                    row=row_num,
                    record_key=rec_key,
                    field="nri_status"
                    if ("nri_status" in reasons[0] or quota == "NRI")
                    else "quota",
                    message="Quota and nationality details are inconsistent",
                    reason="; ".join(reasons) + ".",
                    evidence={
                        "quota": quota,
                        "nationality": nationality,
                        "nri_status": nri_status,
                        "oci_status": oci_status,
                        "fn_status": fn_status,
                    },
                    severity="ERROR",
                    priority="HIGH",
                    bucket="AUTO_FLAG",
                    confidence=1.0,
                )
            )

    return issues


@rule("V015")
def validate_v015_seat_type_and_scheme(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """
    V015: Invalid seat type and scheme combination.
    Supernumerary scheme specified for regular seat, or supernumerary seat missing scheme.
    """
    issues: list[Issue] = []

    for idx, row in df.iterrows():
        row_num = int(idx) + 2
        rec_key = str(row.get("institution_student_id", f"row-{row_num}"))

        seat_type = str(row.get("seat_type", "REGULAR")).strip().upper()
        raw_scheme = row.get("supernumerary_scheme")
        scheme_str = str(raw_scheme).strip().upper() if raw_scheme is not None else ""
        if scheme_str in ("NAN", "NONE", "NULL", ""):
            scheme_str = ""

        # Regular seat with supernumerary scheme
        if seat_type == "REGULAR" and scheme_str:
            issues.append(
                make_issue(
                    rule_id="V015",
                    ctx=ctx,
                    row=row_num,
                    record_key=rec_key,
                    field="supernumerary_scheme",
                    message="Supernumerary scheme specified for a REGULAR seat",
                    reason=(
                        f"Student seat_type is 'REGULAR' but supernumerary_scheme is designated as '{scheme_str}'. "
                        "Supernumerary scheme must only be set when seat_type is 'SUPERNUMERARY'."
                    ),
                    evidence={"seat_type": seat_type, "supernumerary_scheme": scheme_str},
                    severity="ERROR",
                    priority="HIGH",
                    bucket="AUTO_FLAG",
                    confidence=1.0,
                )
            )

        # Supernumerary seat without a scheme
        elif seat_type == "SUPERNUMERARY" and not scheme_str:
            issues.append(
                make_issue(
                    rule_id="V015",
                    ctx=ctx,
                    row=row_num,
                    record_key=rec_key,
                    field="supernumerary_scheme",
                    message="Supernumerary seat is missing required scheme designation",
                    reason="Seat type is 'SUPERNUMERARY' but no supernumerary scheme (e.g. TFW, PMSSS, JK) was specified.",
                    evidence={"seat_type": seat_type, "supernumerary_scheme": ""},
                    severity="ERROR",
                    priority="HIGH",
                    bucket="AUTO_FLAG",
                    confidence=1.0,
                )
            )

    return issues


@rule("V018")
def validate_v018_consent(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """
    V018: Consent missing or minor lacking guardian consent.
    Ensures mandatory consent is GRANTED and minors (< 18) have guardian consent.
    """
    issues: list[Issue] = []

    for idx, row in df.iterrows():
        row_num = int(idx) + 2
        rec_key = str(row.get("institution_student_id", f"row-{row_num}"))

        consent_status = str(row.get("consent_status", "")).strip().upper()

        # 1. Missing or non-GRANTED consent
        if consent_status != "GRANTED":
            issues.append(
                make_issue(
                    rule_id="V018",
                    ctx=ctx,
                    row=row_num,
                    record_key=rec_key,
                    field="consent_status",
                    message=f"Student consent is '{consent_status or 'MISSING'}'",
                    reason=(
                        f"Consent status is '{consent_status or 'MISSING'}'; statutory compliance with the "
                        "Digital Personal Data Protection (DPDP) Act 2023 requires affirmative GRANTED consent."
                    ),
                    evidence={"consent_status": consent_status},
                    severity="ERROR",
                    priority="HIGH",
                    bucket="AUTO_FLAG",
                    confidence=1.0,
                )
            )

        # 2. Minor lacking guardian consent (explicitly REFUSED/WITHDRAWN or under 15)
        raw_gc = str(row.get("guardian_consent", "")).strip().upper()
        raw_dob = row.get("dob")
        iso_dob, _, is_dob_valid = normalize_date(raw_dob)

        if raw_gc in ("REFUSED", "WITHDRAWN"):
            issues.append(
                make_issue(
                    rule_id="V018",
                    ctx=ctx,
                    row=row_num,
                    record_key=rec_key,
                    field="guardian_consent",
                    message=f"Guardian consent is '{raw_gc}'",
                    reason=f"Guardian consent for student is explicitly {raw_gc}.",
                    evidence={"guardian_consent": raw_gc},
                    severity="ERROR",
                    priority="HIGH",
                    bucket="AUTO_FLAG",
                    confidence=1.0,
                )
            )
        elif is_dob_valid and iso_dob:
            try:
                birth_year = int(iso_dob.split("-")[0])
                current_year = int(ctx.academic_year.split("-")[0])
                age = current_year - birth_year
                if age < 15 and not _is_truthy(row.get("guardian_consent")):
                    issues.append(
                        make_issue(
                            rule_id="V018",
                            ctx=ctx,
                            row=row_num,
                            record_key=rec_key,
                            field="guardian_consent",
                            message=f"Minor student (age {age}) lacks verified guardian consent",
                            reason=f"Student is a minor under 15 years of age (born {iso_dob}) but guardian consent flag is not affirmative.",
                            evidence={
                                "age": age,
                                "dob": iso_dob,
                                "guardian_consent": row.get("guardian_consent"),
                            },
                            severity="ERROR",
                            priority="HIGH",
                            bucket="AUTO_FLAG",
                            confidence=1.0,
                        )
                    )
            except (ValueError, IndexError) as e:
                logger.debug(
                    "Skipping minor guardian consent check for row %d due to unparseable date/year: %s",
                    row_num,
                    e,
                )

    return issues


@rule("V021")
def validate_v021_lifecycle_transition(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """
    V021: Invalid lifecycle transition.
    Disallowed transition between student lifecycle states (agents.md §8.1).
    Allowed: ACTIVE->WITHDRAWN|DEFERRED|TRANSFERRED_OUT|COMPLETED, DEFERRED->ACTIVE|WITHDRAWN, COMPLETED->GRADUATED.
    """
    issues: list[Issue] = []
    if "enrolment_status" not in df.columns or "apaar_id" not in df.columns:
        return issues

    ALLOWED_TRANSITIONS = {
        "ACTIVE": {"WITHDRAWN", "DEFERRED", "TRANSFERRED_OUT", "COMPLETED", "ACTIVE"},
        "DEFERRED": {"ACTIVE", "WITHDRAWN", "DEFERRED"},
        "COMPLETED": {"GRADUATED", "COMPLETED"},
        "WITHDRAWN": {"WITHDRAWN"},
        "TRANSFERRED_OUT": {"TRANSFERRED_OUT"},
        "GRADUATED": {"GRADUATED"},
    }

    for idx, row in df.iterrows():
        row_num = int(idx) + 2
        rec_key = str(row.get("institution_student_id", f"row-{row_num}"))
        aid = str(row.get("apaar_id", "")).strip()
        curr_status = str(row.get("enrolment_status", "")).strip().upper()

        if not aid or not curr_status:
            continue

        # Look up previous committed status
        prior_records = ctx.get_snapshot_records(aid)
        if prior_records:
            prev_status = str(prior_records[0].get("enrolment_status", "")).strip().upper()
            if prev_status and prev_status != curr_status:
                allowed_next = ALLOWED_TRANSITIONS.get(prev_status, set())
                if curr_status not in allowed_next:
                    issues.append(
                        make_issue(
                            rule_id="V021",
                            ctx=ctx,
                            row=row_num,
                            record_key=rec_key,
                            field="enrolment_status",
                            message=f"Disallowed lifecycle transition from '{prev_status}' to '{curr_status}'",
                            reason=(
                                f"Cannot transition student from previous state '{prev_status}' to '{curr_status}'. "
                                f"Permitted transitions from '{prev_status}' are: {sorted(list(allowed_next))}."
                            ),
                            evidence={
                                "previous_status": prev_status,
                                "current_status": curr_status,
                                "permitted_transitions": sorted(list(allowed_next)),
                            },
                            severity="ERROR",
                            priority="HIGH",
                            bucket="AUTO_FLAG",
                            confidence=1.0,
                        )
                    )

    return issues
