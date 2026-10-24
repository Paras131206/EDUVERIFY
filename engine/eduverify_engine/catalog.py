"""
Rule catalog loader and validator for EduVerify Engine.
Reads from contracts/rule_catalog.yaml.
"""

from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, Field


class RuleCatalogItem(BaseModel):
    id: str
    name: str
    severity: str
    default_priority: str
    bucket_policy: str
    owner: str = "team-c"
    since_version: str = "0.1.0"
    description: str
    fix_hint: str | None = None


class RuleCatalog(BaseModel):
    catalog_version: str
    owner: str
    description: str | None = None
    rules: list[RuleCatalogItem] = Field(default_factory=list)

    def get_rule(self, rule_id: str) -> RuleCatalogItem | None:
        for r in self.rules:
            if r.id == rule_id:
                return r
        return None

    def as_dict(self) -> dict[str, RuleCatalogItem]:
        return {r.id: r for r in self.rules}


def get_default_catalog_path() -> Path:
    """Finds contracts/rule_catalog.yaml relative to package or repo root."""
    current = Path(__file__).resolve()
    # Check parent traversals
    for parent in [current.parent.parent.parent, current.parent.parent, current.parent]:
        candidate = parent / "contracts" / "rule_catalog.yaml"
        if candidate.exists():
            return candidate
    return Path("contracts/rule_catalog.yaml")


def load_rule_catalog(catalog_path: Path | str | None = None) -> RuleCatalog:
    """Loads and validates the rule catalog YAML file."""
    path = Path(catalog_path) if catalog_path else get_default_catalog_path()
    if not path.exists():
        raise FileNotFoundError(f"Rule catalog not found at {path}")

    with open(path, "r", encoding="utf-8") as f:
        data: dict[str, Any] = yaml.safe_load(f)

    return RuleCatalog(**data)
