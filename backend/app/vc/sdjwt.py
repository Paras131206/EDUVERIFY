"""
IETF / W3C SD-JWT VC implementation for EduVerify.
Complies with agents.md §8.2, §8.3, §8.4 and prompt B6:
- Salted disclosures: [salt, claim_name, claim_value] base64url encoded
- SHA-256 _sd digests
- Tilde-separated compact representation (<issuer_jwt>~<d1>~...~<dN>~<kb_jwt>)
- KB-JWT with sd_hash and nonce
- Ed25519 issuer signing and verification
- Token Status List gzip+base64url bitstring management
"""

import base64
import gzip
import hashlib
import json
import logging
import secrets
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from typing import Any, cast

import jwt
from app.config import get_settings
from app.models.core import IssuerKey
from app.security.crypto import decrypt_field, encrypt_field
from cryptography.hazmat.primitives.asymmetric import ec, ed25519
from jwt.algorithms import ECAlgorithm, OKPAlgorithm
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)
settings = get_settings()


# ============================================================================
# 1. BASE64URL & DIGEST UTILITIES
# ============================================================================


def base64url_encode(data: bytes) -> str:
    """Encode bytes to base64url without padding."""
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def base64url_decode(data: str) -> bytes:
    """Decode base64url string with optional missing padding."""
    rem = len(data) % 4
    if rem > 0:
        data += "=" * (4 - rem)
    return base64.urlsafe_b64decode(data.encode("ascii"))


def sha256_digest_b64(data: bytes | str) -> str:
    """Compute base64url-encoded SHA-256 digest."""
    if isinstance(data, str):
        data = data.encode("ascii")
    return base64url_encode(hashlib.sha256(data).digest())


# ============================================================================
# 2. ISSUER KEY MANAGEMENT & DID:WEB
# ============================================================================


def build_issuer_did(issuer_id: str, host: str | None = None) -> str:
    """Construct did:web identifier for root AICTE or an institution / DAB."""
    base_host = host or settings.PUBLIC_BASE_URL.replace("https://", "").replace("http://", "")
    # In did:web spec, colons in hostname (e.g. localhost:8000) are URL encoded as %3A
    encoded_host = base_host.replace(":", "%3A")

    if issuer_id.upper() in ("AICTE", "ROOT"):
        return f"did:web:{encoded_host}"
    return f"did:web:{encoded_host}:issuers:{issuer_id}"


