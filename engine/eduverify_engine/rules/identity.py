"""
Identity validation rules for EduVerify:
V002: apaar_id missing or not 12 digits
V003: apaar_id not in APAAR registry
V004: Registry name/DOB fuzzy mismatch
V023: APAAR/ID looks Excel-mangled
"""

from rapidfuzz import fuzz

from ..masking import mask_apaar
from ..models import Issue
from ..normalize import normalize_apaar, normalize_date
from .context import RuleContext
from .registry import make_issue, rule


@rule("V023")
def validate_v023_excel_mangled(df, ctx: RuleContext) -> list[Issue]:
    """
    V023: APAAR/ID looks Excel-mangled (scientific notation, dropped leading zero, float suffix).
    Triggered when an identifier was corrupted by spreadsheet formatting but is recoverable.
    """
    issues: list[Issue] = []
    if "apaar_id" not in df.columns:
        return issues

    for idx, row in df.iterrows():
        row_num = int(idx) + 2
        rec_key = str(row.get("institution_student_id", f"row-{row_num}"))
        raw_val = row.get("apaar_id", "")
        if not raw_val or str(raw_val).strip().lower() in ("nan", "none", "null", ""):
            continue

        norm_val, defect, fix = normalize_apaar(raw_val)
        # Emit V023 if defect was detected and recovered string is 12 digits
        if defect and len(norm_val) == 12:
            issues.append(
                make_issue(
                    rule_id="V023",
                    ctx=ctx,
                    row=row_num,
                    record_key=rec_key,
                    field="apaar_id",
                    message="APAAR identifier appears Excel-mangled",
                    reason=f"Detected spreadsheet corruption: {defect} in value '{raw_val}'",
                    evidence={
                        "original": str(raw_val),
                        "cleaned": norm_val,
                        "defect": defect,
                    },
                    suggested_fix=fix,
                    value_masked=mask_apaar(norm_val),
                    severity="WARN",
                    priority="HIGH",
                    bucket="AUTO_FLAG",
                    confidence=0.98,
                )
            )
    return issues


@rule("V002")
def validate_v002_apaar_format(df, ctx: RuleContext) -> list[Issue]:
    """
    V002: apaar_id missing or not 12 digits.
    The APAAR ID is null, empty, or does not consist of exactly 12 numeric digits.
    """
    issues: list[Issue] = []
    if "apaar_id" not in df.columns:
        return issues

    for idx, row in df.iterrows():
        row_num = int(idx) + 2
        rec_key = str(row.get("institution_student_id", f"row-{row_num}"))
        raw_val = row.get("apaar_id", "")

        norm_val, defect, _ = normalize_apaar(raw_val)

        # Missing or not 12 digits or contains non-numeric characters
        if not norm_val or len(norm_val) != 12 or not norm_val.isdigit():
            issues.append(
                make_issue(
                    rule_id="V002",
                    ctx=ctx,
                    row=row_num,
                    record_key=rec_key,
                    field="apaar_id",
                    message="APAAR ID missing or not exactly 12 numeric digits",
                    reason=(
                        f"Expected 12 numeric digits, found '{norm_val}' (length {len(norm_val)})"
                    ),
                    evidence={
                        "value": str(raw_val),
                        "cleaned": norm_val,
                        "length": len(norm_val),
                    },
                    value_masked=mask_apaar(norm_val),
                    severity="ERROR",
                    priority="CRITICAL",
                    bucket="AUTO_FLAG",
                    confidence=1.0,
                )
            )
    return issues


