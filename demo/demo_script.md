# EduVerify 5-Minute Live Demonstration Script

> **Timing:** Exactly 5 Minutes (300 Seconds) | **Follows:** `runthrough.md`  
> **Audience:** AICTE Evaluation Panel, Technical Judges & Higher Education Leadership

---

## Timeline & Cue Sheet Summary

| Timestamp | Phase | Role / Actor | Screen / URL | Key Demonstration Action |
|---|---|---|---|---|
| **0:00 – 0:45** | 1. Ingestion & Mapping | `inst.staff` | `/institution/upload` | Drop `batch_2_errors.xlsx`, smart column mapping, SSE live progress bar. |
| **0:45 – 1:45** | 2. Explainable Review | `inst.staff` & `inst.admin` | `/institution/batches/:id/review` | Inspect CRITICAL rules (V002, V023, V025), approve fixes, score jumps 71% → 96%, commit. |
| **1:45 – 2:30** | 3. Cross-Institution Dupes | `inst2.admin` | `/institution/transfers` | Detect cross-college dual enrolment (V010), approve genuine student transfer. |
| **2:30 – 3:30** | 4. AICTE National Radar | `aicte.analyst` | `/aicte` | Live SSE ticker pop, interactive India map drilldown, quota charts, audit chain badge. |
| **3:30 – 4:30** | 5. Sovereign Student Wallet | `student` | `/student` | WebCrypto non-exportable key banner, unmasked APAAR, selective share modal (2 fields). |
| **4:30 – 5:00** | 6. Trust Verification | `verifier` / Public | `/verify` | Scan QR code → Big Green VALID card showing strictly 2 fields; tamper test. |

---

## Minute-by-Minute Script & Speaker Narrative

### [0:00 – 0:45] Phase 1: Ingestion & Smart Column Mapping
- **Actor:** Institutional Staff (`inst.staff@demo.local`)
- **Screen:** `http://localhost:5173/institution/upload`
- **Speaker:**
  > "Respected judges, Indian higher education institutions manage student records in wildly differing spreadsheet formats. Here, as a college staff member, I select Academic Year 2026-27 and drop our college's internal spreadsheet: `batch_2_errors.xlsx`."
- **Action on Screen:**
  - Drag and drop `batch_2_errors.xlsx`.
  - The **Column Mapping Screen** appears.
- **Speaker:**
  > "Notice how EduVerify's RapidFuzz engine instantly recognizes our internal headers: `PRN` maps to `institution_student_id` with 98% confidence, `DOB` to `dob`, and `APAAR No` to `apaar_id`. We save this mapping profile and confirm."
- **Action on Screen:**
  - Click **Confirm & Validate Batch**.
  - The live SSE progress stepper animates through Parsing $\rightarrow$ Mapping $\rightarrow$ Rules $\rightarrow$ Duplicates $\rightarrow$ Anomaly.

---

### [0:45 – 1:45] Phase 2: Explainable Review, Quality Jump & Commitment
- **Actor:** Institutional Staff $\rightarrow$ Institutional Administrator (`inst.admin@demo.local`)
- **Screen:** `http://localhost:5173/institution/batches/:id/review`
- **Speaker:**
  > "The batch finishes validating in 464 milliseconds. Our initial quality score is 71/100. Rather than opaque rejection codes, every defect is categorized by regulatory severity. 
  > Let's inspect this CRITICAL defect: rule V023 detects an Excel-mangled APAAR with 11 digits, where Excel stripped the leading zero. The system validates the padded value against the national registry and suggests the exact fix."
- **Action on Screen:**
  - Click **Propose Fix** on the APAAR issue and graduation year issue (V025: admission 2026 + 4-year B.Tech $\rightarrow$ expected 2030, not 2028).
  - Switch user to `inst.admin@demo.local`.
  - Open the **Proposed Fixes** tab and click **Approve All**.
- **Speaker:**
  > "The institution administrator holds final signing authority. With one click, the admin approves the proposed fixes with complete audit attribution. 
  > We click **Re-validate**—watch our quality score jump from 71 to 96! Zero CRITICAL issues remain. We click **Commit Batch to Central Repository**."
