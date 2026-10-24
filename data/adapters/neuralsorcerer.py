"""
Adapter for neuralsorcerer/student-performance (HuggingFace, CC0).
Maps student performance and demographics into EduVerify canonical student_record schema.
"""

from __future__ import annotations

from typing import Any
import pandas as pd


def adapt_neuralsorcerer(
    raw_df_or_path: pd.DataFrame | str,
    institution_aicte_id: str = "1-100010001",
    academic_year: str = "2026-27",
) -> pd.DataFrame:
    """
    Transforms neuralsorcerer student dataset into EduVerify canonical student_record schema.
    """
    if isinstance(raw_df_or_path, pd.DataFrame):
        df_raw = raw_df_or_path
    else:
        df_raw = pd.read_csv(raw_df_or_path, dtype=str)

    num_rows = len(df_raw)
    adapted = pd.DataFrame(index=df_raw.index)
    adapted["institution_aicte_id"] = institution_aicte_id

    # Student ID
    if "Student_ID" in df_raw.columns:
        adapted["institution_student_id"] = df_raw["Student_ID"].astype(str)
    elif "student_id" in df_raw.columns:
        adapted["institution_student_id"] = df_raw["student_id"].astype(str)
    else:
        adapted["institution_student_id"] = [f"2026-STU-{i+1:05d}" for i in range(num_rows)]

    # Name
    if "full_name" in df_raw.columns:
        adapted["full_name"] = df_raw["full_name"].astype(str)
    elif "Name" in df_raw.columns:
        adapted["full_name"] = df_raw["Name"].astype(str)
    else:
        adapted["full_name"] = "Student Candidate"

    # Gender
    if "Gender" in df_raw.columns:
        adapted["gender"] = (
            df_raw["Gender"].astype(str).str.upper().map(lambda g: "F" if "F" in g else "M")
        )
    elif "gender" in df_raw.columns:
        adapted["gender"] = (
            df_raw["gender"].astype(str).str.upper().map(lambda g: "F" if "F" in g else "M")
        )
    else:
        adapted["gender"] = "M"

    # DOB / Age
    if "dob" in df_raw.columns:
        adapted["dob"] = df_raw["dob"].astype(str)
    elif "Age" in df_raw.columns:

        def _age_to_dob(a: Any) -> str:
            try:
                age_val = int(float(a))
            except Exception:
                age_val = 19
            birth_year = 2026 - age_val
            return f"{birth_year}-06-15"

        adapted["dob"] = df_raw["Age"].map(_age_to_dob)
    else:
        adapted["dob"] = "2006-05-15"

    # Category
    if "Category" in df_raw.columns:
        adapted["category"] = df_raw["Category"].astype(str).str.upper()
    elif "category" in df_raw.columns:
        adapted["category"] = df_raw["category"].astype(str).str.upper()
    else:
        adapted["category"] = "GEN"

    # Program & Department
    if "Department" in df_raw.columns:
        adapted["department"] = df_raw["Department"].astype(str)
    else:
        adapted["department"] = "Computer Science"

    if "Program_Code" in df_raw.columns:
        adapted["program_code"] = df_raw["Program_Code"].astype(str)
    else:
        adapted["program_code"] = "UG-CSE"

    adapted["course_level"] = "UG"
    adapted["academic_year"] = academic_year
    adapted["year_of_study"] = "1"
    adapted["admission_date"] = "2026-08-10"
    adapted["admission_type"] = "REGULAR"
    adapted["expected_graduation_year"] = "2030"
    adapted["seat_type"] = "REGULAR"
    adapted["supernumerary_scheme"] = ""
    adapted["quota"] = "NONE"
    adapted["nationality"] = "IN"
    adapted["nri_status"] = "False"
    adapted["oci_status"] = "False"
    adapted["fn_status"] = "False"
    adapted["enrolment_status"] = "ACTIVE"
    adapted["consent_status"] = "GRANTED"
    adapted["consent_date"] = "2026-08-10"
    adapted["guardian_consent"] = "False"

    return adapted
