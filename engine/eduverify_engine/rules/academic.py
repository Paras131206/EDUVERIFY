"""
Academic validation rules for EduVerify:
V016: Age implausible for course level
V017: admission_date outside academic-year window
V025: expected_graduation_year inconsistent with admission year + duration - lateral
V026: Conflicting course/department/level for same student across rows
V027: year_of_study exceeds program duration or invalid for lateral
"""

import logging

import pandas as pd

from ..models import Issue, SuggestedFix
from ..normalize import normalize_date
from .context import RuleContext
from .registry import make_issue, rule

logger = logging.getLogger(__name__)

PLAUSIBLE_AGE_RANGES = {
    "DIPLOMA": (14, 35),
    "UG": (16, 35),
    "PG": (19, 50),
    "PGDM": (19, 50),
    "PHD": (21, 65),
}


@rule("V016")
def validate_v016_implausible_age(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """
    V016: Age implausible for course level.
    Calculates age from date of birth and admission date.
    Flags students whose age falls outside customary bounds for the course level.
    """
    issues: list[Issue] = []
    if "dob" not in df.columns:
        return issues

    for idx, row in df.iterrows():
        row_num = int(idx) + 2
        rec_key = str(row.get("institution_student_id", f"row-{row_num}"))
        raw_dob = row.get("dob")
        iso_dob, _, is_dob_valid = normalize_date(raw_dob)
        if not is_dob_valid or not iso_dob:
            continue

        raw_adm = row.get("admission_date")
        iso_adm, _, is_adm_valid = normalize_date(raw_adm)

        try:
            dob_year = int(iso_dob.split("-")[0])
            if is_adm_valid and iso_adm:
                adm_year = int(iso_adm.split("-")[0])
            else:
                adm_year = int(ctx.academic_year.split("-")[0])

            age = adm_year - dob_year
            course_level = str(row.get("course_level", "UG")).strip().upper()
            min_age, max_age = PLAUSIBLE_AGE_RANGES.get(course_level, (16, 40))

            if age < min_age or age > max_age:
                issues.append(
                    make_issue(
                        rule_id="V016",
                        ctx=ctx,
                        row=row_num,
                        record_key=rec_key,
                        field="dob",
                        message=f"Calculated age ({age}y) is implausible for course level '{course_level}'",
                        reason=(
                            f"Calculated age of {age} years (DOB: {iso_dob}, admission: {adm_year}) falls outside "
                            f"expected range [{min_age}..{max_age}] for {course_level} program."
                        ),
                        evidence={
                            "dob": iso_dob,
                            "admission_year": adm_year,
                            "age": age,
                            "course_level": course_level,
                            "plausible_min": min_age,
                            "plausible_max": max_age,
                        },
                        severity="WARN",
                        priority="MEDIUM",
                        bucket="HUMAN_REVIEW",
                        confidence=0.85,
                    )
                )
        except (ValueError, IndexError) as e:
            logger.debug(
                "Skipping V016 age calculation for row %d due to unparseable date/year: %s",
                row_num,
                e,
            )

    return issues


@rule("V017")
def validate_v017_admission_date_window(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """
    V017: admission_date outside academic-year window.
    Ensures student admission date falls within the AICTE-approved cutoff calendar.
    """
    issues: list[Issue] = []
    if "admission_date" not in df.columns:
        return issues

    for idx, row in df.iterrows():
        row_num = int(idx) + 2
        rec_key = str(row.get("institution_student_id", f"row-{row_num}"))
        raw_adm = row.get("admission_date")
        iso_adm, _, is_valid = normalize_date(raw_adm)
        if not is_valid or not iso_adm:
            continue

        ay = str(row.get("academic_year", ctx.academic_year)).strip()
        window = ctx.get_academic_year_window(ay)
        if window:
            window_start, window_end = window
            if iso_adm < window_start or iso_adm > window_end:
                issues.append(
                    make_issue(
                        rule_id="V017",
                        ctx=ctx,
                        row=row_num,
                        record_key=rec_key,
                        field="admission_date",
                        message=f"Admission date '{iso_adm}' outside approved window for academic year {ay}",
                        reason=(
                            f"Admission date {iso_adm} is outside prescribed AICTE admission window "
                            f"({window_start} to {window_end}) for academic year {ay}."
                        ),
                        evidence={
                            "admission_date": iso_adm,
                            "window_start": window_start,
                            "window_end": window_end,
                            "academic_year": ay,
                        },
                        severity="ERROR",
                        priority="HIGH",
                        bucket="AUTO_FLAG",
                        confidence=1.0,
                    )
                )

    return issues


@rule("V025")
def validate_v025_expected_graduation_year(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """
    V025: expected_graduation_year inconsistent with admission year + duration - lateral.
    Ensures expected graduation year matches admission year + duration (adjusted for lateral entry).
    """
    issues: list[Issue] = []
    if "expected_graduation_year" not in df.columns:
        return issues

    for idx, row in df.iterrows():
        row_num = int(idx) + 2
        rec_key = str(row.get("institution_student_id", f"row-{row_num}"))
        raw_grad = row.get("expected_graduation_year")
        if raw_grad is None or str(raw_grad).strip().lower() in ("nan", "none", "null", ""):
            continue

        try:
            grad_year = int(float(str(raw_grad).strip()))
        except ValueError:
            continue

        # Determine admission year
        raw_adm = row.get("admission_date")
        iso_adm, _, is_valid = normalize_date(raw_adm)
        if is_valid and iso_adm:
            adm_year = int(iso_adm.split("-")[0])
        else:
            ay_str = str(row.get("academic_year", ctx.academic_year)).strip()
            try:
                adm_year = int(ay_str.split("-")[0])
            except ValueError:
                adm_year = 2026

        # Determine duration
        prog_code = str(row.get("program_code", "")).strip()
        prog_rec = ctx.get_program(prog_code)
        duration = 4
        if prog_rec and "duration_years" in prog_rec:
            try:
                duration = int(prog_rec["duration_years"])
            except ValueError:
                pass
        else:
            course_level = str(row.get("course_level", "")).strip().upper()
            if course_level in ("PG", "PGDM", "DIPLOMA"):
                duration = 2
            elif course_level == "PHD":
                duration = 3

        adm_type = str(row.get("admission_type", "REGULAR")).strip().upper()
        is_lateral = adm_type == "LATERAL"
        expected_year = adm_year + duration - (1 if is_lateral else 0)

        if grad_year != expected_year:
            lateral_note = " (adjusted for lateral entry)" if is_lateral else ""
            issues.append(
                make_issue(
                    rule_id="V025",
                    ctx=ctx,
                    row=row_num,
                    record_key=rec_key,
                    field="expected_graduation_year",
                    message="Graduation year inconsistent with admission year and program duration",
                    reason=(
                        f"admission_date {iso_adm or adm_year} + {prog_code or 'Program'} duration {duration}y"
                        f"{lateral_note} -> expected {expected_year}, got {grad_year}"
                    ),
                    evidence={
                        "admission_date": iso_adm or str(adm_year),
                        "admission_year": adm_year,
                        "program_code": prog_code,
                        "program_duration_years": duration,
                        "is_lateral": is_lateral,
                        "expected_year": expected_year,
                        "value": grad_year,
                    },
                    suggested_fix=SuggestedFix(
                        value=expected_year,
                        rationale="admission year + program duration"
                        + (" - 1 for lateral entry" if is_lateral else ""),
                        requires_approval=True,
                    ),
                    value_masked=str(grad_year),
                    severity="ERROR",
                    priority="HIGH",
                    bucket="AUTO_FLAG",
                    confidence=0.98,
                )
            )

    return issues


@rule("V026")
def validate_v026_conflicting_student_rows(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """
    V026: Conflicting course/department/level for same student across rows.
    If multiple rows exist for the same student identifier, flags conflicting program/level/dept.
    """
    issues: list[Issue] = []
    id_col = (
        "institution_student_id"
        if "institution_student_id" in df.columns
        else ("apaar_id" if "apaar_id" in df.columns else None)
    )
    if not id_col:
        return issues

    groups: dict[str, list[tuple[int, dict]]] = {}
    for idx, row in df.iterrows():
        sid = str(row.get(id_col, "")).strip()
        if sid and sid.lower() not in ("nan", "none", "null"):
            groups.setdefault(sid, []).append((int(idx) + 2, row.to_dict()))

    for sid, row_list in groups.items():
        if len(row_list) > 1:
            first_row_num, first_r = row_list[0]
            p1 = str(first_r.get("program_code", "")).strip()
            l1 = str(first_r.get("course_level", "")).strip()

            for r_num, r_data in row_list[1:]:
                p2 = str(r_data.get("program_code", "")).strip()
                l2 = str(r_data.get("course_level", "")).strip()

                if p1 != p2 or l1 != l2:
                    issues.append(
                        make_issue(
                            rule_id="V026",
                            ctx=ctx,
                            row=r_num,
                            record_key=sid,
                            field="program_code",
                            message=f"Conflicting program affiliation across rows for student '{sid}'",
                            reason=(
                                f"Student '{sid}' is recorded with program '{p1}' (level {l1}) on row {first_row_num} "
                                f"and conflicting program '{p2}' (level {l2}) on row {r_num}."
                            ),
                            evidence={
                                "student_id": sid,
                                "row_a": first_row_num,
                                "program_a": p1,
                                "level_a": l1,
                                "row_b": r_num,
                                "program_b": p2,
                                "level_b": l2,
                            },
                            severity="ERROR",
                            priority="HIGH",
                            bucket="AUTO_FLAG",
                            confidence=1.0,
                        )
                    )

    return issues


@rule("V027")
def validate_v027_year_of_study_bounds(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """
    V027: year_of_study exceeds program duration or invalid for lateral.
    Ensures year_of_study <= total program duration, and lateral entry starts at >= 2.
    """
    issues: list[Issue] = []
    if "year_of_study" not in df.columns:
        return issues

    for idx, row in df.iterrows():
        row_num = int(idx) + 2
        rec_key = str(row.get("institution_student_id", f"row-{row_num}"))
        raw_yos = row.get("year_of_study")
        if raw_yos is None or str(raw_yos).strip().lower() in ("nan", "none", "null", ""):
            continue

        try:
            yos = int(float(str(raw_yos).strip()))
        except ValueError:
            continue

        prog_code = str(row.get("program_code", "")).strip()
        prog_rec = ctx.get_program(prog_code)
        duration = 4
        if prog_rec and "duration_years" in prog_rec:
            try:
                duration = int(prog_rec["duration_years"])
            except ValueError:
                pass
        else:
            course_level = str(row.get("course_level", "")).strip().upper()
            if course_level in ("PG", "PGDM", "DIPLOMA"):
                duration = 2
            elif course_level == "PHD":
                duration = 3

        # Check year_of_study > duration
        if yos > duration:
            issues.append(
                make_issue(
                    rule_id="V027",
                    ctx=ctx,
                    row=row_num,
                    record_key=rec_key,
                    field="year_of_study",
                    message=f"Year of study ({yos}) exceeds program duration of {duration} years",
                    reason=(
                        f"Student recorded in year {yos}, but program '{prog_code or 'selected'}' "
                        f"has a maximum duration of {duration} years."
                    ),
                    evidence={
                        "year_of_study": yos,
                        "program_code": prog_code,
                        "duration_years": duration,
                    },
                    severity="ERROR",
                    priority="HIGH",
                    bucket="AUTO_FLAG",
                    confidence=1.0,
                )
            )

        # Check lateral entry invalid for Year 1
        adm_type = str(row.get("admission_type", "")).strip().upper()
        if adm_type == "LATERAL" and yos < 2:
            issues.append(
                make_issue(
                    rule_id="V027",
                    ctx=ctx,
                    row=row_num,
                    record_key=rec_key,
                    field="year_of_study",
                    message="Lateral entry student cannot be in Year 1",
                    reason=f"Lateral admission entry is directly into Year 2 or above, but year_of_study is {yos}.",
                    evidence={"admission_type": "LATERAL", "year_of_study": yos},
                    severity="ERROR",
                    priority="HIGH",
                    bucket="AUTO_FLAG",
                    confidence=1.0,
                )
            )

    return issues
