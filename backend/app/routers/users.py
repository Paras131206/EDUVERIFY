"""
User management router for administration and staff account provisioning.
Complies with contracts/openapi.yaml, agents.md §9, and prompt B1.
"""

from app.db import get_db
from app.models.auth import User
from app.schemas.auth import CreateUserRequest, UpdateUserRequest, UserProfile, UserRole
from app.security.deps import (
    Principal,
    require_roles,
    require_same_institution,
)
from app.security.passwords import hash_password, validate_password_strength
from app.services.audit import append_audit_log
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/v1/users", tags=["Users"])


@router.get(
    "",
    response_model=list[UserProfile],
    summary="List users with role filter",
)
def list_users(
    role: UserRole | None = None,
    institution_aicte_id: str | None = None,
    principal: Principal = Depends(require_roles("AICTE_ADMIN", "INSTITUTION_ADMIN")),
    db: Session = Depends(get_db),
) -> list[UserProfile]:
    """Lists users filtered by role or institution scoped by permissions."""
    query = db.query(User)

    if principal.role == "INSTITUTION_ADMIN":
        query = query.filter(User.institution_aicte_id == principal.institution_aicte_id)
    elif institution_aicte_id:
        query = query.filter(User.institution_aicte_id == institution_aicte_id)

    if role:
        query = query.filter(User.role == role.value)

    users = query.order_by(User.created_at.desc()).all()
    return [UserProfile.model_validate(u) for u in users]


@router.post(
    "",
    response_model=UserProfile,
    status_code=status.HTTP_201_CREATED,
    summary="Create new system user",
)
def create_user(
    request: Request,
    body: CreateUserRequest,
    principal: Principal = Depends(require_roles("AICTE_ADMIN", "INSTITUTION_ADMIN")),
    db: Session = Depends(get_db),
) -> UserProfile:
    """Creates a new user account with hashed password and role assignment."""
    # INSTITUTION_ADMIN may only create staff or admin within their institution
    if principal.role == "INSTITUTION_ADMIN":
        if body.role not in (UserRole.INSTITUTION_STAFF, UserRole.INSTITUTION_ADMIN):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "detail": "Institution admins may only create institution staff or admins",
                    "code": "FORBIDDEN",
                },
            )
        target_inst = principal.institution_aicte_id
    else:
        target_inst = body.institution_aicte_id

    # Check unique email
    existing = db.query(User).filter(User.email == body.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "detail": "A user with this email address already exists",
                "code": "EMAIL_EXISTS",
            },
        )

    try:
        validate_password_strength(body.password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": str(e), "code": "WEAK_PASSWORD"},
        ) from e

    pwd_hash = hash_password(body.password)

    new_user = User(
        email=body.email.lower().strip(),
        password_hash=pwd_hash,
        full_name=body.full_name.strip(),
        role=body.role.value,
        institution_aicte_id=target_inst,
        dab_id=body.dab_id,
        is_active=True,
    )
    db.add(new_user)

    ip_addr = request.client.host if request.client else None
    append_audit_log(
        db,
        action="USER_CREATED",
        actor_type="USER",
        actor_id=principal.id,
        role=principal.role,
        resource="USER",
        resource_id=new_user.id,
        payload={
            "email": new_user.email,
            "role": new_user.role,
            "institution_id": new_user.institution_aicte_id,
        },
        ip_address=ip_addr,
    )
    db.commit()

    return UserProfile.model_validate(new_user)


@router.get(
    "/{id}",
    response_model=UserProfile,
    summary="Get user details by ID",
)
def get_user_by_id(
    id: str,
    principal: Principal = Depends(require_roles("AICTE_ADMIN", "INSTITUTION_ADMIN")),
    db: Session = Depends(get_db),
) -> UserProfile:
    """Retrieves user details by ID."""
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "User not found", "code": "NOT_FOUND"},
        )

    if principal.role != "AICTE_ADMIN":
        require_same_institution(principal, user.institution_aicte_id)

    return UserProfile.model_validate(user)


@router.put(
    "/{id}",
    response_model=UserProfile,
    summary="Update user details or active status",
)
def update_user(
    id: str,
    request: Request,
    body: UpdateUserRequest,
    principal: Principal = Depends(require_roles("AICTE_ADMIN", "INSTITUTION_ADMIN")),
    db: Session = Depends(get_db),
) -> UserProfile:
    """Updates user full name, role, or active status."""
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "User not found", "code": "NOT_FOUND"},
        )

    if principal.role != "AICTE_ADMIN":
        require_same_institution(principal, user.institution_aicte_id)

    if body.full_name is not None:
        user.full_name = body.full_name.strip()
    if body.is_active is not None:
        user.is_active = body.is_active
    if body.role is not None and principal.role == "AICTE_ADMIN":
        user.role = body.role.value

    ip_addr = request.client.host if request.client else None
    append_audit_log(
        db,
        action="USER_UPDATED",
        actor_type="USER",
        actor_id=principal.id,
        role=principal.role,
        resource="USER",
        resource_id=user.id,
        payload={"is_active": user.is_active, "role": user.role},
        ip_address=ip_addr,
    )
    db.commit()

    return UserProfile.model_validate(user)
