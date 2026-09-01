import json
import hashlib
from typing import Optional, Dict, Any


def canonicalize_and_hash(payload: Dict[str, Any]) -> str:
    """
    Serializes a dictionary deterministically:
    - Sorted keys
    - No extraneous whitespace (separators=(',', ':'))
    - Strict UTF-8 encoding
    Returns a 0x-prefixed 64-character hex SHA-256 hash.
    """
    canonical_json = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    digest = hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()
    return f"0x{digest}"


def compute_document_hash(raw_bytes: bytes) -> str:
    """
    Computes SHA-256 digest of original raw document bytes.
    Never exposes raw document contents to the blockchain.
    """
    if not raw_bytes:
        return "0x" + "0" * 64
    digest = hashlib.sha256(raw_bytes).hexdigest()
    return f"0x{digest}"


def compute_result_hash(
    verification_result: str,
    risk_score: float,
    risk_level: str,
    mrz_valid: Optional[bool] = None,
    tampering_status: Optional[str] = None,
    face_status: Optional[str] = None,
) -> str:
    """
    Computes deterministic SHA-256 hash of the non-PII verification outcome.
    """
    payload = {
        "face_status": face_status or "NOT_EVALUATED",
        "mrz_valid": bool(mrz_valid) if mrz_valid is not None else False,
        "risk_level": str(risk_level).upper(),
        "risk_score": round(float(risk_score or 0.0), 2),
        "tampering_status": tampering_status or "NOT_EVALUATED",
        "verification_result": str(verification_result).upper(),
    }
    return canonicalize_and_hash(payload)


def compute_case_hash(
    case_id: str,
    document_hash: str,
    result_hash: str,
    timestamp_iso: str,
    verification_version: str = "pehchaan-v1.0",
) -> str:
    """
    Computes the master caseHash combining case ID, document hash, result hash,
    verification engine version, and timestamp.
    """
    payload = {
        "case_id": str(case_id).strip(),
        "document_hash": str(document_hash).lower(),
        "result_hash": str(result_hash).lower(),
        "timestamp": str(timestamp_iso).strip(),
        "verification_version": str(verification_version).strip(),
    }
    return canonicalize_and_hash(payload)
