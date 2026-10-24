"""
APAAR Central Identity Registry adapter and mock implementation.
Complies with agents.md §5, §6, §8 and prompt B2.
"""

from dataclasses import dataclass
from typing import Any, Protocol, runtime_checkable

from app.models.core import MockApaarRegistry as MockApaarRegistryModel
from app.security.crypto import mask_name
from sqlalchemy import select
from sqlalchemy.orm import Session


@runtime_checkable
class ApaarRegistryEntry(Protocol):
    apaar_id: str
    full_name: str
    dob: str
    gender: str


@dataclass(frozen=True)
class ApaarRecord:
    apaar_id: str
    full_name: str
    dob: str
    gender: str


@runtime_checkable
class ApaarRegistry(Protocol):
    """Protocol matching what the validation engine and verification services expect."""

    def lookup(self, apaar_id: str) -> ApaarRecord | None: ...

    def check(self, apaar_id: str) -> dict[str, Any]: ...


class MockApaarRegistry:
    """
    Database-backed mock implementation of ApaarRegistry.
    Queries the mock_apaar_registry table populated from data/demo/demo_registry.csv.
    """

    def __init__(self, db: Session) -> None:
        self.db = db

    def lookup(self, apaar_id: str) -> ApaarRecord | None:
        """Query registry table and return normalized ApaarRecord for validation."""
        clean_id = apaar_id.strip()
        stmt = select(MockApaarRegistryModel).where(MockApaarRegistryModel.apaar_id == clean_id)
        row = self.db.scalars(stmt).first()
        if not row:
            return None
        return ApaarRecord(
            apaar_id=row.apaar_id,
            full_name=row.full_name,
            dob=str(row.dob),
            gender=row.gender,
        )

    def check(self, apaar_id: str) -> dict[str, Any]:
        """
        Check existence and return masked details for AICTE admins/analysts.
        Complies with prompt B2 item 4: GET /v1/registry/{apaar}/check.
        """
        record = self.lookup(apaar_id)
        if not record:
            return {
                "exists": False,
                "apaar_id": apaar_id.strip(),
                "match": None,
            }
        return {
            "exists": True,
            "apaar_id": record.apaar_id,
            "match": {
                "full_name_masked": mask_name(record.full_name),
                "dob": record.dob,
                "gender": record.gender,
            },
        }
