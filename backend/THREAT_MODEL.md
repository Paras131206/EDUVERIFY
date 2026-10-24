# Threat Model & Security Architecture — EduVerify

**System:** AICTE EduVerify Central Repository & Verifiable Credentials Layer  
**Standard:** STRIDE Threat Categorization, DPDP Act 2023 Compliance, W3C VC / IETF SD-JWT  
**Reference:** `agents.md` §8.2, §8.4, §9, §12; `requirements.md`  

---

## 1. System Overview & Core Architecture

EduVerify acts as the national trust infrastructure for AICTE-approved higher educational institutions across India. It ingests bulk student admissions data keyed by **APAAR ID** (Automated Permanent Academic Account Registry), validates records through a multi-layer deterministic engine, commits clean records to the **Central Repository**, issues **SD-JWT Verifiable Credentials (VCs)**, and maintains an append-only, tamper-evident cryptographic **Audit Log** and **Consent Ledger**.

```
 +-----------------------------------------------------------------------------------+
 |                             TRUST BOUNDARY 1 (Public / Edge)                      |
 |                                                                                   |
 |  [Student Browser]            [Institution Portal]           [Verifier / Employer]|
 |   - WebCrypto Key Storage      - Institution Admin / Staff    - Offline / Online  |
 |   - IndexedDB (extractable:F)  - Bearer JWT / API Key         - Presentation Nonce|
 +--------------------------+--------------------+------------------------+----------+
                            |                    |                        |
                   HTTPS    |             HTTPS  |                 HTTPS  |
                   REST     v                    v                        v
 +-----------------------------------------------------------------------------------+
 |                             TRUST BOUNDARY 2 (API Gateway & Core)                 |
 |                                                                                   |
 |                     FastAPI Backend Service (`app/`)                              |
 |   - Authentication & Argon2id Password Verification                               |
 |   - Strict RBAC Middleware (`require_roles`, `require_self_student`)              |
 |   - SlowAPI IP Rate Limiting & Lockout Mechanisms                                 |
 |   - DPDP Act PII Masking Serializer (APAAR, email, mobile)                        |
 |   - Cryptographic Hash Chainer (AuditLog & ConsentLedger)                         |
 |   - Batch Upload Ingestion & 90-Day Retention Purge Engine                        |
 +------------------------------------------+----------------------------------------+
                                            |
                               SQL / TLS    v
 +-----------------------------------------------------------------------------------+
 |                             TRUST BOUNDARY 3 (Data Store)                         |
 |                                                                                   |
 |                     Relational Database (PostgreSQL 16 / SQLite)                  |
 |   - Fernet AES-128-CBC / HMAC-SHA256 encrypted fields (`email_enc`, `mobile_enc`) |
 |   - Keyed HMAC-SHA256 (`apaar_hash`, `key_hash`)                                  |
 |   - Append-Only Advisory Lock Chaining for Audit & Consent Records                |
 +-----------------------------------------------------------------------------------+
```

---

## 2. Information Assets & Classification

| Asset | Sensitivity | Protection Mechanisms | Impact of Compromise |
|---|---|---|---|
| **Student APAAR ID** | High (National PII) | Salted/keyed HMAC-SHA256 index (`apaar_hash`), dynamic masking `1234****9012` on API serializers for analysts & unauthenticated users. | Identity tracking, unauthorized profiling across systems. |
| **Contact PII (Email, Mobile)** | High (Personal Data) | Fernet symmetric encryption at rest (`email_enc`, `mobile_enc`), dynamic masking (`v***t@domain.com`, `******7890`), access audit logging. | Phishing, unsolicited marketing, harassment. |
| **Issuer Private Keys (Ed25519)** | Critical (Root of Trust) | Loaded via environment (`ISSUER_KEYS_JSON`) or hardware KMS; never exposed via API. Public keys served via `/.well-known/did.json`. | Forged institutional diplomas and enrolment credentials. |
| **Holder Private Keys (ECDSA P-256)** | Critical (Student Identity) | Stored in student user agent IndexedDB (`extractable: false`); never transmitted or stored on server. | Unauthorized presentation of credentials by attackers. |
| **Audit Log Trail** | High (Integrity Proof) | Sequential SHA-256 hash chaining (`sha256(prev_hash + canonical_json)`), advisory transaction locks, daily head logging. | Concealed administrative tampering or fraudulent record alteration. |
| **Consent Ledger** | High (Regulatory DPDP) | Immutable append-only cryptographic chain, signature evidence reference linking. | Falsified consent claims, regulatory penalties under DPDP Act. |
| **Raw Batch Payloads** | Moderate (Bulk Ingestion) | 90-day retention window, automatic purges via `purge_expired_batch_files`. | Prolonged exposure of bulk unverified student spreadsheets. |

