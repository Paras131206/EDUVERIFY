"""
Unit and integration tests for EduVerify Intelligent Deduplication (Task C4).
Tests:
1. Mohammed / Mohd. / Md. transliteration variants found with high similarity (V009, AUTO_FLAG).
2. Lakshmi / Laxmi spelling variants found with high similarity (V009, AUTO_FLAG).
3. Twins (identical DOB, same surname, differing first names) NOT auto-flagged.
4. Approved transfer excluded from cross-institution flags (no V010 or V032).
5. Open transfer triggers V032 instead of V010.
6. Exact APAAR duplicates trigger V007.
7. Exact student ID duplicates trigger V008.
8. Active student at another institution triggers V010.
9. Precision and recall evaluation vs data/demo/ground_truth.csv (precision >= 0.90 on AUTO_FLAG).
10. Rapidfuzz blocking performance benchmark under 60s.
"""

import csv
import time
from pathlib import Path

import pandas as pd
import pytest

from eduverify_engine.dedup import detect_duplicates
from eduverify_engine.models import BatchReport
from eduverify_engine.rules.context import RuleContext
from eduverify_engine.validate import validate_batch


def _find_repo_root() -> Path:
    current = Path(__file__).resolve()
    for parent in [current.parent.parent.parent, current.parent.parent]:
        if (parent / "data" / "demo").exists():
            return parent
    return Path(".")


@pytest.fixture(scope="module")
def repo_root() -> Path:
    return _find_repo_root()


def test_mohammed_variants_found():
    """Verifies that Mohammed, Mohd., and Md. spelling variants are detected under V009 as AUTO_FLAG."""
    df = pd.DataFrame(
        [
            {
                "apaar_id": "111122223331",
                "institution_student_id": "STU-001",
                "full_name": "Mohammed Chauhan",
                "dob": "2006-05-16",
                "gender": "M",
                "program_code": "UG-CSE",
            },
            {
                "apaar_id": "111122223332",
                "institution_student_id": "STU-002",
                "full_name": "Mohd. Chauhan",
                "dob": "2006-05-16",
                "gender": "M",
                "program_code": "UG-CSE",
            },
            {
                "apaar_id": "111122223333",
                "institution_student_id": "STU-003",
                "full_name": "Md. Chauhan",
                "dob": "2006-05-16",
                "gender": "M",
                "program_code": "UG-CSE",
            },
        ]
    )
    ctx = RuleContext()
    issues, clusters = detect_duplicates(df, ctx)

    v009_issues = [i for i in issues if i.rule_id == "V009"]
    assert len(v009_issues) >= 2, f"Expected at least 2 V009 issues, got {len(v009_issues)}"
    for iss in v009_issues:
        assert iss.confidence >= 0.92
        assert iss.bucket == "AUTO_FLAG"

    assert len(clusters) >= 1
    assert any(c.score >= 0.92 for c in clusters)


def test_lakshmi_laxmi_found():
    """Verifies that Lakshmi vs Laxmi transliteration is detected under V009 as AUTO_FLAG."""
    df = pd.DataFrame(
        [
            {
                "apaar_id": "088704491607",
                "institution_student_id": "STU-101",
                "full_name": "Lakshmi Iyer",
                "dob": "2006-09-21",
                "gender": "F",
                "program_code": "UG-CSE",
            },
            {
                "apaar_id": "879432050009",
                "institution_student_id": "STU-102",
                "full_name": "Laxmi Iyer",
                "dob": "2006-09-21",
                "gender": "F",
                "program_code": "UG-CSE",
            },
        ]
    )
    ctx = RuleContext()
    issues, clusters = detect_duplicates(df, ctx)

    v009_issues = [i for i in issues if i.rule_id == "V009"]
    assert len(v009_issues) == 1
    iss = v009_issues[0]
    assert iss.row == 3  # second record
    assert iss.confidence >= 0.92
    assert iss.bucket == "AUTO_FLAG"

    assert len(clusters) == 1
    assert clusters[0].score >= 0.92
    assert clusters[0].bucket == "AUTO_FLAG"
    assert clusters[0].scope == "INTRA"


