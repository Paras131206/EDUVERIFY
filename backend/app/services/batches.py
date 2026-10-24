"""
Core batch upload, column mapping, background validation job, commit, and student lifecycle service.
Complies with agents.md §5, §7, §8 and prompt B3.
"""

import contextlib
import hashlib
import logging
import threading
import uuid
import zlib
from datetime import UTC, date, datetime
from typing import Any

import pandas as pd
from app.db import SessionLocal
from app.models.core import (
    AcademicYear,
    Batch,
    BatchFile,
    ColumnMappingProfile,
    Correction,
    Credential,
    DeclaredTotal,
    DegreeAwardingBody,
    District,
    DuplicateFlag,
    EnumItem,
    Institution,
    Issue,
    Job,
    MetricHistory,
    MockApaarRegistry,
    NotificationOutbox,
    Program,
    ProgramIntake,
    State,
    StudentRecord,
    StudentRecordVersion,
    Transfer,
)
from app.models.core import (
    BatchReport as BatchReportModel,
)
from app.schemas.batches import ColumnMappingModel
from app.security.crypto import encrypt_field, keyed_apaar_hash
from app.security.deps import Principal
from app.services.audit import append_audit_log
from app.services.events import broadcaster
from eduverify_engine.mapping import suggest_mapping
from eduverify_engine.models import BatchReport, ColumnMapping
from eduverify_engine.parse import parse_file
from eduverify_engine.report import compare_reports
from eduverify_engine.validate import validate_batch
from fastapi import HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# Advisory lock registry for (institution_aicte_id, academic_year)
_institution_year_locks: dict[tuple[str, str], threading.Lock] = {}
_locks_mutex = threading.Lock()


@contextlib.contextmanager
def _advisory_lock(db: Session, institution_id: str, academic_year: str):
    """Enforces per-(institution, academic_year) advisory lock across threads and DB connections."""
    inst_key = (institution_id, academic_year)
    with _locks_mutex:
        if inst_key not in _institution_year_locks:
            _institution_year_locks[inst_key] = threading.Lock()
        lock = _institution_year_locks[inst_key]
        acquired = lock.acquire(blocking=False)

    if not acquired:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "CONCURRENT_COMMIT",
                "message": "Commit currently in progress for this institution and academic year",
            },
        )
    try:
        if db.bind and db.bind.dialect.name == "postgresql":
            lock_id = zlib.crc32(f"{institution_id}:{academic_year}".encode())
            res = db.execute(
                text("SELECT pg_try_advisory_xact_lock(:lock_id)"), {"lock_id": lock_id}
            ).scalar()
            if not res:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "code": "ADVISORY_LOCK_CONFLICT",
                        "message": "Advisory lock on (institution, year) could not be acquired",
                    },
                )
        yield
    finally:
        lock.release()


# Canonical required target fields per specification
REQUIRED_TARGETS = {
    "apaar_id",
    "full_name",
    "dob",
    "gender",
    "category",
    "pwd",
    "course_level",
    "program_code",
    "academic_year",
    "year_of_study",
    "admission_date",
    "admission_type",
    "seat_type",
    "nationality",
    "nri_status",
    "oci_status",
    "fn_status",
    "enrolment_status",
    "consent_status",
}

NON_TERMINAL_STATUSES = ["UPLOADED", "MAPPING", "VALIDATING", "VALIDATED", "IN_REVIEW"]


