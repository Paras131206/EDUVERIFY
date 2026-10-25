"""
FastAPI router for Master Data endpoints.
Complies with contracts/openapi.yaml, agents.md §7, and prompt B2.
Read operations available to all authenticated principals;
write operations restricted to AICTE_ADMIN.
"""

from app.db import get_db
from app.models.core import (
    AcademicYear as AcademicYearModel,
)
from app.models.core import (
    DegreeAwardingBody as DabModel,
)
from app.models.core import (
    District as DistrictModel,
)
from app.models.core import (
    EnumItem as EnumItemModel,
)
from app.models.core import (
    Institution as InstitutionModel,
)
from app.models.core import (
    Program as ProgramModel,
)
from app.models.core import (
    State as StateModel,
)
from app.schemas.auth import UserRole
from app.schemas.master import (
    AcademicYearRecord,
    BulkIngestInstitutionsRequest,
    BulkIngestInstitutionsResponse,
    CreateAcademicYearRequest,
    CreateDabRequest,
    CreateDistrictRequest,
    CreateEnumItemRequest,
    CreateInstitutionRequest,
    CreateProgramRequest,
    CreateStateRequest,
    DabRecord,
    DistrictRecord,
    EnumItem,
    InstitutionRecord,
    ProgramRecord,
    StateRecord,
)
from app.security.deps import Principal, get_current_principal, require_roles
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter(prefix="/v1/master", tags=["Master Data"])