def test_twins_not_autoflagged():
    """Verifies that twins (same DOB, same surname, same gender, different first names) are NOT auto-flagged."""
    df = pd.DataFrame(
        [
            {
                "apaar_id": "115166955392",
                "institution_student_id": "2026-CSE-222",
                "full_name": "Amit Verma",
                "dob": "2006-11-03",
                "gender": "M",
                "program_code": "UG-CSE",
            },
            {
                "apaar_id": "648807889907",
                "institution_student_id": "2026-CSE-223",
                "full_name": "Sumit Verma",
                "dob": "2006-11-03",
                "gender": "M",
                "program_code": "UG-CSE",
            },
        ]
    )
    ctx = RuleContext()
    issues, clusters = detect_duplicates(df, ctx)

    # Must NOT have any AUTO_FLAG issue
    autoflag_issues = [i for i in issues if i.bucket == "AUTO_FLAG"]
    assert len(autoflag_issues) == 0, f"Twins were unexpectedly auto-flagged: {autoflag_issues}"

    # Any cluster produced must NOT be AUTO_FLAG
    autoflag_clusters = [c for c in clusters if c.bucket == "AUTO_FLAG"]
    assert len(autoflag_clusters) == 0, (
        f"Twins cluster was unexpectedly AUTO_FLAG: {autoflag_clusters}"
    )


def test_approved_transfer_not_flagged(repo_root: Path):
    """
    Verifies that a student with an APPROVED transfer (Prateek Deshmukh, row 15 in batch_3)
    is NOT flagged with V010 or V032.
    """
    path = repo_root / "data" / "demo" / "batch_3_cross_dupes.csv"
    report: BatchReport = validate_batch(path)

    # Row 15 in batch_3_cross_dupes.csv is Prateek Deshmukh (apaar 104332181960)
    row_15_issues = [i for i in report.issues if i.row == 15 and i.rule_id in ("V010", "V032")]
    assert len(row_15_issues) == 0, f"Row 15 with approved transfer was flagged: {row_15_issues}"


def test_open_transfer_triggers_v032(repo_root: Path):
    """
    Verifies that a student with an OPEN transfer (Manish Yadav, row 19 in batch_3)
    triggers V032 instead of V010.
    """
    path = repo_root / "data" / "demo" / "batch_3_cross_dupes.csv"
    report: BatchReport = validate_batch(path)

    row_19_issues = [i for i in report.issues if i.row == 19]
    v032_issues = [i for i in row_19_issues if i.rule_id == "V032"]
    v010_issues = [i for i in row_19_issues if i.rule_id == "V010"]

    assert len(v032_issues) == 1, f"Expected V032 on row 19, got: {row_19_issues}"
    assert len(v010_issues) == 0, f"Row 19 should not have V010, got: {v010_issues}"

    iss = v032_issues[0]
    assert iss.field == "apaar_id"
    assert iss.bucket == "HUMAN_REVIEW"
    assert iss.severity == "WARN"
    assert "TRF-1012" in iss.reason or "TRF-1012" in str(iss.evidence)


def test_exact_apaar_triggers_v007():
    """Verifies that duplicate APAAR within the batch triggers V007 and groups into DuplicateCluster."""
    df = pd.DataFrame(
        [
            {
                "apaar_id": "123456789012",
                "institution_student_id": "PRN-1",
                "full_name": "Student A",
                "dob": "2006-01-01",
                "gender": "M",
                "program_code": "UG-CSE",
            },
            {
                "apaar_id": "123456789012",
                "institution_student_id": "PRN-2",
                "full_name": "Student B",
                "dob": "2006-02-02",
                "gender": "F",
                "program_code": "UG-CSE",
            },
        ]
    )
    ctx = RuleContext()
    issues, clusters = detect_duplicates(df, ctx)

    v007_issues = [i for i in issues if i.rule_id == "V007"]
    assert len(v007_issues) == 1
    assert v007_issues[0].row == 3
    assert v007_issues[0].severity == "ERROR"
    assert v007_issues[0].priority == "CRITICAL"
    assert v007_issues[0].bucket == "AUTO_FLAG"

    assert len(clusters) == 1
    assert clusters[0].score == 1.0
    assert clusters[0].scope == "INTRA"
    assert clusters[0].bucket == "AUTO_FLAG"
    assert len(clusters[0].members) == 2