def create_batch_service(
    db: Session,
    *,
    file_bytes: bytes,
    filename: str,
    content_type: str,
    academic_year: str,
    principal: Principal,
    idempotency_key: str | None = None,
    supersedes_batch_id: str | None = None,
) -> Batch:
    """
    Ingests an uploaded batch file, enforces one non-terminal batch per (institution, year),
    stores payload in batch_files, and initializes smart column mapping.
    """
    # 1. Authorization & Institution Resolution
    if principal.role not in ("INSTITUTION_ADMIN", "INSTITUTION_STAFF", "AICTE_ADMIN"):
        if not (principal.is_api_key and "upload" in principal.scopes):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "FORBIDDEN", "message": "Insufficient upload permissions"},
            )

    institution_id = principal.institution_aicte_id
    if not institution_id:
        if principal.role == "AICTE_ADMIN":
            institution_id = "1-10001"  # Default demo institution for admin testing
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INSTITUTION_REQUIRED",
                    "message": "Uploader must belong to an institution",
                },
            )

    # 2. File size & format validation
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "EMPTY_FILE", "message": "Uploaded file is empty"},
        )
    if len(file_bytes) > 50 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={"code": "FILE_TOO_LARGE", "message": "File exceeds maximum size limit (50 MB)"},
        )

    # 3. Idempotency Check
    if idempotency_key:
        existing = db.scalars(
            select(Batch).where(
                Batch.institution_aicte_id == institution_id,
                Batch.idempotency_key == idempotency_key,
            )
        ).first()
        if existing:
            return existing

    # 4. Enforce One Non-Terminal Batch per Institution + Year
    open_batch = db.scalars(
        select(Batch).where(
            Batch.institution_aicte_id == institution_id,
            Batch.academic_year == academic_year,
            Batch.status.in_(NON_TERMINAL_STATUSES),
        )
    ).first()

    if open_batch:
        if not supersedes_batch_id or supersedes_batch_id != open_batch.batch_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "BATCH_ALREADY_OPEN",
                    "message": (
                        f"A non-terminal batch ({open_batch.batch_id}) is "
                        f"already active for {academic_year}."
                    ),
                    "open_batch_id": open_batch.batch_id,
                },
            )
        else:
            # Superseding open batch
            open_batch.status = "SUPERSEDED"
            open_batch.updated_at = datetime.now(UTC)

    # 5. Persist Batch Entity
    new_batch_id = str(uuid.uuid4())
    file_sha256 = hashlib.sha256(file_bytes).hexdigest()

    batch = Batch(
        batch_id=new_batch_id,
        institution_aicte_id=institution_id,
        academic_year=academic_year,
        status="UPLOADED",
        version=1,
        idempotency_key=idempotency_key,
        supersedes_batch_id=supersedes_batch_id,
        created_by=principal.id if not principal.is_api_key else None,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    db.add(batch)

    # 6. Store File in batch_files
    batch_file = BatchFile(
        id=str(uuid.uuid4()),
        batch_id=new_batch_id,
        file_data=file_bytes,
        sha256=file_sha256,
        size_bytes=len(file_bytes),
        filename=filename,
        content_type=content_type,
        created_at=datetime.now(UTC),
    )
    db.add(batch_file)
    db.commit()
    db.refresh(batch)

    # 7. Initial Column Mapping Step
    try:
        parsed = parse_file(file_bytes)
        suggested = suggest_mapping(parsed.original_headers, sample_df=parsed.df)
        batch.column_mapping_json = [m.model_dump() for m in suggested]
        batch.status = "MAPPING"
        db.commit()
        db.refresh(batch)

        # 8. API Key Auto-Confirmation Rule:
        # API-key uploads auto-confirm if all required columns map with confidence >= 0.9
        if principal.is_api_key:
            high_conf_targets = {
                m.target for m in suggested if m.confidence >= 0.9 and m.target in REQUIRED_TARGETS
            }
            if REQUIRED_TARGETS.issubset(high_conf_targets):
                logger.info(
                    "Auto-confirming mapping for API-key upload on batch %s "
                    "(all required columns >= 0.9)",
                    batch.batch_id,
                )
                confirm_mapping_service(
                    db,
                    batch_id=batch.batch_id,
                    mappings=[
                        ColumnMappingModel(
                            source=m.source,
                            target=m.target,
                            confidence=m.confidence,
                            method=m.method,
                        )
                        for m in suggested
                    ],
                    principal=principal,
                )
    except Exception as e:
        logger.error(
            "Failed during mapping step for batch %s: %s", batch.batch_id, e, exc_info=True
        )

    return batch


def confirm_mapping_service(
    db: Session,
    *,
    batch_id: str,
    mappings: list[ColumnMappingModel],
    save_profile: bool = False,
    profile_name: str | None = None,
    principal: Principal | None = None,
) -> Batch:
    """
    Confirms column mapping, optionally saves profile, and kicks off asynchronous validation.
    """
    batch = db.scalars(select(Batch).where(Batch.batch_id == batch_id)).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    if batch.status in ("COMMITTED", "SUPERSEDED", "REJECTED"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot update mapping on terminal batch ({batch.status})",
        )

    # Save mapping to batch
    batch.column_mapping_json = [m.model_dump() for m in mappings]
    batch.status = "VALIDATING"
    batch.updated_at = datetime.now(UTC)

    # Optionally persist profile
    if save_profile:
        name = profile_name or f"Profile-{batch.academic_year}"
        prof = ColumnMappingProfile(
            id=str(uuid.uuid4()),
            institution_aicte_id=batch.institution_aicte_id,
            name=name,
            mapping_json=[m.model_dump() for m in mappings],
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        db.add(prof)

    # Create background Job in DB
    job_id = str(uuid.uuid4())
    job = Job(
        id=job_id,
        job_type="VALIDATION",
        status="RUNNING",
        progress=10,
        batch_id=batch.batch_id,
        parameters_json={"academic_year": batch.academic_year},
        created_at=datetime.now(UTC),
        started_at=datetime.now(UTC),
    )
    db.add(job)
    db.commit()
    db.refresh(batch)

    # Execute validation synchronously or via worker
    execute_validation_job(batch.batch_id, job_id=job_id, db=db)
    db.refresh(batch)
    return batch


def execute_validation_job(
    batch_id: str, job_id: str | None = None, db: Session | None = None
) -> None:
    """
    Executes full batch validation using the pure engine and persists reports, issues, and metrics.
    Can be run synchronously, as a background task, or resumed upon server startup.
    """
    owns_db = False
    if db is None:
        db = SessionLocal()
        owns_db = True
    try:
        batch = db.scalars(select(Batch).where(Batch.batch_id == batch_id)).first()
        batch_file = db.scalars(select(BatchFile).where(BatchFile.batch_id == batch_id)).first()
        if not batch or not batch_file:
            logger.error("execute_validation_job: batch or file missing for %s", batch_id)
            return

        job = None
        if job_id:
            job = db.scalars(select(Job).where(Job.id == job_id)).first()
        if not job:
            job = db.scalars(
                select(Job).where(Job.batch_id == batch_id, Job.job_type == "VALIDATION")
            ).first()

        # 1. Build RuleContext data from database
        context_data = _build_context_from_db(db, batch)

        # 2. Extract mappings
        mappings = []
        if batch.column_mapping_json and isinstance(batch.column_mapping_json, list):
            for m in batch.column_mapping_json:
                mappings.append(
                    ColumnMapping(
                        source=m["source"],
                        target=m["target"],
                        confidence=float(m["confidence"]),
                        method=m["method"],
                    )
                )

        # 3. Run pure engine validation
        report = validate_batch(
            file_or_df=batch_file.file_data,
            mapping=mappings if mappings else None,
            master=context_data["master"],
            intake=context_data["intake"],
            declared_totals=context_data["declared_totals"],
            registry=context_data["registry"],
            central_snapshot=context_data["central_snapshot"],
            history=context_data["history"],
            transfers=context_data["transfers"],
            institution_aicte_id=batch.institution_aicte_id,
            academic_year=batch.academic_year,
            batch_id=batch.batch_id,
        )

        # 4. Clean old issues & duplicates for this batch
        db.query(Issue).filter(Issue.batch_id == batch.batch_id).delete()
        db.query(DuplicateFlag).filter(DuplicateFlag.batch_id == batch.batch_id).delete()
        db.query(BatchReportModel).filter(BatchReportModel.batch_id == batch.batch_id).delete()

        # 5. Persist BatchReport JSON
        db_report = BatchReportModel(
            id=str(uuid.uuid4()),
            batch_id=batch.batch_id,
            report_json=report.model_dump(),
            created_at=datetime.now(UTC),
        )
        db.add(db_report)

        # 6. Flatten and persist issues
        for iss in report.issues:
            db_iss = Issue(
                id=iss.issue_id,
                batch_id=batch.batch_id,
                rule_id=iss.rule_id,
                row_index=iss.row,
                field_name=iss.field,
                apaar_id=getattr(iss, "apaar_id", None),
                severity=iss.severity,
                priority=iss.priority,
                bucket=iss.bucket,
                message=iss.message,
                reason=iss.reason,
                evidence_json=iss.evidence,
                suggested_fix_json=iss.suggested_fix.model_dump() if iss.suggested_fix else None,
                value_masked=iss.value_masked,
                status="OPEN",
            )
            db.add(db_iss)

        # 7. Flatten and persist duplicate flags
        for cluster in report.duplicate_clusters:
            for member in cluster.members:
                db_dup = DuplicateFlag(
                    id=str(uuid.uuid4()),
                    batch_id=batch.batch_id,
                    cluster_id=cluster.cluster_id,
                    apaar_id=member.apaar_masked,
                    matched_institution_id=member.institution,
                    similarity_score=cluster.score,
                    match_type=cluster.scope,
                    matched_fields_json=cluster.matched_fields,
                    status="OPEN",
                )
                db.add(db_dup)

        # 8. Record MetricHistory row
        metric = MetricHistory(
            id=str(uuid.uuid4()),
            institution_aicte_id=batch.institution_aicte_id,
            academic_year=batch.academic_year,
            batch_number=batch.version,
            rows_total=report.rows_total,
            null_rate=float(report.metrics.get("completeness", {}).get("null_rate", 0.0)),
            nri_share=float(report.metrics.get("aggregates", {}).get("nri_share", 0.0)),
            supernumerary_share=float(
                report.metrics.get("aggregates", {}).get("supernumerary_share", 0.0)
            ),
            duplicate_rate=float(report.metrics.get("duplicates", {}).get("duplicate_rate", 0.0)),
            quality_score=float(report.quality_score),
            committed_at=datetime.now(UTC),
        )
        db.add(metric)

        # 9. Update batch fields and status
        batch.engine_version = report.engine_version
        batch.catalog_version = report.rule_catalog_version
        batch.quality_score_before = report.quality_score

        # If fatal errors or critical issues exist -> IN_REVIEW; otherwise VALIDATED
        has_critical = any(
            iss.priority == "CRITICAL" or iss.severity == "ERROR" for iss in report.issues
        )
        batch.status = "IN_REVIEW" if has_critical else "VALIDATED"
        batch.updated_at = datetime.now(UTC)

        # 10. Update Job status
        if job:
            job.status = "COMPLETED"
            job.progress = 100
            job.completed_at = datetime.now(UTC)
            job.result_json = {
                "quality_score": report.quality_score,
                "issues_count": len(report.issues),
                "status": batch.status,
            }

        db.commit()

        # 11. Broadcast SSE Events
        _broadcast_validation_events(batch, report)

    except Exception as exc:
        db.rollback()
        logger.error("execute_validation_job failed for batch %s: %s", batch_id, exc, exc_info=True)
        try:
            failed_batch = db.scalars(select(Batch).where(Batch.batch_id == batch_id)).first()
            if failed_batch:
                failed_batch.status = "FAILED"
                db.commit()
        except Exception as update_exc:
            logger.warning("Could not mark batch %s as FAILED: %s", batch_id, update_exc)
    finally:
        if owns_db:
            db.close()


def commit_batch_service(
    db: Session,
    *,
    batch_id: str,
    version: int,
    principal: Principal,
) -> dict[str, Any]:
    """
    Commits valid records from a validated/in-review batch into the central repository.
    Blocked if any OPEN CRITICAL issues remain.
    """
    if principal.role not in ("INSTITUTION_ADMIN", "AICTE_ADMIN"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "FORBIDDEN",
                "message": "Only INSTITUTION_ADMIN or AICTE_ADMIN can commit batches",
            },
        )

    with _locks_mutex:
        batch = db.scalars(select(Batch).where(Batch.batch_id == batch_id)).first()
        if not batch:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")
        inst_id = batch.institution_aicte_id
        acad_year = batch.academic_year

    with _advisory_lock(db, inst_id, acad_year):
        return _execute_commit(db, batch=batch, version=version, principal=principal)


def _execute_commit(
    db: Session,
    *,
    batch: Batch,
    version: int,
    principal: Principal,
) -> dict[str, Any]:
    db.refresh(batch)
    if (
        principal.role == "INSTITUTION_ADMIN"
        and principal.institution_aicte_id != batch.institution_aicte_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot commit batch belonging to another institution",
        )

    # 2. State & Version Concurrency Check
    if batch.status not in ("VALIDATED", "IN_REVIEW"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "INVALID_STATE",
                "message": (
                    f"Cannot commit batch in '{batch.status}' state. "
                    "Must be VALIDATED or IN_REVIEW."
                ),
            },
        )

    if batch.version != version:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "CONCURRENCY_CONFLICT",
                "message": (
                    f"Batch version conflict: current is {batch.version}, requested was {version}"
                ),
            },
        )

    # 3. Block if any OPEN CRITICAL issues
    open_critical = db.scalars(
        select(Issue).where(
            Issue.batch_id == batch.batch_id,
            Issue.status == "OPEN",
            Issue.priority == "CRITICAL",
        )
    ).all()
    if open_critical:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "CRITICAL_ISSUES_OPEN",
                "message": (
                    f"Cannot commit batch with {len(open_critical)} unresolved CRITICAL issues."
                ),
            },
        )

    # 4. Exclude rows with unresolved ERROR severity issues
    error_row_indices = set(
        db.scalars(
            select(Issue.row_index).where(
                Issue.batch_id == batch.batch_id,
                Issue.status == "OPEN",
                Issue.severity == "ERROR",
                Issue.row_index.is_not(None),
            )
        ).all()
    )

    batch_file = db.scalars(select(BatchFile).where(BatchFile.batch_id == batch.batch_id)).first()
    if not batch_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Batch payload file not found"
        )

    # 5. Parse and remap records
    parsed = parse_file(batch_file.file_data)
    df = parsed.df
    source_to_target = {}
    if batch.column_mapping_json and isinstance(batch.column_mapping_json, list):
        for m in batch.column_mapping_json:
            source_to_target[m["source"]] = m["target"]

    working_df = pd.DataFrame(index=df.index)
    for src_col, tgt_field in source_to_target.items():
        if src_col in df.columns:
            working_df[tgt_field] = df[src_col]

    if "institution_aicte_id" not in working_df.columns:
        working_df["institution_aicte_id"] = batch.institution_aicte_id

    # 6. Upsert valid student rows
    committed_count = 0
    excluded_rows_list = sorted([r for r in error_row_indices if r is not None])
    now = datetime.now(UTC)

    for idx, row in working_df.iterrows():
        # idx is 0-indexed; row number is idx + 2 (header = row 1)
        row_num = int(str(idx)) + 2
        if row_num in error_row_indices:
            continue

        apaar_val = str(row.get("apaar_id", "")).strip()
        if not apaar_val or len(apaar_val) != 12:
            continue

        val_email = row.get("email")
        raw_email = (
            str(val_email).strip()
            if (val_email is not None and bool(pd.notna(val_email)))
            else None
        )
        val_mobile = row.get("mobile")
        raw_mobile = (
            str(val_mobile).strip()
            if (val_mobile is not None and bool(pd.notna(val_mobile)))
            else None
        )
        email_enc = encrypt_field(raw_email) if raw_email else None
        mobile_enc = encrypt_field(raw_mobile) if raw_mobile else None

        dob_val = None
        val_dob = row.get("dob")
        if val_dob is not None and bool(pd.notna(val_dob)):
            try:
                dob_val = date.fromisoformat(str(val_dob).strip()[:10])
            except Exception:
                dob_val = date(2005, 1, 1)

        admission_date_val = None
        val_adm = row.get("admission_date")
        if val_adm is not None and bool(pd.notna(val_adm)):
            try:
                admission_date_val = date.fromisoformat(str(val_adm).strip()[:10])
            except Exception:
                admission_date_val = date(2026, 8, 1)

        existing_student = db.scalars(
            select(StudentRecord).where(StudentRecord.apaar_id == apaar_val)
        ).first()

        if existing_student:
            # Archive previous version to student_record_versions
            version_archive = StudentRecordVersion(
                id=str(uuid.uuid4()),
                apaar_id=existing_student.apaar_id,
                record_version=existing_student.record_version,
                snapshot_json={
                    "institution_aicte_id": existing_student.institution_aicte_id,
                    "program_code": existing_student.program_code,
                    "enrolment_status": existing_student.enrolment_status,
                    "academic_year": existing_student.academic_year,
                },
                changed_by=principal.id,
                change_reason=f"Batch {batch.batch_id} commit",
                created_at=now,
            )
            db.add(version_archive)

            # Update existing record and increment version
            existing_student.institution_aicte_id = str(
                row.get("institution_aicte_id", batch.institution_aicte_id)
            ).strip()
            existing_student.institution_student_id = (
                str(row.get("institution_student_id", "")).strip()
                or existing_student.institution_student_id
                or f"STU-{apaar_val}"
            )
            existing_student.full_name = str(
                row.get("full_name", existing_student.full_name)
            ).strip()
            if dob_val:
                existing_student.dob = dob_val
            existing_student.gender = str(row.get("gender", existing_student.gender)).strip()
            existing_student.category = str(row.get("category", existing_student.category)).strip()
            existing_student.pwd = str(row.get("pwd", "False")).strip().lower() in ("true", "1")
            existing_student.course_level = str(
                row.get("course_level", existing_student.course_level)
            ).strip()
            existing_student.program_code = str(
                row.get("program_code", existing_student.program_code)
            ).strip()
            existing_student.academic_year = str(
                row.get("academic_year", batch.academic_year)
            ).strip()
            existing_student.year_of_study = int(
                str(row.get("year_of_study", existing_student.year_of_study) or 1)
            )
            if admission_date_val:
                existing_student.admission_date = admission_date_val
            existing_student.admission_type = str(
                row.get("admission_type", existing_student.admission_type)
            ).strip()
            existing_student.seat_type = str(
                row.get("seat_type", existing_student.seat_type)
            ).strip()
            existing_student.supernumerary_scheme = (
                str(row.get("supernumerary_scheme", "")).strip() or None
            )
            existing_student.quota = str(row.get("quota", "NONE")).strip()
            existing_student.nationality = str(row.get("nationality", "IN")).strip()
            existing_student.nri_status = str(row.get("nri_status", "False")).strip().lower() in (
                "true",
                "1",
            )
            existing_student.oci_status = str(row.get("oci_status", "False")).strip().lower() in (
                "true",
                "1",
            )
            existing_student.fn_status = str(row.get("fn_status", "False")).strip().lower() in (
                "true",
                "1",
            )
            existing_student.enrolment_status = str(row.get("enrolment_status", "ACTIVE")).strip()
            existing_student.consent_status = str(row.get("consent_status", "GRANTED")).strip()
            if email_enc:
                existing_student.email_enc = email_enc
            if mobile_enc:
                existing_student.mobile_enc = mobile_enc
            existing_student.record_version += 1
            existing_student.updated_at = now

            # Mark existing credentials as superseded (hook for B6)
            db.query(Credential).filter(
                Credential.apaar_hash == existing_student.apaar_hash,
                Credential.status == "ACTIVE",
            ).update({"status": "SUPERSEDED", "revoked_at": now})

        else:
            # Create fresh StudentRecord
            new_student = StudentRecord(
                apaar_id=apaar_val,
                apaar_hash=keyed_apaar_hash(apaar_val),
                institution_aicte_id=str(
                    row.get("institution_aicte_id", batch.institution_aicte_id)
                ).strip(),
                institution_student_id=str(row.get("institution_student_id", "")).strip()
                or f"STU-{apaar_val}",
                full_name=str(row.get("full_name", "")).strip(),
                dob=dob_val or date(2005, 1, 1),
                gender=str(row.get("gender", "M")).strip(),
                category=str(row.get("category", "GEN")).strip(),
                pwd=str(row.get("pwd", "False")).strip().lower() in ("true", "1"),
                course_level=str(row.get("course_level", "UG")).strip(),
                program_code=str(row.get("program_code", "UG-CSE")).strip(),
                academic_year=str(row.get("academic_year", batch.academic_year)).strip(),
                year_of_study=int(str(row.get("year_of_study", 1) or 1)),
                admission_date=admission_date_val or date(2026, 8, 1),
                admission_type=str(row.get("admission_type", "REGULAR")).strip(),
                seat_type=str(row.get("seat_type", "REGULAR")).strip(),
                supernumerary_scheme=str(row.get("supernumerary_scheme", "")).strip() or None,
                quota=str(row.get("quota", "NONE")).strip(),
                nationality=str(row.get("nationality", "IN")).strip(),
                nri_status=str(row.get("nri_status", "False")).strip().lower() in ("true", "1"),
                oci_status=str(row.get("oci_status", "False")).strip().lower() in ("true", "1"),
                fn_status=str(row.get("fn_status", "False")).strip().lower() in ("true", "1"),
                enrolment_status=str(row.get("enrolment_status", "ACTIVE")).strip(),
                consent_status=str(row.get("consent_status", "GRANTED")).strip(),
                guardian_consent=False,
                email_enc=email_enc,
                mobile_enc=mobile_enc,
                record_version=1,
                created_at=now,
            )
            db.add(new_student)

        committed_count += 1

    # 7. Finalize Batch Status & Concurrency Version
    batch.status = "COMMITTED"
    batch.version += 1
    batch.quality_score_after = batch.quality_score_before
    batch.updated_at = now

    # 8. Audit Log
    append_audit_log(
        db,
        action="BATCH_COMMITTED",
        actor_type="API_KEY" if principal.is_api_key else "USER",
        actor_id=principal.id,
        role=principal.role,
        resource="BATCH",
        resource_id=batch.batch_id,
        payload={
            "committed_records": committed_count,
            "excluded_rows_count": len(excluded_rows_list),
            "quality_score": batch.quality_score_after,
        },
    )

    # 9. Queue Notification
    outbox_entry = NotificationOutbox(
        id=str(uuid.uuid4()),
        recipient=principal.email or f"{batch.institution_aicte_id}@institution.local",
        channel="EMAIL",
        subject=f"EduVerify: Batch {batch.batch_id} committed successfully",
        body=(
            f"Batch {batch.batch_id} ({batch.academic_year}) has been committed. "
            f"Records: {committed_count}."
        ),
        status="PENDING",
        created_at=now,
    )
    db.add(outbox_entry)
    db.commit()

    # 10. Broadcast SSE Event
    broadcaster._publish_sync(
        "batch.committed",
        {
            "batch_id": batch.batch_id,
            "committed_records": committed_count,
            "excluded_rows": len(excluded_rows_list),
            "quality_score": batch.quality_score_after,
        },
        institution_id=batch.institution_aicte_id,
        batch_id=batch.batch_id,
    )

    return {
        "batch_id": batch.batch_id,
        "committed_records": committed_count,
        "quality_score_before": float(batch.quality_score_before or 100.0),
        "quality_score_after": float(batch.quality_score_after or 100.0),
        "committed_at": now,
        "excluded_rows_count": len(excluded_rows_list),
        "excluded_row_numbers": excluded_rows_list,
    }


