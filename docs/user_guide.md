# EduVerify User Manual & Operational Guide
# एडुवेरिफाई उपयोगकर्ता मार्गदर्शिका एवं परिचालन मैनुअल

> **Version / संस्करण:** `1.0.0` | **Date / दिनांक:** 2026-10-24  
> **Platform / मंच:** EduVerify National Higher Education Quality & Trust Platform

---

## Table of Contents / विषय सूची

1. [Role 1: AICTE Administrator / अभाशिप प्रशासक](#role-1-aicte-administrator--अखिल-भारतीय-तकनीकी-शिक्षा-परिषद-प्रशासक)
2. [Role 2: AICTE Policy Analyst / नीति एवं विश्लेषक](#role-2-aicte-policy-analyst--नीति-एवं-विश्लेषक)
3. [Role 3: Institution Administrator / संस्थान प्रशासक](#role-3-institution-administrator--संस्थान-प्रशासक)
4. [Role 4: Institution Staff / संस्थान कर्मचारी](#role-4-institution-staff--संस्थान-कर्मचारी)
5. [Role 5: Degree Awarding Body (DAB) Administrator / डिग्री प्रमाणन बोर्ड प्रशासक](#role-5-degree-awarding-body-dab-administrator--डिग्री-प्रमाणन-बोर्ड-प्रशासक)
6. [Role 6: Student & Credential Holder / विद्यार्थी एवं प्रमाणपत्र धारक](#role-6-student--credential-holder--विद्यार्थी-एवं-प्रमाणपत्र-धारक)
7. [Role 7: Verifier & Employer / सत्यापनकर्ता एवं नियोक्ता](#role-7-verifier--employer--सत्यापनकर्ता-एवं-नियोक्ता)

---

## Role 1: AICTE Administrator / अखिल भारतीय तकनीकी शिक्षा परिषद प्रशासक

### 1.1 Overview & Responsibilities / अवलोकन एवं उत्तरदायित्व
The AICTE Administrator oversees national intake governance, reviews master registries, inspects the cryptographic audit log, and manages the annual academic year rollover wizard.

### 1.2 Core Workflows / मुख्य कार्यप्रवाह

#### A. National Oversight & Live Monitoring (`/aicte`)
1. Sign in with administrative credentials (`aicte.admin@demo.local`).
2. Inspect the **National KPI Cards**: Total Institutions, Coverage % (Student-level vs Aggregate-only), Total Enrolled Students, Average Fill %, Excess Enrolled Seats, and National Average Data Quality Score.
3. Observe the **SSE Live Event Ticker**: Displays live updates as colleges commit batches across India, highlighting detected anomalies and cross-institutional duplicates in real time.
4. Verify the **Audit Chain Integrity Badge** in the header: Confirms whether the SHA-256 Merkle audit chain is intact (`Audit chain intact ✓`). If compromised, inspect the first broken block ID immediately.

#### B. Cross-Institution Duplicate Resolution (`/aicte?tab=duplicates`)
1. Navigate to the **Cross-Institution Duplicate Queue**.
2. Select any flagged pair (e.g. *Rahul Sharma* appearing at both *Demo Institute of Technology* and *Metro Engineering College*).
3. Review the side-by-side demographic breakdown (Name similarity, DOB match, Gender, and Mobile hash).
4. Resolve the cluster by choosing **Confirm Dual Enrolment** (issues regulatory notice) or **Genuine Transfer** (initiates formal transfer reconciliation).

#### C. Academic Year Rollover Wizard (`/aicte?tab=admin`)
1. Open the **Admin Section** and select **Academic Year Rollover Wizard**.
2. Select the source year (`2026-27`) and target target year (`2027-28`).
3. Click **Run Dry Run**: The system evaluates active students, expected graduates, and transfers, outputting transition counts before modifying any data.
4. Click **Confirm Rollover**: Commits the year transition, updates student levels, and generates an audit record.

---

## Role 2: AICTE Policy Analyst / नीति एवं विश्लेषक

### 2.1 Overview & Responsibilities / अवलोकन एवं उत्तरदायित्व
The AICTE Policy Analyst analyzes state-level intake distributions, monitors quota compliance (NRI, OCI, Foreign Nationals, Supernumerary schemes), and compiles statutory policy reports.

### 2.2 Core Workflows / मुख्य कार्यप्रवाह

#### A. India Map & State Drilldown (`/aicte`)
1. Open the **Interactive State Map** (or official state tile-grid fallback).
2. Toggle the metric selector between:
   - **Fill %:** Institutional capacity utilization.
   - **Excess Seats:** Unapproved admissions above approved intake caps.
   - **DQ Score:** Regional data hygiene and compliance score.
   - **Coverage %:** Ratio of student-level verified uploads vs aggregate-only submissions.
3. Click any state (e.g. *Maharashtra*) to drill down into district and institutional tables.

#### B. Supernumerary & Quota Monitoring (`/aicte?tab=quotas`)
1. Inspect the **Supernumerary Quotas Chart**: Tracks Tuition Fee Waiver (TFW $\le 5\%$), PMSSS (J&K), and North East allocations.
2. Review the **NRI / OCI / Foreign Nationals Stacked Bar Chart** across states to ensure admissions do not exceed statutory quotas.

#### C. Statutory Report Generation (`/reports`)
1. Navigate to **Reports** (`/reports`).
2. Choose **POLICY** or **MONITORING** report type.
3. Apply filters: Academic Year (`2026-27`), State Jurisdiction (`Maharashtra`), and Format (`PDF` or `XLSX`).
4. Click **Generate Report**: The system compiles central records, verifies cryptographic proofs, and enables immediate download.

---

## Role 3: Institution Administrator / संस्थान प्रशासक

### 3.1 Overview & Responsibilities / अवलोकन एवं उत्तरदायित्व
The Institution Administrator holds final signing authority for batch submissions, approves data quality fixes proposed by staff, manages transfer requests, and configures ERP API keys and webhooks.

### 3.2 Core Workflows / मुख्य कार्यप्रवाह

#### A. Reviewing & Approving Batch Corrections (`/institution/batches/:id/review`)
1. Log in with institutional admin credentials (`inst.admin@demo.local`).
2. Navigate to **Batch Registry** and open the active batch in review.
3. Switch to the **Proposed Fixes** tab: Review corrections submitted by staff (e.g. restoring leading zero for Excel-mangled APAAR `V023` or correcting graduation year `V025`).
4. Click **Approve Fix** (or **Approve All High Confidence**): Each approval records the administrator's digital identity, timestamp, previous value, and updated value.
5. Click **Re-validate**: The quality score recalculates (e.g. $71\% \rightarrow 96\%$).
6. Click **Commit Batch to Central Repository**: Once all CRITICAL defects are resolved, the batch is permanently committed.

#### B. Managing Inter-Institutional Transfers (`/institution/transfers`)
1. Open **Transfers Desk** (`/institution/transfers`).
2. Review **Incoming Requests**: If a student is transferring out to another institution, review the reason, evidence reference, and click **Approve Transfer**.
3. Create **Outgoing Requests**: Enter the student's APAAR ID, select source institution, and attach transfer evidence.
4. Note: AICTE statutory rule enforces automatic approval after 15 days of source college inactivity.

#### C. System Integration: API Keys & Webhooks (`/settings`)
1. Open **Settings** (`/settings`).
2. In **API Keys**, generate a secure token (`evk_...`) for your campus ERP system.
3. In **Webhooks**, register your endpoint URL and subscribe to `batch.committed` and `credential.revoked` events. Use the copyable HMAC-SHA256 signature verification snippet to authenticate payloads.

---

## Role 4: Institution Staff / संस्थान कर्मचारी

### 4.1 Overview & Responsibilities / अवलोकन एवं उत्तरदायित्व
Institution Staff members are responsible for uploading raw enrollment files, mapping college ERP columns, and investigating validation defects.

### 4.2 Core Workflows / मुख्य कार्यप्रवाह

#### A. Uploading Student Enrollment Files (`/institution/upload`)
1. Sign in as institutional staff (`inst.staff@demo.local`).
2. Navigate to **Upload** (`/institution/upload`) and select Academic Year (`2026-27`).
3. (Optional) Click **Download Official Template** to review the bilingual schema.
4. Drag and drop your college spreadsheet (e.g. `batch_2_errors.xlsx`).

#### B. Smart Column Mapping
1. The **Column Mapping Screen** automatically suggests pairings based on RapidFuzz token matching (e.g. `PRN → institution_student_id`, `DOB → dob`, `Dept → department`).
2. Confirm or adjust pairings using the dropdown selectors.
3. Check **Save as my institution's mapping profile** to remember these column aliases for future uploads.
4. Click **Confirm & Validate Batch**.

#### C. Investigating Issues & Proposing Fixes
1. Open the validation summary: Inspect the initial quality score, priority breakdown (CRITICAL / HIGH / MEDIUM / LOW), and intake status.
2. In the **Review Issues Drawer**:
   - For **CRITICAL** issues (e.g. invalid APAAR format): Review the evidence and suggested fix, then click **Propose Fix**.
   - For **Formatting & Info** issues: Click **Propose All Formatting Fixes** to clean leading whitespace and case inconsistencies.
3. Notify the Institution Administrator once fixes are ready for approval.

---

## Role 5: Degree Awarding Body (DAB) Administrator / डिग्री प्रमाणन बोर्ड प्रशासक

### 5.1 Overview & Responsibilities / अवलोकन एवं उत्तरदायित्व
The Degree Awarding Body (DAB) Administrator oversees graduation records for affiliated colleges and signs official university degree certificates.

### 5.2 Core Workflows / मुख्य कार्यप्रवाह

#### A. Reviewing Affiliated Graduates (`/dab`)
1. Sign in as DAB administrator (`dab.admin@demo.local`).
2. Open the **Affiliated Graduates** tab.
3. Filter by affiliated institution (e.g. *Delhi College of Engineering & Technology*) and graduation status (`COMPLETED` or `GRADUATED`).

#### B. Issuing Verifiable Degree Certificates
1. Locate an eligible graduate (e.g. *Aarav Patel* or *Rahul Sharma*).
2. Click **Issue Degree Credential**:
   - Generates an official verifiable credential signed with the DAB's Ed25519 issuer key.
   - Status transitions to `ISSUED` with a unique credential reference (`cred-degree-...`).
3. Click **Preview Certificate**: Opens the official A4 landscape WeasyPrint-compatible diploma featuring bilingual Hindi/English headings, student APAAR ID, student PRN, digital signatures, and verification QR code.

---

## Role 6: Student & Credential Holder / विद्यार्थी एवं प्रमाणपत्र धारक

### 6.1 Overview & Responsibilities / अवलोकन एवं उत्तरदायित्व
Students maintain sovereign control over their educational identity wallet, manage statutory consent preferences, and share selectively disclosed credentials with prospective employers.

### 6.2 Core Workflows / मुख्य कार्यप्रवाह

#### A. Inspecting Own Identity Record (`/student`)
1. Sign in as a student (`student@demo.local`).
2. View your **Unmasked Student Profile**: Displays your full 12-digit APAAR ID (`9845-7291-2301`), personal demographics, and enrollment details.
3. Expand **Version History**: Review every historical modification to your student record across semesters.
4. Notice the **Hardware Custody Banner**: Confirms your non-extractable WebCrypto key pair is securely stored in this browser's IndexedDB.

#### B. Managing Statutory Consent Toggles
1. Under **Consent Management**, toggle statutory purposes:
   - `REPOSITORY`: Central storage of enrollment history.
   - `VERIFICATION_SHARE`: Permitting third-party credential verification.
   - `ANALYTICS_AGGREGATE`: Inclusion in national anonymized statistics.
2. If withdrawing `VERIFICATION_SHARE`, review the warning: *Withdrawing this consent immediately sets the status list bit and suspends all downstream credentials*.

#### C. Building Selective Disclosure Presentations
1. Under **Verifiable Credentials**, click **Share Selected Fields** on your degree or enrollment credential.
2. In the modal:
   - Check **only** the fields you wish to reveal (e.g. *Full Name* and *Program Name*).
   - Enter the target audience (e.g. *Acme Corp HR*).
3. Click **Build Selective Presentation**:
   - Cryptographically binds chosen disclosures to your WebCrypto ECDSA P-256 private key via a Key Binding JWT (`KB-JWT`).
   - Displays an active **QR Code** (`qrcode.react`), copyable link, and 5-minute expiry countdown timer.

---

## Role 7: Verifier & Employer / सत्यापनकर्ता एवं नियोक्ता

### 7.1 Overview & Responsibilities / अवलोकन एवं उत्तरदायित्व
Verifiers (employers, foreign universities, background check agencies) verify academic credentials without requiring user accounts or viewing unconsented private student attributes.

### 7.2 Core Workflows / मुख्य कार्यप्रवाह

#### A. Verifying Credentials via QR Code or Link (`/verify`)
1. Open the public **Verifier Portal** (`/verify`).
2. **Scan QR Code:** Click *Scan QR Code via Camera* to scan directly from a candidate's mobile screen using `html5-qrcode`.
3. **Paste Link / Token:** Alternatively, paste the shared URL or raw presentation token into the input box and click **Verify Presentation**.

#### B. Interpreting Verification Cards
The verifier screen displays one of four clear status cards:
- 🟢 **VALID (Green):** Credential signature verified, holder device key bound, and AICTE status list active. Displays **strictly the disclosed fields** (e.g. Student Name and Degree). No hidden PII is revealed.
- 🔴 **INVALID (Red):** Tampered presentation token, disclosure hash mismatch, or corrupted cryptographic signature.
- 🟡 **SUPERSEDED (Amber):** The institution has issued a newer record version; prompt the candidate for an updated presentation.
- ⚪ **SUSPENDED (Grey):** The student has exercised their DPDP statutory right to withdraw `VERIFICATION_SHARE` consent. Zero personal fields are displayed.