def test_exact_student_id_triggers_v008():
    """Verifies that duplicate institution_student_id within batch triggers V008."""
    df = pd.DataFrame(
        [
            {
                "apaar_id": "123456789011",
                "institution_student_id": "DUP-ROLL-01",
                "full_name": "Student One",
                "dob": "2006-01-01",
                "gender": "M",
                "program_code": "UG-CSE",
            },
            {
                "apaar_id": "123456789022",
                "institution_student_id": "DUP-ROLL-01",
                "full_name": "Student Two",
                "dob": "2006-02-02",
                "gender": "F",
                "program_code": "UG-CSE",
            },
        ]
    )
    ctx = RuleContext()
    issues, _ = detect_duplicates(df, ctx)

    v008_issues = [i for i in issues if i.rule_id == "V008"]
    assert len(v008_issues) == 1
    assert v008_issues[0].row == 3
    assert v008_issues[0].severity == "ERROR"
    assert v008_issues[0].field == "institution_student_id"


def test_cross_institution_active_triggers_v010(repo_root: Path):
    """
    Verifies that Rakesh Chauhan (row 11 in batch_3) active at another institution without transfer
    triggers V010 as AUTO_FLAG.
    """
    path = repo_root / "data" / "demo" / "batch_3_cross_dupes.csv"
    report: BatchReport = validate_batch(path)

    row_11_issues = [i for i in report.issues if i.row == 11 and i.rule_id == "V010"]
    assert len(row_11_issues) == 1, f"Expected V010 on row 11, got: {report.issues}"
    iss = row_11_issues[0]
    assert iss.field == "apaar_id"
    assert iss.severity == "ERROR"
    assert iss.priority == "CRITICAL"
    assert iss.bucket == "AUTO_FLAG"
    assert "1-100010022" in iss.reason or "1-100010022" in str(iss.evidence)


def test_dedup_precision_recall_vs_ground_truth(repo_root: Path):
    """
    Evaluates precision, recall, and F1 for deduplication on batch_3_cross_dupes.csv
    against ground_truth.csv. Prints a formatted evaluation table and asserts
    target precision >= 0.90 on AUTO_FLAG.
    """
    gt_path = repo_root / "data" / "demo" / "ground_truth.csv"
    assert gt_path.exists(), "ground_truth.csv missing"

    with open(gt_path, "r", encoding="utf-8") as f:
        gt_rows = list(csv.DictReader(f))

    b3_gt = [r for r in gt_rows if r["file"] == "batch_3_cross_dupes.csv"]
    expected_defects = {(int(r["row"]), r["rule_id"]): r["field"] for r in b3_gt}

    batch_path = repo_root / "data" / "demo" / "batch_3_cross_dupes.csv"
    report: BatchReport = validate_batch(batch_path)

    # Filter detected issues to deduplication rules
    dedup_rules = {"V007", "V008", "V009", "V010", "V011", "V032"}
    detected_defects = {
        (iss.row, iss.rule_id): iss.field
        for iss in report.issues
        if iss.row is not None and iss.rule_id in dedup_rules
    }

    all_rule_ids = sorted(list({k[1] for k in expected_defects} | {k[1] for k in detected_defects}))

    print("\n" + "=" * 80)
    print(
        "DEDUPLICATION PRECISION / RECALL EVALUATION (batch_3_cross_dupes.csv vs ground_truth.csv)"
    )
    print("=" * 80)
    print(
        f"{'Rule ID':<10} | {'Expected':<10} | {'Detected':<10} | {'True Pos':<10} | {'Precision':<10} | {'Recall':<10} | {'F1':<10}"
    )
    print("-" * 80)

    total_tp = 0
    total_exp = len(expected_defects)
    total_det = len(detected_defects)

    for r_id in all_rule_ids:
        exp_r = {k: v for k, v in expected_defects.items() if k[1] == r_id}
        det_r = {k: v for k, v in detected_defects.items() if k[1] == r_id}
        tp = len([k for k in det_r if k in exp_r])
        total_tp += tp
        prec = (tp / len(det_r)) if det_r else 1.0
        rec = (tp / len(exp_r)) if exp_r else 0.0
        f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0
        print(
            f"{r_id:<10} | {len(exp_r):<10} | {len(det_r):<10} | {tp:<10} | {prec:<10.2f} | {rec:<10.2f} | {f1:<10.2f}"
        )

    overall_prec = total_tp / total_det if total_det > 0 else 0.0
    overall_rec = total_tp / total_exp if total_exp > 0 else 0.0
    overall_f1 = (
        (2 * overall_prec * overall_rec / (overall_prec + overall_rec))
        if (overall_prec + overall_rec) > 0
        else 0.0
    )

    print("-" * 80)
    print(
        f"{'OVERALL':<10} | {total_exp:<10} | {total_det:<10} | {total_tp:<10} | {overall_prec:<10.2f} | {overall_rec:<10.2f} | {overall_f1:<10.2f}"
    )
    print("=" * 80 + "\n")

    # AUTO_FLAG precision check
    autoflag_detected = {
        (iss.row, iss.rule_id): iss.field
        for iss in report.issues
        if iss.row is not None and iss.rule_id in dedup_rules and iss.bucket == "AUTO_FLAG"
    }
    autoflag_tp = len([k for k in autoflag_detected if k in expected_defects])
    autoflag_prec = (autoflag_tp / len(autoflag_detected)) if autoflag_detected else 1.0

    print(f"AUTO_FLAG Deduplication Precision: {autoflag_prec:.2%}")
    assert autoflag_prec >= 0.90, f"Expected AUTO_FLAG precision >= 0.90, got {autoflag_prec:.2f}"
    assert overall_rec >= 0.90, f"Expected overall recall >= 0.90, got {overall_rec:.2f}"

    # Cluster validation
    assert len(report.duplicate_clusters) >= 4, (
        f"Expected at least 4 duplicate clusters, got {len(report.duplicate_clusters)}"
    )
    for cl in report.duplicate_clusters:
        assert cl.cluster_id.startswith("cluster-")
        assert len(cl.members) >= 2
        assert 0.0 <= cl.score <= 1.0
        assert isinstance(cl.matched_fields, dict)
        assert len(cl.matched_fields) > 0
        assert cl.scope in ("INTRA", "CROSS_INSTITUTION")
        assert cl.bucket in ("AUTO_FLAG", "HUMAN_REVIEW")