def update_student_service(
    db: Session,
    *,
    apaar_id: str,
    update_data: dict[str, Any],
    principal: Principal,
) -> StudentRecord:
    """
    Manually updates student record from the institution of record (creates new record version,
    marks credentials superseded, and logs audit).
    """
    student = db.scalars(select(StudentRecord).where(StudentRecord.apaar_id == apaar_id)).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found"
        )

    if (
        principal.role != "AICTE_ADMIN"
        and principal.institution_aicte_id != student.institution_aicte_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the institution of record or AICTE_ADMIN can update this student record",
        )

    now = datetime.now(UTC)
    reason = update_data.pop("reason", "Manual correction")

    # Archive previous state
    version_archive = StudentRecordVersion(
        id=str(uuid.uuid4()),
        apaar_id=student.apaar_id,
        record_version=student.record_version,
        snapshot_json={
            "full_name": student.full_name,
            "program_code": student.program_code,
            "enrolment_status": student.enrolment_status,
            "academic_year": student.academic_year,
            "year_of_study": student.year_of_study,
        },
        changed_by=principal.id,
        change_reason=reason,
        created_at=now,
    )
    db.add(version_archive)

    # Apply updates
    for key, val in update_data.items():
        if val is not None and hasattr(student, key):
            if key == "email":
                student.email_enc = encrypt_field(str(val))
            elif key == "mobile":
                student.mobile_enc = encrypt_field(str(val))
            else:
                setattr(student, key, val)

    student.record_version += 1
    student.updated_at = now

    # Supersede active credentials
    db.query(Credential).filter(
        Credential.apaar_hash == student.apaar_hash,
        Credential.status == "ACTIVE",
    ).update({"status": "SUPERSEDED", "revoked_at": now})

    # Append audit log
    append_audit_log(
        db,
        action="STUDENT_UPDATED",
        actor_type="API_KEY" if principal.is_api_key else "USER",
        actor_id=principal.id,
        role=principal.role,
        resource="STUDENT",
        resource_id=apaar_id,
        payload={"reason": reason, "new_record_version": student.record_version},
    )

    db.commit()
    db.refresh(student)
    return student


