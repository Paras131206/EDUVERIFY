# Public Dataset Adapters (`data/adapters/`)

These adapters transform research datasets into the canonical EduVerify schema for performance and load test evaluation.

> **Policy:** Never commit raw third-party datasets to git. Download locally and run through adapters.

## Supported Datasets

1. **UniversityIntake-MLDataset** (`drsanjayagal/UniversityIntake-MLDataset`):
   - License: CC BY 4.0
   - Features: Demographic intake fields, missing-value benchmarks.
   - Adapter: `universityintake.py`

2. **SynEdu-HEDL** (`drsanjayagal/SynEdu-HEDL` / Zenodo 10.5281/zenodo.18884938):
   - Features: Relational student records and multi-year enrolments.
   - Adapter: `synedu.py`
