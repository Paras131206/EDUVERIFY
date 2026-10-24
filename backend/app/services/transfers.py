"""
Inter-institution student transfer workflow services.
Enforces rules per agents.md §8.1:
- Destination institution initiates transfer request.
- Source institution approves or rejects (or AICTE overrides after 15 days).
- On approval, source record enrolment_status becomes TRANSFERRED_OUT.
- Destination may upload student with admission_type=TRANSFER_IN, bypassing V010.
"""

import uuid
from datetime import UTC, datetime

from app.models.core import Credential, StudentRecord, StudentRecordVersion, Transfer
from app.security.deps import Principal
from app.services.audit import append_audit_log
from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session


def create_transfer_service(
    db: Session,
    *,
    apaar_id: str,
    from_institution_id: str,
    to_program_code: str,
    academic_year: str | None,
    transfer_certificate_ref: str | None,
    reason: str | None,
    principal: Principal,
) -> Transfer:
    """Initiates a student transfer request by destination institution."""
    if principal.role != "AICTE_ADMIN":
        if principal.role != "INSTITUTION_ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "FORBIDDEN",
                    "message": "Only INSTITUTION_ADMIN can initiate transfer requests",
                },
            )
        dest_inst_id = principal.institution_aicte_id
    else:
        dest_inst_id = principal.institution_aicte_id or "AICTE-CENTRAL"

    if not dest_inst_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Destination institution ID cannot be determined",
        )

    if dest_inst_id == from_institution_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_TRANSFER",
                "message": "Source and destination institutions cannot be identical",
            },
        )

    # Verify student exists and is at source institution
    student = db.scalars(
        select(StudentRecord).where(
            StudentRecord.apaar_id == apaar_id,
            StudentRecord.institution_aicte_id == from_institution_id,
        )
    ).first()

    # Note: if student not yet committed in Central Repository, they may still be transferred
    # based on verified APAAR, but if found, confirm status
    active_year = academic_year or (student.academic_year if student else "2026-27")

    # Check for existing open transfer for this student
    existing_open = db.scalars(
        select(Transfer).where(
            Transfer.apaar_id == apaar_id,
            Transfer.status.in_(["PENDING", "OPEN"]),
        )
    ).first()
    if existing_open:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "TRANSFER_ALREADY_OPEN",
                "message": (
                    f"Transfer request {existing_open.id} is already pending for this student"
                ),
                "transfer_id": existing_open.id,
            },
        )

    transfer = Transfer(
        id=str(uuid.uuid4()),
        apaar_id=apaar_id,
        source_institution_id=from_institution_id,
        dest_institution_id=dest_inst_id,
        academic_year=active_year,
        status="PENDING",
        requested_at=datetime.now(UTC),
        reason=reason or f"Transfer to program {to_program_code}",
        evidence_ref=transfer_certificate_ref,
    )
    db.add(transfer)

    append_audit_log(
        db,
        action="TRANSFER_REQUESTED",
        actor_type="API_KEY" if principal.is_api_key else "USER",
        actor_id=principal.id,
        role=principal.role,
        resource="TRANSFER",
        resource_id=transfer.id,
        payload={
            "apaar_id": apaar_id,
            "source": from_institution_id,
            "dest": dest_inst_id,
            "to_program": to_program_code,
        },
    )

    db.commit()
    db.refresh(transfer)
    return transfer


def list_transfers_service(
    db: Session,
    *,
    direction: str | None,
    status_filter: str | None,
    principal: Principal,
) -> list[Transfer]:
    """Lists student transfer requests with direction filtering (in/out)."""
    stmt = select(Transfer)
    if status_filter:
        stmt = stmt.where(Transfer.status == status_filter.upper())

    is_aicte = principal.role in ("AICTE_ADMIN", "AICTE_ANALYST")
    user_inst = principal.institution_aicte_id

    if not is_aicte:
        if not user_inst:
            return []
        if direction == "in":
            stmt = stmt.where(Transfer.dest_institution_id == user_inst)
        elif direction == "out":
            stmt = stmt.where(Transfer.source_institution_id == user_inst)
        else:
            stmt = stmt.where(
                or_(
                    Transfer.dest_institution_id == user_inst,
                    Transfer.source_institution_id == user_inst,
                )
            )
    else:
        # AICTE admin/analyst can also use direction if specified with an institution
        if direction == "in" and user_inst:
            stmt = stmt.where(Transfer.dest_institution_id == user_inst)
        elif direction == "out" and user_inst:
            stmt = stmt.where(Transfer.source_institution_id == user_inst)

    return list(db.scalars(stmt.order_by(Transfer.requested_at.desc())).all())