def resume_stuck_jobs_service() -> None:
    """Startup routine to resume jobs and batches stuck in RUNNING state upon server restart."""
    db = SessionLocal()
    try:
        stuck_jobs = db.scalars(
            select(Job).where(Job.status.in_(["RUNNING", "PENDING"]), Job.job_type == "VALIDATION")
        ).all()
        for j in stuck_jobs:
            if j.batch_id:
                logger.info("Resuming stuck validation job %s for batch %s", j.id, j.batch_id)
                execute_validation_job(j.batch_id, job_id=j.id)
    except Exception as exc:
        logger.error("Error resuming stuck jobs: %s", exc)
    finally:
        db.close()


def _build_context_from_db(db: Session, batch: Batch) -> dict[str, Any]:
    """Extracts master, intake, registry, and snapshot DataFrames from database tables."""
    # 1. Master tables
    master_dfs = {}
    for model, name in [
        (State, "states"),
        (District, "districts"),
        (Institution, "institutions"),
        (Program, "programs"),
        (AcademicYear, "academic_years"),
        (EnumItem, "enums"),
        (DegreeAwardingBody, "degree_awarding_bodies"),
    ]:
        rows = db.query(model).all()
        if rows:
            master_dfs[name] = pd.DataFrame([r.__dict__ for r in rows]).drop(
                columns=["_sa_instance_state"], errors="ignore"
            )
        else:
            master_dfs[name] = pd.DataFrame()

    # 2. Intake
    intake_rows = (
        db.query(ProgramIntake)
        .filter(
            ProgramIntake.institution_aicte_id == batch.institution_aicte_id,
            ProgramIntake.academic_year == batch.academic_year,
        )
        .all()
    )
    intake_df = (
        pd.DataFrame([r.__dict__ for r in intake_rows]).drop(
            columns=["_sa_instance_state"], errors="ignore"
        )
        if intake_rows
        else pd.DataFrame()
    )

    # 3. Declared totals
    dt_rows = (
        db.query(DeclaredTotal)
        .filter(
            DeclaredTotal.institution_aicte_id == batch.institution_aicte_id,
            DeclaredTotal.academic_year == batch.academic_year,
        )
        .all()
    )
    dt_df = (
        pd.DataFrame([r.__dict__ for r in dt_rows]).drop(
            columns=["_sa_instance_state"], errors="ignore"
        )
        if dt_rows
        else pd.DataFrame()
    )

    # 4. Mock registry
    reg_rows = db.query(MockApaarRegistry).all()
    reg_df = (
        pd.DataFrame([r.__dict__ for r in reg_rows]).drop(
            columns=["_sa_instance_state"], errors="ignore"
        )
        if reg_rows
        else pd.DataFrame()
    )

    # 5. Central snapshot: committed records of OTHER institutions for that year
    snap_rows = (
        db.query(StudentRecord)
        .filter(
            StudentRecord.institution_aicte_id != batch.institution_aicte_id,
            StudentRecord.academic_year == batch.academic_year,
        )
        .all()
    )
    snap_df = (
        pd.DataFrame([r.__dict__ for r in snap_rows]).drop(
            columns=["_sa_instance_state"], errors="ignore"
        )
        if snap_rows
        else pd.DataFrame()
    )

    # 6. History: metric history for this institution
    hist_rows = (
        db.query(MetricHistory)
        .filter(MetricHistory.institution_aicte_id == batch.institution_aicte_id)
        .all()
    )
    hist_df = (
        pd.DataFrame([r.__dict__ for r in hist_rows]).drop(
            columns=["_sa_instance_state"], errors="ignore"
        )
        if hist_rows
        else pd.DataFrame()
    )

    # 7. Transfers
    trf_rows = db.query(Transfer).all()
    trf_df = (
        pd.DataFrame([r.__dict__ for r in trf_rows]).drop(
            columns=["_sa_instance_state"], errors="ignore"
        )
        if trf_rows
        else pd.DataFrame()
    )

    return {
        "master": master_dfs,
        "intake": intake_df,
        "declared_totals": dt_df,
        "registry": reg_df,
        "central_snapshot": snap_df,
        "history": hist_df,
        "transfers": trf_df,
    }


