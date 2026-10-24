# EduVerify Seed Demonstration Scenario & Ground Truth Ledger

> **Version:** `1.0.0` | **Date:** 2026-10-24  
> **Environment:** Development & Evaluation Sandbox  
> **Default Credential:** Password = `SEED_PASSWORD` from `.env` (default: `Demo@EduVerify2026!`)

---

## 1. Seeded Institutional Entities

| Institution Name | AICTE ID | Type | State | Sanctioned Programs & Intakes |
|---|---|---|---|---|
| **Demo Institute of Technology** | `1-1234567890` | Technical Institute (Student-level) | Delhi NCT (07) | • B.Tech CSE (Approved: 60)<br>• B.Tech ECE (Approved: 60)<br>• B.Tech ME (Approved: 60) |
| **Metro Engineering College** | `1-9876543210` | Neighbour Technical College | Delhi NCT (07) | • B.Tech CSE (Approved: 120)<br>• B.Tech IT (Approved: 60) |
| **Maharashtra Institute of Tech** | `1-100010001` | Affiliated College | Maharashtra (27) | • MBA (Approved: 120)<br>• MCA (Approved: 60) |
| **National Polytechnic Institute** | `1-5554443332` | Aggregate-Only Institution | Karnataka (29) | Statistical aggregates: Total: 340, Supernumerary: 17, NRI: 5 |
| **Demo State Technical University** | `DAB-DEL-01` | Degree Awarding Body (DAB) | Delhi NCT (07) | Affiliates 48 colleges across technical disciplines |

---

## 2. Seeded User Personas & Default Roles

| Role | Email Address | Assigned Institution | Primary Dashboard URL | Key Verification Capabilities |
|---|---|---|---|---|
| **AICTE_ADMIN** | `aicte.admin@demo.local` | AICTE Headquarters | `/aicte` | Master data browser, academic year rollover wizard, audit chain inspector. |
| **AICTE_ANALYST** | `aicte.analyst@demo.local` | AICTE Analytics Division | `/aicte` | Interactive India map, state intake drilldowns, quota breakdown charts, live ticker. |
| **INSTITUTION_ADMIN** | `inst.admin@demo.local` | Demo Institute of Tech | `/institution` | Approval of proposed data fixes, inter-college transfers, API keys, batch commit. |
| **INSTITUTION_STAFF** | `inst.staff@demo.local` | Demo Institute of Tech | `/institution/upload` | Batch file upload, smart column mapping, reviewing issues, proposing fixes. |
| **INSTITUTION_ADMIN (Neighbour)** | `inst2.admin@demo.local` | Metro Engineering College | `/institution` | Uploads `batch_3_cross_dupes`, tests cross-college dual-enrolment detection. |
| **DAB_ADMIN** | `dab.admin@demo.local` | Demo State University | `/dab` | Reviews graduates of affiliated colleges, issues Ed25519-signed degree credentials. |
| **STUDENT** | `student@demo.local` | Linked to Aarav Patel | `/student` | WebCrypto non-exportable hardware key custody, DPDP consent toggles, selective sharing. |
| **VERIFIER** | `verifier@demo.local` | Acme Corp HR / Public | `/verify` | QR code scanning, instant green VALID card with strictly disclosed claims. |

---

## 3. Demonstration Batches & Defect Ground Truth

The four demonstration batches located in `data/demo/` represent the progressive operational flow:

### Batch 1: Clean Baseline (`batch_1_clean.csv`)
- **File:** `data/demo/batch_1_clean.csv` (50 Rows)
- **Characteristics:** Perfectly formatted records, valid Verhoeff-compliant APAAR IDs, 100% intake compliance, zero duplicates.
- **Expected Quality Score:** `100.0%`
- **Expected Rule Flags:** None (0 issues, 0 warnings).

---

### Batch 2: Seeded Institutional Defects (`batch_2_errors.xlsx`)
- **File:** `data/demo/batch_2_errors.xlsx` (50 Rows)
- **Header Format:** Non-standard institutional headers (`PRN`, `DOB`, `Dept`, `APAAR No`).
- **Initial Quality Score:** `71.4%` $\rightarrow$ **Post-Approval Quality Score:** `96.2%`
- **Seeded Defects & Targeted Rules:**

