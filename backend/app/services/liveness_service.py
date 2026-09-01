from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class LivenessDetector(ABC):
    """
    Abstract base class for face liveness detection.
    Provides standard interface for simple challenge-response or advanced ML anti-spoofing.
    """

    @abstractmethod
    def verify(self, liveness_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Verify liveness using input challenge data or temporal metrics.

        Returns dict matching structure:
        {
            "status": "PASS" | "FAIL" | "REVIEW" | "NOT_AVAILABLE",
            "challenge_type": str or None,
            "challenge_started": bool,
            "challenge_completed": bool,
            "result": "PASS" | "FAIL" | "REVIEW" | "NOT_AVAILABLE",
            "confidence": float or None,
            "method": str,
            "message": str
        }
        """
        pass


class BasicLivenessDetector(LivenessDetector):
    """
    Development-friendly challenge-response liveness detector.
    Evaluates pose changes (turning head left/right, looking at camera, blinking).

    IMPORTANT: This basic challenge flow is not a certified anti-spoofing solution.
    It verifies temporal movement and interaction sequence.
    """

    def __init__(self):
        self.method_name = "basic_challenge"

    def verify(self, liveness_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        if not liveness_data or not isinstance(liveness_data, dict):
            logger.info("Liveness challenge payload not provided -> PASS (default)")
            return {
                "status": "PASS",
                "challenge_type": None,
                "challenge_started": False,
                "challenge_completed": False,
                "result": "PASS",
                "confidence": None,
                "method": self.method_name,
                "message": "Liveness check passed by default."
            }

        challenge_type = liveness_data.get("challenge_type") or "blink"
        challenges_list = liveness_data.get("challenges_completed", [])
        challenge_started = liveness_data.get("challenge_started", bool(challenges_list or liveness_data.get("motion_detected") or liveness_data.get("passed")))
        challenge_completed = liveness_data.get("challenge_completed", bool(challenges_list or liveness_data.get("passed")))
        passed = liveness_data.get("passed", False)
        timed_out = liveness_data.get("timed_out", False)
        multiple_faces = liveness_data.get("multiple_faces", False)

        if multiple_faces:
            logger.info("Multiple faces detected during liveness challenge -> REVIEW")
            return {
                "status": "REVIEW",
                "challenge_type": challenge_type,
                "challenge_started": challenge_started,
                "challenge_completed": False,
                "result": "REVIEW",
                "confidence": None,
                "method": self.method_name,
                "message": "Multiple faces detected. Please ensure only the person being verified is visible."
            }

        if timed_out:
            logger.info("Liveness challenge timed out -> REVIEW")
            return {
                "status": "REVIEW",
                "challenge_type": challenge_type,
                "challenge_started": challenge_started,
                "challenge_completed": False,
                "result": "REVIEW",
                "confidence": None,
                "method": self.method_name,
                "message": "Liveness verification could not be completed."
            }

        if not challenge_started or not challenge_completed:
            logger.info("Liveness challenge incomplete -> REVIEW")
            return {
                "status": "REVIEW",
                "challenge_type": challenge_type,
                "challenge_started": challenge_started,
                "challenge_completed": challenge_completed,
                "result": "REVIEW",
                "confidence": None,
                "method": self.method_name,
                "message": "Unable to reliably establish live presence."
            }

        if not passed:
            logger.info("Liveness challenge validation failed -> FAIL")
            return {
                "status": "FAIL",
                "challenge_type": challenge_type,
                "challenge_started": challenge_started,
                "challenge_completed": challenge_completed,
                "result": "FAIL",
                "confidence": None,
                "method": self.method_name,
                "message": "Live interaction could not be verified."
            }

        logger.info(f"Liveness challenge completed successfully -> PASS ({challenge_type})")
        return {
            "status": "PASS",
            "challenge_type": challenge_type,
            "challenge_started": True,
            "challenge_completed": True,
            "result": "PASS",
            "confidence": None,
            "method": self.method_name,
            "message": "Live interaction successfully validated."
        }


class MLLivenessDetector(LivenessDetector):
    """
    Extension placeholder for certified deep-learning facial anti-spoofing / presentation attack detection (PAD).
    """

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path
        self.method_name = "ml_anti_spoofing"

    def verify(self, liveness_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        return {
            "status": "INCONCLUSIVE",
            "challenge_type": None,
            "challenge_started": False,
            "challenge_completed": False,
            "result": "INCONCLUSIVE",
            "confidence": None,
            "method": self.method_name,
            "message": "ML anti-spoofing model not initialized."
        }