def _broadcast_validation_events(batch: Batch, report: Any) -> None:
    """Helper to dispatch SSE events synchronously from validation job."""
    # Progress
    broadcaster._publish_sync(
        "batch.progress",
        {"batch_id": batch.batch_id, "progress": 100, "status": batch.status},
        institution_id=batch.institution_aicte_id,
        batch_id=batch.batch_id,
    )
    # Validated
    broadcaster._publish_sync(
        "batch.validated",
        {
            "batch_id": batch.batch_id,
            "quality_score": report.quality_score,
            "rows_total": report.rows_total,
            "status": batch.status,
        },
        institution_id=batch.institution_aicte_id,
        batch_id=batch.batch_id,
    )
    # Cross institution duplicate alert
    for c in getattr(report, "duplicate_clusters", []):
        if c.scope == "CROSS_INSTITUTION":
            broadcaster._publish_sync(
                "duplicate.cross_institution",
                {
                    "batch_id": batch.batch_id,
                    "cluster_id": c.cluster_id,
                    "similarity": c.score,
                },
                institution_id=batch.institution_aicte_id,
                batch_id=batch.batch_id,
            )
            break
    # Anomaly detected
    if getattr(report, "anomalies", None):
        broadcaster._publish_sync(
            "anomaly.detected",
            {
                "batch_id": batch.batch_id,
                "count": len(report.anomalies),
            },
            institution_id=batch.institution_aicte_id,
            batch_id=batch.batch_id,
        )


