"""
Risk scoring service — explainable rule-based risk assessment using data
available from the screening pipeline and identity verification.

Input signals:
- OCR confidence (from ocr_service)
- MRZ detected / checksum valid (from mrz_parser_service)
- Consistency checks (from consistency_service)
- Number of fields extracted
- Date of expiry (if available, checked against current date)
- Face verification status & similarity score (from face_verification_service)
"""
from datetime import datetime
from typing import Optional, Dict, Any, List

from app.models.verification import RiskLevel


def compute_risk_score(
    ocr_confidence: float,
    mrz_detected: Optional[bool],
    mrz_checksum_valid: Optional[bool],
    consistency_name_match: Optional[bool],
    consistency_passport_match: Optional[bool],
    consistency_dob_match: Optional[bool],
    consistency_expiry_match: Optional[bool],
    fields_extracted: int,
    date_of_expiry: Optional[str],
    face_status: Optional[str] = None,
    face_similarity_score: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Computes a risk score (0-100) and risk level based on available verification data.
    
    Returns:
        {
            "risk_score": float (0-100, higher = more risk),
            "risk_level": RiskLevel,
            "risk_factors": list of dicts explaining each factor,
            "verification_result": "PASS" | "REVIEW" | "FAIL"
        }
    """
    risk_score = 0.0
    risk_factors: List[Dict[str, Any]] = []

    # Factor 1: OCR Confidence (max 25 points of risk)
    if ocr_confidence < 0.5:
        points = 25.0
        risk_factors.append({"factor": "low_ocr_confidence", "points": points, "detail": f"OCR confidence {ocr_confidence:.2f} is very low"})
        risk_score += points
    elif ocr_confidence < 0.7:
        points = 15.0
        risk_factors.append({"factor": "moderate_ocr_confidence", "points": points, "detail": f"OCR confidence {ocr_confidence:.2f} is below threshold"})
        risk_score += points
    elif ocr_confidence < 0.85:
        points = 5.0
        risk_factors.append({"factor": "acceptable_ocr_confidence", "points": points, "detail": f"OCR confidence {ocr_confidence:.2f} is acceptable"})
        risk_score += points

    # Factor 2: MRZ Detection (max 20 points of risk)
    if mrz_detected is False or mrz_detected is None:
        points = 20.0
        risk_factors.append({"factor": "mrz_not_detected", "points": points, "detail": "Machine Readable Zone was not detected"})
        risk_score += points
    elif mrz_checksum_valid is False:
        points = 15.0
        risk_factors.append({"factor": "mrz_checksum_invalid", "points": points, "detail": "MRZ checksum validation failed"})
        risk_score += points

    # Factor 3: Consistency Checks (max 30 points of risk)
    consistency_checks = [
        ("name_match", consistency_name_match, 8.0),
        ("passport_number_match", consistency_passport_match, 10.0),
        ("dob_match", consistency_dob_match, 6.0),
        ("expiry_match", consistency_expiry_match, 6.0),
    ]
    for check_name, check_value, max_points in consistency_checks:
        if check_value is False:
            risk_factors.append({
                "factor": f"consistency_{check_name}_failed",
                "points": max_points,
                "detail": f"Visual OCR and MRZ {check_name.replace('_', ' ')} do not match",
            })
            risk_score += max_points

    # Factor 4: Fields Extracted (max 15 points of risk)
    if fields_extracted < 3:
        points = 15.0
        risk_factors.append({"factor": "very_few_fields", "points": points, "detail": f"Only {fields_extracted}/7 fields extracted"})
        risk_score += points
    elif fields_extracted < 5:
        points = 8.0
        risk_factors.append({"factor": "few_fields", "points": points, "detail": f"Only {fields_extracted}/7 fields extracted"})
        risk_score += points

    # Factor 5: Expiry Check (max 10 points of risk)
    if date_of_expiry:
        try:
            # Parse DD/MM/YYYY format from mrz_parser_service
            expiry_date = datetime.strptime(date_of_expiry, "%d/%m/%Y")
            if expiry_date < datetime.now():
                points = 10.0
                risk_factors.append({"factor": "document_expired", "points": points, "detail": f"Document expired on {date_of_expiry}"})
                risk_score += points
        except (ValueError, TypeError):
            pass  # Date format mismatch — don't penalize

    # Factor 6: Face Verification Contribution (Configurable decision-support risk signal)
    if face_status:
        score_str = f"{face_similarity_score:.1f}%" if face_similarity_score is not None else "N/A"
        if face_status == "LOW_SIMILARITY":
            points = 35.0
            risk_factors.append({
                "factor": "face_mismatch_low_similarity",
                "points": points,
                "detail": f"Face verification similarity ({score_str}) is low — potential identity mismatch",
            })
            risk_score += points
        elif face_status == "POSSIBLE_MATCH":
            points = 10.0
            risk_factors.append({
                "factor": "face_verification_inconclusive",
                "points": points,
                "detail": f"Face verification is inconclusive ({score_str}) — manual inspection recommended",
            })
            risk_score += points
        elif face_status == "STRONG_MATCH":
            # No added risk points
            risk_factors.append({
                "factor": "face_verification_strong_match",
                "points": 0.0,
                "detail": f"Identity verified against passport portrait ({score_str})",
            })
        elif face_status in ["NOT_VERIFIED", "FAILED", "NO_FACE", "MULTIPLE_FACES"]:
            points = 5.0
            risk_factors.append({
                "factor": "face_verification_unverified",
                "points": points,
                "detail": f"Face verification could not be completed ({face_status})",
            })
            risk_score += points

    # Clamp score to 0-100
    risk_score = round(min(100.0, max(0.0, risk_score)), 1)

    # Determine risk level
    if risk_score >= 70:
        risk_level = RiskLevel.CRITICAL
    elif risk_score >= 45:
        risk_level = RiskLevel.HIGH
    elif risk_score >= 20:
        risk_level = RiskLevel.MEDIUM
    else:
        risk_level = RiskLevel.LOW

    # Determine verification result
    if risk_score >= 45:
        verification_result = "FAIL"
    elif risk_score >= 20:
        verification_result = "REVIEW"
    else:
        verification_result = "PASS"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_factors": risk_factors,
        "verification_result": verification_result,
    }
