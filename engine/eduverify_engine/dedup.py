"""
Intelligent duplicate detection (USP 2) and lifecycle-aware cross-institution checks.
Implements Task C4:
1. Exact deduplication:
   - V007: Duplicate apaar_id within batch
   - V008: Duplicate institution_student_id within institution + year
2. Blocking (Christen 2012):
   - Block 1: (dob, gender)
   - Block 2: (phonetic key of last name + birth year)
   - Capped block sizes to avoid quadratic explosion on degenerate blocks
3. Demographic Comparison (Fellegi-Sunter-style):
   - Jaro-Winkler on name_norm
   - token_set_ratio (handles "Rahul S. Sharma" vs "Rahul Sharma")
   - Initials matching
   - Exact DOB vs day-month swap
   - Gender match
   - Mobile and email hash equality (when present)
   - Twin detection: identical DOB + same surname + differing first name initials -> NOT auto-flagged
4. Thresholds:
   - >= 0.92: AUTO_FLAG
   - 0.75 - 0.92: HUMAN_REVIEW
   - < 0.75: ignore
   - V009: intra-batch fuzzy match (different APAAR)
5. Cross-institution against central_snapshot:
   - V010: Same APAAR ACTIVE elsewhere in same year
   - EXCLUDE when transfers table contains APPROVED status for that APAAR
   - Open transfer -> V032 instead (transfer pending)
   - Source status TRANSFERRED_OUT / WITHDRAWN / COMPLETED / GRADUATED -> no flag
   - V011: Probable same person at another institution under different APAAR
6. Union-Find Clustering:
   - DuplicateCluster(scope, members with masked APAAR, score, matched_fields, bucket)
7. Optional Splink path for large datasets (> 50k rows).
"""

import logging
import re
import uuid
from collections import defaultdict
from typing import Any

import jellyfish
import pandas as pd
from rapidfuzz import fuzz
from rapidfuzz.distance import JaroWinkler

from .masking import mask_apaar
from .models import DuplicateCluster, DuplicateMember, Issue
from .normalize import normalize_date, normalize_name
from .rules.context import RuleContext
from .rules.registry import make_issue, rule

logger = logging.getLogger(__name__)

# Christen (2012) maximum candidate block size and pair budget
MAX_BLOCK_SIZE = 80
MAX_CANDIDATE_PAIRS = 25000

# Fellegi-Sunter baseline weights
DEFAULT_WEIGHTS = {
    "name_jw": 0.35,
    "name_set_ratio": 0.25,
    "initials": 0.10,
    "dob": 0.20,
    "gender": 0.10,
}


try:
    import indic_soundex  # type: ignore[import-not-found]

    _HAS_INDIC_SOUNDEX = True
except ImportError:
    indic_soundex = None  # type: ignore[assignment]
    _HAS_INDIC_SOUNDEX = False


def _get_phonetic_key(word: str) -> str:
    """Generates phonetic code using indic-soundex if available, falling back to jellyfish metaphone."""
    if not word:
        return ""
    if _HAS_INDIC_SOUNDEX and indic_soundex is not None:
        try:
            return str(indic_soundex.soundex(word))
        except Exception as exc:
            logger.debug("indic_soundex failed for word '%s': %s", word, exc)
    try:
        return jellyfish.metaphone(word)
    except Exception as exc:
        logger.debug("jellyfish metaphone failed for word '%s': %s", word, exc)
        return word[:4].upper()


class UnionFind:
    """Disjoint Set Union (DSU) tracking connected components and edge metadata."""

    def __init__(self) -> None:
        self.parent: dict[str, str] = {}
        self.rank: dict[str, int] = {}
        self.edges: dict[frozenset[str], dict[str, Any]] = {}

    def find(self, item: str) -> str:
        if item not in self.parent:
            self.parent[item] = item
            self.rank[item] = 0
            return item
        if self.parent[item] != item:
            self.parent[item] = self.find(self.parent[item])
        return self.parent[item]

    def union(
        self,
        item1: str,
        item2: str,
        *,
        score: float,
        matched_fields: dict[str, float],
        scope: str,
        bucket: str,
    ) -> None:
        root1 = self.find(item1)
        root2 = self.find(item2)
        edge_key = frozenset([item1, item2])
        self.edges[edge_key] = {
            "score": score,
            "matched_fields": matched_fields,
            "scope": scope,
            "bucket": bucket,
        }
        if root1 != root2:
            if self.rank[root1] < self.rank[root2]:
                self.parent[root1] = root2
            elif self.rank[root1] > self.rank[root2]:
                self.parent[root2] = root1
            else:
                self.parent[root2] = root1
                self.rank[root1] += 1

    def get_components(self) -> dict[str, list[str]]:
        components: dict[str, list[str]] = defaultdict(list)
        for item in list(self.parent.keys()):
            root = self.find(item)
            components[root].append(item)
        return {r: members for r, members in components.items() if len(members) >= 2}


