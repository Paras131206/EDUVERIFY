"""
Adapter for SynEdu-HEDL (Zenodo 10.5281/zenodo.18884938).
Maps synthetic multi-table higher education dataset to EduVerify schema.
"""

from pathlib import Path

import pandas as pd


def adapt_synedu_profile(
    profile_csv_path: Path | str, institution_aicte_id: str = "1-100010001"
) -> pd.DataFrame:
    """
    Transforms SynEdu STUDENT_PROFILE table into EduVerify canonical student_record schema.
    """
    df_raw = pd.read_csv(profile_csv_path, dtype=str)

    adapted = pd.DataFrame(index=df_raw.index)
    adapted["institution_aicte_id"] = institution_aicte_id

    index_series = pd.Series(df_raw.index.astype(str), index=df_raw.index)
    if "student_id" in df_raw.columns:
        adapted["institution_student_id"] = df_raw["student_id"].fillna(index_series)
    else:
        adapted["institution_student_id"] = index_series

    if "full_name" in df_raw.columns:
        adapted["full_name"] = df_raw["full_name"].fillna("Student Candidate").astype(str)
    elif "name" in df_raw.columns:
        adapted["full_name"] = df_raw["name"].fillna("Student Candidate").astype(str)
    else:
        adapted["full_name"] = "Student Candidate"

    adapted["dob"] = (
        df_raw["dob"].fillna("2006-05-15").astype(str)
        if "dob" in df_raw.columns
        else "2006-05-15"
    )

    if "gender" in df_raw.columns:
        adapted["gender"] = df_raw["gender"].fillna("M").astype(str).str.upper()
    else:
        adapted["gender"] = "M"

    adapted["category"] = (
        df_raw["category"].fillna("GEN").astype(str).str.upper()
        if "category" in df_raw.columns
        else "GEN"
    )
    adapted["academic_year"] = "2026-27"

    adapted["year_of_study"] = (
        df_raw["year"].fillna("1").astype(str)
        if "year" in df_raw.columns
        else "1"
    )

    adapted["admission_type"] = "REGULAR"
    adapted["seat_type"] = "REGULAR"
    adapted["nationality"] = "IN"
    adapted["enrolment_status"] = "ACTIVE"
    adapted["consent_status"] = "GRANTED"

    return adapted
