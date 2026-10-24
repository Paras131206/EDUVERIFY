"""
Format and data consistency rules for EduVerify:
V006: Invalid format (enum, email, mobile, nationality)
V024: Ambiguous or unparseable date
V031: Formatting inconsistency (whitespace, title casing)
"""

import re

import pandas as pd

from ..models import Issue, SuggestedFix
from ..normalize import normalize_date
from .context import RuleContext
from .registry import make_issue, rule

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
ISO_COUNTRY_REGEX = re.compile(r"^[A-Z]{2}$")


@rule("V006")
def validate_v006_invalid_format(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """
    V006: Invalid format.
    Checks syntax for enum fields, email, mobile, and ISO nationality.
    """
    issues: list[Issue] = []

    # Enums to check if present in master
    enum_field_map = {
        "gender": ctx.get_valid_enums("gender") or {"M", "F", "T"},
        "category": ctx.get_valid_enums("category") or {"GEN", "EWS", "OBC-NCL", "SC", "ST"},
        "course_level": ctx.get_valid_enums("course_level")
        or {"DIPLOMA", "UG", "PG", "PGDM", "PHD"},
        "admission_type": ctx.get_valid_enums("admission_type")
        or {"REGULAR", "LATERAL", "TRANSFER_IN"},
        "seat_type": ctx.get_valid_enums("seat_type") or {"REGULAR", "SUPERNUMERARY"},
        "quota": ctx.get_valid_enums("quota") or {"NONE", "NRI", "OCI", "FN", "PIO", "CIWG"},
        "enrolment_status": ctx.get_valid_enums("enrolment_status")
        or {"ACTIVE", "WITHDRAWN", "DEFERRED", "TRANSFERRED_OUT", "COMPLETED", "GRADUATED"},
        "consent_status": ctx.get_valid_enums("consent_status")
        or {"GRANTED", "REFUSED", "WITHDRAWN"},
    }

    for idx, row in df.iterrows():
        row_num = int(idx) + 2
        rec_key = str(row.get("institution_student_id", f"row-{row_num}"))

        # Check Enums
        for field, valid_values in enum_field_map.items():
            if field in df.columns:
                val = row.get(field)
                if val is not None:
                    val_str = str(val).strip()
                    if val_str and val_str.lower() not in ("nan", "none", "null"):
                        # Compare case-insensitively with enum set
                        upper_val = val_str.upper()
                        valid_upper = {v.upper() for v in valid_values}
                        if upper_val not in valid_upper:
                            issues.append(
                                make_issue(
                                    rule_id="V006",
                                    ctx=ctx,
                                    row=row_num,
                                    record_key=rec_key,
                                    field=field,
                                    message=f"Value '{val_str}' is not a valid {field} enum",
                                    reason=(
                                        f"Field '{field}' has value '{val_str}' which is not in permitted enum values: "
                                        f"{sorted(list(valid_values))}"
                                    ),
                                    evidence={
                                        "field": field,
                                        "value": val_str,
                                        "allowed": sorted(list(valid_values)),
                                    },
                                    severity="ERROR",
                                    priority="LOW",
                                    bucket="AUTO_FLAG",
                                    confidence=1.0,
                                )
                            )

        # Check nationality (ISO 3166 alpha-2)
        if "nationality" in df.columns:
            nat = row.get("nationality")
            if nat is not None:
                nat_str = str(nat).strip().upper()
                if nat_str and nat_str.lower() not in ("nan", "none", "null"):
                    if not ISO_COUNTRY_REGEX.match(nat_str):
                        issues.append(
                            make_issue(
                                rule_id="V006",
                                ctx=ctx,
                                row=row_num,
                                record_key=rec_key,
                                field="nationality",
                                message=f"Invalid nationality '{nat}' (must be 2-letter ISO code)",
                                reason=f"Nationality '{nat}' does not conform to ISO-3166 alpha-2 format.",
                                evidence={"field": "nationality", "value": str(nat)},
                                severity="ERROR",
                                priority="LOW",
                                bucket="AUTO_FLAG",
                                confidence=1.0,
                            )
                        )

        # Check email format
        if "email" in df.columns:
            email = row.get("email")
            if email is not None:
                email_str = str(email).strip()
                if email_str and email_str.lower() not in ("nan", "none", "null"):
                    if not EMAIL_REGEX.match(email_str):
                        issues.append(
                            make_issue(
                                rule_id="V006",
                                ctx=ctx,
                                row=row_num,
                                record_key=rec_key,
                                field="email",
                                message="Invalid email address syntax",
                                reason=f"Email '{email_str}' is not valid syntax.",
                                evidence={"field": "email", "value": email_str},
                                severity="ERROR",
                                priority="LOW",
                                bucket="AUTO_FLAG",
                                confidence=1.0,
                            )
                        )

        # Check mobile format (10 digits)
        if "mobile" in df.columns:
            mob = row.get("mobile")
            if mob is not None:
                mob_str = re.sub(r"\D", "", str(mob).split(".")[0])
                if mob_str and mob_str.lower() not in ("nan", "none", "null"):
                    if len(mob_str) != 10:
                        issues.append(
                            make_issue(
                                rule_id="V006",
                                ctx=ctx,
                                row=row_num,
                                record_key=rec_key,
                                field="mobile",
                                message="Invalid mobile number format",
                                reason=f"Mobile number must have exactly 10 digits, found '{mob}' (length {len(mob_str)}).",
                                evidence={
                                    "field": "mobile",
                                    "value": str(mob),
                                    "digits_length": len(mob_str),
                                },
                                severity="ERROR",
                                priority="LOW",
                                bucket="AUTO_FLAG",
                                confidence=1.0,
                            )
                        )

    return issues


@rule("V024")
def validate_v024_unparseable_date(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """
    V024: Ambiguous or unparseable date.
    Flags dates that cannot be parsed under the Indian date policy or have invalid day/month.
    """
    issues: list[Issue] = []
    date_fields = ["dob", "admission_date", "consent_date"]

    for idx, row in df.iterrows():
        row_num = int(idx) + 2
        rec_key = str(row.get("institution_student_id", f"row-{row_num}"))

        for df_name in date_fields:
            if df_name in df.columns:
                raw_date = row.get(df_name)
                if raw_date is not None:
                    raw_str = str(raw_date).strip()
                    if raw_str and raw_str.lower() not in ("nan", "none", "null"):
                        iso_val, candidates, is_valid = normalize_date(raw_str)
                        if not is_valid:
                            issues.append(
                                make_issue(
                                    rule_id="V024",
                                    ctx=ctx,
                                    row=row_num,
                                    record_key=rec_key,
                                    field=df_name,
                                    message=f"Ambiguous or unparseable date in '{df_name}'",
                                    reason=(
                                        f"Value '{raw_str}' in field '{df_name}' cannot be parsed under Indian date policy "
                                        "(impossible calendar day/month or invalid syntax)."
                                    ),
                                    evidence={
                                        "field": df_name,
                                        "original_value": raw_str,
                                        "candidates_tried": candidates,
                                    },
                                    severity="ERROR",
                                    priority="MEDIUM",
                                    bucket="HUMAN_REVIEW",
                                    confidence=0.90,
                                )
                            )

    return issues


@rule("V031")
def validate_v031_formatting_inconsistency(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """
    V031: Formatting inconsistency (whitespace, casing).
    Identifies names with leading/trailing whitespace, all-caps, or multi-space formatting.
    Provides deterministic auto-normalisation fix.
    """
    issues: list[Issue] = []
    if "full_name" not in df.columns:
        return issues

    for idx, row in df.iterrows():
        row_num = int(idx) + 2
        rec_key = str(row.get("institution_student_id", f"row-{row_num}"))
        name = row.get("full_name")
        if name is not None:
            name_str = str(name)
            if not name_str or name_str.lower() in ("nan", "none", "null"):
                continue

            # Check if name has extra whitespace or all caps (> 4 letters)
            has_edge_whitespace = name_str != name_str.strip()
            has_double_spaces = "  " in name_str
            is_all_caps = name_str.isupper() and len(re.sub(r"[^a-zA-Z]", "", name_str)) > 3

            if has_edge_whitespace or has_double_spaces or is_all_caps:
                # Deterministic clean title-case
                clean_name = re.sub(r"\s+", " ", name_str).strip().title()
                issues.append(
                    make_issue(
                        rule_id="V031",
                        ctx=ctx,
                        row=row_num,
                        record_key=rec_key,
                        field="full_name",
                        message="Formatting inconsistency in student name",
                        reason=f"Candidate name '{name_str}' contains formatting inconsistency that can be auto-normalized to '{clean_name}'.",
                        evidence={"original": name_str, "suggested": clean_name},
                        suggested_fix=SuggestedFix(
                            value=clean_name,
                            rationale="Trimmed extra whitespace and standardized to title case",
                            requires_approval=True,
                        ),
                        severity="INFO",
                        priority="LOW",
                        bucket="INFO",
                        confidence=1.0,
                    )
                )

    return issues
