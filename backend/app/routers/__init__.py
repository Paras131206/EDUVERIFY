"""
Central router registration for EduVerify API.
Each feature router is imported and registered in sorted alphabetical order.
Complies with agents.md §2.1 rule 7 and prompts B1, B2.
"""

from app.routers.api_keys import router as api_keys_router
from app.routers.auth import router as auth_router
from app.routers.master import router as master_router
from app.routers.registry import router as registry_router
from app.routers.templates import router as templates_router
from app.routers.users import router as users_router
from fastapi import APIRouter

# Registered feature routers in alphabetical order
ROUTERS: list[APIRouter] = [
    api_keys_router,
    auth_router,
    master_router,
    registry_router,
    templates_router,
    users_router,
]