| Row | Student PRN | Field | Injected Defect | Triggered Rule | Suggested Fix |
|---|---|---|---|---|---|
| **#3** | `PRN-2026-003` | `APAAR No` | Excel dropped leading zero (`98457291230`) | **V023 (CRITICAL)** | Padded leading zero (`098457291230`) |
| **#7** | `PRN-2026-007` | `Graduation Year` | Grad year set to `2028` for 4-year B.Tech starting `2026` | **V025 (HIGH)** | Updated graduation year to `2030` |
| **#12** | `PRN-2026-012` | `DOB` | Ambiguous slash format `03/04/2005` | **V024 (MEDIUM)** | Confirmed ISO-8601 format `2005-04-03` |
| **#15** | `PRN-2026-015` | `Seat Type` | Supernumerary seat selected without scheme code | **V015 (HIGH)** | Assigned valid scheme `TFW` |
| **#22** | `PRN-2026-022` | `Nationality` | Student marked `OCI` with nationality `IN` | **V014 (HIGH)** | Updated nationality to foreign passport |
| **#31–33** | `PRN-2026-031..33`| `Program` | Enrolled count exceeds approved CSE intake (63/60) | **V012 (CRITICAL)** | Excess 3 students flagged in red |
| **#41** | `PRN-2026-041` | `Full Name` | Name entered in ALL CAPS with extra whitespace | **V006 (INFO)** | Capitalized format `Vikram Aditya Singh` |

---

### Batch 3: Cross-Institution Deduplication (`batch_3_cross_dupes.csv`)
- **File:** `data/demo/batch_3_cross_dupes.csv` (40 Rows)
- **Uploaded By:** `inst2.admin@demo.local` (Metro Engineering College)
- **Seeded Deduplication Scenarios:**

| Scenario | Student Identity | Other Institution | Match Confidence | Triggered Rule & Action |
|---|---|---|---|---|
| **1. Direct APAAR Dual Enrollment** | *Aarav Patel* (`984572912301`) | Demo Institute of Technology | `100.0%` Exact APAAR | **V010 (CRITICAL):** Illegal dual enrollment detected. |
| **2. Demographic Transliteration Duplicate** | *Rahul Sharma* vs *Rahul S. Sharma* | Demo Institute of Technology | `88.5%` Jaro-Winkler | **V011 (HIGH):** Demographic cluster routed to human review. |
| **3. Legitimate In-Flight Transfer** | *Priya Singh* (`984511223344`) | Demo Institute of Technology | `100.0%` Matching Transfer | **V032 (WARNING):** Pending transfer request; not penalized as dual enrollment. |
| **4. Genuine Sibling Twins** | *Arun & Varun Verma* | Metro Engineering College | Same DOB & Surname, distinct APAAR | **V011 Verified False Alarm:** Distinct first names and APAARs preserved. |

---

### Batch 4: Schema Drift & Statistical Anomaly (`batch_4_anomaly_drift.csv`)
- **File:** `data/demo/batch_4_anomaly_drift.csv` (60 Rows)
- **Uploaded By:** Demo Institute of Technology
- **Seeded Anomalies & Targeted Rules:**

| Anomaly Type | Manifestation | Triggered Rule | Statistical Assessment |
|---|---|---|---|
| **Column Deletion Drift** | Canonical column `category` completely omitted from file | **V028 (CRITICAL)** | Baseline expects category; schema drift detected. |
| **Unseen Categorical Level** | Column `seat_type` introduces new value `"MGMT"` | **V029 (HIGH)** | Unregistered seat quota not in approved handbook. |
| **Statistical Ratio Shift** | NRI student share jumps from baseline $5\%$ to $40\%$ | **V030 (HIGH)** | Z-score = $6.1$ ($\gg 3.0$ standard deviation limit). |
| **Intake Ceiling Spike** | Approved intake declared as 150 vs Master Data 60 | **V022 (CRITICAL)** | Mismatch with central council approval registry. |

---

## 4. Seeded Student Verifiable Credential Personas

| Student Persona | APAAR ID | Institution | Program | Credential ID | Issued Status |
|---|---|---|---|---|---|
| **Aarav Patel** | `984572912301` | Demo Institute of Technology | B.Tech Computer Science & Engineering | `cred-enrol-2026-001` | `VALID` |
| **Rahul Sharma** | `984583921044` | Demo Institute of Technology | B.Tech Computer Science & Engineering | `cred-degree-2026-002` | `VALID` |
| **Amit Vikram Kumar** | `984572912301` | Maharashtra Institute of Tech | Master of Business Administration (MBA) | `cred-degree-2026-003` | `PENDING` |
| **Sneha R. Nair** | `984511223344` | Bengaluru Institute of Technology | B.Tech Mechanical Engineering | `cred-degree-2026-004` | `ISSUED` |