def test_rapidfuzz_performance_benchmark():
    """
    Verifies that the rapidfuzz + Christen (2012) blocking path handles
    thousands of candidate rows in seconds (must be well under 60 s).
    """
    records = []
    first_names = ["Rahul", "Amit", "Priya", "Suresh", "Lakshmi", "Mohammad", "Ananya", "Rohan"]
    last_names = ["Sharma", "Verma", "Jain", "Singh", "Iyer", "Chauhan", "Gupta", "Patel"]
    for i in range(2000):
        fn = first_names[i % len(first_names)]
        ln = last_names[i % len(last_names)]
        dob = f"2006-{(i % 12) + 1:02d}-{(i % 28) + 1:02d}"
        records.append(
            {
                "apaar_id": f"90000000{i:04d}",
                "institution_student_id": f"BENCH-{i:05d}",
                "full_name": f"{fn} {ln}",
                "dob": dob,
                "gender": "M" if i % 2 == 0 else "F",
                "program_code": "UG-CSE",
            }
        )

    # Inject deliberate fuzzy pair
    records.append(
        {
            "apaar_id": "900099990001",
            "institution_student_id": "BENCH-99991",
            "full_name": "Rahul Sharma",
            "dob": "2006-05-14",
            "gender": "M",
            "program_code": "UG-CSE",
        }
    )
    records.append(
        {
            "apaar_id": "900099990002",
            "institution_student_id": "BENCH-99992",
            "full_name": "Rahul S. Sharma",
            "dob": "2006-05-14",
            "gender": "M",
            "program_code": "UG-CSE",
        }
    )

    bench_df = pd.DataFrame(records)
    ctx = RuleContext()

    t0 = time.perf_counter()
    issues, clusters = detect_duplicates(bench_df, ctx)
    elapsed = time.perf_counter() - t0

    print(f"\nBenchmark 2002 rows deduplication took: {elapsed:.3f} seconds")
    assert elapsed < 10.0, f"Expected elapsed < 10.0s, took {elapsed:.3f}s"
    assert any(iss.rule_id == "V009" for iss in issues)
