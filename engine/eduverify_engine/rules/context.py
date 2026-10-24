"""
Rule evaluation context for EduVerify Engine.
Holds master data, intake quotas, declared totals, mock registry,
central snapshot, history, transfers, and configuration.
"""

import logging
from pathlib import Path
from typing import Any

import pandas as pd

from ..catalog import RuleCatalog, load_rule_catalog
from ..models import ColumnMapping

logger = logging.getLogger(__name__)


def _find_repo_root() -> Path:
    """Finds repository root relative to this file."""
    current = Path(__file__).resolve()
    for parent in [
        current.parent.parent.parent.parent,
        current.parent.parent.parent,
        current.parent.parent,
    ]:
        if (parent / "contracts" / "rule_catalog.yaml").exists() or (
            parent / "data" / "master"
        ).exists():
            return parent
    return Path(".")


def load_master_tables(repo_root: Path | None = None) -> dict[str, pd.DataFrame]:
    """Loads all CSV master tables from data/master/ into DataFrames."""
    root = repo_root or _find_repo_root()
    master_dir = root / "data" / "master"
    tables: dict[str, pd.DataFrame] = {}
    if not master_dir.exists():
        return tables

    for csv_file in master_dir.glob("*.csv"):
        table_name = csv_file.stem
        try:
            tables[table_name] = pd.read_csv(csv_file, dtype=str)
        except (pd.errors.EmptyDataError, pd.errors.ParserError, OSError) as e:
            logger.warning(
                "Could not parse master table '%s' from %s: %s",
                table_name,
                csv_file,
                e,
            )
        except Exception as e:
            logger.error(
                "Unexpected failure reading master table '%s' from %s: %s",
                table_name,
                csv_file,
                e,
                exc_info=True,
            )
    return tables


def load_demo_csv(filename: str, repo_root: Path | None = None) -> pd.DataFrame:
    """Loads a CSV from data/demo/ if present, otherwise returns empty DataFrame."""
    root = repo_root or _find_repo_root()
    demo_file = root / "data" / "demo" / filename
    if demo_file.exists():
        try:
            return pd.read_csv(demo_file, dtype=str)
        except (pd.errors.EmptyDataError, pd.errors.ParserError, OSError) as e:
            logger.warning(
                "Could not load optional demo CSV '%s': %s",
                filename,
                e,
            )
        except Exception as e:
            logger.error(
                "Unexpected failure reading demo CSV '%s': %s",
                filename,
                e,
                exc_info=True,
            )
    return pd.DataFrame()