def get_or_create_issuer_key(
    db: Session,
    issuer_id: str,
    host: str | None = None,
) -> tuple[ed25519.Ed25519PrivateKey, str, dict[str, Any]]:
    """
    Retrieve or lazily generate an Ed25519 key pair for an issuer.
    Keys are encrypted at rest with FERNET_KEY.
    Returns: (private_key_obj, issuer_did, public_jwk_dict).
    """
    # 1. Check if configured in ISSUER_KEYS_JSON
    if settings.ISSUER_KEYS_JSON:
        try:
            keys_dict = json.loads(settings.ISSUER_KEYS_JSON)
            if issuer_id in keys_dict:
                priv_raw = base64.b64decode(keys_dict[issuer_id])
                priv_key = ed25519.Ed25519PrivateKey.from_private_bytes(priv_raw)
                pub_raw = priv_key.public_key().public_bytes_raw()
                did = build_issuer_did(issuer_id, host)
                jwk = {
                    "kty": "OKP",
                    "crv": "Ed25519",
                    "x": base64url_encode(pub_raw),
                    "kid": f"{did}#key-1",
                }
                return priv_key, did, jwk
        except Exception as exc:
            logger.warning("Error parsing ISSUER_KEYS_JSON for issuer %s: %s", issuer_id, exc)

    # 2. Check database
    record = db.query(IssuerKey).filter(IssuerKey.issuer_id == issuer_id).first()
    if record:
        decrypted_priv_b64 = decrypt_field(record.encrypted_private_key)
        assert decrypted_priv_b64 is not None
        priv_raw = base64.b64decode(decrypted_priv_b64)
        priv_key = ed25519.Ed25519PrivateKey.from_private_bytes(priv_raw)
        return priv_key, record.did, record.public_key_jwk_json

    # 3. Dev / On-demand: generate new Ed25519 key pair
    priv_key = ed25519.Ed25519PrivateKey.generate()
    priv_raw = priv_key.private_bytes_raw()
    pub_raw = priv_key.public_key().public_bytes_raw()
    did = build_issuer_did(issuer_id, host)
    jwk = {
        "kty": "OKP",
        "crv": "Ed25519",
        "x": base64url_encode(pub_raw),
        "kid": f"{did}#key-1",
    }

    encrypted_priv = encrypt_field(base64.b64encode(priv_raw).decode("ascii"))
    assert encrypted_priv is not None
    new_record = IssuerKey(
        issuer_id=issuer_id,
        did=did,
        key_id="key-1",
        encrypted_private_key=encrypted_priv,
        public_key_jwk_json=jwk,
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return priv_key, did, jwk


def build_did_document(
    issuer_id: str, jwk: dict[str, Any], host: str | None = None
) -> dict[str, Any]:
    """Generate W3C did:web DID document."""
    did = build_issuer_did(issuer_id, host)
    key_id = f"{did}#key-1"
    jwk_with_kid = {**jwk, "kid": key_id}

    return {
        "@context": [
            "https://www.w3.org/ns/did/v1",
            "https://w3id.org/security/suites/ed25519-2020/v1",
        ],
        "id": did,
        "verificationMethod": [
            {
                "id": key_id,
                "type": "JsonWebKey2020",
                "controller": did,
                "publicKeyJwk": jwk_with_kid,
            }
        ],
        "authentication": [key_id],
        "assertionMethod": [key_id],
    }


# ============================================================================
# 3. TOKEN STATUS LIST BITSTRING MANAGEMENT
# ============================================================================


def create_empty_status_list_bits(length: int = 131072) -> str:
    """Create a gzip-compressed, base64url-encoded zeroed bitstring."""
    byte_count = (length + 7) // 8
    raw_bytes = bytes(byte_count)
    compressed = gzip.compress(raw_bytes, compresslevel=9)
    return base64url_encode(compressed)


def get_status_list_bit(bitstring_b64: str, index: int, bits: int = 2) -> int:
    """
    Extract the status value at index from compressed bitstring.
    0 = VALID, 1 = REVOKED, 2 = SUPERSEDED, 3 = SUSPENDED.
    """
    compressed = base64url_decode(bitstring_b64)
    raw = gzip.decompress(compressed)
    bit_pos = index * bits
    byte_idx = bit_pos // 8
    bit_offset = bit_pos % 8

    if byte_idx >= len(raw):
        return 0

    mask = (1 << bits) - 1
    return (raw[byte_idx] >> bit_offset) & mask


def set_status_list_bit(bitstring_b64: str, index: int, value: int, bits: int = 2) -> str:
    """
    Update status value at index in compressed bitstring and recompress.
    """
    compressed = base64url_decode(bitstring_b64)
    raw = bytearray(gzip.decompress(compressed))
    bit_pos = index * bits
    byte_idx = bit_pos // 8
    bit_offset = bit_pos % 8

    if byte_idx >= len(raw):
        raw.extend(b"\x00" * (byte_idx - len(raw) + 1))

    mask = ((1 << bits) - 1) << bit_offset
    raw[byte_idx] = (raw[byte_idx] & ~mask) | ((value << bit_offset) & mask)

    new_compressed = gzip.compress(bytes(raw), compresslevel=9)
    return base64url_encode(new_compressed)


# ============================================================================
# 4. SD-JWT VC ISSUANCE & DISCLOSURES
# ============================================================================


def create_sd_jwt_credential(
    issuer_key: ed25519.Ed25519PrivateKey,
    issuer_did: str,
    key_id: str,
    vct: str,
    holder_jwk: dict[str, Any],
    always_disclosed: dict[str, Any],
    selectively_disclosable: dict[str, Any],
    status_list_ref: dict[str, Any] | None = None,
    exp_seconds: int = 315360000,  # ~10 years default
) -> str:
    """
    Constructs and signs an SD-JWT Verifiable Credential per IETF SD-JWT spec.
    Returns: '<issuer_jwt>~<disclosure_1>~...~<disclosure_N>~'
    """
    now = datetime.now(UTC)
    iat = int(now.timestamp())
    exp = int((now + timedelta(seconds=exp_seconds)).timestamp())

    disclosures: list[str] = []
    _sd_digests: list[str] = []

    for claim_name, claim_val in sorted(selectively_disclosable.items()):
        if claim_val is None:
            continue
        salt = secrets.token_urlsafe(16)
        disc_obj = [salt, claim_name, claim_val]
        disc_json = json.dumps(disc_obj, separators=(",", ":"))
        disc_b64 = base64url_encode(disc_json.encode("utf-8"))
        digest = sha256_digest_b64(disc_b64)

        disclosures.append(disc_b64)
        _sd_digests.append(digest)

    _sd_digests.sort()

    payload: dict[str, Any] = {
        "iss": issuer_did,
        "iat": iat,
        "exp": exp,
        "vct": vct,
        "cnf": {"jwk": holder_jwk},
        "_sd": _sd_digests,
        "_sd_alg": "sha-256",
        **always_disclosed,
    }

    if status_list_ref:
        payload["status"] = status_list_ref

    headers = {
        "typ": "vc+sd-jwt",
        "alg": "EdDSA",
        "kid": key_id,
    }

    issuer_jwt = jwt.encode(payload, issuer_key, algorithm="EdDSA", headers=headers)
    # Tilde-separated representation ending with '~' indicating no KB-JWT attached yet
    return f"{issuer_jwt}~{'~'.join(disclosures)}~"


# ============================================================================
# 5. HOLDER PRESENTATION & KEY BINDING BUILDER
# ============================================================================


def build_holder_presentation(
    sd_jwt_compact: str,
    claims_to_disclose: list[str] | set[str] | None = None,
    holder_private_key: ec.EllipticCurvePrivateKey | None = None,
    nonce: str | None = None,
    aud: str | None = None,
) -> str:
    """
    Constructs an SD-JWT presentation disclosing only requested claims and
    signing a Key Binding JWT (KB-JWT) over the presentation hash.
    """
    parts = sd_jwt_compact.split("~")
    issuer_jwt = parts[0]
    raw_disclosures = [p for p in parts[1:] if p]

    selected_disclosures: list[str] = []
    claims_filter = set(claims_to_disclose) if claims_to_disclose is not None else None

    for disc_b64 in raw_disclosures:
        try:
            disc_json = base64url_decode(disc_b64).decode("utf-8")
            disc_obj = json.loads(disc_json)
            # disc_obj is [salt, claim_name, claim_value]
            if isinstance(disc_obj, list) and len(disc_obj) >= 3:
                claim_name = disc_obj[1]
                if claims_filter is None or claim_name in claims_filter:
                    selected_disclosures.append(disc_b64)
        except (ValueError, json.JSONDecodeError, UnicodeDecodeError):
            pass

    presentation_without_kb = f"{issuer_jwt}~{'~'.join(selected_disclosures)}"

    if holder_private_key is not None and nonce:
        sd_hash = sha256_digest_b64(presentation_without_kb.encode("ascii"))
        kb_payload: dict[str, Any] = {
            "nonce": nonce,
            "iat": int(datetime.now(UTC).timestamp()),
            "sd_hash": sd_hash,
        }
        if aud:
            kb_payload["aud"] = aud

        kb_headers = {
            "typ": "kb+jwt",
            "alg": "ES256",
        }
        kb_jwt = jwt.encode(kb_payload, holder_private_key, algorithm="ES256", headers=kb_headers)
        return f"{presentation_without_kb}~{kb_jwt}"

    return f"{presentation_without_kb}~"


# ============================================================================
# 6. PRESENTATION VERIFICATION
# ============================================================================


def verify_sd_jwt_presentation(
    presentation: str,
    expected_nonce: str | None = None,
    expected_aud: str | None = None,
    trust_list_dids: set[str] | None = None,
    get_issuer_public_jwk_fn: Callable[[str], dict[str, Any] | None] | None = None,
    check_status_list_fn: Callable[[str, int], int] | None = None,
) -> dict[str, Any]:
    """
    Verifies an SD-JWT presentation per prompt B6:
    1. Issuer signature (Ed25519)
    2. Issuer in trust list
    3. Not expired (exp claim)
    4. Status bits in status list (not revoked, not superseded, not suspended)
    5. KB-JWT signature vs cnf.jwk
    6. Nonce / aud validation
    7. sd_hash verification
    Returns detailed dict matching VerificationResultResponse.
    """
    now_ts = int(datetime.now(UTC).timestamp())
    now_iso = datetime.now(UTC).isoformat()
    reasons: list[str] = []

    parts = presentation.split("~")
    if not parts or not parts[0]:
        return {
            "result": "INVALID",
            "status": "INVALID_SIGNATURE",
            "valid": False,
            "reasons": ["Empty presentation string"],
            "error_message": "Empty presentation string",
            "verified_at": now_iso,
        }

    issuer_jwt = parts[0]
    kb_jwt = parts[-1] if len(parts) > 1 and parts[-1] else None
    disclosures = [p for p in parts[1:-1] if p] if kb_jwt else [p for p in parts[1:] if p]

    # Decode issuer JWT unverified first to read claims and header
    try:
        _ = jwt.get_unverified_header(issuer_jwt)
        unverified_payload = jwt.decode(issuer_jwt, options={"verify_signature": False})
    except Exception as exc:
        return {
            "result": "INVALID",
            "status": "INVALID_SIGNATURE",
            "valid": False,
            "reasons": [f"Malformed issuer JWT: {exc}"],
            "error_message": f"Malformed issuer JWT: {exc}",
            "verified_at": now_iso,
        }

    issuer_did = unverified_payload.get("iss")
    if not issuer_did:
        return {
            "result": "INVALID",
            "status": "INVALID_SIGNATURE",
            "valid": False,
            "reasons": ["Missing iss claim in issuer JWT"],
            "error_message": "Missing iss claim in issuer JWT",
            "verified_at": now_iso,
        }

    # 1. Trust list verification
    issuer_trusted = True
    if trust_list_dids is not None:
        if issuer_did not in trust_list_dids:
            reasons.append(f"Issuer {issuer_did} is not in AICTE trust list")
            issuer_trusted = False

    # 2. Issuer public key resolution & signature verification
    issuer_jwk: dict[str, Any] | None = None
    if get_issuer_public_jwk_fn:
        issuer_jwk = get_issuer_public_jwk_fn(issuer_did)

    if not issuer_jwk:
        reasons.append(f"Could not resolve public key for issuer {issuer_did}")
        return {
            "result": "INVALID",
            "status": "INVALID_SIGNATURE",
            "valid": False,
            "issuer": issuer_did,
            "issuer_trusted": issuer_trusted,
            "reasons": reasons,
            "error_message": f"Could not resolve public key for issuer {issuer_did}",
            "verified_at": now_iso,
        }

    try:
        issuer_pub_key = OKPAlgorithm.from_jwk(issuer_jwk)
        verified_payload = jwt.decode(
            issuer_jwt,
            cast(Any, issuer_pub_key),
            algorithms=["EdDSA"],
            options={"verify_exp": False},  # We check exp manually for clean error reporting
        )
    except Exception as exc:
        reasons.append(f"Issuer signature verification failed: {exc}")
        return {
            "result": "INVALID",
            "status": "INVALID_SIGNATURE",
            "valid": False,
            "issuer": issuer_did,
            "issuer_trusted": issuer_trusted,
            "reasons": reasons,
            "error_message": f"Issuer signature verification failed: {exc}",
            "verified_at": now_iso,
        }

    # 3. Check expiration
    exp = verified_payload.get("exp")
    if exp and exp < now_ts:
        reasons.append("Credential has expired")
        return {
            "result": "INVALID",
            "status": "EXPIRED",
            "valid": False,
            "issuer": issuer_did,
            "issuer_trusted": issuer_trusted,
            "issued_at": datetime.fromtimestamp(
                verified_payload.get("iat", now_ts), UTC
            ).isoformat(),
            "reasons": reasons,
            "error_message": "Credential has expired",
            "verified_at": now_iso,
        }

    # 4. Check selectively disclosed claims
    valid_sd_digests = set(verified_payload.get("_sd", []))
    disclosed_claims: dict[str, Any] = {}

    for disc_b64 in disclosures:
        calc_digest = sha256_digest_b64(disc_b64)
        if calc_digest not in valid_sd_digests:
            reasons.append(f"Tampered disclosure detected (digest {calc_digest} not in _sd)")
            return {
                "result": "INVALID",
                "status": "INVALID_SIGNATURE",
                "valid": False,
                "issuer": issuer_did,
                "issuer_trusted": issuer_trusted,
                "reasons": reasons,
                "error_message": "Tampered disclosure: digest not found in credential _sd claim",
                "verified_at": now_iso,
            }
        try:
            disc_obj = json.loads(base64url_decode(disc_b64).decode("utf-8"))
            if isinstance(disc_obj, list) and len(disc_obj) >= 3:
                disclosed_claims[disc_obj[1]] = disc_obj[2]
        except Exception as exc:
            reasons.append(f"Failed to parse disclosure: {exc}")
            return {
                "result": "INVALID",
                "status": "INVALID_SIGNATURE",
                "valid": False,
                "issuer": issuer_did,
                "issuer_trusted": issuer_trusted,
                "reasons": reasons,
                "error_message": f"Failed to parse disclosure: {exc}",
                "verified_at": now_iso,
            }

    # Include always-disclosed non-internal claims
    for k, v in verified_payload.items():
        if k not in ("_sd", "_sd_alg", "cnf", "status", "iss", "iat", "exp"):
            disclosed_claims[k] = v

    # 5. Check status list (Token Status List)
    status_ref = verified_payload.get("status")
    if status_ref and isinstance(status_ref, dict) and check_status_list_fn:
        status_list_info = status_ref.get("status_list", status_ref)
        uri = status_list_info.get("uri", "")
        idx = status_list_info.get("idx")
        if uri and idx is not None:
            bit_val = check_status_list_fn(uri, int(idx))
            if bit_val == 1:
                reasons.append("Credential has been revoked in status list")
                return {
                    "result": "REVOKED",
                    "status": "REVOKED",
                    "valid": False,
                    "issuer": issuer_did,
                    "issuer_trusted": issuer_trusted,
                    "issued_at": datetime.fromtimestamp(
                        verified_payload.get("iat", now_ts), UTC
                    ).isoformat(),
                    "disclosed_claims": disclosed_claims,
                    "reasons": reasons,
                    "error_message": "Credential revoked",
                    "verified_at": now_iso,
                }
            if bit_val == 2:
                reasons.append("Credential has been superseded by a record correction")
                return {
                    "result": "SUPERSEDED",
                    "status": "SUPERSEDED",
                    "valid": False,
                    "issuer": issuer_did,
                    "issuer_trusted": issuer_trusted,
                    "issued_at": datetime.fromtimestamp(
                        verified_payload.get("iat", now_ts), UTC
                    ).isoformat(),
                    "disclosed_claims": disclosed_claims,
                    "reasons": reasons,
                    "error_message": "Credential superseded",
                    "verified_at": now_iso,
                }
            if bit_val == 3:
                reasons.append("Credential is suspended due to student consent withdrawal")
                return {
                    "result": "SUSPENDED",
                    "status": "SUSPENDED",
                    "valid": False,
                    "issuer": issuer_did,
                    "issuer_trusted": issuer_trusted,
                    "issued_at": datetime.fromtimestamp(
                        verified_payload.get("iat", now_ts), UTC
                    ).isoformat(),
                    "disclosed_claims": disclosed_claims,
                    "reasons": reasons,
                    "error_message": "Credential suspended",
                    "verified_at": now_iso,
                }

    # 6. Key binding (KB-JWT) verification
    holder_cnf = verified_payload.get("cnf", {})
    holder_jwk = holder_cnf.get("jwk") if isinstance(holder_cnf, dict) else None

    if holder_jwk:
        if not kb_jwt:
            reasons.append("Credential requires holder key binding, but no KB-JWT was provided")
            return {
                "result": "INVALID",
                "status": "KEY_BINDING_FAILED",
                "valid": False,
                "issuer": issuer_did,
                "issuer_trusted": issuer_trusted,
                "reasons": reasons,
                "error_message": "Missing required KB-JWT key binding",
                "verified_at": now_iso,
            }

        try:
            holder_pub_key = ECAlgorithm.from_jwk(holder_jwk)
            kb_payload = jwt.decode(
                kb_jwt,
                cast(Any, holder_pub_key),
                algorithms=["ES256"],
                options={"verify_exp": False, "verify_aud": False},
            )
        except Exception as exc:
            reasons.append(f"KB-JWT signature verification failed: {exc}")
            return {
                "result": "INVALID",
                "status": "KEY_BINDING_FAILED",
                "valid": False,
                "issuer": issuer_did,
                "issuer_trusted": issuer_trusted,
                "reasons": reasons,
                "error_message": f"KB-JWT signature invalid: {exc}",
                "verified_at": now_iso,
            }

        # Verify sd_hash
        expected_presentation_prefix = f"{issuer_jwt}~{'~'.join(disclosures)}"
        expected_sd_hash = sha256_digest_b64(expected_presentation_prefix.encode("ascii"))
        actual_sd_hash = kb_payload.get("sd_hash")
        if actual_sd_hash != expected_sd_hash:
            reasons.append("KB-JWT sd_hash mismatch with presentation disclosures")
            return {
                "result": "INVALID",
                "status": "KEY_BINDING_FAILED",
                "valid": False,
                "issuer": issuer_did,
                "issuer_trusted": issuer_trusted,
                "reasons": reasons,
                "error_message": "KB-JWT sd_hash does not match presentation disclosures",
                "verified_at": now_iso,
            }

        # Verify nonce
        actual_nonce = kb_payload.get("nonce")
        if expected_nonce and actual_nonce != expected_nonce:
            reasons.append(f"Nonce mismatch: expected {expected_nonce}, got {actual_nonce}")
            return {
                "result": "INVALID",
                "status": "KEY_BINDING_FAILED",
                "valid": False,
                "issuer": issuer_did,
                "issuer_trusted": issuer_trusted,
                "reasons": reasons,
                "error_message": "Nonce mismatch or expired challenge",
                "verified_at": now_iso,
            }

        # Verify audience if requested
        actual_aud = kb_payload.get("aud")
        if expected_aud and actual_aud != expected_aud:
            reasons.append(f"Audience mismatch: expected {expected_aud}, got {actual_aud}")
            return {
                "result": "INVALID",
                "status": "KEY_BINDING_FAILED",
                "valid": False,
                "issuer": issuer_did,
                "issuer_trusted": issuer_trusted,
                "reasons": reasons,
                "error_message": "Audience mismatch",
                "verified_at": now_iso,
            }

    if not issuer_trusted:
        return {
            "result": "INVALID",
            "status": "INVALID_SIGNATURE",
            "valid": False,
            "issuer": issuer_did,
            "issuer_trusted": False,
            "reasons": reasons,
            "error_message": "Issuer not in AICTE trust list",
            "verified_at": now_iso,
        }

    # All checks passed!
    return {
        "result": "VALID",
        "status": "VALID",
        "valid": True,
        "issuer": issuer_did,
        "issuer_name": verified_payload.get("institution_name", issuer_did),
        "issuer_trusted": True,
        "issued_at": datetime.fromtimestamp(verified_payload.get("iat", now_ts), UTC).isoformat(),
        "checked_at": now_iso,
        "verified_at": now_iso,
        "disclosed_claims": disclosed_claims,
        "reasons": [
            "Credential signature, issuer trust, status list, and holder key binding verified"
        ],
    }
