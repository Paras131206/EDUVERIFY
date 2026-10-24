"""
Central router registration for EduVerify API.
Each feature router is imported and registered in sorted alphabetical order.
Complies with prompt B-MASTER and B1.
"""

from app.routers.api_keys import router as api_keys_router
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from fastapi import APIRouter

# Registered feature routers in alphabetical order
ROUTERS: list[APIRouter] = [
    api_keys_router,
    auth_router,
    users_router,
]