---

## 3. Trust Boundaries

1. **TB-1: Client to API Gateway:**
   - External untrusted networks communicating over TLS 1.3 / HTTPS.
   - Authentication via short-lived JWT access tokens (15-min expiry) + HttpOnly SameSite=Lax refresh cookies, or institution-scoped hashed API keys.
2. **TB-2: User Roles & Principal Access (RBAC):**
   - Segregation between `AICTE_ADMIN`, `AICTE_ANALYST`, `INSTITUTION_ADMIN`, `INSTITUTION_STAFF`, `STUDENT`, and `VERIFIER`.
   - `AICTE_ANALYST` is permanently restricted to masked PII.
   - Unmasked student reads are exclusively authorized for the student themselves or their enrolled institution's administrator.
3. **TB-3: Student Browser Key Boundary:**
   - WebCrypto isolation in the browser sandboxes the holder private key.
   - Server only receives the public JWK embedded in `cnf` at credential issuance.
4. **TB-4: Application Service to Database Storage:**
   - Direct database access is restricted to the application database user.
   - PII fields encrypted before ORM persistence.

---

## 4. STRIDE Threat Analysis

| Threat Category | Threat Scenario | Impact | Mitigation in EduVerify |
|---|---|---|---|
| **S - Spoofing** | Attacker impersonates a student or institution admin using stolen session tokens or spoofed headers. | High | Short-lived access tokens (15m), refresh token rotation with automated family reuse revocation, strict password hashing (Argon2id), IP hashing in audit. |
| **S - Spoofing** | Adversary presents a stolen SD-JWT credential without holder authorization. | Critical | Holder Key Binding (KB-JWT): Verifier validates student's cryptographic signature over fresh server nonce (`GET /v1/verify/nonce`) and presentation `sd_hash`. |
| **T - Tampering** | Malicious DB administrator modifies student grades or audit rows directly in the database. | Critical | Hash-chained audit log and consent ledger: `GET /v1/audit/verify-chain` recalculates sequential digests; tampering immediately flags `valid: false` and identifies `first_broken_id`. |
| **T - Tampering** | Verifier alters selectively disclosed claims in an SD-JWT. | High | SD-JWT salted disclosure digests: sha256 digests of all disclosures are sealed under the issuer's Ed25519 signature. |
| **R - Repudiation** | Institution admin denies approving a batch or overriding an invalid record. | High | Mandatory audit logging: `append_audit_log` records actor UUID, role, action code, resource ID, client IP hash, and canonical payload. |
| **R - Repudiation** | Student denies granting or withdrawing sharing consent. | High | Cryptographically chained `consent_ledger` with timestamp, guardian/evidence reference, and immutable previous hash link. |
| **I - Information Disclosure** | Central AICTE analysts or database log sniffers view plaintext APAAR IDs and phone numbers. | High | Masking middleware masks APAAR (`1234****9012`), email, and mobile in all API responses unless explicitly permitted. Every unmasked read logs `PII_UNMASKED_READ` audit entry. |
| **I - Information Disclosure** | Over-retention of unverified raw Excel files containing thousands of student rows. | Moderate | Data retention service `purge_expired_batch_files` purges raw `batch_files` older than 90 days (`BATCH_FILES_RETENTION_DAYS`). |
| **D - Denial of Service** | Credential brute-force attacks on login endpoint. | Moderate | SlowAPI IP rate limits (10/min), account lockout after 5 consecutive failed logins for 15 minutes with uniform non-enumerating error messages. |
| **D - Denial of Service** | Gigabyte-scale CSV uploads to exhaust backend memory and database storage. | Moderate | File upload size limits, streaming chunk processors, advisory transaction locks per institution/year to prevent concurrent race conditions. |
| **E - Elevation of Privilege** | `INSTITUTION_STAFF` attempts to commit batches or approve manual corrections. | High | Strict service-layer guards: `ACCEPT_FIX` and batch commit require `INSTITUTION_ADMIN` role; staff proposals are segregated in pending state. |
| **E - Elevation of Privilege** | Student requests another student's record via `/v1/students/{apaar_id}`. | High | `require_self_student` and router-level checks match `principal.student_apaar_hash` against the record; unauthorized requests yield 403 Forbidden. |

---

## 5. Holder Key Custody Decision (`agents.md` §8.2)

### Architecture Decision: Client-Side WebCrypto Custody
EduVerify adopts a **non-custodial holder architecture**:
1. **Key Generation & Storage:**
   - The student's private key is generated client-side inside the browser using `window.crypto.subtle.generateKey({name: "ECDSA", namedCurve: "P-256"}, false, ["sign"])`.
   - The private key is flagged `extractable: false` and persisted in browser `IndexedDB`.
   - The private key never leaves the student device and is never transmitted to the EduVerify backend.