@rule("V003")
def validate_v003_apaar_in_registry(df, ctx: RuleContext) -> list[Issue]:
    """
    V003: apaar_id not in APAAR registry.
    For syntactically valid 12-digit APAAR IDs, verifies existence in the national registry.
    """
    issues: list[Issue] = []
    if "apaar_id" not in df.columns or ctx.registry.empty:
        return issues

    for idx, row in df.iterrows():
        row_num = int(idx) + 2
        rec_key = str(row.get("institution_student_id", f"row-{row_num}"))
        raw_val = row.get("apaar_id", "")

        norm_val, _, _ = normalize_apaar(raw_val)
        if len(norm_val) == 12 and norm_val.isdigit():
            reg_entry = ctx.lookup_registry(norm_val)
            if reg_entry is None:
                issues.append(
                    make_issue(
                        rule_id="V003",
                        ctx=ctx,
                        row=row_num,
                        record_key=rec_key,
                        field="apaar_id",
                        message="APAAR ID not found in national verification registry",
                        reason=f"APAAR number '{norm_val}' does not exist in national APAAR registry.",
                        evidence={"apaar_id": norm_val, "registry_checked": True},
                        value_masked=mask_apaar(norm_val),
                        severity="ERROR",
                        priority="CRITICAL",
                        bucket="AUTO_FLAG",
                        confidence=1.0,
                    )
                )
    return issues


@rule("V004")
def validate_v004_registry_fuzzy_mismatch(df, ctx: RuleContext) -> list[Issue]:
    """
    V004: Registry name/DOB fuzzy mismatch.
    When student is found in registry, compares name with rapidfuzz and checks DOB.
    """
    issues: list[Issue] = []
    if "apaar_id" not in df.columns or ctx.registry.empty:
        return issues

    has_name = "full_name" in df.columns
    has_dob = "dob" in df.columns

    for idx, row in df.iterrows():
        row_num = int(idx) + 2
        rec_key = str(row.get("institution_student_id", f"row-{row_num}"))
        raw_val = row.get("apaar_id", "")

        norm_val, _, _ = normalize_apaar(raw_val)
        if len(norm_val) == 12 and norm_val.isdigit():
            reg_entry = ctx.lookup_registry(norm_val)
            if reg_entry:
                uploaded_name = str(row.get("full_name", "")).strip() if has_name else ""
                registry_name = str(reg_entry.get("full_name", "")).strip()

                uploaded_dob_raw = row.get("dob", "") if has_dob else ""
                uploaded_dob_iso, _, _ = normalize_date(uploaded_dob_raw)
                registry_dob_raw = reg_entry.get("dob", "")
                registry_dob_iso, _, _ = normalize_date(registry_dob_raw)

                name_score = 100
                if uploaded_name and registry_name:
                    name_score = int(
                        fuzz.token_set_ratio(uploaded_name.lower(), registry_name.lower())
                    )

                dob_matches = True
                if uploaded_dob_iso and registry_dob_iso:
                    dob_matches = uploaded_dob_iso == registry_dob_iso

                if name_score < 85 or not dob_matches:
                    mismatch_parts = []
                    if name_score < 85:
                        mismatch_parts.append(
                            f"name similarity {name_score}% (uploaded '{uploaded_name}' vs registry '{registry_name}')"
                        )
                    if not dob_matches:
                        mismatch_parts.append(
                            f"DOB mismatch (uploaded '{uploaded_dob_iso}' vs registry '{registry_dob_iso}')"
                        )

                    reason = "Demographic discrepancy with APAAR registry: " + "; ".join(
                        mismatch_parts
                    )
                    issues.append(
                        make_issue(
                            rule_id="V004",
                            ctx=ctx,
                            row=row_num,
                            record_key=rec_key,
                            field="full_name" if name_score < 85 else "dob",
                            message="Uploaded student name or DOB differs from APAAR registry",
                            reason=reason,
                            evidence={
                                "uploaded_name": uploaded_name,
                                "registry_name": registry_name,
                                "name_similarity": name_score,
                                "uploaded_dob": uploaded_dob_iso or str(uploaded_dob_raw),
                                "registry_dob": registry_dob_iso or str(registry_dob_raw),
                            },
                            value_masked=mask_apaar(norm_val),
                            severity="WARN",
                            priority="HIGH",
                            bucket="HUMAN_REVIEW",
                            confidence=0.88,
                        )
                    )
    return issues
