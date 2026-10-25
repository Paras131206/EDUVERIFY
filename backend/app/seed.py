"""
Database seeding script for master data, demo data, and system accounts.
Complies with runthrough.md, agents.md §5, §7, §8, §9, and prompt B2.
Can be executed as: python -m app.seed [--if-empty]
"""

import argparse
import csv
import json
import logging
import sys
from datetime import UTC, date, datetime
from pathlib import Path

from app.config import get_settings
from app.db import Base, SessionLocal, engine
from app.models.auth import User
from app.models.core import (
    AcademicYear,
    DeclaredTotal,
    DegreeAwardingBody,
    District,
    EmployerAccessRequest,
    EnumItem,
    Institution,
    MetricHistory,
    MockApaarRegistry,
    Program,
    ProgramIntake,
    State,
    StudentAcademicRecord,
    StudentRecord,
    Transfer,
)
from app.security.crypto import encrypt_field, keyed_apaar_hash
from app.security.passwords import hash_password
from app.services.audit import append_audit_log
from sqlalchemy import select
from sqlalchemy.orm import Session

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)
settings = get_settings()

DEFAULT_DEV_PASSWORD = "AdminPassword@2026"  # nosec B105

DEMO_USERS = [
    {
        "email": "aicte.admin@demo.local",
        "full_name": "AICTE Administrator",
        "role": "AICTE_ADMIN",
        "institution_aicte_id": None,
        "dab_id": None,
        "student_apaar_hash": None,
    },
    {
        "email": "aicte.analyst@demo.local",
        "full_name": "AICTE Data Analyst",
        "role": "AICTE_ANALYST",
        "institution_aicte_id": None,
        "dab_id": None,
        "student_apaar_hash": None,
    },
    {
        "email": "inst.admin@demo.local",
        "full_name": "Delhi College Admin",
        "role": "INSTITUTION_ADMIN",
        "institution_aicte_id": "1-100010001",
        "dab_id": None,
        "student_apaar_hash": None,
    },
    {
        "email": "inst.staff@demo.local",
        "full_name": "Delhi College Staff",
        "role": "INSTITUTION_STAFF",
        "institution_aicte_id": "1-100010001",
        "dab_id": None,
        "student_apaar_hash": None,
    },
    {
        "email": "inst2.admin@demo.local",
        "full_name": "Capital Institute Admin",
        "role": "INSTITUTION_ADMIN",
        "institution_aicte_id": "1-100010002",
        "dab_id": None,
        "student_apaar_hash": None,
    },
    {
        "email": "dab.admin@demo.local",
        "full_name": "Delhi State Tech University Admin",
        "role": "DAB_ADMIN",
        "institution_aicte_id": None,
        "dab_id": "DAB-101",
        "student_apaar_hash": None,
    },
    {
        "email": "student@demo.local",
        "full_name": "Manish Mukherjee",
        "role": "STUDENT",
        "institution_aicte_id": "1-100010002",
        "dab_id": None,
        "student_apaar_hash": keyed_apaar_hash("104332181960"),
    },
    {
        "email": "verifier@demo.local",
        "full_name": "Corporate Verifier",
        "role": "VERIFIER",
        "institution_aicte_id": None,
        "dab_id": None,
        "student_apaar_hash": None,
    },
    {
        "email": "employer@demo.local",
        "full_name": "Tata Consultancy Services (Talent Acquisition)",
        "role": "EMPLOYER",
        "institution_aicte_id": None,
        "dab_id": None,
        "student_apaar_hash": None,
    },
]


def find_data_dir() -> Path:
    """Find data/ directory whether running from backend/ or repository root."""
    possible = [
        Path(__file__).resolve().parent.parent.parent / "data",
        Path("data"),
        Path("../data"),
    ]
    for p in possible:
        if p.exists() and (p / "master").exists():
            return p
    raise FileNotFoundError("Could not locate data/ directory with master/ and demo/ datasets")


def seed_states(db: Session, path: Path) -> int:
    if not path.exists():
        return 0
    count = 0
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = int(row["lgd_state_code"])
            existing = db.get(State, code)
            if existing:
                existing.name = row["name"]
                existing.name_hi = row["name_hi"]
            else:
                db.add(State(lgd_state_code=code, name=row["name"], name_hi=row["name_hi"]))
                count += 1
    db.flush()
    return count


