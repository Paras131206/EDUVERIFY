# OWASP ZAP Baseline Security Scanning

This directory contains the OWASP ZAP (Zed Attack Proxy) baseline scan configuration, rule exclusions, and automated scan scripts for the EduVerify API service.

## Configuration & Reviewed Ignore List

The baseline scan inspects the API against the OWASP Top 10 web application vulnerabilities and common misconfigurations. Pure REST APIs require specific rule tuning:

| Rule ID | Name | Action | Security Justification |
| :--- | :--- | :--- | :--- |
| **10020** | `X-Frame-Options Header Not Set` | `IGNORE` | The EduVerify backend provides headless REST endpoints returning `application/json`. The `SecurityHeadersMiddleware` sets `DENY` globally, but ZAP triggers false positives on non-HTML responses. |
| **10038** | `Content Security Policy Not Set` | `IGNORE` | JSON/CBOR payload endpoints do not render scripts or DOM elements. CSP is enforced strictly on the frontend static hosting layer (`eduverify-web`). |
| **10055** | `CSP: script-src unsafe-inline` | `IGNORE` | No executable JavaScript is returned by the API; verified safe. |
| **10096** | `Timestamp Disclosure - Unix` | `IGNORE` | Cryptographic presentation nonces, JWT token expiry (`exp`, `iat`), and status lists require standardized UNIX epoch timestamps. |
| **10098** | `Cross-Domain Misconfiguration` | `IGNORE` | CORS headers (`Access-Control-Allow-Origin`) are dynamically evaluated against authenticated whitelists (`CORS_ORIGINS`). |
| **10109** | `Modern Web Application` | `IGNORE` | Informational alert recognizing AJAX/RESTful architectural pattern. |

## Running the Scan

### Prerequisites
- Docker installed and running
- EduVerify API running locally (`http://localhost:8000`) or deployed on Render

### Usage
```bash
# Scan local development server
./infra/zap/run-zap.sh http://localhost:8000

# Scan deployed staging/production environment
./infra/zap/run-zap.sh https://eduverify-api.onrender.com
```

The script produces `zap-report.html` and `zap-report.json` with vulnerability findings and remediation guidance.
