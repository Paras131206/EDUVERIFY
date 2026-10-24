"""
Deterministic synthetic data generator for EduVerify.
Generates realistic Indian student records, master context, seeded defects, and demo batches.
Reproducible with --seed 42.
"""

import argparse
import csv
import json
import random
from datetime import date
from pathlib import Path

import pandas as pd

# Curated Indian names across regions
FIRST_NAMES_MALE = [
    "Aarav",
    "Aditya",
    "Amit",
    "Ananya",
    "Arjun",
    "Deepak",
    "Devendra",
    "Gaurav",
    "Harish",
    "Ishaan",
    "Karan",
    "Kunal",
    "Lakshman",
    "Manish",
    "Mayank",
    "Mohit",
    "Mohammad",
    "Mohammed",
    "Mohd.",
    "Naveen",
    "Nikhil",
    "Nitin",
    "Pranav",
    "Prateek",
    "Rahul",
    "Rakesh",
    "Rohan",
    "Rohit",
    "Sachin",
    "Sameer",
    "Sanjay",
    "Siddharth",
    "Suresh",
    "Varun",
    "Vikas",
    "Vinay",
    "Vishal",
    "Vivek",
    "Yash",
    "Zaid",
]

FIRST_NAMES_FEMALE = [
    "Aarti",
    "Aditi",
    "Ananya",
    "Ankita",
    "Bhavna",
    "Deepika",
    "Divya",
    "Gayatri",
    "Ishita",
    "Kavita",
    "Kirti",
    "Komal",
    "Lakshmi",
    "Laxmi",
    "Meera",
    "Neha",
    "Nikita",
    "Pooja",
    "Prerna",
    "Priya",
    "Priyanka",
    "Radha",
    "Ritu",
    "Roshni",
    "Sakshi",
    "Shreya",
    "Shruti",
    "Sneha",
    "Sonali",
    "Swati",
    "Tanya",
    "Vaishali",
]

LAST_NAMES = [
    "Agarwal",
    "Bose",
    "Chauhan",
    "Das",
    "Deshmukh",
    "Gupta",
    "Iyer",
    "Jadhav",
    "Jain",
    "Joshi",
    "Khan",
    "Kumar",
    "Mehta",
    "Mishra",
    "Mukherjee",
    "Nair",
    "Patel",
    "Patil",
    "Pillai",
    "Prasad",
    "Rao",
    "Reddy",
    "Roy",
    "Saxena",
    "Sen",
    "Shah",
    "Sharma",
    "Singh",
    "Srivastava",
    "Trivedi",
    "Varma",
    "Verma",
    "Yadav",
]

PROGRAM_CODES = [
    ("UG-CSE", "UG", 4, True),
    ("UG-IT", "UG", 4, True),
    ("UG-AI-ML", "UG", 4, True),
    ("UG-ECE", "UG", 4, True),
    ("UG-EE", "UG", 4, True),
    ("UG-ME", "UG", 4, True),
    ("UG-CE", "UG", 4, True),
    ("PG-CSE", "PG", 2, False),
    ("PG-MBA", "PG", 2, False),
    ("DIP-CSE", "DIPLOMA", 3, False),
]

CATEGORIES = ["GEN", "OBC-NCL", "SC", "ST", "EWS"]
CATEGORY_WEIGHTS = [0.45, 0.27, 0.15, 0.08, 0.05]

SUPERNUMERARY_SCHEMES = ["TFW", "PMSSS", "JK", "NE", "FN_OCI_NRI", "PWD"]


def generate_apaar_id(rng: random.Random) -> str:
    """Generates a plausible 12-digit APAAR ID as a string with leading digits."""
    return "".join(str(rng.randint(0, 9)) for _ in range(12))


def generate_indian_dob(
    rng: random.Random, course_level: str, admission_year: int
) -> date:
    """Generates plausible DOB based on course level and admission year."""
    if course_level == "DIPLOMA":
        age = rng.randint(15, 18)
    elif course_level == "UG":
        age = rng.randint(17, 21)
    elif course_level in ("PG", "PGDM"):
        age = rng.randint(21, 26)
    else:
        age = rng.randint(24, 32)
    birth_year = admission_year - age
    birth_month = rng.randint(1, 12)
    birth_day = rng.randint(1, 28)
    return date(birth_year, birth_month, birth_day)


