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

    adapted = pd.DataFrame()
    adapted["institution_aicte_id"] = institution_aicte_id
    adapted["institution_student_id"] = df_raw.get(
        "student_id", df_raw.index.astype(str)
    )
    adapted["full_name"] = df_raw.get(
        "full_name", df_raw.get("name", "Student Candidate")
    )
    adapted["dob"] = df_raw.get("dob", "2006-05-15")
    adapted["gender"] = df_raw.get("gender", "M").str.upper()
    adapted["category"] = df_raw.get("category", "GEN")
    adapted["academic_year"] = "2026-27"
    adapted["year_of_study"] = df_raw.get("year", "1")
    adapted["admission_type"] = "REGULAR"
    adapted["seat_type"] = "REGULAR"
    adapted["nationality"] = "IN"
    adapted["enrolment_status"] = "ACTIVE"
    adapted["consent_status"] = "GRANTED"

    return adapted