def revalidate_batch_service(
    db: Session,
    *,
    batch_id: str,
    principal: Principal,
) -> dict[str, Any]:
    """
    Re-runs engine validation on the corrected batch dataset.
    Applies all APPROVED corrections to the raw DataFrame, re-validates,
    computes before/after comparison with compare_reports, updates quality_score_after,
    and refreshes issues and duplicates.
    """
    batch = db.scalars(select(Batch).where(Batch.batch_id == batch_id)).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Batch '{batch_id}' not found"},
        )

    if (
        principal.role != "AICTE_ADMIN"
        and principal.institution_aicte_id != batch.institution_aicte_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "FORBIDDEN",
                "message": "Cannot revalidate batch belonging to another institution",
            },
        )

    batch_file = db.scalars(select(BatchFile).where(BatchFile.batch_id == batch_id)).first()
    if not batch_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Batch raw file data not found"},
        )

    # 1. Parse raw file
    parsed = parse_file(batch_file.file_data)
    df = parsed.df.copy()

    # 2. Extract mappings
    mappings = []
    if batch.column_mapping_json and isinstance(batch.column_mapping_json, list):
        for m in batch.column_mapping_json:
            mappings.append(
                ColumnMapping(
                    source=m["source"],
                    target=m["target"],
                    confidence=float(m["confidence"]),
                    method=m["method"],
                )
            )

    target_to_source = {m.target: m.source for m in mappings}

    # 3. Fetch all approved corrections
    approved_corrections = db.scalars(
        select(Correction).where(
            Correction.batch_id == batch_id,
            Correction.status == "APPROVED",
        )
    ).all()

    # 4. Apply corrections onto the raw dataframe
    for corr in approved_corrections:
        target_field = corr.field
        source_col = target_to_source.get(target_field, target_field)
        if source_col not in df.columns:
            df[source_col] = ""

        new_val = corr.new_value_enc or ""

        # Match row by apaar_id if present
        applied = False
        if corr.apaar_id:
            apaar_src = target_to_source.get("apaar_id", "apaar_id")
            if apaar_src in df.columns:
                mask = df[apaar_src].astype(str).str.strip() == corr.apaar_id.strip()
                if mask.any():
                    df.loc[mask, source_col] = new_val
                    applied = True

        # Match row by issue_id if present
        if not applied and corr.issue_id:
            iss = db.scalars(select(Issue).where(Issue.id == corr.issue_id)).first()
            if iss and iss.row_index and iss.row_index > 1:
                row_idx = iss.row_index - 2  # 0-indexed in DataFrame
                if 0 <= row_idx < len(df):
                    df.loc[df.index[row_idx], source_col] = new_val

    # 5. Build RuleContext from database
    context_data = _build_context_from_db(db, batch)

    # 6. Re-run pure engine validation
    new_report = validate_batch(
        file_or_df=df,
        mapping=mappings if mappings else None,
        master=context_data["master"],
        intake=context_data["intake"],
        declared_totals=context_data["declared_totals"],
        registry=context_data["registry"],
        central_snapshot=context_data["central_snapshot"],
        history=context_data["history"],
        transfers=context_data["transfers"],
        institution_aicte_id=batch.institution_aicte_id,
        academic_year=batch.academic_year,
        batch_id=batch.batch_id,
    )

    # 7. Get previous report
    old_db_report = db.scalars(
        select(BatchReportModel).where(BatchReportModel.batch_id == batch_id)
    ).first()
    old_engine_report = BatchReport(**old_db_report.report_json) if old_db_report else new_report

    # 8. Compare reports
    dq_comp = compare_reports(old_engine_report, new_report)

    # 9. Update batch metrics and state
    batch.quality_score_before = old_engine_report.quality_score
    batch.quality_score_after = new_report.quality_score
    batch.status = "VALIDATED" if new_report.rows_error == 0 else "IN_REVIEW"
    batch.version += 1
    batch.updated_at = datetime.now(UTC)

    # 10. Update stored report JSON
    if old_db_report:
        old_db_report.report_json = new_report.model_dump()
        old_db_report.created_at = datetime.now(UTC)
    else:
        new_db_rep = BatchReportModel(
            id=str(uuid.uuid4()),
            batch_id=batch.batch_id,
            report_json=new_report.model_dump(),
            created_at=datetime.now(UTC),
        )
        db.add(new_db_rep)

    # 11. Refresh issues & duplicate flags
    db.query(Issue).filter(Issue.batch_id == batch.batch_id).delete()
    db.query(DuplicateFlag).filter(DuplicateFlag.batch_id == batch.batch_id).delete()

    for iss in new_report.issues:
        db_iss = Issue(
            id=iss.issue_id,
            batch_id=batch.batch_id,
            rule_id=iss.rule_id,
            row_index=iss.row,
            field_name=iss.field,
            apaar_id=getattr(iss, "apaar_id", None),
            severity=iss.severity,
            priority=iss.priority,
            bucket=iss.bucket,
            message=iss.message,
            reason=iss.reason,
            evidence_json=iss.evidence,
            suggested_fix_json=iss.suggested_fix.model_dump() if iss.suggested_fix else None,
            value_masked=iss.value_masked,
            status="OPEN",
        )
        db.add(db_iss)

    for cluster in new_report.duplicate_clusters:
        for member in cluster.members:
            flag = DuplicateFlag(
                id=str(uuid.uuid4()),
                batch_id=batch.batch_id,
                cluster_id=cluster.cluster_id,
                apaar_id=member.apaar_masked,
                matched_institution_id=member.institution,
                similarity_score=cluster.score,
                match_type=cluster.scope,
                matched_fields_json=cluster.matched_fields,
                status="OPEN",
            )
            db.add(flag)

    append_audit_log(
        db,
        action="BATCH_REVALIDATED",
        actor_type="API_KEY" if principal.is_api_key else "USER",
        actor_id=principal.id,
        role=principal.role,
        resource="BATCH",
        resource_id=batch.batch_id,
        payload={
            "quality_score_before": batch.quality_score_before,
            "quality_score_after": batch.quality_score_after,
            "corrections_applied": len(approved_corrections),
        },
    )

    db.commit()
    db.refresh(batch)

    _broadcast_validation_events(batch, new_report)

    return {
        "batch_id": batch.batch_id,
        "quality_score_before": float(batch.quality_score_before or 100.0),
        "quality_score_after": float(batch.quality_score_after or 100.0),
        "score_delta": round(
            float(batch.quality_score_after or 100.0) - float(batch.quality_score_before or 100.0),
            2,
        ),
        "resolved_count": dq_comp.resolved,
        "pending_count": dq_comp.pending,
        "per_rule_deltas": dq_comp.per_rule_deltas,
        "per_priority_deltas": dq_comp.per_priority_deltas,
    }


