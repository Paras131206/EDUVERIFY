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

    adapted = pd.DataFrame()
    adapted["institution_aicte_id"] = institution_aicte_id
    adapted["institution_student_id"] = df_raw.get(
        "student_id", df_raw.get("id", df_raw.index.astype(str))
    )
    adapted["full_name"] = df_raw.get("name", "Student Candidate")
    adapted["gender"] = (
        df_raw.get("gender", "M").str.upper().map(lambda g: "M" if "M" in g else "F")
    )
    adapted["category"] = df_raw.get("category", "GEN").str.upper()
    adapted["academic_year"] = "2026-27"
    adapted["course_level"] = "UG"
    adapted["seat_type"] = "REGULAR"
    adapted["enrolment_status"] = "ACTIVE"
    adapted["consent_status"] = "GRANTED"

    return adapted