def seed_districts(db: Session, path: Path) -> int:
    if not path.exists():
        return 0
    count = 0
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            d_code = int(row["lgd_district_code"])
            s_code = int(row["lgd_state_code"])
            existing = db.get(District, d_code)
            if existing:
                existing.lgd_state_code = s_code
                existing.name = row["name"]
            else:
                db.add(District(lgd_district_code=d_code, lgd_state_code=s_code, name=row["name"]))
                count += 1
    db.flush()
    return count


def seed_dabs(db: Session, path: Path) -> int:
    if not path.exists():
        return 0
    count = 0
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            dab_id = row["dab_id"].strip()
            state_code = int(row["state_code"])
            existing = db.get(DegreeAwardingBody, dab_id)
            if existing:
                existing.name = row["name"]
                existing.type = row["type"]
                existing.state_code = state_code
                existing.did = row["did"]
            else:
                db.add(
                    DegreeAwardingBody(
                        dab_id=dab_id,
                        name=row["name"],
                        type=row["type"],
                        state_code=state_code,
                        did=row["did"],
                    )
                )
                count += 1
    db.flush()
    return count


def seed_institutions(db: Session, path: Path) -> int:
    if not path.exists():
        return 0
    count = 0
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            inst_id = row["institution_aicte_id"].strip()
            state_code = int(row["state_code"])
            dist_code = int(row["district_code"])
            dab_id = row["affiliated_dab_id"].strip() if row.get("affiliated_dab_id") else None
            existing = db.get(Institution, inst_id)
            if existing:
                existing.name = row["name"]
                existing.state_code = state_code
                existing.district_code = dist_code
                existing.type = row["type"]
                existing.affiliated_dab_id = dab_id
                existing.onboarding_level = row["onboarding_level"]
                existing.did = row["did"]
            else:
                db.add(
                    Institution(
                        institution_aicte_id=inst_id,
                        name=row["name"],
                        state_code=state_code,
                        district_code=dist_code,
                        type=row["type"],
                        affiliated_dab_id=dab_id,
                        onboarding_level=row["onboarding_level"],
                        did=row["did"],
                    )
                )
                count += 1
    db.flush()
    return count


def seed_programs(db: Session, path: Path) -> int:
    if not path.exists():
        return 0
    count = 0
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            p_code = row["program_code"].strip()
            lat = row["lateral_allowed"].strip().lower() in ("true", "1", "yes")
            existing = db.get(Program, p_code)
            if existing:
                existing.name = row["name"]
                existing.course_level = row["course_level"]
                existing.department = row.get("department")
                existing.duration_years = int(row["duration_years"])
                existing.lateral_allowed = lat
            else:
                db.add(
                    Program(
                        program_code=p_code,
                        name=row["name"],
                        course_level=row["course_level"],
                        department=row.get("department"),
                        duration_years=int(row["duration_years"]),
                        lateral_allowed=lat,
                    )
                )
                count += 1
    db.flush()
    return count


def seed_academic_years(db: Session, path: Path) -> int:
    if not path.exists():
        return 0
    count = 0
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            ay = row["academic_year"].strip()
            curr = row["is_current"].strip().lower() in ("true", "1", "yes")
            s_date = date.fromisoformat(row["start_date"].strip())
            e_date = date.fromisoformat(row["end_date"].strip())
            w_start = date.fromisoformat(row["admission_window_start"].strip())
            w_end = date.fromisoformat(row["admission_window_end"].strip())
            existing = db.get(AcademicYear, ay)
            if existing:
                existing.start_date = s_date
                existing.end_date = e_date
                existing.admission_window_start = w_start
                existing.admission_window_end = w_end
                existing.is_current = curr
            else:
                db.add(
                    AcademicYear(
                        academic_year=ay,
                        start_date=s_date,
                        end_date=e_date,
                        admission_window_start=w_start,
                        admission_window_end=w_end,
                        is_current=curr,
                    )
                )
                count += 1
    db.flush()
    return count


def seed_enums(db: Session, path: Path) -> int:
    if not path.exists():
        return 0
    count = 0
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            e_name = row["enum_name"].strip()
            val = row["value"].strip()
            existing = db.get(EnumItem, (e_name, val))
            if existing:
                existing.label_en = row["label_en"]
                existing.label_hi = row["label_hi"]
            else:
                db.add(
                    EnumItem(
                        enum_name=e_name,
                        value=val,
                        label_en=row["label_en"],
                        label_hi=row["label_hi"],
                    )
                )
                count += 1
    db.flush()
    return count


