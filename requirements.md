# requirements.md — EduVerify

> What the system must do, and where each requirement is handled in this kit.
> Reading order: `requirements.md` → `agents.md` → `steps.md` → `prompts/` → `runthrough.md`.

---

## 1. Problem statement (SIH 2026)

AICTE receives student information from approved institutions through different submission mechanisms. PGDM institutions submit detailed student data every year. Other AICTE-approved institutions mostly submit statistics, such as total enrolment during the approval process. This makes it hard to keep complete, authentic and verifiable student records.

APAAR ID is the national academic identity. The task is an integrated digital platform that:
- uses APAAR ID as the unique academic identifier for students in AICTE-approved institutions;
- lets institutions submit student-level data securely to the AICTE portal after admissions;
- supports real-time verification and monitoring of student records.

**Required pipeline:**
`Institution → Student Data Upload → APAAR Validation → Data Verification → AICTE Central Repository → Analytics & Monitoring → Authorized Verification`

**Expected outcome:**
- authentic, verifiable student records linked to a national academic identity;
- real-time monitoring of admissions;
- detection of excess enrolment;
- data-driven governance and policy formulation.

**Innovation expected:** go beyond data collection. Provide automated validation, intelligent anomaly detection, real-time monitoring, secure verification and analytics. The result should be a reliable national-level student data ecosystem.

---

## 2. Functional requirements (from the PS)

| ID | Requirement | How EduVerify meets it | Where |
|---|---|---|---|
| R1 | Secure platform/API to upload and update student-level data keyed on APAAR ID | `POST /v1/batches` (CSV/XLSX), `PUT /v1/students/{apaar_id}`, scoped institution API keys, idempotency keys | agents.md §11, B3, B1 |
| R2 | Fields for approved intake, actual enrolment, supernumerary seats, NRI, OCI, FN and other student data | Canonical `student_record` schema, `program_intake`, `declared_totals` | agents.md §5 |
| R3 | Automated validation: duplicates, invalid/missing APAAR, intake exceeded, inconsistencies, cross-institution duplicate enrolment | Rule catalog V001–V035, fuzzy dedup, transfer-aware cross-institution checks | agents.md §6, C3, C4 |
| R4 | Real-time dashboards for AICTE and institutions | AICTE console and institution dashboard, live via SSE | A4, A5, B7 |
| R5 | Secure verification for AICTE, institutions, employers and regulators | Verifier portal, `POST /v1/verify`, VERIFIER role | A6, B6 |
| R6 | Verifiable student records linked to academic identity | SD-JWT verifiable credential bound to the APAAR record and the student's device key | agents.md §8.2, B6 |
| R7 | Integration with existing institutional and AICTE systems | OpenAPI 3.1, API keys, HMAC-signed webhooks, bulk export | B7 |
| R8 | Data security, privacy, authentication, RBAC, audit trails, consent | JWT auth + RBAC (7 roles), consent ledger, hash-chained audit log, field encryption, PII masking | agents.md §8–9, B1, B5 |
| R9 | Reports for policy, accreditation, monitoring and regulation | Report builder (PDF/XLSX) and data-quality reports | A7, B7, C6 |
| R10 | APAAR ID and student ID printed/displayed on certificates from degree-awarding bodies | Certificate template with APAAR ID, institution student ID and a verification QR; the issuer is the degree-awarding body | agents.md §8.6, A6, B6 |

---

## 3. Our USPs (differentiators)

| # | USP | What it means | Where |
|---|---|---|---|
| U1 | Field-level explainable verification | Every issue names the field, the reason, the evidence, the severity and a suggested fix. Example: graduation year 2028 conflicts with admission 2026 + a 4-year program, so the expected year is 2030 | C3, A3 |
| U2 | Intelligent duplicate detection | Catches near-matches like "Rahul Sharma" and "Rahul S. Sharma", with a similarity score and per-field match details. A human confirms; records are never merged automatically | C4, A3 |
| U3 | Cross-field and cross-record consistency | Graduation year vs admission year, student ID uniqueness, conflicting course/department/year, invalid value combinations | C3 (V014, V015, V017, V025–V027) |
| U4 | Confidence-based human review | Issues are sorted into auto-flagged, needs review and info. Suggested corrections need approval before any data changes | C3, B4, A3 |
| U5 | Before-and-after data-quality report | Records scanned, errors and duplicates found, resolved vs pending, quality score before vs after, downloadable report | C6, B4, A3 |
| U6 | Smart column mapping | Recognises equivalent headers (PRN / Student_ID / Enrollment_No, DOB / Date_of_Birth, Dept / Department_Name). The user confirms the mapping before validation | C2, A2 |
| U7 | Schema-drift detection | Flags a removed required column, a numeric field turned to text, new categories, or a jump in missing IDs compared with the previous upload | C5 (V028–V030) |
| U8 | Risk-based prioritisation | Issues ranked CRITICAL / HIGH / MEDIUM / LOW: identifier problems first, cosmetic formatting last | C3, A3 |

---

## 4. Gap requirements (logic gaps judges could probe)

### High priority

