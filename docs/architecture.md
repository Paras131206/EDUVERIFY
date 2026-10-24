# EduVerify System Architecture & Technical Specifications

> **System Version:** `1.0.0` | **Date:** 2026-10-24  
> **Target:** AICTE Approval & Enrollment Data Quality Verification Platform  
> **Security Baseline:** DPDP Act 2023 · ISO/IEC 27001 · W3C Verifiable Credentials · IETF RFC 9635 SD-JWT

---

## 1. Architectural Philosophy & Design Principles

EduVerify is architected to address national higher education data verification at population scale. It adheres to four fundamental design principles:

1. **Privacy-by-Design & Data Minimization:** Personal Identifiable Information (PII) like APAAR ID, email, and mobile are cryptographically masked (`1234****9012`) across all API responses, logs, and public dashboards. Unmasked data is accessible exclusively to authorized institutional registrars and students inspecting their own records.
2. **Statutory & Regulatory Alignment:** Every validation rule is mapped directly to AICTE Approval Process Handbook (APH) regulations, National Education Policy (NEP 2020) APAAR guidelines, and the Digital Personal Data Protection (DPDP) Act 2023.
3. **Deterministic Governance with Explainable Human-in-the-Loop:** Automated checks provide exact rule IDs (`V001–V035`), regulatory rationales, and deterministic suggested fixes. Suspicious cases are routed to human review queues based on confidence thresholds rather than arbitrary automated rejections.
4. **Zero-Gas Cost Cryptographic Trust:** Instead of costly public blockchain networks, EduVerify utilizes **Ed25519 digital signatures, IETF RFC 9635 SD-JWTs with client-side WebCrypto key binding, and an immutable SHA-256 hash-chained audit ledger**—achieving sub-second verification latency, zero per-transaction fees, and a cloud memory footprint below 350 MB RSS.

---

## 2. End-to-End Data Processing Pipeline

The following Mermaid diagram illustrates the lifecycle of educational enrollment data from institutional file ingestion through 35-rule validation, anomaly detection, human review, central repository commitment, and verifiable credential issuance:

```mermaid
flowchart TD
    subgraph INGESTION["1. Institutional Ingestion Layer"]
        A1[College Registrar / Staff] -->|Uploads CSV / XLSX| A2[POST /v1/batches]
        A2 --> A3[RapidFuzz Smart Column Mapping]
        A3 -->|Synonym Dict & Pattern Match| A4[Normalized Student Batch JSON]
    end

    subgraph ENGINE["2. EduVerify Rule Engine (Pure Python)"]
        A4 --> B1[Syntactic & Format Rules V001-V006]
        B1 --> B2[Referential & APAAR Registry Validation V007-V011]
        B2 --> B3[Intake Ceiling & Quota Rules V012-V015]
        B3 --> B4[Academic & Eligibility Consistency V016-V027]
        B4 --> B5[Schema Drift & Anomaly Engine V028-V035]
        B5 -->|Multi-Pass Blocking & Jaro-Winkler| B6[Fellegi-Sunter Deduplication]
    end

    subgraph ROUTING["3. 3-Tier Human-in-the-Loop Review"]
        B6 --> C1{Confidence Threshold}
        C1 -->|Score >= 0.95| C2[AUTO_FLAG: Immediate Fix Proposal]
        C1 -->|0.80 <= Score < 0.95| C3[HUMAN_REVIEW: Registrar Review Queue]
        C1 -->|Formatting| C4[INFO: Bulk Clean]
        C2 & C3 & C4 --> C5[Registrar Approval / Correction Ledger]
        C5 -->|Re-validate| C6{Zero CRITICAL Issues?}
    end

    subgraph REPOSITORY["4. AICTE Central Repository & Audit Chain"]
        C6 -->|Yes: Commit Batch| D1[POST /v1/batches/commit]
        D1 --> D2[(AICTE Central Student Database)]
        D1 --> D3[SHA-256 Merkle Audit Log Append]
        D1 --> D4[Real-Time SSE Live Ticker Event]
        D4 --> D5[AICTE National Monitoring Dashboard]
    end

    subgraph TRUST["5. Credential Issuance & Verification"]
        D2 --> E1[Issue SD-JWT Credential Ed25519 Signed]
        E1 --> E2[Student Browser Wallet /student]
        E2 -->|WebCrypto ECDSA P-256 Key Binding| E3[Selective Disclosure Builder]
        E3 -->|Only Chosen Claims + QR| E4[Verifier Portal /verify]
        E4 -->|Check Issuer Key + Status List| E5{Verification Verdict}
        E5 -->|Valid| E6[Big Green VALID Card]
        E5 -->|Tampered| E7[Big Red INVALID Card]
        E5 -->|New Record| E8[Big Amber SUPERSEDED Card]
        E5 -->|Consent Revoked| E9[Big Grey SUSPENDED Card]
    end
```

---

## 3. Cloud Deployment Topology & Infrastructure Architecture

The deployment architecture utilizes a lightweight, horizontally scalable micro-monolith topology designed to operate reliably within strict memory and compute ceilings:

```mermaid
flowchart TB
    subgraph CLIENTS["Client Access Tier"]
        C1[Desktop Browser / Laptop]
        C2[Tablet / Mobile Browser]
        C3[Institution ERP System via API]
    end

    subgraph EDGE["Edge & Gateway Tier"]
        GW[Cloud Reverse Proxy / Caddy / Nginx SSL]
        CDN[Static Asset CDN Vite SPA Bundle]
    end

    subgraph APP["Application & Engine Services (FastAPI Container)"]
        API[FastAPI REST API Server :8000]
        ROUTER[Role-Based Router: AICTE / Inst / Student / Verifier]
        ENGINE_SVC[EduVerify Core Validation Engine]
        AUTH_SVC[OAuth2 JWT / API Key & Webhook Dispatcher]
        VC_SVC[RFC 9635 SD-JWT VC Issuer & Verifier]
        REPORT_SVC[WeasyPrint PDF & OpenPyXL Excel Generator]
    end

    subgraph DATA["Persistence & State Tier"]
        PG[(PostgreSQL 16 Relational Store)]
        REDIS[(Redis Key-Value & Nonce Store)]
        AUDIT_CHAIN[(Immutable Hash-Chained Audit Ledger)]
        REVOCATION_LIST[(AICTE Status Bitstring Revocation List)]
    end

    subgraph EXT["External Mock Services"]
        MOCK_APAAR[Mock APAAR National Registry]
        SMTP[Mailpit / SMTP Notification Gateway :8025]
    end

    C1 & C2 -->|HTTPS :443| GW
    C1 & C2 -->|Static Assets| CDN
    C3 -->|API Key / Webhook| GW

    GW -->|Forward API Traffic| API
    API --> ROUTER
    ROUTER --> AUTH_SVC
    ROUTER --> ENGINE_SVC
    ROUTER --> VC_SVC
    ROUTER --> REPORT_SVC

    ENGINE_SVC <--> PG
    AUTH_SVC <--> REDIS
    VC_SVC <--> REVOCATION_LIST
    API --> AUDIT_CHAIN
    ENGINE_SVC <--> MOCK_APAAR
    API --> SMTP
```

---

## 4. Architectural Component Breakdown

### 4.1. Ingestion & Pre-Processing Tier
- **Smart Column Mapping (`column_synonyms.yaml` + RapidFuzz):** Uses token sort and Levenshtein ratio comparisons against standard AICTE canonical field names. Institutions can save mapping profiles to remember custom college ERP headers (`PRN → institution_student_id`, `DOB → dob`).
- **Stream Ingestion & Parsing:** Pure-Python chunked readers support `.csv`, `.xlsx`, and `.parquet` inputs with immediate schema typing and date format normalization.

### 4.2. EduVerify Pure Python Validation Engine
- **35 Deterministic Rules (`V001–V035`):**
  - *Syntactic & Identity (`V001–V006`):* Verhoeff check on APAAR, ISO-8601 DOB validity, gender enumerated sets.
  - *Referential Integrity (`V007–V011`):* Cross-table foreign key constraints, active national APAAR duplicates.
  - *Intake & Quota (`V012–V015`):* Program approved intake ceilings, supernumerary caps (TFW $\le 5\%$, PMSSS, JK, NE), NRI/OCI/FN legal quotas.
  - *Academic Sanity (`V016–V027`):* Year of study vs course duration, graduation year consistency, excel date mangling recovery (`V023`).
  - *Schema Drift & Distribution (`V028–V035`):* Unseen categorical levels, column deletions, and statistical z-score shifts.
- **Deduplication Engine:** Multi-pass deterministic blocking followed by phonetic Metaphone clustering and weighted demographic Jaro-Winkler comparison.

### 4.3. Cryptographic Trust & Verifiable Credentials
- **RFC 9635 SD-JWT Core:** Educational verifiable credentials issued with Ed25519 digital signatures. Selective disclosure hashes (`_sd`) conceal undisclosed claims while proving the authenticity of selected fields.
- **WebCrypto Holder Key Custody:** Student browser generates an `ECDSA P-256` key pair with `extractable: false` stored in IndexedDB. Key Binding JWT (`KB-JWT`) signed by this device key prevents token replay attacks.
- **Bitstring Status List:** Real-time bit-indexed revocation list tracking credential validity (`ACTIVE`, `SUSPENDED`, `SUPERSEDED`, `REVOKED`) without leaking student identity.

### 4.4. Security, RBAC & Audit Chain
- **Role-Based Access Control (RBAC):** 7 distinct actors with strict route protection:
  - `AICTE_ADMIN`, `AICTE_ANALYST`, `INSTITUTION_ADMIN`, `INSTITUTION_STAFF`, `DAB_ADMIN`, `STUDENT`, `VERIFIER`.
- **SHA-256 Hash-Chained Audit Ledger:** Every critical event (batch commit, fix approval, status transition, consent withdrawal) appends a cryptographically chained block (`prev_hash + payload_hash → current_hash`). The UI includes an **"Audit Chain Intact ✓"** indicator verified live via `GET /v1/audit/verify-chain`.

---

## 5. Security & Privacy Guarantees

1. **Zero Raw PII Transmission:** Verifiers never receive unselected student attributes. Database columns storing student identifiers utilize SHA-256 masked hashes for indexing.
2. **DPDP Act 2023 Statutory Compliance:** Purpose-bound consent switches (`REPOSITORY`, `VERIFICATION_SHARE`, `ANALYTICS_AGGREGATE`) allow instant revocation, triggering immediate credential suspension.
3. **No Private Key Extraction:** WebCrypto hardware-isolated browser keys cannot be exfiltrated via client-side scripts, protecting student credentials even in hostile browser environments.