def seed_demo_registry(db: Session, path: Path) -> int:
    if not path.exists():
        return 0
    count = 0
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            apaar = row["apaar_id"].strip()
            dob_val = date.fromisoformat(row["dob"].strip())
            existing = db.get(MockApaarRegistry, apaar)
            if existing:
                existing.full_name = row["full_name"]
                existing.dob = dob_val
                existing.gender = row["gender"]
            else:
                db.add(
                    MockApaarRegistry(
                        apaar_id=apaar,
                        full_name=row["full_name"],
                        dob=dob_val,
                        gender=row["gender"],
                    )
                )
                count += 1
    db.flush()
    return count


def seed_demo_intake(db: Session, path: Path) -> int:
    if not path.exists():
        return 0
    count = 0
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            inst = row["institution_aicte_id"].strip()
            prog = row["program_code"].strip()
            ay = row["academic_year"].strip()
            approved = int(row["approved_intake"])
            supernumerary = json.loads(row["supernumerary_allowed"])
            approval_ref = row.get("approval_letter_ref")

            stmt = select(ProgramIntake).where(
                ProgramIntake.institution_aicte_id == inst,
                ProgramIntake.program_code == prog,
                ProgramIntake.academic_year == ay,
            )
            existing = db.scalars(stmt).first()
            if existing:
                existing.approved_intake = approved
                existing.supernumerary_allowed = supernumerary
                existing.approval_letter_ref = approval_ref
            else:
                db.add(
                    ProgramIntake(
                        institution_aicte_id=inst,
                        program_code=prog,
                        academic_year=ay,
                        approved_intake=approved,
                        supernumerary_allowed=supernumerary,
                        approval_letter_ref=approval_ref,
                    )
                )
                count += 1
    db.flush()
    return count


def seed_demo_declared_totals(db: Session, path: Path) -> int:
    if not path.exists():
        return 0
    count = 0
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            inst = row["institution_aicte_id"].strip()
            prog = row["program_code"].strip()
            ay = row["academic_year"].strip()
            sub_at = datetime.fromisoformat(row["submitted_at"].strip().replace("Z", "+00:00"))

            stmt = select(DeclaredTotal).where(
                DeclaredTotal.institution_aicte_id == inst,
                DeclaredTotal.program_code == prog,
                DeclaredTotal.academic_year == ay,
            )
            existing = db.scalars(stmt).first()
            if existing:
                existing.declared_enrolment = int(row["declared_enrolment"])
                existing.declared_supernumerary = int(row["declared_supernumerary"])
                existing.declared_nri = int(row["declared_nri"])
                existing.declared_oci = int(row["declared_oci"])
                existing.declared_fn = int(row["declared_fn"])
                existing.source = row.get("source", "APPROVAL_PROCESS")
                existing.submitted_at = sub_at
            else:
                db.add(
                    DeclaredTotal(
                        institution_aicte_id=inst,
                        program_code=prog,
                        academic_year=ay,
                        declared_enrolment=int(row["declared_enrolment"]),
                        declared_supernumerary=int(row["declared_supernumerary"]),
                        declared_nri=int(row["declared_nri"]),
                        declared_oci=int(row["declared_oci"]),
                        declared_fn=int(row["declared_fn"]),
                        source=row.get("source", "APPROVAL_PROCESS"),
                        submitted_at=sub_at,
                    )
                )
                count += 1
    db.flush()
    return count