| Gap | Requirement | Where |
|---|---|---|
| Student lifecycle | Institutions can mark students withdrawn, deferred, transferred, completed or graduated, and record lateral entry. Genuine transfers must not show up as cross-institution duplicates | agents.md §8.1, B4, A4, C4 |
| Holder key custody | Decide who holds the SD-JWT key-binding key. **Decision:** it stays in the student's browser and can't be exported; a lost device means re-issue. Recorded in the threat model | agents.md §8.2, B5, A6 |
| Corrections vs issued credentials | A correction marks earlier credentials as SUPERSEDED, so verifiers never accept outdated data | agents.md §8.3, B3, B6 |
| Consent withdrawal | Withdrawing verification-share consent suspends the student's credentials. Withdrawing repository consent pseudonymises the PII and keeps only counts | agents.md §8.4, B5 |
| Reconciliation with statistical totals | Compare totals declared at approval with student-level uploads. Institutions not fully onboarded get an aggregate-only mode | agents.md §8.5, C5, B4, A4 |
| Master data | Reference tables for AICTE institution IDs, program codes, LGD states/districts, degree-awarding bodies, academic years and enums | agents.md §7, C1, B2 |

### Medium priority: engine and data

| Gap | Requirement | Where |
|---|---|---|
| Parser pitfalls | Read every cell as a string so leading zeros survive. Use an explicit Indian date policy (never MM/DD) and handle Excel serial dates | agents.md §8.9, C2 |
| Generator outputs | Generate the registry, intake, declared totals, central snapshot, history, transfers and 4 demo batches with ground truth | C1 |
| Rule catalog versioning | The catalog has an owner and a semver version. Every report records the engine and catalog versions | agents.md §6, C0 |
| Batch concurrency | One open batch per institution and year, explicit supersede, advisory-lock commit, idempotency keys | agents.md §8.7, B3 |
| Webhook registration | Endpoints and a UI to register a URL and secret, with HMAC-signed delivery and retries | B7, A4 |
| Academic-year rollover | Year-of-study progression, next-year windows, and a rollover wizard with a dry run | agents.md §8.8, C5, B4/B7, A5 |

### Medium priority: engineering

| Gap | Requirement | Where |
|---|---|---|
| Contract testing | Schemathesis against `contracts/openapi.yaml`; frontend types generated from the same file | B0, B8, A0 |
| Security CI | bandit, pip-audit, npm audit and a ZAP baseline scan | B0, B8 |
| Deployment | Render Blueprint, env separation, automatic TLS, migration strategy, backup/restore, a hosted demo URL | steps.md, B8 |
| Notifications | Email (SMTP/Mailpit) and an SMS adapter through an outbox | agents.md §8.10, B7 |
| SD-JWT library | Python `sd-jwt` behind a wrapper; `@sd-jwt/*` in the browser | agents.md §13, B6, A6 |

### Lower priority: polish

| Gap | Requirement | Where |
|---|---|---|
| India map | Official Survey of India boundaries only, with a tile-grid fallback | agents.md §12, A5 |
| Language support | English and Hindi throughout the UI and templates | A0 |
| Frontend tests | Empty, error and offline state tests on every page, every phase | A-MASTER |
| Integration milestones | Tagged sync points between teams | steps.md, Sync points |
| Affiliation model | Institutions are affiliated to degree-awarding bodies. The institution issues enrolment credentials; the degree-awarding body issues degree credentials | agents.md §8.6 |

---

## 5. Non-functional requirements

| Area | Requirement |
|---|---|
| Security | argon2id passwords, 15-minute access tokens, rotating refresh tokens with reuse detection, account lockout, rate limits, security headers, secrets only in env vars |
| Privacy | No real student data, synthetic data only. Raw APAAR or PII never appears in logs. PII is masked by default and encrypted at rest. Note: a real deployment needs a legal-basis review under the DPDP Act 2023 |
| Auditability | Every PII read, verification and state change writes to an append-only, hash-chained audit log that can be verified through the API |
| Performance | 50k-row batch validated in under 60 s and under 400 MB of memory (fits Render's free 512 MB). 20k-row batch end-to-end in under 2 min |
| Reliability | Resumable validation jobs. Bad rows never crash a batch. Idempotent uploads |
| Accessibility | WCAG AA, keyboard navigable, priority shown with an icon and text, not colour alone |
| Interoperability | OpenAPI 3.1, W3C VC data model (SD-JWT VC), did:web issuer keys, status lists for revocation |
| Deployability | `docker compose up` locally; a Render Blueprint deploys without code changes |
| Maintainability | Strict folder ownership per team, one CI workflow per team, contract-change PRs, Conventional Commits |

---

## 6. Data sources and research

| Source | Use |
|---|---|
| HF `neuralsorcerer/student-performance` | Value ranges, load-test sample |
| `drsanjayagal/UniversityIntake-MLDataset` | Intake fields, missing-value fixtures |
| `drsanjayagal/SynEdu-HEDL` / Zenodo 10.5281/zenodo.18884938 | Referential integrity and duplicate-enrolment model |
| Schelter et al., Deequ (PVLDB 2018) | Data-quality constraints, metric history, anomaly detection |
| Christen, record-linkage indexing survey (IEEE TKDE 2012) | Blocking strategy for deduplication |
| Vatsalan, Christen, Verykios, PPRL taxonomy (Information Systems 2013) | Privacy-preserving linkage (future work) |
| Berrios Moya et al., ZKP academic record verification (Sensors 2025) | Selective-disclosure motivation |
| Springer s10639-024-12493-6 | Issuance, third-party verification, auditability |
| Rustemi et al., SLR on blockchain certificate verification (IEEE Access 2023) | Literature review and gap justification |

Verification status for each source is in agents.md §13.

---

## 7. Out of scope for the MVP (roadmap)

- Integration with the real APAAR API. We ship a mock registry behind an adapter.
- Zero-knowledge predicate proofs (for example "enrolled AND not FN").
- Merkle anchoring of batch hashes on a public ledger.
- Bloom-filter privacy-preserving linkage across regulatory bodies.
- A native mobile wallet. The browser wallet covers the MVP.
