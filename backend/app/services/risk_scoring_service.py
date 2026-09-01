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
    and individual 7 primary check breakdown with deduplication and missing data handling.
    """

    def assess(self, data: Dict[str, Any]) -> Dict[str, Any]:
        primary_checks: List[Dict[str, Any]] = []
        total_score = 0
        total_primary_checks = 7

        ocr_data = data.get("ocr")
        mrz_data = data.get("mrz")
        consistency_data = data.get("consistency")
        validation_data = data.get("validation") or data.get("document_validation")
        tampering_data = data.get("tampering_analysis")
        face_data = data.get("face_verification")
        liveness_data = data.get("liveness") or (face_data.get("liveness") if face_data and isinstance(face_data, dict) else None)
        quality_data = data.get("quality") or (face_data.get("quality") if face_data and isinstance(face_data, dict) else None)
        fields_data = data.get("fields") or data.get("identity")

        # Track flags for deduplication
        validation_already_failed_for_expiry = False

        # -------------------------------------------------------------
        # CHECK 1: Identity / OCR Fields
        # -------------------------------------------------------------
        if fields_data and isinstance(fields_data, dict):
            has_name = bool(fields_data.get("full_name") or fields_data.get("surname"))
            has_num = bool(fields_data.get("passport_number"))
            has_dob = bool(fields_data.get("date_of_birth"))

            if has_name and has_num and has_dob:
                ocr_status = "PASS"
                ocr_pts = 0
                ocr_reason = "Required identity fields extracted successfully."
            elif has_name or has_num or has_dob:
                ocr_status = "REVIEW"
                ocr_pts = 0
                ocr_reason = "Some core identity fields could not be fully parsed."
            else:
                ocr_status = "PASS"
                ocr_pts = 0
                ocr_reason = "Identity fields processing complete."

            primary_checks.append({
                "name": "Identity / OCR",
                "status": ocr_status,
                "points": ocr_pts,
                "reason": ocr_reason
            })
            total_score += ocr_pts
        else:
            primary_checks.append({
                "name": "Identity / OCR",
                "status": "NOT_AVAILABLE",
                "points": 0,
                "reason": "Identity OCR data unavailable"
            })

        # -------------------------------------------------------------
        # CHECK 2: MRZ Verification
        # -------------------------------------------------------------
        if mrz_data and isinstance(mrz_data, dict) and ("detected" in mrz_data or "checksum_valid" in mrz_data or "status" in mrz_data):
            mrz_detected = mrz_data.get("detected", False)
            checksum_valid = mrz_data.get("checksum_valid")
            raw_m_status = mrz_data.get("status")

            if not mrz_detected:
                m_status = "NOT_AVAILABLE"
                m_pts = 0
                m_reason = "MRZ format not detected in document."
            elif raw_m_status == "PASS" or checksum_valid is True:
                m_status = "PASS"
                m_pts = 0
                m_reason = "MRZ structure and check digits validated."
            elif raw_m_status == "FAIL" or checksum_valid is False:
                m_status = "FAIL"
                m_pts = settings.WEIGHT_MRZ
                m_reason = "MRZ check digit validation failed."
            elif raw_m_status == "REVIEW" or checksum_valid is None:
                m_status = "REVIEW"
                m_pts = 3
                m_reason = "MRZ detected, but checksum could not be confidently validated."
            else:
                m_status = "NOT_AVAILABLE"
                m_pts = 0
                m_reason = "MRZ format not detected in document."

            primary_checks.append({
                "name": "MRZ Verification",
                "status": m_status,
                "points": m_pts,
                "reason": m_reason
            })
            total_score += m_pts
        else:
            primary_checks.append({
                "name": "MRZ Verification",
                "status": "NOT_AVAILABLE",
                "points": 0,
                "reason": "MRZ analysis not performed"
            })

        # -------------------------------------------------------------
        # CHECK 3: Document Validation
        # -------------------------------------------------------------
        if validation_data and isinstance(validation_data, dict):
            v_status_raw = validation_data.get("overall_status", "NOT_AVAILABLE")
            checks = validation_data.get("checks", {})

            # Check if expiry check failed inside validation
            expiry_check = checks.get("expiry_date", {}) if isinstance(checks, dict) else {}
            if expiry_check.get("status") == "FAIL":
                validation_already_failed_for_expiry = True

            if v_status_raw == "PASS":
                v_status = "PASS"
                v_pts = 0
                v_reason = "Document structure and validation rules passed."
            elif v_status_raw == "REVIEW":
                v_status = "REVIEW"
                v_pts = 5
                v_reason = "Document validation rule review recommended."
            elif v_status_raw == "FAIL":
                v_status = "FAIL"
                v_pts = settings.WEIGHT_VALIDATION
                v_reason = "Document validation check failed."
            else:
                v_status = "NOT_AVAILABLE"
                v_pts = 0
                v_reason = "Document validation not performed"

            primary_checks.append({
                "name": "Document Validation",
                "status": v_status,
                "points": v_pts,
                "reason": v_reason
            })
            total_score += v_pts
        else:
            primary_checks.append({
                "name": "Document Validation",
                "status": "NOT_AVAILABLE",
                "points": 0,
                "reason": "Document validation not performed"
            })

        # -------------------------------------------------------------
        # CHECK 4: OCR / MRZ Consistency
        # -------------------------------------------------------------
        if consistency_data and isinstance(consistency_data, dict):
            c_status_raw = consistency_data.get("overall_status", "NOT_AVAILABLE")
            pp_status = consistency_data.get("passport_number_status")
            mrz_detected = mrz_data.get("detected", False) if mrz_data and isinstance(mrz_data, dict) else False

            # Deduplication: If MRZ was not detected in document, consistency check is omitted to avoid double penalty
            if not mrz_detected:
                c_status = "NOT_AVAILABLE"
                c_pts = 0
                c_reason = "MRZ not detected; consistency check omitted to prevent double penalization."
            elif c_status_raw == "PASS":
                c_status = "PASS"
                c_pts = 0
                c_reason = "Comparable visual OCR and MRZ fields match."
            elif pp_status == "FAIL":
                c_status = "FAIL"
                c_pts = settings.WEIGHT_CONSISTENCY
                c_reason = "Passport number mismatch between OCR text and MRZ data."
            elif c_status_raw == "FAIL":
                c_status = "FAIL"
                c_pts = 8
                c_reason = "Field mismatch between OCR text and MRZ data."
            elif c_status_raw == "REVIEW":
                c_status = "REVIEW"
                c_pts = 4
                c_reason = "Partial discrepancy between OCR text and MRZ data."
            else:
                c_status = "NOT_AVAILABLE"
                c_pts = 0
                c_reason = "Consistency check not performed"

            primary_checks.append({
                "name": "OCR / MRZ Consistency",
                "status": c_status,
                "points": c_pts,
                "reason": c_reason
            })
            total_score += c_pts
        else:
            primary_checks.append({
                "name": "OCR / MRZ Consistency",
                "status": "NOT_AVAILABLE",
                "points": 0,
                "reason": "Consistency check not performed"
            })

        # -------------------------------------------------------------
        # CHECK 5: Document Authenticity / Tampering
        # -------------------------------------------------------------
        if tampering_data and isinstance(tampering_data, dict) and tampering_data.get("status") != "NOT_AVAILABLE":
            t_status_raw = tampering_data.get("status")
            t_score = tampering_data.get("score") or tampering_data.get("suspicion_score")

            if t_status_raw in ["LOW_SUSPICION", "PASS"] or (t_score is not None and t_score < settings.TAMPERING_LOW_MAX):
                t_status = "PASS"
                t_pts = 0
                default_reason = "No significant localized forensic anomaly detected."
            elif t_status_raw == "HIGH_SUSPICION" or (t_score is not None and t_score >= settings.TAMPERING_MEDIUM_MAX and t_status_raw != "MEDIUM_SUSPICION"):
                t_status = "FAIL"
                t_pts = settings.WEIGHT_TAMPERING
                default_reason = "Multiple agreeing forensic anomalies indicate possible localized manipulation."
            elif t_status_raw in ["MEDIUM_SUSPICION", "REVIEW"] or (t_score is not None and settings.TAMPERING_LOW_MAX <= t_score < settings.TAMPERING_MEDIUM_MAX):
                t_status = "REVIEW"
                t_pts = 5
                default_reason = "Localized compression or texture anomalies detected; manual review recommended."
            elif t_status_raw == "INCONCLUSIVE":
                t_status = "REVIEW"
                t_pts = 3
                default_reason = "Image quality limits reliable forensic assessment."
            else:
                t_status = "PASS"
                t_pts = 0
                default_reason = "Tampering analysis within acceptable bounds."

            reasons_list = tampering_data.get("reasons", [])
            if reasons_list and len(reasons_list) > 0 and isinstance(reasons_list[0], str):
                t_reason = reasons_list[0]
            else:
                t_reason = default_reason

            primary_checks.append({
                "name": "Document Authenticity",
                "status": t_status,
                "points": t_pts,
                "reason": t_reason
            })
            total_score += t_pts
        else:
            primary_checks.append({
                "name": "Document Authenticity",
                "status": "NOT_AVAILABLE",
                "points": 0,
                "reason": "Authenticity analysis not performed"
            })

        # -------------------------------------------------------------
        # CHECK 6: Face Verification
        # -------------------------------------------------------------
        if face_data and isinstance(face_data, dict):
            f_status_raw = face_data.get("status", "NOT_AVAILABLE")
            f_reason_custom = face_data.get("reason") or face_data.get("message")

            if f_status_raw in ["PASS", "MATCH"]:
                f_status = "PASS"
                f_pts = 0
                f_reason = f_reason_custom or "Passport photo and live face comparison passed."
            elif f_status_raw in ["REVIEW", "IMAGE_QUALITY_INSUFFICIENT", "PASSPORT_FACE_NOT_FOUND", "LIVE_FACE_NOT_FOUND", "MULTIPLE_FACES"]:
                f_status = "REVIEW"
                f_pts = 10
                f_reason = f_reason_custom or "Face similarity is inconclusive; manual inspection recommended."
            elif f_status_raw in ["FAIL", "MISMATCH"]:
                f_status = "FAIL"
                f_pts = settings.WEIGHT_FACE_MATCH
                f_reason = f_reason_custom or "Passport face and live face do not match."
            else:
                f_status = "NOT_AVAILABLE"
                f_pts = 0
                f_reason = "Face verification not performed"

            primary_checks.append({
                "name": "Face Verification",
                "status": f_status,
                "points": f_pts,
                "reason": f_reason
            })
            total_score += f_pts
        else:
            primary_checks.append({
                "name": "Face Verification",
                "status": "NOT_AVAILABLE",
                "points": 0,
                "reason": "Face verification not performed"
            })

        # -------------------------------------------------------------
        # CHECK 7: Liveness Verification
        # -------------------------------------------------------------
        if liveness_data and isinstance(liveness_data, dict):
            l_status_raw = liveness_data.get("status", "NOT_AVAILABLE")
            if l_status_raw == "PASS":
                l_status = "PASS"
                l_pts = 0
                l_reason = "Live interaction was successfully validated."
            elif l_status_raw == "FAIL":
                l_status = "FAIL"
                l_pts = settings.WEIGHT_LIVENESS
                l_reason = "Liveness challenge failed."
            elif l_status_raw == "REVIEW":
                l_status = "REVIEW"
                l_pts = 2
                l_reason = liveness_data.get("message") or "Unable to reliably establish live presence."
            else:
                l_status = "NOT_AVAILABLE"
                l_pts = 0
                l_reason = "Liveness check unavailable."

            primary_checks.append({
                "name": "Liveness Verification",
                "status": l_status,
                "points": l_pts,
                "reason": l_reason
            })
            total_score += l_pts
        else:
            primary_checks.append({
                "name": "Liveness Verification",
                "status": "NOT_AVAILABLE",
                "points": 0,
                "reason": "Liveness check unavailable."
            })

        # -------------------------------------------------------------
        # SUPPORTING SIGNALS (Not primary 7 checks)
        # -------------------------------------------------------------
        supporting_signals = {}

        # Supporting Signal 1: Passport Expiry
        expiry_date_val = fields_data.get("date_of_expiry") if fields_data and isinstance(fields_data, dict) else None
        if validation_already_failed_for_expiry:
            supporting_signals["expiry"] = {
                "status": "FAIL",
                "reason": "Document is expired (failure accounted for in Document Validation)"
            }
        elif expiry_date_val:
            supporting_signals["expiry"] = {
                "status": "PASS",
                "reason": "Document is within valid date threshold"
            }
        else:
            supporting_signals["expiry"] = {
                "status": "NOT_AVAILABLE",
                "reason": "Expiry date unavailable"
            }

        # Supporting Signal 2: Image Quality
        if quality_data and isinstance(quality_data, dict):
            q_status = quality_data.get("status", "GOOD")
            q_reason = quality_data.get("reason") or ("Image is sufficiently clear for downstream verification." if q_status == "GOOD" else "Image quality limitations detected; recapture recommended.")
            
            if q_status == "POOR":
                q_pts = 5
                q_ui_status = "POOR"
            elif q_status == "FAIR":
                q_pts = 2
                q_ui_status = "FAIR"
            else:
                q_pts = 0
                q_ui_status = "GOOD"

            total_score += q_pts
            supporting_signals["image_quality"] = {
                "status": q_ui_status,
                "points": q_pts,
                "reason": q_reason,
                "signals": quality_data.get("signals")
            }
        else:
            supporting_signals["image_quality"] = {
                "status": "NOT_AVAILABLE",
                "points": 0,
                "reason": "Image quality metrics unavailable"
            }

        # -------------------------------------------------------------
        # COVERAGE & FINAL SCORE COMPUTATION
        # -------------------------------------------------------------
        completed_checks = sum(1 for c in primary_checks if c["status"] != "NOT_AVAILABLE")
        coverage_percentage = round((completed_checks / total_primary_checks) * 100)
        verification_incomplete = completed_checks < total_primary_checks

        final_score = min(100, max(0, total_score))

        # Safe development logging (No sensitive PII / passport numbers / DOB / images logged)
        logger.info(f"MRZ backend status raw={mrz_data.get('status') if mrz_data else None}, checksum_valid={mrz_data.get('checksum_valid') if mrz_data else None} -> normalized status")
        logger.info(f"Risk checks summary: completed={completed_checks}/{total_primary_checks}, score={final_score}")

        # Risk Level & Recommendation
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

        if completed_checks == 0:
            risk_level = "MEDIUM"
            recommendation = "Insufficient verification data available; manual review required"

        return {
            "score": final_score,
            "level": risk_level,
            "coverage": {
                "completed_checks": completed_checks,
                "total_checks": total_primary_checks,
                "percentage": coverage_percentage
            },
            "checks": primary_checks,
            "risk_factors": primary_checks, # for backward compatibility
            "supporting_signals": supporting_signals,
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
            "coverage": {"completed_checks": 0, "total_checks": 7, "percentage": 0},
            "checks": [],
            "risk_factors": [],
            "supporting_signals": {},
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
