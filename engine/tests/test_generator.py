import csv
import hashlib
import tempfile
from pathlib import Path

# pyrefly: ignore[missing-import]
from data.generator.generate import generate_dataset


def hash_file(path: Path) -> str:
    hasher = hashlib.sha256()
    with open(path, "rb") as f:
        hasher.update(f.read())
    return hasher.hexdigest()


def test_generator_determinism():
    """Verifies that the same seed produces identical file hashes."""
    with tempfile.TemporaryDirectory() as tmp1, tempfile.TemporaryDirectory() as tmp2:
        out1 = Path(tmp1) / "synthetic"
        demo1 = Path(tmp1) / "demo"
        out2 = Path(tmp2) / "synthetic"
        demo2 = Path(tmp2) / "demo"

        # Generate 200 students for quick test
        generate_dataset(seed=42, num_students=200, out_dir=out1, demo_dir=demo1)
        generate_dataset(seed=42, num_students=200, out_dir=out2, demo_dir=demo2)

        # Compare hashes for registry, transfers, batch_1_clean
        h1_reg = hash_file(out1 / "registry.csv")
        h2_reg = hash_file(out2 / "registry.csv")
        assert h1_reg == h2_reg, "Registry generation is non-deterministic"

        h1_b1 = hash_file(demo1 / "batch_1_clean.csv")
        h2_b1 = hash_file(demo2 / "batch_1_clean.csv")
        assert h1_b1 == h2_b1, "batch_1_clean generation is non-deterministic"


def test_ground_truth_row_counts():
    """Verifies that ground truth contains seeded defect records."""
    gt_path = Path("data/demo/ground_truth.csv")
    assert gt_path.exists(), "Ground truth file missing"

    with open(gt_path, "r", encoding="utf-8") as f:
        reader = list(csv.DictReader(f))

    assert len(reader) >= 10, f"Expected at least 10 seeded defects, found {len(reader)}"
    files = {r["file"] for r in reader}
    assert "batch_2_errors.xlsx" in files
    assert "batch_3_cross_dupes.csv" in files
    assert "batch_4_anomaly_drift.csv" in files


def test_demo_batches_exist():
    demo_dir = Path("data/demo")
    assert (demo_dir / "batch_1_clean.csv").exists()
    assert (demo_dir / "batch_2_errors.xlsx").exists()
    assert (demo_dir / "batch_3_cross_dupes.csv").exists()
    assert (demo_dir / "batch_4_anomaly_drift.csv").exists()
    assert (demo_dir / "demo_registry.csv").exists()
    assert (demo_dir / "demo_intake.csv").exists()