- **Action on Screen:**
  - Click **Commit Batch**. The batch transitions to `COMMITTED`.

---

### [1:45 – 2:30] Phase 3: Cross-Institution Duplicate Detection & Lifecycle Transfer
- **Actor:** Neighbour Institution (`inst2.admin@demo.local`)
- **Screen:** `http://localhost:5173/institution/transfers`
- **Speaker:**
  > "Now, what happens if a student attempts dual-enrollment at a neighbouring university? We sign in as Metro Engineering College and upload `batch_3_cross_dupes.csv`.
  > Immediately, rule V010 flags a CRITICAL defect: this student is already active at Demo Institute of Technology for 2026-27."
- **Action on Screen:**
  - Show the dual enrollment flag on the dashboard.
  - Navigate to `/institution/transfers` and open the incoming transfer request.
  - Click **Approve Transfer**.
- **Speaker:**
  > "Because this is a genuine student relocation, the source college approves the transfer. The source record updates to `TRANSFERRED_OUT`, unblocking the receiving institution without creating duplicate enrollment."

---

### [2:30 – 3:30] Phase 4: AICTE Central Radar & Real-Time Monitoring
- **Actor:** AICTE National Analyst (`aicte.analyst@demo.local`)
- **Screen:** `http://localhost:5173/aicte`
- **Speaker:**
  > "Let's switch to the national regulator's cockpit at `/aicte`. In the top right, look at our live SSE ticker—the batch we just committed appeared in under 1 second.
  > In the header, our cryptographic badge displays: **Audit Chain Intact ✓**, cryptographically validating the SHA-256 Merkle chain across all national transactions."
- **Action on Screen:**
  - Click the **Interactive State Map** on Maharashtra to reveal district and institution drilldowns.
  - Show the **Excess Enrolment Leaderboard** (+3 in B.Tech CSE).
  - Open the **Quota Breakdown** tab showing supernumerary allocations (TFW, PMSSS) and NRI shares.
- **Speaker:**
  > "Regulators have instant national visibility: excess intake, demographic quota compliance, and statistical anomaly detection (z-score shifts) without waiting for end-of-year reports."

---

### [3:30 – 4:30] Phase 5: Sovereign Student Wallet & Selective Disclosure
- **Actor:** Student (`student@demo.local`)
- **Screen:** `http://localhost:5173/student`
- **Speaker:**
  > "Now let's examine the student's perspective. The student visits `/student`. On their first visit, their browser creates an ECDSA P-256 cryptographic key pair via WebCrypto with `extractable: false`. The banner confirms: *This device holds your key; if you clear browser data you must request re-issue*.
  > The student inspects their unmasked record and statutory DPDP consent toggles."
- **Action on Screen:**
  - Click **Share Selected Fields** on the B.Tech Degree Credential.
  - In the modal, uncheck all claims except **Full Name** and **Program Name**.
  - Enter audience: *Acme Corp HR*. Click **Build Selective Presentation**.
- **Speaker:**
  > "Under DPDP Act 2023, students must control what they disclose. Here, the student reveals **only their Name and Program**. The system signs a Key Binding JWT using their browser hardware key and generates this live QR code and link."

---

### [4:30 – 5:00] Phase 6: Instant Zero-Knowledge Verification
- **Actor:** Public Employer / Verifier
- **Screen:** `http://localhost:5173/verify`
- **Speaker:**
  > "Finally, the employer opens `/verify` and scans the QR code or clicks the verification link.
  > Boom—a Big Green **VALID** card! 
  > Look at the disclosed claims table: exactly the **two fields** the student chose to share are revealed. Date of birth, category, mobile, and admission details remain cryptographically concealed.
  > If someone tampers with even one character of the presentation token—it instantly turns Big Red **INVALID**."
- **Action on Screen:**
  - Display the green VALID card with strictly 2 claims.
  - Display the issuer trust statement (*Delhi College of Engineering & Technology, verified against AICTE Trust List*).
- **Speaker:**
  > "From raw messy college spreadsheets to privacy-preserving, mathematically verified credentials: that is EduVerify. Thank you!"
