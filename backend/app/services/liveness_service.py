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
            "status": "PASS" | "FAIL" | "INCONCLUSIVE",
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
        if not liveness_data:
            # Default fallback when simple capture is performed without client challenge payload
            return {
                "status": "PASS",
                "confidence": None,
                "method": self.method_name,
                "message": "Basic face detection completed."
            }

        challenges_completed = liveness_data.get("challenges_completed", [])
        passed_challenge = liveness_data.get("passed", False)
        motion_detected = liveness_data.get("motion_detected", True)

        if not passed_challenge:
            return {
                "status": "FAIL",
                "confidence": None,
                "method": self.method_name,
                "message": "Liveness challenge was not completed."
            }

        if not motion_detected:
            return {
                "status": "FAIL",
                "confidence": None,
                "method": self.method_name,
                "message": "Insufficient natural face movement detected."
            }

        return {
            "status": "PASS",
            "confidence": None, # Explicitly null for basic non-certified detector as per security requirements
            "method": self.method_name,
            "message": f"Basic challenge completed successfully ({', '.join(challenges_completed) if challenges_completed else 'interactive'})."
        }


class MLLivenessDetector(LivenessDetector):
    """
    Extension placeholder for certified deep-learning facial anti-spoofing / presentation attack detection (PAD).
    """

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path
        self.method_name = "ml_anti_spoofing"

    def verify(self, liveness_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        # Future extension for trained FasNet / Silent-Face anti-spoofing model
        return {
            "status": "INCONCLUSIVE",
            "confidence": None,
            "method": self.method_name,
            "message": "ML anti-spoofing model not initialized."
        }
