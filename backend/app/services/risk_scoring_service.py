from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class RiskScoringEngine(ABC):
    """
    Abstract base class for risk scoring.
    Enables pluggable rule-based or machine-learning risk engines.
    """

    @abstractmethod
    def assess(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates a deterministic risk assessment from structured module outputs.
        """
        pass


class RuleBasedRiskScoringEngine(RiskScoringEngine):
    """
    Explainable, rule-based risk scoring engine.
    Calculates score (0-100), risk level (LOW, MEDIUM, HIGH), verification coverage %,
    and individual risk factor breakdown with deduplication and missing data handling.
    """

    def assess(self, data: Dict[str, Any]) -> Dict[str, Any]:
        risk_factors: List[Dict[str, Any]] = []
        total_score = 0
        total_checks = 7
        available_checks = 0

        tampering_data = data.get("tampering_analysis")
        face_data = data.get("face_verification")
        mrz_data = data.get("mrz")
        consistency_data = data.get("consistency")
        validation_data = data.get("validation")
        liveness_data = data.get("liveness") or (face_data.get("liveness") if face_data else None)
        quality_data = data.get("quality") or (face_data.get("quality") if face_data else None)
        fields_data = data.get("fields")

        # Track flags for deduplication
        validation_already_failed_for_expiry = False

        # 1. Tampering Analysis (Max 30 pts)
        if tampering_data and isinstance(tampering_data, dict):
            available_checks += 1
            t_status = tampering_data.get("status", "INCONCLUSIVE")
            if t_status == "LOW_SUSPICION":
                t_pts = 0
                t_reason = "No strong forensic anomaly detected"
            elif t_status == "MEDIUM_SUSPICION":
                t_pts = 15
                t_reason = "Moderate image compression or noise anomaly detected"
            elif t_status == "HIGH_SUSPICION":
                t_pts = settings.WEIGHT_TAMPERING
                t_reason = "Strong forensic tampering anomaly detected"
            elif t_status == "INCONCLUSIVE":
                t_pts = 3
                t_reason = "Forensic analysis inconclusive due to image quality"
            else:
                t_pts = 0
                t_reason = "Tampering analysis status unverified"

            risk_factors.append({
                "name": "Tampering Analysis",
                "status": t_status,
                "points": t_pts,
                "reason": t_reason
            })
            total_score += t_pts
        else:
            risk_factors.append({
                "name": "Tampering Analysis",
                "status": "NOT_AVAILABLE",
                "points": 0,
                "reason": "Tampering analysis not performed"
            })

        # 2. Face Verification (Max 25 pts)
        if face_data and isinstance(face_data, dict):
            available_checks += 1
            f_status = face_data.get("status", "NOT_AVAILABLE")
            if f_status == "MATCH":
                f_pts = 0
                f_reason = "Live face matches passport photograph"
            elif f_status == "REVIEW":
                f_pts = 12
                f_reason = "Face similarity is borderline; manual inspection recommended"
            elif f_status == "MISMATCH":
                f_pts = settings.WEIGHT_FACE_MATCH
                f_reason = "Live face does not match passport photograph"
            elif f_status in ["PASSPORT_FACE_NOT_FOUND", "LIVE_FACE_NOT_FOUND", "MULTIPLE_FACES"]:
                f_pts = 10
                f_reason = f"Face detection check issue ({f_status.replace('_', ' ')})"
            elif f_status == "NOT_AVAILABLE":
                f_pts = 0
                f_reason = "Face verification not performed"
                available_checks -= 1 # adjust if status explicitly set to NOT_AVAILABLE
            else:
                f_pts = 5
                f_reason = "Face verification review recommended"

            risk_factors.append({
                "name": "Face Verification",
                "status": f_status,
                "points": f_pts,
                "reason": f_reason
            })
            total_score += f_pts
        else:
            risk_factors.append({
                "name": "Face Verification",
                "status": "NOT_AVAILABLE",
                "points": 0,
                "reason": "Face verification not performed"
            })

        # 3. MRZ / Checksum (Max 15 pts)
        if mrz_data and isinstance(mrz_data, dict) and "detected" in mrz_data:
            available_checks += 1
            mrz_detected = mrz_data.get("detected", False)
            checksum_valid = mrz_data.get("checksum_valid")

            if mrz_detected and checksum_valid is True:
                m_status = "PASS"
                m_pts = 0
                m_reason = "MRZ detected and checksum validated"
            elif mrz_detected and checksum_valid is False:
                m_status = "FAIL"
                m_pts = settings.WEIGHT_MRZ
                m_reason = "MRZ checksum validation failed"
            elif mrz_detected and checksum_valid is None:
                m_status = "REVIEW"
                m_pts = 3
                m_reason = "MRZ detected but checksum unavailable"
            else:
                m_status = "FAIL"
                m_pts = 10
                m_reason = "MRZ format not detected in document"

            risk_factors.append({
                "name": "MRZ / Checksum",
                "status": m_status,
                "points": m_pts,
                "reason": m_reason
            })
            total_score += m_pts
        else:
            risk_factors.append({
                "name": "MRZ / Checksum",
                "status": "NOT_AVAILABLE",
                "points": 0,
                "reason": "MRZ analysis not performed"
            })

        # 4. OCR / MRZ Consistency (Max 10 pts)
        if consistency_data and isinstance(consistency_data, dict):
            available_checks += 1
            c_status = consistency_data.get("overall_status", "NOT_AVAILABLE")
            pp_status = consistency_data.get("passport_number_status")

            if c_status == "PASS":
                c_pts = 0
                c_reason = "OCR text matches MRZ data"
            elif pp_status == "FAIL":
                c_pts = settings.WEIGHT_CONSISTENCY
                c_reason = "Passport number mismatch between OCR text and MRZ data"
            elif c_status == "FAIL":
                c_pts = 8
                c_reason = "Field mismatch between OCR text and MRZ data"
            elif c_status == "REVIEW":
                c_pts = 4
                c_reason = "Partial discrepancy between OCR text and MRZ data"
            elif c_status == "NOT_AVAILABLE":
                c_pts = 0
                c_reason = "Consistency check not performed"
                available_checks -= 1
            else:
                c_pts = 0
                c_reason = "OCR / MRZ consistency acceptable"

            risk_factors.append({
                "name": "OCR ↔ MRZ Consistency",
                "status": c_status,
                "points": c_pts,
                "reason": c_reason
            })
            total_score += c_pts
        else:
            risk_factors.append({
                "name": "OCR ↔ MRZ Consistency",
                "status": "NOT_AVAILABLE",
                "points": 0,
                "reason": "Consistency check not performed"
            })

        # 5. Document Validation (Max 10 pts)
        if validation_data and isinstance(validation_data, dict):
            available_checks += 1
            v_status = validation_data.get("overall_status", "NOT_AVAILABLE")
            checks = validation_data.get("checks", {})

            # Check if expiry check failed inside validation
            expiry_check = checks.get("expiry_date", {}) if isinstance(checks, dict) else {}
            if expiry_check.get("status") == "FAIL":
                validation_already_failed_for_expiry = True

            if v_status == "PASS":
                v_pts = 0
                v_reason = "Document structure and validation rules passed"
            elif v_status == "REVIEW":
                v_pts = 5
                v_reason = "Document validation rule review recommended"
            elif v_status == "FAIL":
                v_pts = settings.WEIGHT_VALIDATION
                v_reason = "Document validation check failed"
            elif v_status == "NOT_AVAILABLE":
                v_pts = 0
                v_reason = "Document validation not performed"
                available_checks -= 1
            else:
                v_pts = 0
                v_reason = "Document validation complete"

            risk_factors.append({
                "name": "Document Validation",
                "status": v_status,
                "points": v_pts,
                "reason": v_reason
            })
            total_score += v_pts
        else:
            risk_factors.append({
                "name": "Document Validation",
                "status": "NOT_AVAILABLE",
                "points": 0,
                "reason": "Document validation not performed"
            })

        # 6. Expiry Check & Deduplication (Max 5 pts)
        is_expired = False
        expiry_date_val = fields_data.get("date_of_expiry") if fields_data else None

        if validation_already_failed_for_expiry:
            is_expired = True

        if is_expired:
            available_checks += 1
            if validation_already_failed_for_expiry:
                # Deduplication: Expiry failure already counted in Document Validation
                ex_pts = 0
                ex_reason = "Document is expired (failure accounted for in Document Validation)"
                ex_status = "FAIL"
            else:
                ex_pts = settings.WEIGHT_EXPIRY
                ex_reason = "Document expiry date has passed"
                ex_status = "FAIL"

            risk_factors.append({
                "name": "Expiry Check",
                "status": ex_status,
                "points": ex_pts,
                "reason": ex_reason
            })
            total_score += ex_pts
        elif expiry_date_val:
            available_checks += 1
            risk_factors.append({
                "name": "Expiry Check",
                "status": "PASS",
                "points": 0,
                "reason": "Document is within valid date threshold"
            })
        else:
            risk_factors.append({
                "name": "Expiry Check",
                "status": "NOT_AVAILABLE",
                "points": 0,
                "reason": "Expiry date unavailable"
            })

        # 7. Liveness Check (Max 5 pts)
        if liveness_data and isinstance(liveness_data, dict):
            available_checks += 1
            l_status = liveness_data.get("status", "NOT_AVAILABLE")
            if l_status == "PASS":
                l_pts = 0
                l_reason = "Liveness challenge completed successfully"
            elif l_status == "FAIL":
                l_pts = settings.WEIGHT_LIVENESS
                l_reason = "Liveness challenge failed"
            elif l_status == "NOT_AVAILABLE":
                l_pts = 0
                l_reason = "Liveness check not performed"
                available_checks -= 1
            else:
                l_pts = 2
                l_reason = "Liveness check inconclusive"

            risk_factors.append({
                "name": "Liveness Check",
                "status": l_status,
                "points": l_pts,
                "reason": l_reason
            })
            total_score += l_pts
        else:
            risk_factors.append({
                "name": "Liveness Check",
                "status": "NOT_AVAILABLE",
                "points": 0,
                "reason": "Liveness check not performed"
            })

        # Optional Image Quality Penalty (3 pts) if poor quality reported
        if quality_data and isinstance(quality_data, dict):
            p_qual = quality_data.get("passport_face") or quality_data.get("live_face")
            if p_qual == "POOR":
                total_score += 3
                risk_factors.append({
                    "name": "Image Quality",
                    "status": "POOR",
                    "points": 3,
                    "reason": "Image resolution or blur is poor; recapture recommended"
                })

        # Final score calculation & bounding
        final_score = min(100, max(0, total_score))

        # Coverage calculation
        coverage_percentage = round((available_checks / total_checks) * 100) if total_checks > 0 else 0
        verification_incomplete = available_checks < total_checks

        # Level determination
        if final_score <= settings.RISK_LOW_MAX:
            risk_level = "LOW"
            if verification_incomplete:
                recommendation = "Additional verification recommended"
            else:
                recommendation = "Proceed to officer review"
        elif final_score <= settings.RISK_MEDIUM_MAX:
            risk_level = "MEDIUM"
            recommendation = "Manual review recommended"
        else:
            risk_level = "HIGH"
            recommendation = "Manual verification required"

        # Special fallback: if ALL checks are unavailable, return REVIEW / insufficient status
        if available_checks == 0:
            return {
                "score": 0,
                "level": "MEDIUM",
                "coverage": {
                    "available_checks": 0,
                    "total_checks": total_checks,
                    "percentage": 0
                },
                "risk_factors": risk_factors,
                "verification_incomplete": True,
                "recommendation": "Insufficient verification data available; manual review required"
            }

        return {
            "score": final_score,
            "level": risk_level,
            "coverage": {
                "available_checks": available_checks,
                "total_checks": total_checks,
                "percentage": coverage_percentage
            },
            "risk_factors": risk_factors,
            "verification_incomplete": verification_incomplete,
            "recommendation": recommendation
        }


class MLRiskScoringEngine(RiskScoringEngine):
    """
    Extension placeholder for future machine-learning risk assessment model.
    """

    def assess(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "score": 0,
            "level": "LOW",
            "coverage": {"available_checks": 0, "total_checks": 7, "percentage": 0},
            "risk_factors": [],
            "verification_incomplete": True,
            "recommendation": "ML risk scoring engine not initialized."
        }


class RiskScoringService:
    """
    Primary service wrapper for risk assessment.
    """

    def __init__(self, engine: Optional[RiskScoringEngine] = None):
        self.engine = engine or RuleBasedRiskScoringEngine()

    def calculate_risk(self, verification_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes risk assessment using current configured engine.
        Returns structured response dict.
        """
        assessment = self.engine.assess(verification_payload)
        return {
            "success": True,
            "risk_assessment": assessment
        }


risk_scoring_service = RiskScoringService()
