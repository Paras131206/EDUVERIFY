# EduVerify Demo Datasets (`data/demo/`)

This directory contains deterministic demo datasets for live demonstrations, integration tests, and verification.
All files are tied to primary demo institution **`1-100010001` (Delhi College of Engineering & Technology)** and 3 neighbour institutions (`1-100010002` to `1-100010004`).

---

## Demo Batches Overview

| Batch File | Rows | Intended Scenario | Seeded Defects / Ground Truth |
|---|---|---|---|
| `batch_1_clean.csv` | 50 | Pristine baseline upload | **0 errors, 0 warnings**. Quality score = 100.0. Clean commit path. |
| `batch_2_errors.xlsx` | 50 | Smart column mapping & explainable rule validation | Non-standard headers (`PRN`, `DOB`, `Dept`, `APAAR No`). Seeded defects: `V002` (APAAR length), `V023` (Excel scientific notation), `V005` (null candidate name), `V025` (graduation year inconsistent), `V014` (quota/NRI mismatch), `V015` (seat/scheme mismatch), `V018` (consent missing), `V024` (unparseable date `31/02/2026`), `V027` (year of study > duration). |
| `batch_3_cross_dupes.csv` | 40 | Deduplication & lifecycle-aware cross-institution checks | `V009` intra-batch fuzzy dup ("Rahul Sharma" vs "Rahul S. Sharma", "Lakshmi Iyer" vs "Laxmi Iyer"), `V010` active enrolment at neighbour `1-100010002`, **approved transfer** (Row 14, excluded from V010), **pending transfer** (Row 18, triggers `V032`), and **twins case** (Rows 22 & 23, valid distinct students not merged). |
| `batch_4_anomaly_drift.csv` | 60 | Schema drift & statistical monitoring intelligence | `V028` removed column (`guardian_consent`), `V029` unseen category (`SPORTS_QUOTA`), and `V020` anomaly (40% NRI spike vs 5% baseline, z > 3). |

---

## Supporting Demo Context Files

- `demo_registry.csv`: Mock APAAR verification registry containing demographic records for all students in demo batches.
- `demo_intake.csv`: AICTE approved intake quotas and supernumerary caps per scheme for demo institutions.
- `demo_declared_totals.csv`: Statistical totals submitted during the institutional approval process.
- `demo_central_snapshot.csv`: Already-committed central repository student records across neighbour institutions for cross-institution duplicate and transfer detection.
- `demo_transfers.csv`: Inter-institutional transfer records (including approved and pending transfers).
- `demo_history.csv`: Six historical batch quality and demographic metric snapshots for institution `1-100010001`.
- `ground_truth.csv`: Exact row-by-row mapping of seeded defects (`row, file, rule_id, field`) for automated precision/recall evaluation.
