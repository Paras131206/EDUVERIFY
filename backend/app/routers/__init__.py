"""
Central router registration for EduVerify API.
Each feature router is imported and registered in sorted alphabetical order.
"""

from fastapi import APIRouter

# Registered routers list
ROUTERS: list[APIRouter] = []
