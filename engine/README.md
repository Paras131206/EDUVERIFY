# EduVerify AI & Data Validation Engine (`eduverify_engine`)

`eduverify_engine` is a pure-Python, zero-C-extension data quality and deduplication engine designed for regulatory compliance in higher education (AICTE / APAAR). It executes deterministic rule checking, smart schema mapping, demographic entity deduplication, schema drift tracking, anomaly detection, and data-quality reporting.

---

## 1. Public API Reference

The engine exposes a clean, frozen Python interface:

### Primary Validation Pipeline
```python
from eduverify_engine import validate_batch

report = validate_batch(
    file_or_df="batch_upload.xlsx",  # File path, bytes, BytesIO, or pd.DataFrame
    mapping=None,  # Optional list[ColumnMapping] overrides
    institution_aicte_id="1-100010001",  # Authenticated uploader AICTE ID
    academic_year="2026-27",  # Academic calendar year
)

print(f"Quality Score: {report.quality_score:.1f}%")
print(f"Issues Found: {len(report.issues)}")
print(f"Duplicate Clusters: {len(report.duplicate_clusters)}")
```

### Ingest & Parsing
```python
from eduverify_engine.parse import parse_file

# Handles CSV and XLSX up to 10MB; auto-detects encoding, normalizes strings
parsed = parse_file(file_bytes)
df = parsed.df
headers = parsed.original_headers
```

### Smart Column Mapping
```python
from eduverify_engine.mapping import suggest_mapping

mappings = suggest_mapping(headers, sample_df=df)
# Returns list[ColumnMapping] with source, target, confidence (0.0-1.0), and method
```

### Entity Deduplication & Record Linkage
```python
from eduverify_engine.dedup import detect_duplicates

issues, clusters = detect_duplicates(df, ctx)
# Returns detected deduplication Issues (V007..V011, V032) and DuplicateCluster models
```

### Differential DQ Reporting
```python
from eduverify_engine.report import compare_reports, export_report

# Compare two BatchReports across resolution decisions
comparison = compare_reports(before_report, after_report, decisions={"ISS-001": "ACCEPTED"})

# Export to JSON string or formatted Excel workbook (7 sheets, conditional formatting, strict masking)
xlsx_bytes = export_report(report, format="xlsx")
```

### Privacy & Masking
```python
from eduverify_engine.masking import mask_apaar, mask_email, mask_mobile

assert mask_apaar("123456789012") == "1234****9012"
assert mask_email("rahul.sharma@college.edu") == "r***a@college.edu"
assert mask_mobile("9876543210") == "98****3210"
```

---

## 2. Rule Catalog (V001 – V035)

All 30 active validation rules implemented in the engine, categorized by domain:

| Rule ID | Name | Severity | Priority | Review Bucket | Family | Description |
|:---|:---|:---:|:---:|:---:|:---|:---|
| **V001** | Missing Column | ERROR | CRITICAL | AUTO_FLAG | Completeness | Mandatory student record column missing after mapping. |
| **V002** | Invalid APAAR Format | ERROR | CRITICAL | AUTO_FLAG | Identity | APAAR ID missing, not 12 numeric digits, or corrupted. |
| **V003** | APAAR Registry Missing | ERROR | CRITICAL | AUTO_FLAG | Identity | 12-digit APAAR not found in national registry. |
| **V004** | Demographic Mismatch | WARN | HIGH | HUMAN_REVIEW | Identity | Fuzzy discrepancy between registry and uploaded name/DOB. |
| **V005** | Required Field Null | ERROR | CRITICAL / HIGH | AUTO_FLAG | Completeness | Mandatory field blank in student record. |
| **V006** | Invalid Format | ERROR | LOW | AUTO_FLAG | Format | Invalid enum, malformed email, mobile, or ISO country. |
| **V007** | Duplicate APAAR (Intra) | ERROR | CRITICAL | AUTO_FLAG | Deduplication | Same APAAR ID appears multiple times in uploaded batch. |
| **V008** | Duplicate Student ID | ERROR | CRITICAL | AUTO_FLAG | Deduplication | Duplicate institution student ID within institution and year. |
| **V009** | Fuzzy Duplicate (Intra) | ERROR / WARN | HIGH | AUTO_FLAG / REVIEW | Deduplication | Probable same person under different APAAR in batch. |
| **V010** | Dual Enrolment Active | ERROR | CRITICAL | AUTO_FLAG | Deduplication | Same APAAR enrolled ACTIVE at another institution same year. |
| **V011** | Cross-Inst Fuzzy Duplicate | WARN | HIGH | HUMAN_REVIEW | Deduplication | Probable same student active at another institution. |
| **V012** | Program Intake Exceeded | ERROR | CRITICAL | AUTO_FLAG | Aggregates | Regular enrolment exceeds approved AICTE intake. |
| **V013** | Supernumerary Cap Exceeded | ERROR | HIGH | AUTO_FLAG | Aggregates | Supernumerary quota exceeds permissible intake cap. |
| **V014** | Quota / Nationality Mismatch | ERROR | HIGH | AUTO_FLAG | Quota | Indian national on FN quota or Foreign national on NRI quota. |
| **V015** | Invalid Seat Type / Scheme | ERROR | HIGH | AUTO_FLAG | Quota | Supernumerary scheme on regular seat or missing scheme. |
| **V016** | Implausible Age | WARN | MEDIUM | HUMAN_REVIEW | Academic | Student age falls outside customary bounds for course level. |
| **V017** | Admission Date Window | ERROR | HIGH | AUTO_FLAG | Academic | Admission date outside approved academic-year calendar. |
| **V018** | Consent Missing / Refused | ERROR | HIGH | AUTO_FLAG | Consent | DPDP statutory consent missing or minor lacking guardian consent. |
| **V019** | Program Unapproved | ERROR | HIGH | AUTO_FLAG | Institutional | Program code not in approved intake master for institution. |
| **V020** | Statistical Anomaly | WARN | HIGH | HUMAN_REVIEW | Monitoring | Deequ metric z-score jump or IsolationForest outlier. |
| **V021** | Disallowed Lifecycle Move | ERROR | HIGH | AUTO_FLAG | Quota | Disallowed student state transition (e.g. COMPLETED -> ACTIVE). |
| **V022** | Declared Totals Discrepancy | WARN | HIGH | HUMAN_REVIEW | Reconciliation | Enrolment totals differ from declared headcounts. |
| **V023** | Excel-Mangled Identifier | WARN | HIGH | AUTO_FLAG | Identity | Scientific notation / float corruption recoverable by engine. |
| **V024** | Unparseable Date | ERROR | MEDIUM | HUMAN_REVIEW | Format | Date cannot be resolved under Indian date policy. |
| **V025** | Graduation Year Mismatch | ERROR | HIGH | AUTO_FLAG | Academic | Graduation year != admission year + program duration. |
| **V026** | Conflicting Records | ERROR | HIGH | AUTO_FLAG | Academic | Same student assigned to conflicting programs across rows. |
| **V027** | Year of Study Invalid | ERROR | HIGH | AUTO_FLAG | Academic | Year of study > duration or Year 1 lateral entry. |
| **V028** | Schema Drift: Removed Column | ERROR | HIGH | AUTO_FLAG | Monitoring | Required column removed or data type changed across batches. |
| **V029** | Schema Drift: New Category | INFO | LOW | INFO | Monitoring | New unseen category value appeared in upload. |
| **V030** | Metric Jump Anomaly | WARN | MEDIUM | HUMAN_REVIEW | Monitoring | Missing ID rate jumped > 3x or +10 percentage points. |
| **V031** | Formatting Inconsistency | INFO | LOW | INFO | Format | Casing/whitespace issues with automatic clean fix. |
| **V032** | Transfer Pending | WARN | HIGH | HUMAN_REVIEW | Deduplication | Dual enrolment flagged with pending inter-institute transfer. |
| **V033** | Degree Body Affiliation | ERROR | HIGH | AUTO_FLAG | Institutional | Institution not affiliated to accredited degree-awarding body. |
| **V034** | Cohort Progression Defect | WARN | HIGH | HUMAN_REVIEW | Rollover | Year-over-year rollover drop > 25% or invalid year leap. |
| **V035** | Unauthorized Institution | ERROR | CRITICAL | AUTO_FLAG | Institutional | Batch data cites institution different from authenticated uploader. |

---

## 3. Decision Thresholds & Tuning Parameters

### Demographic Deduplication (Fellegi-Sunter Linking)
Records are blocked using **Christen (2012)** dual-pass blocking:
1. Exact Date of Birth + Gender (`{dob}_{gender}`)
2. Phonetic Soundex/Metaphone Key of Last Name + Birth Year (`{metaphone}_{birth_year}`)

Candidate pairs are evaluated using weighted demographic feature comparison:
- `name_jw` (Jaro-Winkler Name Similarity): **0.35**
- `name_set_ratio` (Token Set Ratio): **0.25**
- `initials` (First Name Initials Match): **0.10**
- `dob` (Exact or Day-Month Swap): **0.20**
- `gender` (Exact Match): **0.10**

**Action Buckets**:
- **Composite Score $\ge 0.92$**: `AUTO_FLAG` (`ERROR`, `HIGH` priority)
- **$0.75 \le \text{Score} < 0.92$**: `HUMAN_REVIEW` (`WARN`, `HIGH` priority)
- **$\text{Score} < 0.75$**: Ignored (below false-positive threshold)
- **Guardrails**:
  - Twin Filter: Different first name ($JW < 0.82$) with same DOB + last name is flagged as twin, not duplicate.
  - Performance Caps: `MAX_BLOCK_SIZE = 80`, `MAX_CANDIDATE_PAIRS = 25,000`.