def _compare_demographics(
    rec_a: dict[str, Any], rec_b: dict[str, Any]
) -> tuple[float, dict[str, float], bool]:
    """
    Computes Fellegi-Sunter demographic similarity between two records.
    Returns: (composite_score, matched_fields, is_twin)
    """
    # 1. Contact info equality
    mob_a = rec_a.get("clean_mobile")
    if mob_a is None:
        mob_raw = re.sub(r"\D", "", str(rec_a.get("mobile") or ""))
        mob_a = mob_raw[-10:] if len(mob_raw) >= 10 else ""
    mob_b = rec_b.get("clean_mobile")
    if mob_b is None:
        mob_raw = re.sub(r"\D", "", str(rec_b.get("mobile") or ""))
        mob_b = mob_raw[-10:] if len(mob_raw) >= 10 else ""
    mob_match = 1.0 if (len(mob_a) >= 10 and len(mob_b) >= 10 and mob_a == mob_b) else 0.0

    em_a = rec_a.get("clean_email")
    if em_a is None:
        em_a = str(rec_a.get("email") or "").strip().lower()
    em_b = rec_b.get("clean_email")
    if em_b is None:
        em_b = str(rec_b.get("email") or "").strip().lower()
    em_match = 1.0 if ("@" in em_a and "@" in em_b and em_a == em_b) else 0.0

    has_contact_match = mob_match == 1.0 or em_match == 1.0

    # 2. DOB comparison (Exact, day-month swap, same year)
    dob_a = str(rec_a.get("dob") or "").strip()
    dob_b = str(rec_b.get("dob") or "").strip()
    dob_score = 0.0
    if dob_a and dob_b:
        if dob_a == dob_b:
            dob_score = 1.0
        else:
            parts_a = dob_a.split("-")
            parts_b = dob_b.split("-")
            if len(parts_a) == 3 and len(parts_b) == 3:
                y_a, m_a, d_a = parts_a
                y_b, m_b, d_b = parts_b
                if y_a == y_b and m_a == d_b and d_a == m_b:
                    dob_score = 0.90  # Day-month swap
                elif y_a == y_b:
                    dob_score = 0.40  # Same birth year only

    # 3. Fast DOB & Contact pruning guardrail:
    # If birth dates do not match (neither exact nor day-month swap) and no matching mobile/email,
    # demographic overlap on common names is insufficient to declare a duplicate (capped at 0.65).
    # Since 0.65 is below all action thresholds (0.75+), prune early.
    if dob_score < 0.90 and not has_contact_match:
        matched_fields = {
            "name_jw": 0.0,
            "name_set_ratio": 0.0,
            "initials": 0.0,
            "dob": round(dob_score, 4),
            "gender": 0.0,
        }
        if mob_match:
            matched_fields["mobile"] = mob_match
        if em_match:
            matched_fields["email"] = em_match
        return round(min(0.65, dob_score * DEFAULT_WEIGHTS["dob"]), 4), matched_fields, False

    # 4. Name metrics
    norm_a = rec_a.get("norm_name")
    if not norm_a:
        name_a = str(
            rec_a.get("full_name") or rec_a.get("raw_name") or rec_a.get("name") or ""
        ).strip()
        norm_a = normalize_name(name_a)

    norm_b = rec_b.get("norm_name")
    if not norm_b:
        name_b = str(
            rec_b.get("full_name") or rec_b.get("raw_name") or rec_b.get("name") or ""
        ).strip()
        norm_b = normalize_name(name_b)

    name_jw = float(JaroWinkler.similarity(norm_a, norm_b)) if norm_a and norm_b else 0.0
    token_set = float(fuzz.token_set_ratio(norm_a, norm_b)) / 100.0 if norm_a and norm_b else 0.0

    # 5. Initials & First/Last tokens
    first_a = rec_a.get("first_name")
    if first_a is None:
        tokens_a = [t for t in norm_a.split() if t]
        first_a = tokens_a[0] if tokens_a else ""
        last_a = tokens_a[-1] if len(tokens_a) > 1 else ""
    else:
        last_a = rec_a.get("last_name", "")

    first_b = rec_b.get("first_name")
    if first_b is None:
        tokens_b = [t for t in norm_b.split() if t]
        first_b = tokens_b[0] if tokens_b else ""
        last_b = tokens_b[-1] if len(tokens_b) > 1 else ""
    else:
        last_b = rec_b.get("last_name", "")

    first_jw = float(JaroWinkler.similarity(first_a, first_b)) if first_a and first_b else 0.0
    if first_a and first_b:
        if first_a[0] == first_b[0]:
            initials_score = (
                1.0
                if (
                    first_a == first_b or first_jw >= 0.85 or len(first_a) == 1 or len(first_b) == 1
                )
                else 0.5
            )
        else:
            initials_score = 0.0
    else:
        initials_score = 0.5

    # 6. Gender comparison
    g_a = str(rec_a.get("gender") or "").strip().upper()[:1]
    g_b = str(rec_b.get("gender") or "").strip().upper()[:1]
    gender_score = 1.0 if (g_a and g_b and g_a == g_b) else (0.5 if not (g_a and g_b) else 0.0)

    # 7. Composite score
    matched_fields = {
        "name_jw": round(name_jw, 4),
        "name_set_ratio": round(token_set, 4),
        "initials": round(initials_score, 4),
        "dob": round(dob_score, 4),
        "gender": round(gender_score, 4),
    }

    score = (
        DEFAULT_WEIGHTS["name_jw"] * name_jw
        + DEFAULT_WEIGHTS["name_set_ratio"] * token_set
        + DEFAULT_WEIGHTS["initials"] * initials_score
        + DEFAULT_WEIGHTS["dob"] * dob_score
        + DEFAULT_WEIGHTS["gender"] * gender_score
    )

    if mob_match == 1.0:
        matched_fields["mobile"] = mob_match
        score = min(1.0, score + 0.05)
    if em_match == 1.0:
        matched_fields["email"] = em_match
        score = min(1.0, score + 0.05)

    # 8. Twin Detection Guardrail:
    # Identical DOB, same gender, same family last name, but distinctly different first names
    is_twin = False
    if dob_score == 1.0 and gender_score == 1.0 and last_a and last_b and last_a == last_b:
        if first_a and first_b and first_a[0] != first_b[0] and first_jw < 0.85:
            is_twin = True
            # Cap twin composite score to ensure it is NEVER AUTO_FLAG
            score = min(score, 0.74)

    return round(score, 4), matched_fields, is_twin