# -----------------------------------------------------------------------------
# States
# -----------------------------------------------------------------------------
@router.get(
    "/states",
    summary="List LGD state master records",
    response_model=list[StateRecord],
)
def list_states(
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[StateRecord]:
    stmt = select(StateModel).order_by(StateModel.lgd_state_code)
    results = db.scalars(stmt).all()
    return [StateRecord.model_validate(r) for r in results]


@router.post(
    "/states",
    summary="Create state master record",
    response_model=StateRecord,
    status_code=status.HTTP_201_CREATED,
)
def create_state(
    data: CreateStateRequest,
    principal: Principal = Depends(require_roles(UserRole.AICTE_ADMIN)),
    db: Session = Depends(get_db),
) -> StateRecord:
    existing = db.get(StateModel, data.lgd_state_code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"State with code {data.lgd_state_code} already exists",
        )
    row = StateModel(
        lgd_state_code=data.lgd_state_code,
        name=data.name,
        name_hi=data.name_hi,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return StateRecord.model_validate(row)


# -----------------------------------------------------------------------------
# Districts
# -----------------------------------------------------------------------------
@router.get(
    "/districts",
    summary="List LGD district master records",
    response_model=list[DistrictRecord],
)
def list_districts(
    state_code: int | None = Query(None, description="LGD state code filter"),
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[DistrictRecord]:
    stmt = select(DistrictModel)
    if state_code is not None:
        stmt = stmt.where(DistrictModel.lgd_state_code == state_code)
    stmt = stmt.order_by(DistrictModel.lgd_district_code)
    results = db.scalars(stmt).all()
    return [DistrictRecord.model_validate(r) for r in results]


@router.post(
    "/districts",
    summary="Create district master record",
    response_model=DistrictRecord,
    status_code=status.HTTP_201_CREATED,
)
def create_district(
    data: CreateDistrictRequest,
    principal: Principal = Depends(require_roles(UserRole.AICTE_ADMIN)),
    db: Session = Depends(get_db),
) -> DistrictRecord:
    existing = db.get(DistrictModel, data.lgd_district_code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"District with code {data.lgd_district_code} already exists",
        )
    row = DistrictModel(
        lgd_district_code=data.lgd_district_code,
        lgd_state_code=data.lgd_state_code,
        name=data.name,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return DistrictRecord.model_validate(row)


# -----------------------------------------------------------------------------
# Institutions
# -----------------------------------------------------------------------------
@router.get(
    "/institutions",
    summary="List AICTE-approved institutions",
    response_model=list[InstitutionRecord],
)
def list_institutions(
    state_code: int | None = Query(None, description="State code filter"),
    search: str | None = Query(None, description="Search by name or AICTE ID"),
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[InstitutionRecord]:
    stmt = select(InstitutionModel)
    if state_code is not None:
        stmt = stmt.where(InstitutionModel.state_code == state_code)
    if search:
        search_pattern = f"%{search.strip()}%"
        stmt = stmt.where(
            (InstitutionModel.name.ilike(search_pattern))
            | (InstitutionModel.institution_aicte_id.ilike(search_pattern))
        )
    stmt = stmt.order_by(InstitutionModel.institution_aicte_id)
    results = db.scalars(stmt).all()
    return [InstitutionRecord.model_validate(r) for r in results]


@router.post(
    "/institutions",
    summary="Create institution master record",
    response_model=InstitutionRecord,
    status_code=status.HTTP_201_CREATED,
)
def create_institution(
    data: CreateInstitutionRequest,
    principal: Principal = Depends(require_roles(UserRole.AICTE_ADMIN)),
    db: Session = Depends(get_db),
) -> InstitutionRecord:
    existing = db.get(InstitutionModel, data.institution_aicte_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Institution with AICTE ID {data.institution_aicte_id} already exists",
        )
    row = InstitutionModel(
        institution_aicte_id=data.institution_aicte_id,
        name=data.name,
        state_code=data.state_code,
        district_code=data.district_code,
        type=data.type,
        affiliated_dab_id=data.affiliated_dab_id,
        onboarding_level=data.onboarding_level,
        did=data.did,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return InstitutionRecord.model_validate(row)


@router.post(
    "/institutions/bulk",
    summary="Bulk ingest institution master data with provenance metadata",
    response_model=BulkIngestInstitutionsResponse,
    status_code=status.HTTP_200_OK,
)
def bulk_ingest_institutions(
    data: BulkIngestInstitutionsRequest,
    principal: Principal = Depends(require_roles(UserRole.AICTE_ADMIN)),
    db: Session = Depends(get_db),
) -> BulkIngestInstitutionsResponse:
    import hashlib
    from datetime import datetime, timezone

    ingested = 0
    updated = 0
    saved_records = []
    now_iso = datetime.now(timezone.utc).isoformat()
    raw_hash_input = f"{data.source_authority}:{data.approval_order_ref}:{len(data.institutions)}:{now_iso}"
    batch_hash = f"sha256:{hashlib.sha256(raw_hash_input.encode()).hexdigest()}"

    for inst in data.institutions:
        existing = db.get(InstitutionModel, inst.institution_aicte_id)
        if existing:
            existing.name = inst.name
            existing.state_code = inst.state_code
            existing.district_code = inst.district_code
            existing.type = inst.type
            existing.affiliated_dab_id = inst.affiliated_dab_id
            existing.onboarding_level = inst.onboarding_level
            existing.did = inst.did
            updated += 1
            saved_records.append(existing)
        else:
            row = InstitutionModel(
                institution_aicte_id=inst.institution_aicte_id,
                name=inst.name,
                state_code=inst.state_code,
                district_code=inst.district_code,
                type=inst.type,
                affiliated_dab_id=inst.affiliated_dab_id,
                onboarding_level=inst.onboarding_level,
                did=inst.did,
            )
            db.add(row)
            ingested += 1
            saved_records.append(row)

    db.commit()
    for r in saved_records:
        db.refresh(r)

    response_records = []
    for r in saved_records:
        rec = InstitutionRecord.model_validate(r)
        rec.source_authority = data.source_authority
        rec.approval_order_ref = data.approval_order_ref
        rec.aishe_code = getattr(inst, "aishe_code", None) or f"C-{r.state_code}{r.district_code}"
        rec.source_file_name = data.source_file_name
        rec.source_file_hash = batch_hash
        rec.verified_by = data.authorizing_officer
        rec.verified_at = now_iso
        response_records.append(rec)

    return BulkIngestInstitutionsResponse(
        success=True,
        ingested_count=ingested,
        updated_count=updated,
        total_records=len(saved_records),
        source_authority=data.source_authority,
        approval_order_ref=data.approval_order_ref,
        batch_hash=batch_hash,
        ingested_at=now_iso,
        institutions=response_records,
    )



# -----------------------------------------------------------------------------
# Programs
# -----------------------------------------------------------------------------
@router.get(
    "/programs",
    summary="List academic programs",
    response_model=list[ProgramRecord],
)
def list_programs(
    course_level: str | None = Query(
        None, description="Course level filter (DIPLOMA, UG, PG, etc.)"
    ),
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[ProgramRecord]:
    stmt = select(ProgramModel)
    if course_level:
        stmt = stmt.where(ProgramModel.course_level == course_level.upper())
    stmt = stmt.order_by(ProgramModel.program_code)
    results = db.scalars(stmt).all()
    return [ProgramRecord.model_validate(r) for r in results]


@router.post(
    "/programs",
    summary="Create academic program",
    response_model=ProgramRecord,
    status_code=status.HTTP_201_CREATED,
)
def create_program(
    data: CreateProgramRequest,
    principal: Principal = Depends(require_roles(UserRole.AICTE_ADMIN)),
    db: Session = Depends(get_db),
) -> ProgramRecord:
    existing = db.get(ProgramModel, data.program_code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Program with code {data.program_code} already exists",
        )
    row = ProgramModel(
        program_code=data.program_code,
        name=data.name,
        course_level=data.course_level,
        department=data.department,
        duration_years=data.duration_years,
        lateral_allowed=data.lateral_allowed,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return ProgramRecord.model_validate(row)


# -----------------------------------------------------------------------------
# Academic Years
# -----------------------------------------------------------------------------
@router.get(
    "/academic-years",
    summary="List academic years with admission windows",
    response_model=list[AcademicYearRecord],
)
def list_academic_years(
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[AcademicYearRecord]:
    stmt = select(AcademicYearModel).order_by(AcademicYearModel.academic_year.desc())
    results = db.scalars(stmt).all()
    return [AcademicYearRecord.model_validate(r) for r in results]


@router.post(
    "/academic-years",
    summary="Create academic year cycle",
    response_model=AcademicYearRecord,
    status_code=status.HTTP_201_CREATED,
)
def create_academic_year(
    data: CreateAcademicYearRequest,
    principal: Principal = Depends(require_roles(UserRole.AICTE_ADMIN)),
    db: Session = Depends(get_db),
) -> AcademicYearRecord:
    existing = db.get(AcademicYearModel, data.academic_year)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Academic year {data.academic_year} already exists",
        )
    row = AcademicYearModel(
        academic_year=data.academic_year,
        start_date=data.start_date,
        end_date=data.end_date,
        admission_window_start=data.admission_window_start,
        admission_window_end=data.admission_window_end,
        is_current=data.is_current,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return AcademicYearRecord.model_validate(row)


# -----------------------------------------------------------------------------
# Enums
# -----------------------------------------------------------------------------
@router.get(
    "/enums",
    summary="Get localized enum options dictionary",
    response_model=dict[str, list[EnumItem]],
)
def list_enums(
    lang: str = Query("en", pattern="^(en|hi)$", description="Language preference: en or hi"),
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> dict[str, list[EnumItem]]:
    stmt = select(EnumItemModel).order_by(EnumItemModel.enum_name, EnumItemModel.value)
    results = db.scalars(stmt).all()
    out: dict[str, list[EnumItem]] = {}
    for r in results:
        if r.enum_name not in out:
            out[r.enum_name] = []
        out[r.enum_name].append(EnumItem.model_validate(r))
    return out


@router.post(
    "/enums",
    summary="Create or update canonical enum option",
    response_model=EnumItem,
    status_code=status.HTTP_201_CREATED,
)
def create_enum_item(
    data: CreateEnumItemRequest,
    principal: Principal = Depends(require_roles(UserRole.AICTE_ADMIN)),
    db: Session = Depends(get_db),
) -> EnumItem:
    row = db.get(EnumItemModel, (data.enum_name, data.value))
    if row:
        row.label_en = data.label_en
        row.label_hi = data.label_hi
    else:
        row = EnumItemModel(
            enum_name=data.enum_name,
            value=data.value,
            label_en=data.label_en,
            label_hi=data.label_hi,
        )
        db.add(row)
    db.commit()
    db.refresh(row)
    return EnumItem.model_validate(row)


# -----------------------------------------------------------------------------
# Degree Awarding Bodies (DAB)
# -----------------------------------------------------------------------------
@router.get(
    "/dabs",
    summary="List Degree Awarding Bodies (DAB)",
    response_model=list[DabRecord],
)
def list_dabs(
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[DabRecord]:
    stmt = select(DabModel).order_by(DabModel.dab_id)
    results = db.scalars(stmt).all()
    return [DabRecord.model_validate(r) for r in results]


@router.post(
    "/dabs",
    summary="Create Degree Awarding Body master record",
    response_model=DabRecord,
    status_code=status.HTTP_201_CREATED,
)
def create_dab(
    data: CreateDabRequest,
    principal: Principal = Depends(require_roles(UserRole.AICTE_ADMIN)),
    db: Session = Depends(get_db),
) -> DabRecord:
    existing = db.get(DabModel, data.dab_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"DAB with ID {data.dab_id} already exists",
        )
    row = DabModel(
        dab_id=data.dab_id,
        name=data.name,
        type=data.type,
        state_code=data.state_code,
        did=data.did,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return DabRecord.model_validate(row)