def generate_dataset(
    seed: int = 42,
    num_students: int = 20000,
    out_dir: Path | None = None,
    demo_dir: Path | None = None,
):
    rng = random.Random(seed)

    if out_dir is None:
        out_dir = Path("data/synthetic")
    if demo_dir is None:
        demo_dir = Path("data/demo")

    out_dir.mkdir(parents=True, exist_ok=True)
    demo_dir.mkdir(parents=True, exist_ok=True)

    academic_year = "2026-27"
    admission_year = 2026

    # 1. Generate APAAR Registry
    print(f"Generating registry for {num_students} students (seed={seed})...")
    registry_records = []
    student_pool = []

    for _ in range(num_students):
        apaar = generate_apaar_id(rng)
        is_male = rng.random() < 0.55
        if is_male:
            first = rng.choice(FIRST_NAMES_MALE)
            gender = "M"
        else:
            first = rng.choice(FIRST_NAMES_FEMALE)
            gender = "F"
        last = rng.choice(LAST_NAMES)
        full_name = f"{first} {last}"

        # Default UG level for age estimation
        dob = generate_indian_dob(rng, "UG", admission_year)
        record = {
            "apaar_id": apaar,
            "full_name": full_name,
            "dob": dob.isoformat(),
            "gender": gender,
        }
        registry_records.append(record)
        student_pool.append(record)

    with open(out_dir / "registry.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f, fieldnames=["apaar_id", "full_name", "dob", "gender"]
        )
        writer.writeheader()
        writer.writerows(registry_records)

    # 2. Generate Program Intake for 40 institutions
    print("Generating program intake...")
    intake_records = []
    institutions = [f"1-1000100{i:02d}" for i in range(1, 41)]

    for inst in institutions:
        for prog_code, level, _dur, _lat in PROGRAM_CODES:
            approved = rng.choice([60, 120, 180, 240] if level == "UG" else [30, 60])
            schemes = {
                "TFW": int(approved * 0.05),
                "PMSSS": 2,
                "JK": 1,
                "NE": 1,
                "FN_OCI_NRI": int(approved * 0.15),
                "PWD": int(approved * 0.05),
            }
            intake_records.append(
                {
                    "institution_aicte_id": inst,
                    "program_code": prog_code,
                    "academic_year": academic_year,
                    "approved_intake": approved,
                    "supernumerary_allowed": json.dumps(schemes),
                    "approval_letter_ref": f"AICTE/AB/2026/{inst[-4:]}/{prog_code}",
                }
            )

    with open(out_dir / "intake.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "institution_aicte_id",
                "program_code",
                "academic_year",
                "approved_intake",
                "supernumerary_allowed",
                "approval_letter_ref",
            ],
        )
        writer.writeheader()
        writer.writerows(intake_records)

    # 3. Generate Declared Totals (Statistical submissions)
    print("Generating declared totals...")
    declared_records = []
    for inst in institutions:
        for prog_code, level, _dur, _lat in PROGRAM_CODES:
            # Baseline close to intake
            approved = 60 if level != "UG" else 120
            # Some deliberate discrepancies for reconciliation testing
            mismatch = rng.random() < 0.15
            delta = rng.randint(-8, 5) if mismatch else 0
            declared = max(10, approved - delta)
            declared_records.append(
                {
                    "institution_aicte_id": inst,
                    "program_code": prog_code,
                    "academic_year": academic_year,
                    "declared_enrolment": declared,
                    "declared_supernumerary": int(declared * 0.08),
                    "declared_nri": int(declared * 0.05),
                    "declared_oci": 0,
                    "declared_fn": 0,
                    "source": "APPROVAL_PROCESS",
                    "submitted_at": "2026-05-15T10:00:00Z",
                }
            )

    with open(out_dir / "declared_totals.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "institution_aicte_id",
                "program_code",
                "academic_year",
                "declared_enrolment",
                "declared_supernumerary",
                "declared_nri",
                "declared_oci",
                "declared_fn",
                "source",
                "submitted_at",
            ],
        )
        writer.writeheader()
        writer.writerows(declared_records)

    # 4. Generate Central Snapshot (Already committed students in central repository)
    print("Generating central repository snapshot...")
    snapshot_records = []
    # Commit first 5000 students to various neighbour institutions
    for i in range(min(5000, len(student_pool))):
        st = student_pool[i]
        inst = institutions[1 + (i % 30)]  # not primary demo institution 1-100010001
        prog = rng.choice(PROGRAM_CODES)
        snapshot_records.append(
            {
                "apaar_id": st["apaar_id"],
                "institution_aicte_id": inst,
                "academic_year": academic_year,
                "enrolment_status": "ACTIVE",
                "full_name": st["full_name"],
                "dob": st["dob"],
                "gender": st["gender"],
                "institution_student_id": f"ROLL-{20260000 + i}",
                "program_code": prog[0],
            }
        )

    with open(out_dir / "central_snapshot.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "apaar_id",
                "institution_aicte_id",
                "academic_year",
                "enrolment_status",
                "full_name",
                "dob",
                "gender",
                "institution_student_id",
                "program_code",
            ],
        )
        writer.writeheader()
        writer.writerows(snapshot_records)

    # 5. Generate Transfers (Approved and Open)
    print("Generating transfer requests...")
    transfer_records = []
    # Pick a few from snapshot to have approved or pending transfers
    for i in range(20):
        src_student = snapshot_records[i]
        status = "APPROVED" if i < 10 else "OPEN"
        transfer_records.append(
            {
                "transfer_id": f"TRF-{1000 + i}",
                "apaar_id": src_student["apaar_id"],
                "from_institution": src_student["institution_aicte_id"],
                "to_institution": "1-100010001",  # Transferring into primary demo institution
                "academic_year": academic_year,
                "status": status,
                "created_at": "2026-07-15T09:00:00Z",
                "decided_at": "2026-07-20T14:30:00Z" if status == "APPROVED" else "",
                "reason": "Parent relocation" if i % 2 == 0 else "Curriculum alignment",
            }
        )

    with open(out_dir / "transfers.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "transfer_id",
                "apaar_id",
                "from_institution",
                "to_institution",
                "academic_year",
                "status",
                "created_at",
                "decided_at",
                "reason",
            ],
        )
        writer.writeheader()
        writer.writerows(transfer_records)

    # 6. Generate History Metrics
    print("Generating history metrics...")
    history_records = []
    for inst in institutions[:10]:
        for b_idx in range(1, 7):
            history_records.append(
                {
                    "institution_aicte_id": inst,
                    "batch_number": b_idx,
                    "rows_total": rng.randint(200, 500),
                    "null_rate": round(rng.uniform(0.01, 0.04), 4),
                    "nri_share": round(rng.uniform(0.03, 0.06), 4),
                    "supernumerary_share": round(rng.uniform(0.05, 0.08), 4),
                    "duplicate_rate": round(rng.uniform(0.00, 0.01), 4),
                    "quality_score": round(rng.uniform(92.0, 98.5), 1),
                    "committed_at": f"2025-08-{b_idx * 4:02d}T10:00:00Z",
                }
            )

    with open(out_dir / "history_metrics.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "institution_aicte_id",
                "batch_number",
                "rows_total",
                "null_rate",
                "nri_share",
                "supernumerary_share",
                "duplicate_rate",
                "quality_score",
                "committed_at",
            ],
        )
        writer.writeheader()
        writer.writerows(history_records)

    # =========================================================================
    # 7. GENERATE DEMO BATCHES FOR DEMO INSTITUTION 1-100010001
    # =========================================================================
    print("Generating demo batches in data/demo/...")
    demo_inst = "1-100010001"

    # Save demo context files matching 1-100010001 + 3 neighbours
    demo_institutions = ["1-100010001", "1-100010002", "1-100010003", "1-100010004"]

    with open(demo_dir / "demo_intake.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "institution_aicte_id",
                "program_code",
                "academic_year",
                "approved_intake",
                "supernumerary_allowed",
                "approval_letter_ref",
            ],
        )
        writer.writeheader()
        for r in intake_records:
            if r["institution_aicte_id"] in demo_institutions:
                writer.writerow(r)

    with open(
        demo_dir / "demo_declared_totals.csv", "w", newline="", encoding="utf-8"
    ) as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "institution_aicte_id",
                "program_code",
                "academic_year",
                "declared_enrolment",
                "declared_supernumerary",
                "declared_nri",
                "declared_oci",
                "declared_fn",
                "source",
                "submitted_at",
            ],
        )
        writer.writeheader()
        for r in declared_records:
            if r["institution_aicte_id"] in demo_institutions:
                writer.writerow(r)

    with open(
        demo_dir / "demo_central_snapshot.csv", "w", newline="", encoding="utf-8"
    ) as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "apaar_id",
                "institution_aicte_id",
                "academic_year",
                "enrolment_status",
                "full_name",
                "dob",
                "gender",
                "institution_student_id",
                "program_code",
            ],
        )
        writer.writeheader()
        for r in snapshot_records[:200]:
            writer.writerow(r)

    with open(demo_dir / "demo_transfers.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "transfer_id",
                "apaar_id",
                "from_institution",
                "to_institution",
                "academic_year",
                "status",
                "created_at",
                "decided_at",
                "reason",
            ],
        )
        writer.writeheader()
        writer.writerows(transfer_records)

    with open(demo_dir / "demo_history.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "institution_aicte_id",
                "batch_number",
                "rows_total",
                "null_rate",
                "nri_share",
                "supernumerary_share",
                "duplicate_rate",
                "quality_score",
                "committed_at",
            ],
        )
        writer.writeheader()
        for r in history_records:
            if r["institution_aicte_id"] == demo_inst:
                writer.writerow(r)

    # Demo registry subset (contains students used in demo batches)
    # Reserve students from 5000..10000 for demo batches
    demo_pool_idx = 5000 if len(student_pool) > 5500 else 0

    def get_pool_student(idx: int):
        return student_pool[idx % len(student_pool)]

    def make_clean_record(
        apaar,
        name,
        dob_str,
        gender,
        roll_num,
        prog_code="UG-CSE",
        adm_type="REGULAR",
        yr=1,
        exp_grad=2030,
    ):
        return {
            "apaar_id": apaar,
            "institution_aicte_id": demo_inst,
            "institution_student_id": f"2026-CSE-{roll_num:03d}",
            "full_name": name,
            "dob": dob_str,
            "gender": gender,
            "category": "GEN",
            "pwd": "False",
            "program_code": prog_code,
            "course_level": "UG",
            "department": "Computer Science",
            "academic_year": academic_year,
            "year_of_study": yr,
            "admission_date": "2026-08-10",
            "admission_type": adm_type,
            "expected_graduation_year": exp_grad,
            "seat_type": "REGULAR",
            "supernumerary_scheme": "",
            "quota": "NONE",
            "nationality": "IN",
            "nri_status": "False",
            "oci_status": "False",
            "fn_status": "False",
            "enrolment_status": "ACTIVE",
            "consent_status": "GRANTED",
            "consent_date": "2026-08-10",
            "guardian_consent": "False",
            "email": f"student{roll_num:03d}@dcet.eduverify.ac.in",
            "mobile": f"98765{roll_num:05d}",
        }

    # BATCH 1: Clean (50 rows, 0 errors, 0 warnings)
    batch_1_rows = []
    for i in range(1, 51):
        st = get_pool_student(demo_pool_idx + i)
        rec = make_clean_record(
            apaar=st["apaar_id"],
            name=st["full_name"],
            dob_str=st["dob"],
            gender=st["gender"],
            roll_num=i,
            prog_code="UG-CSE",
            exp_grad=2030,
        )
        batch_1_rows.append(rec)

    with open(demo_dir / "batch_1_clean.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(batch_1_rows[0].keys()))
        writer.writeheader()
        writer.writerows(batch_1_rows)

    demo_pool_idx += 100

    # BATCH 2: Errors & Excel with non-standard headers (50 rows)
    # Headers: PRN (institution_student_id), DOB (dob), Dept (department),
    # APAAR No (apaar_id), Candidate Name (full_name)...
    # Seeded defects: V002, V005, V014, V015, V018, V023, V024, V025, V027
    batch_2_rows = []
    ground_truth = []

    for i in range(1, 51):
        st = get_pool_student(demo_pool_idx + i)
        # Base valid record
        row_dict = {
            "APAAR No": st["apaar_id"],
            "institution_aicte_id": demo_inst,
            "PRN": f"2026-CSE-{100 + i:03d}",
            "Candidate Name": st["full_name"],
            "DOB": st["dob"],
            "Gender": st["gender"],
            "Category": "GEN",
            "Dept": "Computer Science",
            "Program Code": "UG-CSE",
            "Course Level": "UG",
            "Academic Year": academic_year,
            "Year of Study": 1,
            "Admission Date": "2026-08-10",
            "Admission Type": "REGULAR",
            "Expected Graduation Year": 2030,
            "Seat Type": "REGULAR",
            "Supernumerary Scheme": "",
            "Quota": "NONE",
            "Nationality": "IN",
            "NRI Status": "False",
            "OCI Status": "False",
            "FN Status": "False",
            "Enrolment Status": "ACTIVE",
            "Consent Status": "GRANTED",
            "Consent Date": "2026-08-10",
            "Guardian Consent": "False",
            "Email": f"st{100 + i}@dcet.ac.in",
            "Mobile": f"98111{100 + i:05d}",
        }

        # Seed defects at specific rows (1-indexed header + row => row i+1)
        # Note: row index in spreadsheet = i + 1
        curr_row = i + 1

        if i == 2:
            # V002: APAAR not 12 digits (10 digits)
            row_dict["APAAR No"] = "1234567890"
            ground_truth.append(
                {
                    "row": curr_row,
                    "file": "batch_2_errors.xlsx",
                    "rule_id": "V002",
                    "field": "apaar_id",
                }
            )
        elif i == 5:
            # V023: Excel scientific notation APAAR (1.23457E+11)
            row_dict["APAAR No"] = "1.23457E+11"
            ground_truth.append(
                {
                    "row": curr_row,
                    "file": "batch_2_errors.xlsx",
                    "rule_id": "V023",
                    "field": "apaar_id",
                }
            )
        elif i == 8:
            # V005: Required field null (Candidate Name is empty)
            row_dict["Candidate Name"] = ""
            ground_truth.append(
                {
                    "row": curr_row,
                    "file": "batch_2_errors.xlsx",
                    "rule_id": "V005",
                    "field": "full_name",
                }
            )
        elif i == 12:
            # V025: Expected graduation year inconsistent (2028 instead of 2030)
            row_dict["Expected Graduation Year"] = 2028
            ground_truth.append(
                {
                    "row": curr_row,
                    "file": "batch_2_errors.xlsx",
                    "rule_id": "V025",
                    "field": "expected_graduation_year",
                }
            )
        elif i == 15:
            # V014: Quota NRI but NRI status is False
            row_dict["Quota"] = "NRI"
            row_dict["NRI Status"] = "False"
            ground_truth.append(
                {
                    "row": curr_row,
                    "file": "batch_2_errors.xlsx",
                    "rule_id": "V014",
                    "field": "nri_status",
                }
            )
        elif i == 18:
            # V015: Regular seat but supernumerary scheme specified
            row_dict["Seat Type"] = "REGULAR"
            row_dict["Supernumerary Scheme"] = "TFW"
            ground_truth.append(
                {
                    "row": curr_row,
                    "file": "batch_2_errors.xlsx",
                    "rule_id": "V015",
                    "field": "supernumerary_scheme",
                }
            )
        elif i == 22:
            # V018: Consent status REFUSED
            row_dict["Consent Status"] = "REFUSED"
            ground_truth.append(
                {
                    "row": curr_row,
                    "file": "batch_2_errors.xlsx",
                    "rule_id": "V018",
                    "field": "consent_status",
                }
            )
        elif i == 26:
            # V024: Ambiguous/unparseable date "31/02/2026"
            row_dict["Admission Date"] = "31/02/2026"
            ground_truth.append(
                {
                    "row": curr_row,
                    "file": "batch_2_errors.xlsx",
                    "rule_id": "V024",
                    "field": "admission_date",
                }
            )
        elif i == 30:
            # V027: Year of study > program duration (year 5 for 4y program)
            row_dict["Year of Study"] = 5
            ground_truth.append(
                {
                    "row": curr_row,
                    "file": "batch_2_errors.xlsx",
                    "rule_id": "V027",
                    "field": "year_of_study",
                }
            )

        batch_2_rows.append(row_dict)

    df_b2 = pd.DataFrame(batch_2_rows)
    df_b2.to_excel(demo_dir / "batch_2_errors.xlsx", index=False)

    demo_pool_idx += 100

    # BATCH 3: Deduplication & Cross-institution (40 rows)
    # Seeded:
    # 1. Intra-batch fuzzy duplicate (Row 2 & 3: "Rahul Sharma" vs "Rahul S. Sharma",
    #    same DOB/gender, different APAAR => V009)
    # 2. Transliteration dup (Row 6 & 7: "Lakshmi Iyer" vs "Laxmi Iyer", same DOB => V009)
    # 3. Cross-institution ACTIVE dup (Row 10 has APAAR from central_snapshot
    #    with no transfer => V010)
    # 4. Approved transfer student (Row 14 has APAAR from transfers with status
    #    APPROVED => must NOT be flagged V010!)
    # 5. Open/Pending transfer student (Row 18 has APAAR from transfers with status OPEN => V032)
    # 6. Twins case (Row 22 & 23: same DOB, same last name, different first names
    #    "Amit" vs "Sumit" => NOT auto-flagged!)
    batch_3_rows = []

    # Base 40 clean students
    for i in range(1, 41):
        st = get_pool_student(demo_pool_idx + i)
        rec = make_clean_record(
            apaar=st["apaar_id"],
            name=st["full_name"],
            dob_str=st["dob"],
            gender=st["gender"],
            roll_num=200 + i,
            prog_code="UG-CSE",
        )
        batch_3_rows.append(rec)

    # Inject duplicate cases:
    # Case 1: Intra-batch fuzzy
    batch_3_rows[1]["full_name"] = "Rahul Sharma"
    batch_3_rows[1]["dob"] = "2006-05-14"
    batch_3_rows[1]["gender"] = "M"

    batch_3_rows[2]["full_name"] = "Rahul S. Sharma"
    batch_3_rows[2]["dob"] = "2006-05-14"
    batch_3_rows[2]["gender"] = "M"
    ground_truth.append(
        {
            "row": 4,
            "file": "batch_3_cross_dupes.csv",
            "rule_id": "V009",
            "field": "full_name",
        }
    )

    # Case 2: Transliteration
    batch_3_rows[5]["full_name"] = "Lakshmi Iyer"
    batch_3_rows[5]["dob"] = "2006-09-21"
    batch_3_rows[5]["gender"] = "F"

    batch_3_rows[6]["full_name"] = "Laxmi Iyer"
    batch_3_rows[6]["dob"] = "2006-09-21"
    batch_3_rows[6]["gender"] = "F"
    ground_truth.append(
        {
            "row": 8,
            "file": "batch_3_cross_dupes.csv",
            "rule_id": "V009",
            "field": "full_name",
        }
    )

    # Case 3: Cross-institution active duplicate (from snapshot)
    cross_active = snapshot_records[50 % len(snapshot_records)]
    batch_3_rows[9]["apaar_id"] = cross_active["apaar_id"]
    batch_3_rows[9]["full_name"] = cross_active["full_name"]
    batch_3_rows[9]["dob"] = cross_active["dob"]
    ground_truth.append(
        {
            "row": 11,
            "file": "batch_3_cross_dupes.csv",
            "rule_id": "V010",
            "field": "apaar_id",
        }
    )

    # Case 4: Approved transfer student (from transfer_records)
    app_trf = transfer_records[0]
    batch_3_rows[13]["apaar_id"] = app_trf["apaar_id"]
    batch_3_rows[13]["admission_type"] = "TRANSFER_IN"
    # Note: Must NOT be flagged V010

    # Case 5: Open/Pending transfer student (from transfer_records)
    open_trf = transfer_records[min(12, len(transfer_records) - 1)]
    batch_3_rows[17]["apaar_id"] = open_trf["apaar_id"]
    batch_3_rows[17]["admission_type"] = "TRANSFER_IN"
    ground_truth.append(
        {
            "row": 19,
            "file": "batch_3_cross_dupes.csv",
            "rule_id": "V032",
            "field": "apaar_id",
        }
    )

    # Case 6: Twins (valid distinct records, must not be merged or flagged as duplicate)
    batch_3_rows[21]["full_name"] = "Amit Verma"
    batch_3_rows[21]["dob"] = "2006-11-03"
    batch_3_rows[21]["gender"] = "M"

    batch_3_rows[22]["full_name"] = "Sumit Verma"
    batch_3_rows[22]["dob"] = "2006-11-03"
    batch_3_rows[22]["gender"] = "M"

    with open(
        demo_dir / "batch_3_cross_dupes.csv", "w", newline="", encoding="utf-8"
    ) as f:
        writer = csv.DictWriter(f, fieldnames=list(batch_3_rows[0].keys()))
        writer.writeheader()
        writer.writerows(batch_3_rows)

    demo_pool_idx += 100

    # BATCH 4: Schema drift & Anomaly (60 rows)
    # Seeded:
    # 1. Anomaly: NRI share spike (24 out of 60 rows = 40% NRI vs historical baseline 5% => V020)
    # 2. Drift: Column removed (e.g. guardian_consent removed)
    # 3. Drift: New category value (Category = "SPORTS_QUOTA")
    batch_4_rows = []
    for i in range(1, 61):
        st = get_pool_student(demo_pool_idx + i)
        is_nri = i <= 24  # 40% NRI spike
        cat = "SPORTS_QUOTA" if i == 5 else "GEN"

        rec = make_clean_record(
            apaar=st["apaar_id"],
            name=st["full_name"],
            dob_str=st["dob"],
            gender=st["gender"],
            roll_num=300 + i,
            prog_code="UG-CSE",
        )
        if is_nri:
            rec["quota"] = "NRI"
            rec["nri_status"] = "True"
            rec["nationality"] = "US"
        rec["category"] = cat

        # Simulate column removal: delete 'guardian_consent'
        del rec["guardian_consent"]
        batch_4_rows.append(rec)

    ground_truth.append(
        {
            "row": 1,
            "file": "batch_4_anomaly_drift.csv",
            "rule_id": "V028",
            "field": "guardian_consent",
        }
    )
    ground_truth.append(
        {
            "row": 6,
            "file": "batch_4_anomaly_drift.csv",
            "rule_id": "V029",
            "field": "category",
        }
    )
    ground_truth.append(
        {
            "row": 0,
            "file": "batch_4_anomaly_drift.csv",
            "rule_id": "V020",
            "field": "nri_share",
        }
    )

    with open(
        demo_dir / "batch_4_anomaly_drift.csv", "w", newline="", encoding="utf-8"
    ) as f:
        writer = csv.DictWriter(f, fieldnames=list(batch_4_rows[0].keys()))
        writer.writeheader()
        writer.writerows(batch_4_rows)

    # Write ground truth to synthetic and demo
    with open(out_dir / "ground_truth.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["row", "file", "rule_id", "field"])
        writer.writeheader()
        writer.writerows(ground_truth)

    with open(demo_dir / "ground_truth.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["row", "file", "rule_id", "field"])
        writer.writeheader()
        writer.writerows(ground_truth)

    # Demo registry: union of all students present in demo batches + snapshot
    demo_apaars = set()
    for b in [batch_1_rows, batch_2_rows, batch_3_rows, batch_4_rows]:
        for r in b:
            apaar = r.get("apaar_id") or r.get("APAAR No")
            if apaar and len(str(apaar)) == 12:
                demo_apaars.add(str(apaar))

    demo_registry = [r for r in registry_records if r["apaar_id"] in demo_apaars]
    with open(demo_dir / "demo_registry.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f, fieldnames=["apaar_id", "full_name", "dob", "gender"]
        )
        writer.writeheader()
        writer.writerows(demo_registry)

    print(f"Generated demo datasets in {demo_dir}:")
    print(f"  - batch_1_clean.csv ({len(batch_1_rows)} rows)")
    print(f"  - batch_2_errors.xlsx ({len(batch_2_rows)} rows)")
    print(f"  - batch_3_cross_dupes.csv ({len(batch_3_rows)} rows)")
    print(f"  - batch_4_anomaly_drift.csv ({len(batch_4_rows)} rows)")
    print(f"  - demo_registry.csv ({len(demo_registry)} entries)")
    print(f"  - ground_truth.csv ({len(ground_truth)} seeded defects)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="EduVerify Synthetic Data Generator")
    parser.add_argument(
        "--seed", type=int, default=42, help="Random seed for deterministic output"
    )
    parser.add_argument(
        "--students", type=int, default=20000, help="Number of registered students"
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path("data/synthetic"),
        help="Synthetic output directory",
    )
    parser.add_argument(
        "--demo-dir", type=Path, default=Path("data/demo"), help="Demo directory"
    )
    args = parser.parse_args()

    generate_dataset(
        seed=args.seed,
        num_students=args.students,
        out_dir=args.out_dir,
        demo_dir=args.demo_dir,
    )