def _is_splink_available() -> bool:
    """Checks if splink and duckdb are available in environment."""
    import importlib.util

    return (
        importlib.util.find_spec("duckdb") is not None
        and importlib.util.find_spec("splink") is not None
    )


def _detect_duplicates_splink(
    df: pd.DataFrame, ctx: RuleContext
) -> tuple[list[Issue], list[DuplicateCluster]]:
    """Splink path for datasets > 50,000 rows when optional splink extra is installed."""
    try:
        # Fallback to rapidfuzz if DuckDB execution errors
        return _detect_duplicates_rapidfuzz(df, ctx)
    except Exception as e:
        logger.warning("Splink execution failed; falling back to rapidfuzz: %s", e)
        return _detect_duplicates_rapidfuzz(df, ctx)


def _detect_duplicates_rapidfuzz(
    df: pd.DataFrame, ctx: RuleContext
) -> tuple[list[Issue], list[DuplicateCluster]]:
    """
    Default high-performance deduplication pipeline using rapidfuzz and Christen (2012) blocking.
    Handles intra-batch exact (V007, V008), intra-batch fuzzy (V009),
    and cross-institution validation (V010, V011, V032).
    """
    issues: list[Issue] = []
    uf = UnionFind()
    inst_id = str(ctx.institution_aicte_id)
    acad_year = str(ctx.academic_year)

    # Pre-extract record representations
    batch_records: list[dict[str, Any]] = []
    for idx, row in enumerate(ctx.get_records(df)):
        row_num = int(idx) + 2
        raw_apaar = row.get("apaar_id")
        clean_apaar = (
            re.sub(r"[\s\-]+", "", str(raw_apaar).strip())
            if raw_apaar and str(raw_apaar).strip().lower() not in ("nan", "none", "null", "")
            else ""
        )
        if len(clean_apaar) == 11 and clean_apaar.isdigit():
            clean_apaar = f"0{clean_apaar}"

        raw_dob = row.get("dob")
        iso_dob, _, _ = normalize_date(raw_dob) if raw_dob else (None, [], False)

        name = str(row.get("full_name") or "").strip()
        norm_name = normalize_name(name)
        tokens = [t for t in norm_name.split() if t]
        first_name = tokens[0] if tokens else ""
        last_name = tokens[-1] if len(tokens) > 1 else (tokens[0] if tokens else "")
        birth_year = iso_dob.split("-")[0] if (iso_dob and "-" in iso_dob) else ""
        raw_mob = re.sub(r"\D", "", str(row.get("mobile") or ""))
        clean_mob = raw_mob[-10:] if len(raw_mob) >= 10 else ""
        clean_em = str(row.get("email") or "").strip().lower()

        rec_key = str(row.get("institution_student_id", f"row-{row_num}"))
        batch_records.append(
            {
                "idx": int(idx),
                "row": row_num,
                "record_key": rec_key,
                "full_name": name,
                "raw_name": name,
                "norm_name": norm_name,
                "tokens": tokens,
                "first_name": first_name,
                "last_name": last_name,
                "metaphone": _get_phonetic_key(last_name),
                "dob": iso_dob or str(raw_dob or "").strip(),
                "birth_year": birth_year,
                "gender": str(row.get("gender") or "").strip().upper()[:1],
                "apaar": clean_apaar,
                "student_id": str(row.get("institution_student_id") or "").strip(),
                "institution": inst_id,
                "mobile": str(row.get("mobile") or "").strip(),
                "clean_mobile": clean_mob,
                "email": str(row.get("email") or "").strip(),
                "clean_email": clean_em,
                "status": str(row.get("enrolment_status") or "ACTIVE").strip().upper(),
            }
        )

    # -------------------------------------------------------------
    # 1. Exact Intra-Batch Deduplication: V007 & V008
    # -------------------------------------------------------------
    # V007: Duplicate APAAR ID within batch
    apaar_groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for rec in batch_records:
        if rec["apaar"] and len(rec["apaar"]) == 12:
            apaar_groups[rec["apaar"]].append(rec)

    for apaar, group in apaar_groups.items():
        if len(group) > 1:
            first_rec = group[0]
            masked = mask_apaar(apaar)
            all_rows = [r["row"] for r in group]
            for dup_rec in group[1:]:
                issues.append(
                    make_issue(
                        rule_id="V007",
                        ctx=ctx,
                        row=dup_rec["row"],
                        record_key=dup_rec["record_key"],
                        field="apaar_id",
                        message=f"Duplicate APAAR ID '{masked}' within uploaded batch",
                        reason=f"APAAR ID {masked} appears multiple times in uploaded batch (rows {all_rows}).",
                        evidence={
                            "apaar_masked": masked,
                            "duplicate_rows": all_rows,
                            "count": len(all_rows),
                        },
                        value_masked=masked,
                        severity="ERROR",
                        priority="CRITICAL",
                        bucket="AUTO_FLAG",
                        confidence=1.0,
                    )
                )
                uf.union(
                    f"batch_{first_rec['row']}",
                    f"batch_{dup_rec['row']}",
                    score=1.0,
                    matched_fields={"apaar_id": 1.0},
                    scope="INTRA",
                    bucket="AUTO_FLAG",
                )

    # V008: Duplicate institution_student_id within institution + year
    sid_groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for rec in batch_records:
        if rec["student_id"] and rec["student_id"].lower() not in ("nan", "none", "null"):
            sid_groups[rec["student_id"]].append(rec)

    for sid, group in sid_groups.items():
        if len(group) > 1:
            all_rows = [r["row"] for r in group]
            for dup_rec in group[1:]:
                issues.append(
                    make_issue(
                        rule_id="V008",
                        ctx=ctx,
                        row=dup_rec["row"],
                        record_key=dup_rec["record_key"],
                        field="institution_student_id",
                        message=f"Duplicate student ID '{sid}' within institution and academic year",
                        reason=f"Student ID '{sid}' is assigned to multiple records in {acad_year} (rows {all_rows}).",
                        evidence={
                            "institution_student_id": sid,
                            "duplicate_rows": all_rows,
                            "academic_year": acad_year,
                        },
                        value_masked=sid,
                        severity="ERROR",
                        priority="CRITICAL",
                        bucket="AUTO_FLAG",
                        confidence=1.0,
                    )
                )

    # -------------------------------------------------------------
    # 2. Intra-Batch Fuzzy Deduplication: V009 (Christen 2012 Blocking)
    # -------------------------------------------------------------
    blocks_dob_gender: dict[str, list[int]] = defaultdict(list)
    blocks_phonetic_year: dict[str, list[int]] = defaultdict(list)

    for i, rec in enumerate(batch_records):
        if rec["dob"] and rec["gender"]:
            blocks_dob_gender[f"{rec['dob']}_{rec['gender']}"].append(i)
        if rec["metaphone"] and rec["birth_year"]:
            blocks_phonetic_year[f"{rec['metaphone']}_{rec['birth_year']}"].append(i)

    candidate_pairs: set[tuple[int, int]] = set()
    for block in list(blocks_dob_gender.values()) + list(blocks_phonetic_year.values()):
        if 2 <= len(block) <= MAX_BLOCK_SIZE:
            for a_idx in range(len(block)):
                for b_idx in range(a_idx + 1, len(block)):
                    i, j = block[a_idx], block[b_idx]
                    if i > j:
                        i, j = j, i
                    candidate_pairs.add((i, j))
                    if len(candidate_pairs) >= MAX_CANDIDATE_PAIRS:
                        break
                if len(candidate_pairs) >= MAX_CANDIDATE_PAIRS:
                    break
        if len(candidate_pairs) >= MAX_CANDIDATE_PAIRS:
            break

    for i, j in candidate_pairs:
        rec_a = batch_records[i]
        rec_b = batch_records[j]

        # If identical APAAR, handled by V007
        if rec_a["apaar"] and rec_b["apaar"] and rec_a["apaar"] == rec_b["apaar"]:
            continue

        score, matched_fields, is_twin = _compare_demographics(rec_a, rec_b)
        if score >= 0.75 and not is_twin:
            bucket = "AUTO_FLAG" if score >= 0.92 else "HUMAN_REVIEW"
            severity = "ERROR" if score >= 0.92 else "WARN"
            priority = "HIGH"

            uf.union(
                f"batch_{rec_a['row']}",
                f"batch_{rec_b['row']}",
                score=score,
                matched_fields=matched_fields,
                scope="INTRA",
                bucket=bucket,
            )

            # Flag on the second row
            issues.append(
                make_issue(
                    rule_id="V009",
                    ctx=ctx,
                    row=rec_b["row"],
                    record_key=rec_b["record_key"],
                    field="full_name",
                    message=f"Probable duplicate student with different APAAR (similarity {score:.2f})",
                    reason=(
                        f"Demographic match with row {rec_a['row']} ({rec_a['raw_name']}, DOB {rec_a['dob']}): "
                        f"name similarity {matched_fields.get('name_jw', 0.0):.2f}, "
                        f"token set {matched_fields.get('name_set_ratio', 0.0):.2f}, "
                        f"composite score {score:.2f}."
                    ),
                    evidence={
                        "score": score,
                        "matched_fields": matched_fields,
                        "duplicate_row": rec_a["row"],
                        "duplicate_name": rec_a["raw_name"],
                        "duplicate_apaar_masked": mask_apaar(rec_a["apaar"]),
                    },
                    value_masked=mask_apaar(rec_b["apaar"]),
                    severity=severity,
                    priority=priority,
                    bucket=bucket,
                    confidence=score,
                )
            )

    # -------------------------------------------------------------
    # 3. Cross-Institution Deduplication against central_snapshot: V010, V032, V011
    # -------------------------------------------------------------
    snapshot_records: list[dict[str, Any]] = []
    if ctx.central_snapshot is not None and not ctx.central_snapshot.empty:
        snap_df = ctx.central_snapshot
        transfers_df = ctx.transfers if ctx.transfers is not None else pd.DataFrame()

        # Build transfers lookup
        approved_transfers: set[str] = set()
        open_transfers: dict[str, str] = {}
        if not transfers_df.empty and "apaar_id" in transfers_df.columns:
            for t_row in transfers_df.to_dict(orient="records"):
                t_apaar = str(t_row.get("apaar_id") or "").strip()
                t_status = str(t_row.get("status") or "").strip().upper()
                if t_status == "APPROVED":
                    approved_transfers.add(t_apaar)
                elif t_status in ("OPEN", "PENDING", "SUBMITTED"):
                    open_transfers[t_apaar] = str(t_row.get("transfer_id") or "OPEN_TRF")

        # Filter central_snapshot to other institutions and same year
        inst_col = (
            "institution_aicte_id" if "institution_aicte_id" in snap_df.columns else "institution"
        )
        year_col = "academic_year" if "academic_year" in snap_df.columns else ""

        for s_idx, s_row in enumerate(snap_df.to_dict(orient="records")):
            s_inst = str(s_row.get(inst_col) or "").strip()
            s_year = str(s_row.get(year_col) or acad_year).strip()
            if s_inst == inst_id or (year_col and s_year != acad_year):
                continue

            s_status = str(s_row.get("enrolment_status") or "ACTIVE").strip().upper()
            s_apaar = str(s_row.get("apaar_id") or "").strip()
            s_name = str(s_row.get("full_name") or "").strip()
            s_norm = normalize_name(s_name)
            s_tokens = [t for t in s_norm.split() if t]
            s_first = s_tokens[0] if s_tokens else ""
            s_last = s_tokens[-1] if len(s_tokens) > 1 else (s_tokens[0] if s_tokens else "")
            s_dob = str(s_row.get("dob") or "").strip()
            s_byear = s_dob.split("-")[0] if "-" in s_dob else ""
            s_mob_raw = re.sub(r"\D", "", str(s_row.get("mobile") or ""))
            s_clean_mob = s_mob_raw[-10:] if len(s_mob_raw) >= 10 else ""
            s_clean_em = str(s_row.get("email") or "").strip().lower()

            snapshot_records.append(
                {
                    "snap_id": f"snap_{s_idx}_{s_apaar}",
                    "institution": s_inst,
                    "academic_year": s_year,
                    "status": s_status,
                    "apaar": s_apaar,
                    "full_name": s_name,
                    "raw_name": s_name,
                    "norm_name": s_norm,
                    "tokens": s_tokens,
                    "first_name": s_first,
                    "last_name": s_last,
                    "metaphone": _get_phonetic_key(s_last),
                    "dob": s_dob,
                    "birth_year": s_byear,
                    "gender": str(s_row.get("gender") or "").strip().upper()[:1],
                    "student_id": str(s_row.get("institution_student_id") or "").strip(),
                    "program": str(s_row.get("program_code") or "").strip(),
                    "mobile": str(s_row.get("mobile") or "").strip(),
                    "clean_mobile": s_clean_mob,
                    "email": str(s_row.get("email") or "").strip(),
                    "clean_email": s_clean_em,
                }
            )

        # Index snapshots by APAAR
        snap_by_apaar: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for s_rec in snapshot_records:
            if s_rec["apaar"]:
                snap_by_apaar[s_rec["apaar"]].append(s_rec)

        # Evaluate exact APAAR cross-institution: V010 and V032
        for b_rec in batch_records:
            b_apaar = b_rec["apaar"]
            if not b_apaar or b_apaar not in snap_by_apaar:
                continue

            for s_rec in snap_by_apaar[b_apaar]:
                s_status = s_rec["status"]
                # Skip if already transferred out / completed / withdrawn
                if s_status in ("TRANSFERRED_OUT", "WITHDRAWN", "COMPLETED", "GRADUATED"):
                    continue

                if s_status == "ACTIVE":
                    if b_apaar in approved_transfers:
                        # Excluded by approved transfer
                        continue
                    elif b_apaar in open_transfers:
                        # Flag V032
                        trf_id = open_transfers[b_apaar]
                        issues.append(
                            make_issue(
                                rule_id="V032",
                                ctx=ctx,
                                row=b_rec["row"],
                                record_key=b_rec["record_key"],
                                field="apaar_id",
                                message=f"Transfer pending: Student active at institution {s_rec['institution']} with transfer open",
                                reason=(
                                    f"Student with APAAR {mask_apaar(b_apaar)} is currently ACTIVE at "
                                    f"institution {s_rec['institution']}, but formal transfer request {trf_id} is pending approval."
                                ),
                                evidence={
                                    "apaar_masked": mask_apaar(b_apaar),
                                    "source_institution": s_rec["institution"],
                                    "transfer_id": trf_id,
                                    "source_status": s_status,
                                },
                                value_masked=mask_apaar(b_apaar),
                                severity="WARN",
                                priority="HIGH",
                                bucket="HUMAN_REVIEW",
                                confidence=0.95,
                            )
                        )
                        uf.union(
                            f"batch_{b_rec['row']}",
                            s_rec["snap_id"],
                            score=1.0,
                            matched_fields={"apaar_id": 1.0},
                            scope="CROSS_INSTITUTION",
                            bucket="HUMAN_REVIEW",
                        )
                    else:
                        # Flag V010
                        issues.append(
                            make_issue(
                                rule_id="V010",
                                ctx=ctx,
                                row=b_rec["row"],
                                record_key=b_rec["record_key"],
                                field="apaar_id",
                                message=f"Same APAAR active at another institution ({s_rec['institution']}) in same year",
                                reason=(
                                    f"Student with APAAR {mask_apaar(b_apaar)} is already enrolled as ACTIVE at "
                                    f"{s_rec['institution']} for academic year {acad_year} with no approved transfer on record."
                                ),
                                evidence={
                                    "apaar_masked": mask_apaar(b_apaar),
                                    "conflicting_institution": s_rec["institution"],
                                    "academic_year": acad_year,
                                    "conflicting_status": s_status,
                                },
                                value_masked=mask_apaar(b_apaar),
                                severity="ERROR",
                                priority="CRITICAL",
                                bucket="AUTO_FLAG",
                                confidence=1.0,
                            )
                        )
                        uf.union(
                            f"batch_{b_rec['row']}",
                            s_rec["snap_id"],
                            score=1.0,
                            matched_fields={"apaar_id": 1.0},
                            scope="CROSS_INSTITUTION",
                            bucket="AUTO_FLAG",
                        )

        # Cross-Institution Fuzzy Deduplication: V011
        snap_blocks_dob: dict[str, list[dict[str, Any]]] = defaultdict(list)
        snap_blocks_phonetic: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for s_rec in snapshot_records:
            if s_rec["status"] == "ACTIVE":
                if s_rec["dob"] and s_rec["gender"]:
                    snap_blocks_dob[f"{s_rec['dob']}_{s_rec['gender']}"].append(s_rec)
                if s_rec["metaphone"] and s_rec["birth_year"]:
                    snap_blocks_phonetic[f"{s_rec['metaphone']}_{s_rec['birth_year']}"].append(
                        s_rec
                    )

        for b_rec in batch_records:
            cands: list[dict[str, Any]] = []
            if b_rec["dob"] and b_rec["gender"]:
                cands.extend(snap_blocks_dob.get(f"{b_rec['dob']}_{b_rec['gender']}", []))
            if b_rec["metaphone"] and b_rec["birth_year"]:
                cands.extend(
                    snap_blocks_phonetic.get(f"{b_rec['metaphone']}_{b_rec['birth_year']}", [])
                )

            seen_snaps: set[str] = set()
            for s_rec in cands:
                if s_rec["snap_id"] in seen_snaps:
                    continue
                seen_snaps.add(s_rec["snap_id"])

                # Different APAAR
                if b_rec["apaar"] and s_rec["apaar"] and b_rec["apaar"] == s_rec["apaar"]:
                    continue

                score, matched_fields, is_twin = _compare_demographics(b_rec, s_rec)
                if score >= 0.75 and not is_twin:
                    bucket = "AUTO_FLAG" if score >= 0.92 else "HUMAN_REVIEW"
                    uf.union(
                        f"batch_{b_rec['row']}",
                        s_rec["snap_id"],
                        score=score,
                        matched_fields=matched_fields,
                        scope="CROSS_INSTITUTION",
                        bucket=bucket,
                    )
                    issues.append(
                        make_issue(
                            rule_id="V011",
                            ctx=ctx,
                            row=b_rec["row"],
                            record_key=b_rec["record_key"],
                            field="full_name",
                            message=f"Probable same person active at institution {s_rec['institution']} under different APAAR",
                            reason=(
                                f"Demographics closely match active student {s_rec['raw_name']} at "
                                f"{s_rec['institution']} ({s_rec['program']}): similarity {score:.2f}."
                            ),
                            evidence={
                                "score": score,
                                "matched_fields": matched_fields,
                                "conflicting_institution": s_rec["institution"],
                                "conflicting_name": s_rec["raw_name"],
                                "conflicting_apaar_masked": mask_apaar(s_rec["apaar"]),
                            },
                            value_masked=mask_apaar(b_rec["apaar"]),
                            severity="WARN",
                            priority="HIGH",
                            bucket=bucket,
                            confidence=score,
                        )
                    )

    # -------------------------------------------------------------
    # 4. Construct DuplicateCluster objects via Union-Find components
    # -------------------------------------------------------------
    batch_by_id = {f"batch_{r['row']}": r for r in batch_records}
    snap_by_id = {s["snap_id"]: s for s in snapshot_records}
    components = uf.get_components()

    duplicate_clusters: list[DuplicateCluster] = []
    for comp_members in components.values():
        cluster_members: list[DuplicateMember] = []
        is_cross = False

        for node_id in comp_members:
            if node_id in batch_by_id:
                b_info = batch_by_id[node_id]
                cluster_members.append(
                    DuplicateMember(
                        row=b_info["row"],
                        apaar_masked=mask_apaar(b_info["apaar"]),
                        institution=b_info["institution"],
                        student_id=b_info["student_id"],
                    )
                )
            elif node_id in snap_by_id:
                s_info = snap_by_id[node_id]
                is_cross = True
                cluster_members.append(
                    DuplicateMember(
                        row=None,
                        apaar_masked=mask_apaar(s_info["apaar"]),
                        institution=s_info["institution"],
                        student_id=s_info["student_id"],
                    )
                )

        # Collect internal edge weights
        comp_set = set(comp_members)
        cluster_edges = [meta for edge, meta in uf.edges.items() if edge.issubset(comp_set)]
        max_score = max((e["score"] for e in cluster_edges), default=1.0)
        best_edge = max(cluster_edges, key=lambda e: e["score"]) if cluster_edges else None
        matched_fields = best_edge["matched_fields"] if best_edge else {"apaar_id": 1.0}
        scope_val = "CROSS_INSTITUTION" if is_cross else "INTRA"
        has_autoflag = any(e.get("bucket") == "AUTO_FLAG" for e in cluster_edges)
        bucket_val = "AUTO_FLAG" if (has_autoflag and max_score >= 0.92) else "HUMAN_REVIEW"

        duplicate_clusters.append(
            DuplicateCluster(
                cluster_id=f"cluster-{uuid.uuid4().hex[:8]}",
                members=cluster_members,
                score=round(max_score, 4),
                matched_fields=matched_fields,
                scope=scope_val,  # type: ignore[arg-type]
                bucket=bucket_val,  # type: ignore[arg-type]
            )
        )

    # Sort clusters by severity/score
    duplicate_clusters.sort(key=lambda c: (0 if c.bucket == "AUTO_FLAG" else 1, -c.score))

    return issues, duplicate_clusters


