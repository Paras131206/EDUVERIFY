# EduVerify Webhooks Integration Guide

EduVerify dispatches real-time HTTPS webhook events to affiliated institutions whenever student enrolment, batch verification, lifecycle transitions, consent revocations, or credential status updates take place.

---

## 1. Webhook Signature Security

All outgoing webhook requests include the `X-EduVerify-Signature` header to prevent tampering, replay attacks, and unauthorized payloads.

### Signature Header Format

```http
X-EduVerify-Signature: t=1730000000,v1=9b3a4f6...c82d
```

- **`t`**: Unix timestamp (seconds) when the payload was signed.
- **`v1`**: Hex-encoded HMAC-SHA256 signature calculated over:
  ```
  signature_base = f"{t}.".encode("utf-8") + raw_request_body_bytes
  ```
- **Signing Key**: The secret key returned once during webhook creation (`whsec_...`).

---

## 2. Signature Verification in Python

Using standard Python 3.10+ (`hmac`, `hashlib`, `time`):

```python
import hashlib
import hmac
import time
from typing import Any


def verify_eduverify_webhook(
    raw_body_bytes: bytes,
    signature_header: str,
    secret: str,
    tolerance_seconds: int = 300,
) -> bool:
    """
    Verifies the HMAC-SHA256 signature of an incoming EduVerify webhook.

    :param raw_body_bytes: Raw unmodified request body bytes.
    :param signature_header: Value of the 'X-EduVerify-Signature' header.
    :param secret: Webhook signing secret (e.g. 'whsec_...').
    :param tolerance_seconds: Replay tolerance window in seconds (default: 5 min).
    :return: True if valid, False otherwise.
    """
    if not signature_header or not secret:
        return False

    elements = {}
    for part in signature_header.split(","):
        if "=" in part:
            k, v = part.split("=", 1)
            elements[k.strip()] = v.strip()

    timestamp_str = elements.get("t")
    received_signature = elements.get("v1")

    if not timestamp_str or not received_signature:
        return False

    try:
        timestamp = int(timestamp_str)
    except ValueError:
        return False

    # Prevent replay attacks
    current_time = int(time.time())
    if abs(current_time - timestamp) > tolerance_seconds:
        return False

    # Compute expected HMAC-SHA256
    to_sign = f"{timestamp}.".encode("utf-8") + raw_body_bytes
    expected_signature = hmac.new(
        secret.encode("utf-8"),
        to_sign,
        hashlib.sha256,
    ).hexdigest()

    # Constant-time comparison to prevent timing attacks
    return hmac.compare_digest(expected_signature, received_signature)


# Example FastAPI Webhook Receiver
# --------------------------------
# from fastapi import FastAPI, Request, HTTPException, status
#
# app = FastAPI()
# WEBHOOK_SECRET = "whsec_your_secret_here"
#
# @app.post("/webhooks/eduverify")
# async def receive_webhook(request: Request):
#     body_bytes = await request.body()
#     sig_header = request.headers.get("X-EduVerify-Signature", "")
#     if not verify_eduverify_webhook(body_bytes, sig_header, WEBHOOK_SECRET):
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")
#
#     event_data = await request.json()
#     print("Received verified event:", event_data["event"])
#     return {"status": "received"}
```

---

## 3. Signature Verification in Node.js

Using Node.js built-in `crypto` module (works with Express, Fastify, Next.js):

```javascript
const crypto = require('crypto');

/**
 * Verifies EduVerify webhook signature.
 * @param {Buffer|string} rawBody - Raw body Buffer or string.
 * @param {string} signatureHeader - Value of 'x-eduverify-signature' header.
 * @param {string} secret - Webhook signing secret ('whsec_...').
 * @param {number} toleranceSeconds - Allowed drift in seconds (default: 300).
 * @returns {boolean} True if signature is valid.
 */
function verifyEduVerifyWebhook(rawBody, signatureHeader, secret, toleranceSeconds = 300) {
  if (!signatureHeader || !secret) {
    return false;
  }

  const elements = {};
  for (const part of signatureHeader.split(',')) {
    const idx = part.indexOf('=');
    if (idx !== -1) {
      const k = part.substring(0, idx).trim();
      const v = part.substring(idx + 1).trim();
      elements[k] = v;
    }
  }

  const timestampStr = elements['t'];
  const receivedSig = elements['v1'];

  if (!timestampStr || !receivedSig) {
    return false;
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return false;
  }

  // Prevent replay attacks
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - timestamp) > toleranceSeconds) {
    return false;
  }

  // Compute expected HMAC-SHA256
  const payloadBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf-8');
  const timestampPrefix = Buffer.from(`${timestamp}.`, 'utf-8');
  const toSign = Buffer.concat([timestampPrefix, payloadBuffer]);

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(toSign);
  const expectedSig = hmac.digest('hex');

  // Constant-time buffer comparison to prevent timing attacks
  const expectedBuf = Buffer.from(expectedSig, 'utf-8');
  const receivedBuf = Buffer.from(receivedSig, 'utf-8');

  if (expectedBuf.length !== receivedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

module.exports = { verifyEduVerifyWebhook };

// Example Express Receiver
// ------------------------
// const express = require('express');
// const app = express();
//
// app.post('/webhooks/eduverify', express.raw({ type: 'application/json' }), (req, res) => {
//   const sigHeader = req.headers['x-eduverify-signature'];
//   const isValid = verifyEduVerifyWebhook(req.body, sigHeader, process.env.WEBHOOK_SECRET);
//
//   if (!isValid) {
//     return res.status(401).json({ error: 'Invalid webhook signature' });
//   }
//
//   const event = JSON.parse(req.body.toString('utf-8'));
//   console.log('Verified event received:', event.event, event.id);
//   res.status(200).json({ received: true });
// });
```

---

## 4. Supported Event Types

| Event Name | Description | Trigger |
| :--- | :--- | :--- |
| `batch.validated` | Batch ingestion and multi-layer validation completed | Batch review ready |
| `batch.committed` | Clean student records committed to Central Repository | Admissions finalized |
| `review.needed` | Anomalies or rule violations routed for human decision | Data quality warning |
| `transfer.requested` | Inter-institutional student migration initiated | Student transfer |
| `consent.changed` | Verification or data sharing consent granted/withdrawn | DPDP compliance |
| `credential.revoked` | Student VC explicitly revoked or suspended | Disciplinary/Degree revocation |
| `credential.superseded` | Credential superseded by student record correction | Record correction |
| `ping` | Verification health ping sent by institution admin | `POST /v1/webhooks/{id}/test` |