def seed_demo_central_snapshot(db: Session, path: Path) -> int:
    if not path.exists():
        return 0
    count = 0
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            apaar = row["apaar_id"].strip()
            dob_val = date.fromisoformat(row["dob"].strip())
            prog = row["program_code"].strip()
            level = "UG" if prog.startswith("UG") else "PG" if prog.startswith("PG") else "DIPLOMA"
            full_name = row["full_name"].strip()
            email_enc = encrypt_field(f"{full_name.lower().replace(' ', '.')}@demo.ac.in")
            mobile_enc = encrypt_field("9876543210")

            stmt = select(StudentRecord).where(StudentRecord.apaar_id == apaar)
            existing = db.scalars(stmt).first()
            if existing:
                existing.institution_aicte_id = row["institution_aicte_id"].strip()
                existing.academic_year = row["academic_year"].strip()
                existing.enrolment_status = row["enrolment_status"].strip()
                existing.full_name = full_name
                existing.dob = dob_val
                existing.gender = row["gender"].strip()
                existing.institution_student_id = row["institution_student_id"].strip()
                existing.program_code = prog
            else:
                db.add(
                    StudentRecord(
                        apaar_id=apaar,
                        apaar_hash=keyed_apaar_hash(apaar),
                        institution_aicte_id=row["institution_aicte_id"].strip(),
                        institution_student_id=row["institution_student_id"].strip(),
                        full_name=full_name,
                        dob=dob_val,
                        gender=row["gender"].strip(),
                        category="GEN",
                        pwd=False,
                        program_code=prog,
                        course_level=level,
                        academic_year=row["academic_year"].strip(),
                        year_of_study=1,
                        admission_date=date(2026, 8, 1),
                        admission_type="REGULAR",
                        seat_type="REGULAR",
                        quota="NONE",
                        nationality="IN",
                        nri_status=False,
                        oci_status=False,
                        fn_status=False,
                        enrolment_status=row["enrolment_status"].strip(),
                        consent_status="GRANTED",
                        consent_date=date(2026, 8, 1),
                        guardian_consent=False,
                        email_enc=email_enc,
                        mobile_enc=mobile_enc,
                        record_version=1,
                    )
                )
                count += 1
    db.flush()
    return count


def seed_demo_transfers(db: Session, path: Path) -> int:
    if not path.exists():
        return 0
    count = 0
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            trf_id = row["transfer_id"].strip()
            created_at = datetime.fromisoformat(row["created_at"].strip().replace("Z", "+00:00"))
            decided_at = (
                datetime.fromisoformat(row["decided_at"].strip().replace("Z", "+00:00"))
                if row.get("decided_at")
                else None
            )

            existing = db.get(Transfer, trf_id)
            if existing:
                existing.apaar_id = row["apaar_id"].strip()
                existing.source_institution_id = row["from_institution"].strip()
                existing.dest_institution_id = row["to_institution"].strip()
                existing.academic_year = row["academic_year"].strip()
                existing.status = row["status"].strip()
                existing.reason = row.get("reason")
            else:
                db.add(
                    Transfer(
                        id=trf_id,
                        apaar_id=row["apaar_id"].strip(),
                        source_institution_id=row["from_institution"].strip(),
                        dest_institution_id=row["to_institution"].strip(),
                        academic_year=row["academic_year"].strip(),
                        status=row["status"].strip(),
                        requested_at=created_at,
                        decided_at=decided_at,
                        reason=row.get("reason"),
                    )
                )
                count += 1
    db.flush()
    return count


def seed_demo_history(db: Session, path: Path) -> int:
    if not path.exists():
        return 0
    count = 0
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            inst = row["institution_aicte_id"].strip()
            batch_num = int(row["batch_number"])
            committed_at = datetime.fromisoformat(
                row["committed_at"].strip().replace("Z", "+00:00")
            )

            stmt = select(MetricHistory).where(
                MetricHistory.institution_aicte_id == inst,
                MetricHistory.batch_number == batch_num,
            )
            existing = db.scalars(stmt).first()
            if existing:
                existing.rows_total = int(row["rows_total"])
                existing.null_rate = float(row["null_rate"])
                existing.nri_share = float(row["nri_share"])
                existing.supernumerary_share = float(row["supernumerary_share"])
                existing.duplicate_rate = float(row["duplicate_rate"])
                existing.quality_score = float(row["quality_score"])
                existing.committed_at = committed_at
            else:
                db.add(
                    MetricHistory(
                        institution_aicte_id=inst,
                        batch_number=batch_num,
                        rows_total=int(row["rows_total"]),
                        null_rate=float(row["null_rate"]),
                        nri_share=float(row["nri_share"]),
                        supernumerary_share=float(row["supernumerary_share"]),
                        duplicate_rate=float(row["duplicate_rate"]),
                        quality_score=float(row["quality_score"]),
                        committed_at=committed_at,
                    )
                )
                count += 1
    db.flush()
    return count