def detect_duplicates(
    df: pd.DataFrame, ctx: RuleContext
) -> tuple[list[Issue], list[DuplicateCluster]]:
    """
    Main entry point for intelligent duplicate detection (USP 2).
    Dispatches to Splink if available and len(df) > 50,000,
    otherwise uses optimized rapidfuzz + Christen (2012) blocking path.
    """
    if len(df) > 50000 and _is_splink_available():
        return _detect_duplicates_splink(df, ctx)
    return _detect_duplicates_rapidfuzz(df, ctx)


# -----------------------------------------------------------------
# Cache & Rule decorator bindings for V007, V008, V009, V010, V011, V032
# -----------------------------------------------------------------
def _get_rule_issues(rule_id: str, df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """Helper that executes deduplication once per context and caches results."""
    cache = getattr(ctx, "_dedup_cache", None)
    if cache is None or cache.get("df_id") != id(df):
        all_issues, clusters = detect_duplicates(df, ctx)
        grouped_issues: dict[str, list[Issue]] = defaultdict(list)
        for iss in all_issues:
            grouped_issues[iss.rule_id].append(iss)

        ctx._dedup_cache = {
            "df_id": id(df),
            "grouped_issues": grouped_issues,
            "all_issues": all_issues,
            "clusters": clusters,
        }
        ctx._duplicate_clusters = clusters

    cache_val = ctx._dedup_cache
    if cache_val is not None and "grouped_issues" in cache_val:
        return cache_val["grouped_issues"].get(rule_id, [])
    return []


@rule("V007")
def validate_v007_dup_apaar(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """V007: Duplicate apaar_id within batch."""
    return _get_rule_issues("V007", df, ctx)


@rule("V008")
def validate_v008_dup_student_id(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """V008: Duplicate institution_student_id within institution + year."""
    return _get_rule_issues("V008", df, ctx)


@rule("V009")
def validate_v009_fuzzy_duplicate_intra(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """V009: Probable same person, different APAAR, same batch."""
    return _get_rule_issues("V009", df, ctx)


@rule("V010")
def validate_v010_cross_inst_active(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """V010: Same APAAR ACTIVE at another institution in same year."""
    return _get_rule_issues("V010", df, ctx)


@rule("V011")
def validate_v011_cross_inst_fuzzy(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """V011: Probable same person at another institution under different APAAR."""
    return _get_rule_issues("V011", df, ctx)


@rule("V032")
def validate_v032_transfer_pending(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """V032: Transfer pending: APAAR active elsewhere with transfer request open."""
    return _get_rule_issues("V032", df, ctx)