class RuleContext:
    """
    Context supplied to every rule function (df, ctx).
    Carries master tables, registry, intake, transfers, snapshots,
    academic year config, and uploader credentials.
    """

    def __init__(
        self,
        *,
        master: dict[str, pd.DataFrame] | None = None,
        intake: pd.DataFrame | None = None,
        declared_totals: pd.DataFrame | None = None,
        registry: pd.DataFrame | None = None,
        central_snapshot: pd.DataFrame | None = None,
        history: pd.DataFrame | None = None,
        previous_batch_profile: dict[str, Any] | None = None,
        previous_year_records: pd.DataFrame | None = None,
        transfers: pd.DataFrame | None = None,
        academic_year: str = "2026-27",
        institution_aicte_id: str = "1-100010001",
        authenticated_institution_id: str | None = None,
        batch_id: str | None = None,
        mapping: list[ColumnMapping] | None = None,
        raw_df: pd.DataFrame | None = None,
        catalog: RuleCatalog | None = None,
        repo_root: Path | None = None,
    ) -> None:
        self.repo_root = repo_root or _find_repo_root()
        self.academic_year = academic_year
        self.institution_aicte_id = institution_aicte_id
        self.authenticated_institution_id = authenticated_institution_id or institution_aicte_id
        self.batch_id = batch_id or ""
        self.mapping = mapping or []
        self.raw_df = raw_df
        self.catalog = catalog or load_rule_catalog()
        self.previous_batch_profile = previous_batch_profile
        self.previous_year_records = previous_year_records

        # Load or use provided master tables
        self.master = master if master is not None else load_master_tables(self.repo_root)

        # Load or use provided intake
        if intake is not None:
            self.intake = intake
        else:
            self.intake = load_demo_csv("demo_intake.csv", self.repo_root)

        # Load or use declared totals
        if declared_totals is not None:
            self.declared_totals = declared_totals
        else:
            self.declared_totals = load_demo_csv("demo_declared_totals.csv", self.repo_root)

        # Load or use mock registry
        if registry is not None:
            self.registry = registry
        else:
            self.registry = load_demo_csv("demo_registry.csv", self.repo_root)

        # Load or use central snapshot
        if central_snapshot is not None:
            self.central_snapshot = central_snapshot
        else:
            self.central_snapshot = load_demo_csv("demo_central_snapshot.csv", self.repo_root)

        # Load or use history
        if history is not None:
            self.history = history
        else:
            self.history = load_demo_csv("demo_history.csv", self.repo_root)

        # Load or use transfers
        if transfers is not None:
            self.transfers = transfers
        else:
            self.transfers = load_demo_csv("demo_transfers.csv", self.repo_root)

        # Build fast lookup indexes
        self._init_lookups()

    def _init_lookups(self) -> None:
        """Precomputes hash sets and dicts for fast row validation."""
        # 1. Registry lookup by apaar_id
        self._registry_by_apaar: dict[str, dict[str, Any]] = {}
        if not self.registry.empty and "apaar_id" in self.registry.columns:
            for _, r in self.registry.iterrows():
                aid = str(r["apaar_id"]).strip()
                if aid:
                    self._registry_by_apaar[aid] = r.to_dict()

        # 2. Programs lookup by program_code
        self._programs_by_code: dict[str, dict[str, Any]] = {}
        programs_df = self.master.get("programs", pd.DataFrame())
        if not programs_df.empty and "program_code" in programs_df.columns:
            for _, r in programs_df.iterrows():
                code = str(r["program_code"]).strip()
                if code:
                    self._programs_by_code[code] = r.to_dict()

        # 3. Academic years lookup
        self._academic_years: dict[str, dict[str, Any]] = {}
        ay_df = self.master.get("academic_years", pd.DataFrame())
        if not ay_df.empty and "academic_year" in ay_df.columns:
            for _, r in ay_df.iterrows():
                ay = str(r["academic_year"]).strip()
                if ay:
                    self._academic_years[ay] = r.to_dict()

        # 4. Enums lookup by enum_name -> set of valid values
        self._enums: dict[str, set[str]] = {}
        enums_df = self.master.get("enums", pd.DataFrame())
        if not enums_df.empty and "enum_name" in enums_df.columns and "value" in enums_df.columns:
            for _, r in enums_df.iterrows():
                ename = str(r["enum_name"]).strip()
                eval_val = str(r["value"]).strip()
                self._enums.setdefault(ename, set()).add(eval_val)

        # 5. Institutions lookup by institution_aicte_id
        self._institutions: dict[str, dict[str, Any]] = {}
        inst_df = self.master.get("institutions", pd.DataFrame())
        if not inst_df.empty and "institution_aicte_id" in inst_df.columns:
            for _, r in inst_df.iterrows():
                iid = str(r["institution_aicte_id"]).strip()
                if iid:
                    self._institutions[iid] = r.to_dict()

        # 6. Central snapshot lookup by apaar_id
        self._snapshot_by_apaar: dict[str, list[dict[str, Any]]] = {}
        if not self.central_snapshot.empty and "apaar_id" in self.central_snapshot.columns:
            for _, r in self.central_snapshot.iterrows():
                aid = str(r["apaar_id"]).strip()
                if aid:
                    self._snapshot_by_apaar.setdefault(aid, []).append(r.to_dict())

    def lookup_registry(self, apaar_id: str) -> dict[str, Any] | None:
        """Returns demographic registry record for given APAAR ID or None."""
        return self._registry_by_apaar.get(str(apaar_id).strip())

    def get_program(self, program_code: str) -> dict[str, Any] | None:
        """Returns program master record for given program_code or None."""
        return self._programs_by_code.get(str(program_code).strip())

    def get_academic_year_window(self, academic_year: str) -> tuple[str, str] | None:
        """Returns (admission_window_start, admission_window_end) for academic_year."""
        rec = self._academic_years.get(str(academic_year).strip())
        if rec and "admission_window_start" in rec and "admission_window_end" in rec:
            return str(rec["admission_window_start"]).strip(), str(
                rec["admission_window_end"]
            ).strip()
        return None

    def get_institution(self, inst_id: str) -> dict[str, Any] | None:
        """Returns institution master record or None."""
        return self._institutions.get(str(inst_id).strip())

    def get_valid_enums(self, enum_name: str) -> set[str]:
        """Returns set of valid enum values for enum_name."""
        return self._enums.get(enum_name, set())

    def get_intake_record(
        self, program_code: str, institution_id: str | None = None, academic_year: str | None = None
    ) -> dict[str, Any] | None:
        """Returns approved intake record for (institution, program, year)."""
        inst = institution_id or self.institution_aicte_id
        year = academic_year or self.academic_year
        if self.intake.empty:
            return None

        mask = (
            (self.intake["program_code"].astype(str) == str(program_code))
            & (self.intake["institution_aicte_id"].astype(str) == str(inst))
            & (self.intake["academic_year"].astype(str) == str(year))
        )
        subset = self.intake[mask]
        if not subset.empty:
            return subset.iloc[0].to_dict()
        return None

    def get_snapshot_records(self, apaar_id: str) -> list[dict[str, Any]]:
        """Returns central snapshot records for given apaar_id."""
        return self._snapshot_by_apaar.get(str(apaar_id).strip(), [])
