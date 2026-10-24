"""
Unit and integration tests for EduVerify Rule Engine (Task C3).
Tests:
1. Every individual rule with fixtures in data/fixtures/.
2. Every Issue must have a plain-English reason and structured evidence dict.
3. Precision, recall, and F1 evaluation vs data/demo/ground_truth.csv.
4. Clean baseline verification for batch_1_clean.csv.
"""

import csv
from pathlib import Path

import pytest

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


# Map fixture file to expected rule_id
FIXTURE_RULES = [
    ("v001_missing_col.csv", "V001"),
    ("v002_bad_apaar.csv", "V002"),
    ("v003_unregistered_apaar.csv", "V003"),
    ("v004_registry_mismatch.csv", "V004"),
    ("v005_null_field.csv", "V005"),
    ("v006_invalid_format.csv", "V006"),
    ("v012_intake_excess.csv", "V012"),
    ("v013_supernumerary_excess.csv", "V013"),
    ("v014_quota_inconsistent.csv", "V014"),
    ("v015_seat_scheme.csv", "V015"),
    ("v016_implausible_age.csv", "V016"),
    ("v017_admission_window.csv", "V017"),
    ("v018_consent_missing.csv", "V018"),
    ("v019_unapproved_program.csv", "V019"),
    ("v023_excel_mangled.csv", "V023"),
    ("v024_unparseable_date.csv", "V024"),
    ("v025_graduation_year.csv", "V025"),
    ("v026_conflicting_program.csv", "V026"),
    ("v027_year_of_study.csv", "V027"),
    ("v031_formatting.csv", "V031"),
    ("v033_dab_affiliation.csv", "V033"),
    ("v035_institution_mismatch.csv", "V035"),
]


@pytest.mark.parametrize("fixture_name,expected_rule", FIXTURE_RULES)
def test_individual_rules_with_fixtures(repo_root: Path, fixture_name: str, expected_rule: str):
    """Verifies that each dedicated fixture triggers its target rule."""
    fixture_path = repo_root / "data" / "fixtures" / fixture_name
    assert fixture_path.exists(), f"Missing fixture file {fixture_path}"

    report = validate_batch(fixture_path)
    rule_ids = {i.rule_id for i in report.issues}
    assert expected_rule in rule_ids, (
        f"Fixture {fixture_name} failed to trigger {expected_rule}. Detected: {rule_ids}"
    )


def test_every_issue_has_reason_and_evidence(repo_root: Path):
    """
    Mandatory check per Task C3 requirement:
    Asserts that every detected issue across demo batches contains non-empty reason and evidence dict.
    """
    for file_name in ["batch_2_errors.xlsx"]:
        path = repo_root / "data" / "demo" / file_name
        report = validate_batch(path)
        assert len(report.issues) > 0, f"Expected issues in {file_name}"

        for iss in report.issues:
            assert iss.reason, f"Issue {iss.rule_id} at row {iss.row} is missing reason text"
            assert len(iss.reason.strip()) > 5, (
                f"Issue {iss.rule_id} reason is too short: '{iss.reason}'"
            )
            assert isinstance(iss.evidence, dict), f"Issue {iss.rule_id} evidence must be a dict"
            assert len(iss.evidence) > 0, f"Issue {iss.rule_id} evidence dict is empty"


def test_clean_batch_has_zero_errors(repo_root: Path):
    """Verifies that batch_1_clean.csv yields 0 errors, 0 warnings and quality score 100.0."""
    clean_path = repo_root / "data" / "demo" / "batch_1_clean.csv"
    assert clean_path.exists(), "batch_1_clean.csv missing"

    report = validate_batch(clean_path)
    assert len(report.issues) == 0, f"batch_1_clean has unexpected issues: {report.issues}"
    assert report.quality_score == 100.0
    assert report.rows_error == 0
    assert report.rows_warning == 0
    assert report.rows_valid == report.rows_total


def test_precision_recall_vs_ground_truth(repo_root: Path):
    """
    Evaluates precision, recall, and F1 against data/demo/ground_truth.csv for batch_2_errors.xlsx.
    Prints a formatted table and fails if recall < 0.95 for deterministic rules.
    """
    gt_path = repo_root / "data" / "demo" / "ground_truth.csv"
    assert gt_path.exists(), "ground_truth.csv missing"

    with open(gt_path, "r", encoding="utf-8") as f:
        gt_rows = list(csv.DictReader(f))

    # Focus on batch_2_errors.xlsx rule-based defects
    b2_gt = [r for r in gt_rows if r["file"] == "batch_2_errors.xlsx"]
    expected_defects = {(int(r["row"]), r["rule_id"]): r["field"] for r in b2_gt}

    report = validate_batch(repo_root / "data" / "demo" / "batch_2_errors.xlsx")

    # Map detected issues by (row, rule_id)
    detected_defects = {}
    for iss in report.issues:
        if iss.row is not None:
            detected_defects[(iss.row, iss.rule_id)] = iss.field

    # Compute metrics per rule and overall
    all_rules = sorted(list({r["rule_id"] for r in b2_gt}))

    print("\n" + "=" * 80)
    print("RULE ENGINE PRECISION / RECALL EVALUATION (batch_2_errors.xlsx vs ground_truth.csv)")
    print("=" * 80)
    print(
        f"{'Rule ID':<10} | {'Expected':<10} | {'Detected':<10} | {'True Pos':<10} | {'Precision':<10} | {'Recall':<10} | {'F1':<10}"
    )
    print("-" * 80)

    total_tp = 0
    total_expected = len(expected_defects)
    total_detected = len(detected_defects)

    for rule_id in all_rules:
        exp_for_rule = {k: v for k, v in expected_defects.items() if k[1] == rule_id}
        det_for_rule = {k: v for k, v in detected_defects.items() if k[1] == rule_id}

        tp = len([k for k in det_for_rule if k in exp_for_rule])
        total_tp += tp

        prec = (tp / len(det_for_rule)) if det_for_rule else 1.0
        rec = (tp / len(exp_for_rule)) if exp_for_rule else 0.0
        f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0

        print(
            f"{rule_id:<10} | {len(exp_for_rule):<10} | {len(det_for_rule):<10} | {tp:<10} | {prec:<10.2f} | {rec:<10.2f} | {f1:<10.2f}"
        )

    overall_prec = total_tp / total_detected if total_detected > 0 else 0.0
    overall_rec = total_tp / total_expected if total_expected > 0 else 0.0
    overall_f1 = (
        (2 * overall_prec * overall_rec / (overall_prec + overall_rec))
        if (overall_prec + overall_rec) > 0
        else 0.0
    )

    print("-" * 80)
    print(
        f"{'OVERALL':<10} | {total_expected:<10} | {total_detected:<10} | {total_tp:<10} | {overall_prec:<10.2f} | {overall_rec:<10.2f} | {overall_f1:<10.2f}"
    )
    print("=" * 80 + "\n")

    # Fail if recall < 0.95 for deterministic rules
    assert overall_rec >= 0.95, f"Expected recall >= 0.95, got {overall_rec:.2f}"