def seed_demo_academic_records(db: Session) -> int:
    """Seeds rich previous schooling, 10th/12th marks, and CGPA for demo students."""
    students = db.query(StudentRecord).all()
    count = 0

    boards_10th = [
        "CBSE",
        "ICSE",
        "State Board of Secondary Education",
        "Maharashtra State Board",
    ]
    boards_12th = [
        "CBSE (Science)",
        "ICSE (ISC Science)",
        "State Higher Secondary Board",
        "Maharashtra State Board",
    ]

    for idx, s in enumerate(students):
        existing = (
            db.query(StudentAcademicRecord)
            .filter(StudentAcademicRecord.apaar_id == s.apaar_id)
            .first()
        )

        tenth_pct = round(85.0 + (idx % 12) * 1.15, 2)
        twelfth_pct = round(84.0 + (idx % 14) * 1.05, 2)
        cgpa_val = round(7.80 + (idx % 20) * 0.11, 2)
        if cgpa_val > 9.85:
            cgpa_val = 9.85

        sem_marks = [
            {"semester": 1, "sgpa": round(cgpa_val - 0.25, 2), "credits": 22, "status": "PASS"},
            {"semester": 2, "sgpa": round(cgpa_val - 0.10, 2), "credits": 22, "status": "PASS"},
            {"semester": 3, "sgpa": round(cgpa_val + 0.15, 2), "credits": 24, "status": "PASS"},
            {"semester": 4, "sgpa": round(cgpa_val, 2), "credits": 24, "status": "PASS"},
            {"semester": 5, "sgpa": round(cgpa_val + 0.20, 2), "credits": 24, "status": "PASS"},
            {"semester": 6, "sgpa": round(cgpa_val + 0.10, 2), "credits": 24, "status": "PASS"},
        ]

        skills_list = ["Python", "Algorithms", "SQL", "Data Structures", "System Design"]
        if idx % 3 == 0:
            skills_list.extend(["React", "TypeScript", "Node.js"])
        elif idx % 3 == 1:
            skills_list.extend(["Machine Learning", "PyTorch", "Data Science"])
        else:
            skills_list.extend(["Embedded Systems", "IoT", "Linux Kernel"])

        achievements = [
            "AICTE National Level Technical Symposium Winner",
            "Smart India Hackathon Institutional Finalist",
        ]

        if existing:
            existing.tenth_percentage = tenth_pct
            existing.twelfth_percentage = twelfth_pct
            existing.cgpa = cgpa_val
            existing.semester_marks_json = sem_marks
            existing.skills_json = skills_list
        else:
            db.add(
                StudentAcademicRecord(
                    apaar_id=s.apaar_id,
                    tenth_board=boards_10th[idx % len(boards_10th)],
                    tenth_percentage=tenth_pct,
                    tenth_year=2021,
                    tenth_school=f"Model Senior Secondary School #{101 + (idx % 15)}",
                    twelfth_board=boards_12th[idx % len(boards_12th)],
                    twelfth_percentage=twelfth_pct,
                    twelfth_stream="PCM with Computer Science",
                    twelfth_year=2023,
                    twelfth_school=f"Apex Higher Secondary College #{201 + (idx % 15)}",
                    cgpa=cgpa_val,
                    total_credits=160,
                    completed_credits=120,
                    active_backlogs=0,
                    semester_marks_json=sem_marks,
                    skills_json=skills_list,
                    achievements_json=achievements,
                )
            )
            count += 1

    db.flush()
    return count


def seed_demo_employer_requests(db: Session) -> int:
    """Seeds sample employer requests for demonstration."""
    employer_user = db.query(User).filter(User.role == "EMPLOYER").first()
    if not employer_user:
        return 0

    student = db.query(StudentRecord).filter(StudentRecord.apaar_id == "104332181960").first()
    if not student:
        return 0

    existing_req = (
        db.query(EmployerAccessRequest)
        .filter(
            EmployerAccessRequest.employer_id == employer_user.id,
            EmployerAccessRequest.apaar_id == student.apaar_id,
        )
        .first()
    )

    if not existing_req:
        db.add(
            EmployerAccessRequest(
                employer_id=employer_user.id,
                employer_name=employer_user.full_name,
                apaar_id=student.apaar_id,
                job_title="Software Development Engineer (Graduate 2026)",
                organization="Tata Consultancy Services",
                purpose="Pre-employment academic verification & marks audit",
                status="PENDING",
                requested_at=datetime.now(UTC),
            )
        )
        db.flush()
        return 1
    return 0