def decide_transfer_service(
    db: Session,
    *,
    transfer_id: str,
    decision: str,
    remarks: str | None,
    principal: Principal,
) -> Transfer:
    """
    Source institution approves or rejects transfer.
    CRITICAL: Approval sets source student record enrolment_status to TRANSFERRED_OUT!
    """
    transfer = db.scalars(select(Transfer).where(Transfer.id == transfer_id)).first()
    if not transfer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Transfer '{transfer_id}' not found"},
        )

    # Check permission: source institution admin or AICTE admin
    if principal.role != "AICTE_ADMIN":
        if (
            principal.role != "INSTITUTION_ADMIN"
            or principal.institution_aicte_id != transfer.source_institution_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "FORBIDDEN",
                    "message": "Only the source institution administrator can decide this transfer",
                },
            )

    decision_norm = decision.strip().upper()
    if decision_norm not in ("APPROVED", "REJECTED"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "INVALID_DECISION", "message": "Decision must be APPROVED or REJECTED"},
        )

    now = datetime.now(UTC)
    transfer.status = decision_norm
    transfer.decided_at = now
    transfer.decided_by = principal.id
    if remarks:
        transfer.reason = (transfer.reason or "") + f" | Decision remarks: {remarks}"

    if decision_norm == "APPROVED":
        # Find student record at source institution and update to TRANSFERRED_OUT
        student = db.scalars(
            select(StudentRecord).where(
                StudentRecord.apaar_id == transfer.apaar_id,
                StudentRecord.institution_aicte_id == transfer.source_institution_id,
            )
        ).first()

        if student:
            # Archive version
            version_archive = StudentRecordVersion(
                id=str(uuid.uuid4()),
                apaar_id=student.apaar_id,
                record_version=student.record_version,
                snapshot_json={
                    "institution_aicte_id": student.institution_aicte_id,
                    "program_code": student.program_code,
                    "enrolment_status": student.enrolment_status,
                    "academic_year": student.academic_year,
                    "year_of_study": student.year_of_study,
                },
                changed_by=principal.id,
                change_reason=f"Approved transfer to {transfer.dest_institution_id}",
                created_at=now,
            )
            db.add(version_archive)

            # Update status
            student.enrolment_status = "TRANSFERRED_OUT"
            student.record_version += 1
            student.updated_at = now

            # Supersede active credentials
            db.query(Credential).filter(
                Credential.apaar_hash == student.apaar_hash,
                Credential.status == "ACTIVE",
            ).update({"status": "SUPERSEDED", "revoked_at": now})

    append_audit_log(
        db,
        action="TRANSFER_DECIDED",
        actor_type="API_KEY" if principal.is_api_key else "USER",
        actor_id=principal.id,
        role=principal.role,
        resource="TRANSFER",
        resource_id=transfer.id,
        payload={
            "decision": decision_norm,
            "remarks": remarks,
            "apaar_id": transfer.apaar_id,
            "source": transfer.source_institution_id,
            "dest": transfer.dest_institution_id,
        },
    )

    db.commit()
    db.refresh(transfer)
    return transfer


def override_transfer_service(
    db: Session,
    *,
    transfer_id: str,
    decision: str,
    reason: str,
    principal: Principal,
) -> Transfer:
    """
    AICTE_ADMIN override for stale or disputed transfers (typically after 15 days).
    Approval sets source record to TRANSFERRED_OUT.
    """
    if principal.role != "AICTE_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "FORBIDDEN",
                "message": "Only AICTE_ADMIN can execute transfer overrides",
            },
        )

    transfer = db.scalars(select(Transfer).where(Transfer.id == transfer_id)).first()
    if not transfer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Transfer '{transfer_id}' not found"},
        )

    decision_norm = decision.strip().upper()
    if decision_norm not in ("APPROVED", "REJECTED"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "INVALID_DECISION", "message": "Decision must be APPROVED or REJECTED"},
        )

    now = datetime.now(UTC)
    transfer.status = "APPROVED" if decision_norm == "APPROVED" else "REJECTED"
    transfer.decided_at = now
    transfer.decided_by = principal.id
    transfer.reason = (transfer.reason or "") + f" | AICTE Override ({decision_norm}): {reason}"

    if decision_norm == "APPROVED":
        student = db.scalars(
            select(StudentRecord).where(
                StudentRecord.apaar_id == transfer.apaar_id,
                StudentRecord.institution_aicte_id == transfer.source_institution_id,
            )
        ).first()

        if student:
            version_archive = StudentRecordVersion(
                id=str(uuid.uuid4()),
                apaar_id=student.apaar_id,
                record_version=student.record_version,
                snapshot_json={
                    "institution_aicte_id": student.institution_aicte_id,
                    "program_code": student.program_code,
                    "enrolment_status": student.enrolment_status,
                    "academic_year": student.academic_year,
                },
                changed_by=principal.id,
                change_reason=(
                    f"AICTE Administrator transfer override to "
                    f"{transfer.dest_institution_id}: {reason}"
                ),
                created_at=now,
            )
            db.add(version_archive)

            student.enrolment_status = "TRANSFERRED_OUT"
            student.record_version += 1
            student.updated_at = now

            db.query(Credential).filter(
                Credential.apaar_hash == student.apaar_hash,
                Credential.status == "ACTIVE",
            ).update({"status": "SUPERSEDED", "revoked_at": now})

    append_audit_log(
        db,
        action="TRANSFER_OVERRIDDEN",
        actor_type="API_KEY" if principal.is_api_key else "USER",
        actor_id=principal.id,
        role=principal.role,
        resource="TRANSFER",
        resource_id=transfer.id,
        payload={"decision": decision_norm, "reason": reason, "apaar_id": transfer.apaar_id},
    )

    db.commit()
    db.refresh(transfer)
    return transfer