### Quality Scoring Model
Batch quality score begins at **100.0%**:
$$\text{Quality Score} = \max\left(0, 100.0 - \frac{2.0 \cdot N_{\text{err}} + 0.5 \cdot N_{\text{warn}}}{N_{\text{total}}} \times 100\right)$$
- Each row with at least one `ERROR` deducts 2.0 weighted points.
- Each row with only `WARN` deducts 0.5 weighted points.

### Monitoring & Intelligence Thresholds
- **Metric History Z-Score**: Flagged when $|z| \ge 2.5$ (requires at least 3 historical snapshots).
- **IsolationForest Anomaly**: Scikit-Learn IsolationForest (`contamination=0.05`, `random_state=42`) trained across institution profile vectors.
- **Missing-ID Drift**: Flagged when null-rate jumps $> 3\times$ or increases by $> 10$ percentage points.

---

## 4. How to Add a New Rule

Adding a new validation rule to EduVerify follows a 4-step contract-driven workflow:

### Step 1: Catalog Definition
Add the metadata entry to `contracts/rule_catalog.yaml`:
```yaml
  - id: "V036"
    name: "Sample Rule Name"
    severity: "ERROR"
    default_priority: "HIGH"
    bucket_policy: "AUTO_FLAG"
    owner: "team-c"
    since_version: "1.0.0"
    description: "Detailed description of rule conditions."
    fix_hint: "Suggested resolution guidance."
```

### Step 2: Implement the Rule Function
Create or add to the appropriate module in `engine/eduverify_engine/rules/`:
```python
from eduverify_engine.rules import RuleContext, rule, make_issue
from eduverify_engine.models import Issue


@rule("V036")
def validate_v036_sample_rule(df, ctx: RuleContext) -> list[Issue]:
    issues: list[Issue] = []
    # Fast vectorized iteration
    for idx, row in enumerate(ctx.get_records(df)):
        if row.get("some_field") == "invalid":
            issues.append(
                make_issue(
                    rule_id="V036",
                    ctx=ctx,
                    row=int(idx) + 2,
                    record_key=str(row.get("institution_student_id", f"row-{idx + 2}")),
                    field="some_field",
                    message="Explanation of failure",
                    reason="Detailed statutory rationale.",
                    evidence={"found": row.get("some_field")},
                )
            )
    return issues
```

### Step 3: Add Fixture Dataset
Add a test row or sample fixture dataset in `data/demo/` or `data/synthetic/generator.py`.

### Step 4: Write Unit Test
Add test coverage in `engine/tests/test_rules.py`:
```python
def test_v036_sample_rule():
    df = pd.DataFrame([{"some_field": "invalid"}])
    ctx = RuleContext()
    issues = validate_v036_sample_rule(df, ctx)
    assert len(issues) == 1
    assert issues[0].rule_id == "V036"
```

---

## 5. Performance & Hardening SLA (50,000 Rows)

Tested on 50,000 student records mapped via the `neuralsorcerer` adapter against synthetic AICTE registers:

| Metric | Target SLA | Measured Benchmark | Margin | Status |
|:---|:---:|:---:|:---:|:---:|
| **Validation Runtime** | $< 60.0\text{ s}$ | **11.97 s** | **-48.03 s (5x faster)** | **PASSED** |
| **Throughput** | $> 1,000\text{ rows/s}$ | **4,177.4 rows/s** | **+3,177.4 rows/s** | **PASSED** |
| **Peak Memory (RSS)** | $< 400.0\text{ MB}$ | **307.5 MB** | **-92.5 MB headroom** | **PASSED** |
| **Render Free Tier (512 MB)** | Safe Margin | **Safe (< 60% RSS)** | **+204.5 MB reserve** | **PASSED** |

### Key Optimizations Applied:
1. **Cached Dictionary Iteration**: `ctx.get_records(df)` converts DataFrame to cached list-of-dicts, reducing per-rule traversal from 28.0 s to 0.03 s compared to `df.iterrows()`.
2. **Dual-Pass Christen Blocking with Hard Caps**: Capped block sizes (`MAX_BLOCK_SIZE = 80`) and candidate pairs (`MAX_CANDIDATE_PAIRS = 25,000`) prevent combinatorial $O(N^2)$ candidate explosions on large batches.
3. **In-Memory Master Table Caching**: Reference tables (`programs`, `institutions`, `intake`, `registry`) are cached in memory after initial load, eliminating filesystem I/O bottleneck.

---

## 6. Versioning Policy

EduVerify follows [Semantic Versioning 2.0.0](https://semver.org/):
- **Major (`X.0.0`)**: Breaking schema changes, removed public APIs, or rule catalog schema migrations.
- **Minor (`1.X.0`)**: New validation rules, new export formats, new monitoring algorithms (backwards-compatible).
- **Patch (`1.0.X`)**: Bug fixes, performance optimizations, rule threshold adjustments, documentation updates.

Catalog version (`contracts/rule_catalog.yaml`) and Engine version (`engine/pyproject.toml`) are synced to **`1.0.0`**.