def seed_database(if_empty: bool = False) -> None:
    """Seeds predefined demo accounts and master/demo data into the database."""
    if settings.ENV != "dev" and settings.SEED_PASSWORD == DEFAULT_DEV_PASSWORD:
        logger.error(
            "Refusing to seed with default password in non-dev environment (ENV=%s)", settings.ENV
        )
        raise ValueError(
            f"Security Violation: Refusing to seed with default password "
            f"'{DEFAULT_DEV_PASSWORD}' when ENV={settings.ENV}"
        )

    # Ensure all tables exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        state_count = db.query(State).count()

        if if_empty and user_count > 0 and state_count > 0:
            logger.info(
                "Database already populated (users=%d, states=%d). Skipping seed (--if-empty).",
                user_count,
                state_count,
            )
            return

        data_dir = find_data_dir()
        master_dir = data_dir / "master"
        demo_dir = data_dir / "demo"

        logger.info("Loading master data from %s...", master_dir)
        n_states = seed_states(db, master_dir / "states.csv")
        n_districts = seed_districts(db, master_dir / "districts.csv")
        n_dabs = seed_dabs(db, master_dir / "degree_awarding_bodies.csv")
        n_insts = seed_institutions(db, master_dir / "institutions.csv")
        n_progs = seed_programs(db, master_dir / "programs.csv")
        n_ays = seed_academic_years(db, master_dir / "academic_years.csv")
        n_enums = seed_enums(db, master_dir / "enums.csv")
        logger.info(
            "Master data loaded: %d states, %d districts, %d DABs, %d institutions, "
            "%d programs, %d academic years, %d enums.",
            n_states,
            n_districts,
            n_dabs,
            n_insts,
            n_progs,
            n_ays,
            n_enums,
        )

        logger.info("Loading demo data from %s...", demo_dir)
        n_registry = seed_demo_registry(db, demo_dir / "demo_registry.csv")
        n_intake = seed_demo_intake(db, demo_dir / "demo_intake.csv")
        n_totals = seed_demo_declared_totals(db, demo_dir / "demo_declared_totals.csv")
        n_snapshot = seed_demo_central_snapshot(db, demo_dir / "demo_central_snapshot.csv")
        n_transfers = seed_demo_transfers(db, demo_dir / "demo_transfers.csv")
        n_history = seed_demo_history(db, demo_dir / "demo_history.csv")
        logger.info(
            "Demo data loaded: %d registry, %d intake, %d declared totals, "
            "%d snapshots, %d transfers, %d history metrics.",
            n_registry,
            n_intake,
            n_totals,
            n_snapshot,
            n_transfers,
            n_history,
        )

        # Seed demo user accounts
        password_hash = hash_password(settings.SEED_PASSWORD)
        for udata in DEMO_USERS:
            email = str(udata["email"])
            full_name = str(udata["full_name"])
            role = str(udata["role"])
            inst_id = udata["institution_aicte_id"]
            dab_id = udata["dab_id"]
            apaar_hash = udata["student_apaar_hash"]

            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                existing_user.password_hash = password_hash
                existing_user.full_name = full_name
                existing_user.role = role
                existing_user.institution_aicte_id = inst_id
                existing_user.dab_id = dab_id
                existing_user.student_apaar_hash = apaar_hash
                existing_user.is_active = True
            else:
                db.add(
                    User(
                        email=email,
                        password_hash=password_hash,
                        full_name=full_name,
                        role=role,
                        institution_aicte_id=inst_id,
                        dab_id=dab_id,
                        student_apaar_hash=apaar_hash,
                        is_active=True,
                        created_at=datetime.now(UTC),
                    )
                )
        # Seed demo student academic history and employer requests
        n_acad = seed_demo_academic_records(db)
        n_reqs = seed_demo_employer_requests(db)
        logger.info(
            "Academic data loaded: %d student academic records, %d sample employer requests.",
            n_acad,
            n_reqs,
        )

        append_audit_log(
            db,
            action="DATABASE_SEEDED",
            actor_type="SYSTEM",
            resource="MASTER_AND_DEMO_DATA",
            payload={
                "seeded_users_count": len(DEMO_USERS),
                "master_loaded": True,
                "demo_loaded": True,
                "env": settings.ENV,
            },
        )
        db.commit()
        logger.info(
            "Successfully seeded database with %d demo users and all datasets.", len(DEMO_USERS)
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Seed EduVerify database with demo accounts and datasets."
    )
    parser.add_argument(
        "--if-empty",
        action="store_true",
        help="Only seed if tables are empty.",
    )
    args = parser.parse_args()

    try:
        seed_database(if_empty=args.if_empty)
    except Exception as e:
        logger.error("Seeding failed: %s", e)
        sys.exit(1)


if __name__ == "__main__":
    main()