2. **Key Binding (KB-JWT):**
   - At issuance (`POST /v1/credentials/issue`), the student's browser submits only the public JWK.
   - The issuer embeds this JWK in the credential's `cnf.jwk` claim signed with the issuer's Ed25519 key.
   - When presenting to a verifier (`POST /v1/verify`), the browser creates a Key Binding JWT (KB-JWT) signed with the private key over `{nonce, aud, sd_hash}`.
3. **Trade-Off Analysis & Device Loss Handling:**
   - *Advantage:* Complete cryptographic immunity against server-side credential theft; EduVerify cannot forge presentations on behalf of students.
   - *Operational Trade-off:* If a student clears their browser storage or loses their physical phone/laptop, the private key cannot be recovered.
   - *Recovery Policy:* Recovery is handled via re-issuance rather than key escrow. The student authenticates via institutional Single Sign-On, requests re-issuance, the prior credential is marked **SUPERSEDED** / **REVOKED** on the status list, and a new credential is bound to the new browser key.

---

## 6. Consent & Credential Lifecycle Behaviour (`agents.md` §8.4)

### Purpose-Bound Consent Matrix
EduVerify enforces 3 granular DPDP Act purposes:
1. `REPOSITORY`: Authority to retain identity and enrollment details in the Central AICTE Repository.
2. `VERIFICATION_SHARE`: Authority to issue and cryptographically verify verifiable credentials with third-party verifiers.
3. `ANALYTICS_AGGREGATE`: Authority to incorporate student data into statutory aggregate counts and state-level policy dashboards.

### Lifecycle State Machine & Side Effects

```
 [Student Action]                  [System Lifecycle Effect]
 
 Withdraw VERIFICATION_SHARE  --->  All valid credentials transitioned to SUSPENDED.
                                    Token Status List suspension bit set.
                                    Third-party /v1/verify returns:
                                    "Holder has withdrawn consent" with zero disclosed claims.
 
 Re-grant VERIFICATION_SHARE  --->  Suspension lifted; credentials return to VALID.
 
 Withdraw REPOSITORY          --->  Record archived in student_record_versions.
                                    PII pseudonymised: full_name="[WITHDRAWN]",
                                    email_enc=NULL, mobile_enc=NULL, consent_status="WITHDRAWN".
                                    Statistical aggregations (program, level, year) preserved.
```

---

## 7. DPDP Act 2023 Compliance & Legal Basis Note

### Statutory vs Consent Legal Basis
Under India's **Digital Personal Data Protection (DPDP) Act 2023**:
- **Section 4 & 6 (Notice & Consent):** Consent must be free, specific, informed, unconditional, and unambiguous with clear affirmative action. EduVerify provides itemized consent purposes and clear withdrawal mechanisms.
- **Section 7 (Certain Legitimate Uses):** For state accreditation, seat matrix compliance, and AICTE statutory regulatory oversight, student enrollment counts and compliance records are maintained under legitimate regulatory mandates.
- **Section 9 (Processing of Personal Data of Children):** For minor students (< 18 years), consent must be provided by a lawful parent or guardian. EduVerify's `POST /v1/consent` endpoint supports `guardian_consent=true` and requires an administrative `evidence_ref` (e.g., admission guardian form index).
- **Data Minimization & Storage Limitation (Section 8(7)):** Raw batch upload files stored in `batch_files` are retained only as long as necessary for validation review. The automated retention purge removes raw payloads after 90 days while preserving verified repository records and audit links.

---

## 8. Residual Risks & Future Mitigations

1. **Client-Side Browser Vulnerabilities (XSS):**
   - *Risk:* If a cross-site scripting flaw exists in the frontend single-page application, malicious scripts could invoke WebCrypto sign operations while the session is active.
   - *Mitigation:* Strict Content Security Policy (CSP), subresource integrity (SRI), and no external unvetted JavaScript dependencies.
2. **Pepper Compromise:**
   - *Risk:* If the backend application host environment variable `PEPPER` is exposed, brute-force dictionary attacks against `apaar_hash` indexes become computationally feasible.
   - *Mitigation:* Integration with cloud hardware security modules (HSM) or cloud KMS (AWS KMS / Azure Key Vault) for cryptographic secret management in production deployments.
3. **Database Administrator Direct Access:**
   - *Risk:* A malicious superuser with raw SQL access could bypass the application layer and modify records without triggering Python audit hooks.
   - *Mitigation:* Cryptographic hash chaining ensures that any offline modification breaks the sequential chain verification (`verify-chain`). External SIEM logging should ingest the daily head hash (`log_daily_audit_head_hash`) to anchor the chain against a separate write-once medium.