def get_dq_comparison_service(
    db: Session,
    *,
    batch_id: str,
    principal: Principal,
) -> dict[str, Any]:
    """Retrieves before/after data quality comparison and score delta."""
    batch = db.scalars(select(Batch).where(Batch.batch_id == batch_id)).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Batch '{batch_id}' not found"},
        )

    if (
        principal.role != "AICTE_ADMIN"
        and principal.institution_aicte_id != batch.institution_aicte_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Access denied"},
        )

    q_before = float(
        batch.quality_score_before if batch.quality_score_before is not None else 100.0
    )
    q_after = float(
        batch.quality_score_after if batch.quality_score_after is not None else q_before
    )
    delta = round(q_after - q_before, 2)

    open_count = db.query(Issue).filter(Issue.batch_id == batch_id, Issue.status == "OPEN").count()
    resolved_count = (
        db.query(Issue)
        .filter(Issue.batch_id == batch_id, Issue.status.in_(["ACCEPTED", "FIXED", "DISMISSED"]))
        .count()
    )

    return {
        "batch_id": batch.batch_id,
        "quality_score_before": q_before,
        "quality_score_after": q_after,
        "score_delta": delta,
        "resolved_count": resolved_count,
        "pending_count": open_count,
        "per_rule_deltas": {},
        "per_priority_deltas": {},
        "per_column_completeness_before": {},
        "per_column_completeness_after": {},
    }
