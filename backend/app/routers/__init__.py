"""
Central router registration for EduVerify API.
Each feature router is imported and registered in sorted alphabetical order.
Complies with agents.md §2.1 rule 7 and prompts B1, B2, B3, B4, B5.
"""

from app.routers.api_keys import router as api_keys_router
from app.routers.audit import router as audit_router
from app.routers.auth import router as auth_router
from app.routers.batches import router as batches_router
from app.routers.consent import router as consent_router
from app.routers.credentials import router as credentials_router
from app.routers.dashboards import router as dashboards_router
from app.routers.duplicates import router as duplicates_router
from app.routers.employer import router as employer_router
from app.routers.events import router as events_router
from app.routers.exports import router as exports_router
from app.routers.issues import router as issues_router
from app.routers.master import router as master_router
from app.routers.notifications import router as notifications_router
from app.routers.reconciliation import router as reconciliation_router
from app.routers.registry import router as registry_router
from app.routers.reports import router as reports_router
from app.routers.rollover import router as rollover_router
from app.routers.students import router as students_router
from app.routers.templates import router as templates_router
from app.routers.transfers import router as transfers_router
from app.routers.users import router as users_router
from app.routers.verification import router as verification_router
from app.routers.webhooks import router as webhooks_router
from fastapi import APIRouter

# Registered feature routers in alphabetical order
ROUTERS: list[APIRouter] = [
    api_keys_router,
    audit_router,
    auth_router,
    batches_router,
    consent_router,
    credentials_router,
    dashboards_router,
    duplicates_router,
    employer_router,
    events_router,
    exports_router,
    issues_router,
    master_router,
    notifications_router,
    reconciliation_router,
    registry_router,
    reports_router,
    rollover_router,
    students_router,
    templates_router,
    transfers_router,
    users_router,
    verification_router,
    webhooks_router,
]
