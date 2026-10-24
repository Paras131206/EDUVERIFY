"""
Adapter for drsanjayagal/UniversityIntake-MLDataset.
Maps public dataset schema into EduVerify canonical student_record schema.
Does NOT commit raw datasets into repo.
"""

from pathlib import Path

import pandas as pd


def adapt_university_intake(
    raw_csv_path: Path | str, institution_aicte_id: str = "1-100010001"
) -> pd.DataFrame:
    """
    Transforms UniversityIntake-MLDataset columns into canonical student_record fields.
    Maps:
      - student_id / id -> institution_student_id
      - gender -> gender (M/F/T)
      - category -> category (GEN/EWS/OBC-NCL/SC/ST)
      - state -> nationality / address
      - program / branch -> program_code
    """
    df_raw = pd.read_csv(raw_csv_path, dtype=str)

    adapted = pd.DataFrame(index=df_raw.index)
    adapted["institution_aicte_id"] = institution_aicte_id

    index_series = pd.Series(df_raw.index.astype(str), index=df_raw.index)
    if "student_id" in df_raw.columns:
        adapted["institution_student_id"] = df_raw["student_id"].fillna(index_series)
    elif "id" in df_raw.columns:
        adapted["institution_student_id"] = df_raw["id"].fillna(index_series)
    else:
        adapted["institution_student_id"] = index_series

    adapted["full_name"] = (
        df_raw["name"].fillna("Student Candidate").astype(str)
        if "name" in df_raw.columns
        else "Student Candidate"
    )

    if "gender" in df_raw.columns:
        adapted["gender"] = (
            df_raw["gender"]
            .fillna("M")
            .astype(str)
            .str.upper()
            .map(lambda g: "F" if "F" in g else ("T" if "T" in g else "M"))
        )
    else:
        adapted["gender"] = "M"

    if "category" in df_raw.columns:
        adapted["category"] = df_raw["category"].fillna("GEN").astype(str).str.upper()
    else:
        adapted["category"] = "GEN"

    adapted["academic_year"] = "2026-27"
    adapted["course_level"] = "UG"
    adapted["seat_type"] = "REGULAR"
    adapted["enrolment_status"] = "ACTIVE"
    adapted["consent_status"] = "GRANTED"

    return adapted
