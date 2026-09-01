import os
import urllib.request
import logging
import cv2
import numpy as np
from typing import Dict, Any, Tuple, Optional, List
from app.config import settings
from app.services.liveness_service import BasicLivenessDetector

logger = logging.getLogger("pehchaan.face_verification_service")

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
YUNET_PATH = os.path.join(MODELS_DIR, "face_detection_yunet_2023mar.onnx")
SFACE_PATH = os.path.join(MODELS_DIR, "face_recognition_sface_2021dec.onnx")

YUNET_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
SFACE_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"


class FaceVerificationService:
    """
    Dedicated service for passport face extraction, live face detection, quality analysis,
    face embedding generation, liveness verification, and similarity matching.
    """

    def __init__(self):
        self._ensure_models_exist()
        self.detector = None
        self.recognizer = None
        self.liveness_detector = BasicLivenessDetector()
        self._init_models()

    def _ensure_models_exist(self):
        """Ensure model weights are present locally."""
        try:
            os.makedirs(MODELS_DIR, exist_ok=True)
            if not os.path.exists(YUNET_PATH):
                logger.info(f"Downloading YuNet model to {YUNET_PATH}...")
                urllib.request.urlretrieve(YUNET_URL, YUNET_PATH)
            if not os.path.exists(SFACE_PATH):
                logger.info(f"Downloading SFace model to {SFACE_PATH}...")
                urllib.request.urlretrieve(SFACE_URL, SFACE_PATH)
        except Exception as e:
            logger.error(f"Failed to ensure model files: {e}")

    def _init_models(self):
        """Initialize OpenCV YuNet and SFace model instances."""
        try:
            if os.path.exists(YUNET_PATH) and os.path.exists(SFACE_PATH):
                # Initial default input size (300, 300); updated dynamically per image
                self.detector = cv2.FaceDetectorYN.create(
                    model=YUNET_PATH,
                    config="",
                    input_size=(300, 300),
                    score_threshold=0.45,
                    nms_threshold=0.3,
                    top_k=5000
                )
                self.recognizer = cv2.FaceRecognizerSF.create(
                    model=SFACE_PATH,
                    config=""
                )
                logger.info("FaceDetectorYN and FaceRecognizerSF initialized successfully.")
            else:
                logger.warning("Face detection/embedding models unavailable.")
        except Exception as e:
            logger.error(f"Error initializing face models: {e}")

    def detect_faces(self, image_bgr: np.ndarray) -> List[np.ndarray]:
        """
        Detect face bounding boxes and landmarks in an image using YuNet.
        Returns a list of detected face arrays (or empty list).
        """
        if self.detector is None or image_bgr is None:
            return []

        h, w = image_bgr.shape[:2]
        if h == 0 or w == 0:
            return []

        # Update input size dynamically for the detector
        self.detector.setInputSize((w, h))
        status, faces = self.detector.detect(image_bgr)

        if status != cv2.CV_32F or faces is None:
            return []

        return [face for face in faces]

    def select_passport_portrait(self, faces: List[np.ndarray], img_shape: Tuple[int, int, int]) -> Optional[np.ndarray]:
        """
        If multiple faces are detected in a passport (e.g. main portrait vs small ghost photo),
        identifies the primary passport portrait region by area.
        """
        if not faces:
            return None

        if len(faces) == 1:
            return faces[0]

        scored_faces = []
        for face in faces:
            w, h = face[2], face[3]
            score = face[-1]
            area = w * h
            scored_faces.append((area, score, face))

        # Sort descending by bounding box area
        scored_faces.sort(key=lambda x: x[0], reverse=True)
        return scored_faces[0][2]

    def evaluate_face_quality(self, image_bgr: np.ndarray, face: np.ndarray) -> Tuple[str, str]:
        """
        Checks quality of detected face: bounding box size, blur, brightness.
        Returns (quality_status, message).
        """
        if image_bgr is None or face is None:
            return "POOR", "Image or face array is missing."

        x, y, w, h = int(face[0]), int(face[1]), int(face[2]), int(face[3])
        img_h, img_w = image_bgr.shape[:2]

        # Check bounds
        x1, y1 = max(0, x), max(0, y)
        x2, y2 = min(img_w, x + w), min(img_h, y + h)

        if w < 35 or h < 35 or (x2 - x1) < 25 or (y2 - y1) < 25:
            return "POOR", "Face resolution is too low. Move closer to the camera."

        crop = image_bgr[y1:y2, x1:x2]
        if crop.size == 0:
            return "POOR", "Invalid face crop coordinates."

        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)

        # Blur check via Laplacian variance
        blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
        if blur_score < 15.0:
            return "POOR", "Face image is too blurry. Hold the camera steady."

        # Lighting check
        mean_brightness = np.mean(gray)
        if mean_brightness < 15:
            return "POOR", "Lighting is too dark. Move to a well-lit area."
        if mean_brightness > 248:
            return "POOR", "Lighting is overexposed. Reduce glare."

        return "GOOD", "Image quality is sufficient."

    def extract_embedding(self, image_bgr: np.ndarray, face: np.ndarray) -> Optional[np.ndarray]:
        """
        Aligns face using 5 facial landmarks and extracts 128-d normalized feature embedding vector.
        """
        if self.recognizer is None or image_bgr is None or face is None:
            return None

        try:
            aligned_face = self.recognizer.alignCrop(image_bgr, face)
            if aligned_face is None or aligned_face.size == 0:
                return None
            
            embedding = self.recognizer.feature(aligned_face)
            return embedding
        except Exception as e:
            logger.error(f"Error extracting face embedding: {e}")
            return None

    def compute_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Computes cosine similarity between two face embedding vectors using SFace match.
        Returns float score in range [-1.0, 1.0].
        """
        if embedding1 is None or embedding2 is None or self.recognizer is None:
            return 0.0

        try:
            score = self.recognizer.match(embedding1, embedding2, cv2.HISTCMP_COSINE)
            return float(score)
        except Exception as e:
            logger.error(f"Error matching face embeddings: {e}")
            return 0.0

    def verify_faces(
        self,
        passport_img_bgr: np.ndarray,
        live_img_bgr: np.ndarray,
        liveness_payload: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Full face verification workflow:
        Passport face detection -> Live face detection -> Quality check -> Alignment & Embedding -> Liveness -> Cosine Match.
        Returns structured dict response.
        """
        if settings.DEV_TEST_MODE:
            logger.warning("DEV_TEST_MODE is enabled in configuration.")

        match_threshold = getattr(settings, "FACE_MATCH_THRESHOLD", 0.50)
        review_threshold = getattr(settings, "FACE_BORDERLINE_THRESHOLD", 0.363)

        # 1. Detect Passport Face
        passport_faces = self.detect_faces(passport_img_bgr)
        passport_face = self.select_passport_portrait(passport_faces, passport_img_bgr.shape) if passport_faces else None
        passport_face_detected = passport_face is not None

        # 2. Detect Live Face
        live_faces = self.detect_faces(live_img_bgr)
        num_live_faces = len(live_faces)
        live_face_detected = (num_live_faces == 1)
        live_face = live_faces[0] if num_live_faces >= 1 else None

        # 3. Liveness Check
        liveness_result = self.liveness_detector.verify(liveness_payload)
        liveness_status = liveness_result.get("status", "NOT_AVAILABLE")
        liveness_passed = (liveness_status == "PASS")

        # 4. Handle Detection Failures
        if not passport_face_detected:
            msg = "Passport face could not be reliably detected."
            logger.info(f"Face verification: passport_face_detected=False, live_face_detected={num_live_faces == 1}, liveness={liveness_status}, comparison_available=False, similarity=0.0, threshold={match_threshold}, face_status=REVIEW")
            return {
                "success": True,
                "face_verification": {
                    "passport_face_detected": False,
                    "live_face_detected": (num_live_faces == 1),
                    "face_positioned": False,
                    "liveness_status": liveness_status,
                    "liveness_passed": liveness_passed,
                    "comparison_available": False,
                    "similarity": 0.0,
                    "similarity_score": None,
                    "threshold": match_threshold,
                    "match_threshold": match_threshold,
                    "review_threshold": review_threshold,
                    "status": "REVIEW",
                    "reason": msg,
                    "message": msg,
                    "passport_face": {"detected": False},
                    "live_face": {"detected": num_live_faces == 1},
                    "liveness": liveness_result,
                    "quality": {"passport_face": "POOR", "live_face": "UNKNOWN"}
                }
            }

        if num_live_faces > 1:
            msg = "Multiple faces detected. Please ensure only the candidate is visible."
            logger.info(f"Face verification: passport_face_detected=True, live_face_detected=False (multiple), liveness={liveness_status}, comparison_available=False, similarity=0.0, threshold={match_threshold}, face_status=REVIEW")
            return {
                "success": True,
                "face_verification": {
                    "passport_face_detected": True,
                    "live_face_detected": False,
                    "face_positioned": False,
                    "liveness_status": liveness_status,
                    "liveness_passed": liveness_passed,
                    "comparison_available": False,
                    "similarity": 0.0,
                    "similarity_score": None,
                    "threshold": match_threshold,
                    "match_threshold": match_threshold,
                    "review_threshold": review_threshold,
                    "status": "REVIEW",
                    "reason": msg,
                    "message": msg,
                    "passport_face": {"detected": True},
                    "live_face": {"detected": False},
                    "liveness": liveness_result,
                    "quality": {"passport_face": "GOOD", "live_face": "POOR"}
                }
            }

        if num_live_faces == 0 or live_face is None:
            msg = "Live face could not be reliably detected."
            logger.info(f"Face verification: passport_face_detected=True, live_face_detected=False, liveness={liveness_status}, comparison_available=False, similarity=0.0, threshold={match_threshold}, face_status=REVIEW")
            return {
                "success": True,
                "face_verification": {
                    "passport_face_detected": True,
                    "live_face_detected": False,
                    "face_positioned": False,
                    "liveness_status": liveness_status,
                    "liveness_passed": liveness_passed,
                    "comparison_available": False,
                    "similarity": 0.0,
                    "similarity_score": None,
                    "threshold": match_threshold,
                    "match_threshold": match_threshold,
                    "review_threshold": review_threshold,
                    "status": "REVIEW",
                    "reason": msg,
                    "message": msg,
                    "passport_face": {"detected": True},
                    "live_face": {"detected": False},
                    "liveness": liveness_result,
                    "quality": {"passport_face": "GOOD", "live_face": "POOR"}
                }
            }

        # 5. Quality Analysis
        passport_qual, _ = self.evaluate_face_quality(passport_img_bgr, passport_face)
        live_qual, _ = self.evaluate_face_quality(live_img_bgr, live_face)
        quality_ok = (passport_qual != "POOR" and live_qual != "POOR")

        if not quality_ok:
            msg = "Face image quality is insufficient for reliable comparison."
            logger.info(f"Face verification: passport_face_detected=True, live_face_detected=True, liveness={liveness_status}, comparison_available=False, similarity=0.0, threshold={match_threshold}, face_status=REVIEW")
            return {
                "success": True,
                "face_verification": {
                    "passport_face_detected": True,
                    "live_face_detected": True,
                    "face_positioned": False,
                    "liveness_status": liveness_status,
                    "liveness_passed": liveness_passed,
                    "comparison_available": False,
                    "similarity": 0.0,
                    "similarity_score": None,
                    "threshold": match_threshold,
                    "match_threshold": match_threshold,
                    "review_threshold": review_threshold,
                    "status": "REVIEW",
                    "reason": msg,
                    "message": msg,
                    "passport_face": {"detected": True},
                    "live_face": {"detected": True},
                    "liveness": liveness_result,
                    "quality": {"passport_face": passport_qual, "live_face": live_qual}
                }
            }

        # 6. Extract Embeddings & Compute Cosine Similarity
        passport_emb = self.extract_embedding(passport_img_bgr, passport_face)
        live_emb = self.extract_embedding(live_img_bgr, live_face)

        if passport_emb is None or live_emb is None:
            msg = "Face embedding feature extraction was inconclusive."
            logger.info(f"Face verification: passport_face_detected=True, live_face_detected=True, liveness={liveness_status}, comparison_available=False, similarity=0.0, threshold={match_threshold}, face_status=REVIEW")
            return {
                "success": True,
                "face_verification": {
                    "passport_face_detected": True,
                    "live_face_detected": True,
                    "face_positioned": True,
                    "liveness_status": liveness_status,
                    "liveness_passed": liveness_passed,
                    "comparison_available": False,
                    "similarity": 0.0,
                    "similarity_score": None,
                    "threshold": match_threshold,
                    "match_threshold": match_threshold,
                    "review_threshold": review_threshold,
                    "status": "REVIEW",
                    "reason": msg,
                    "message": msg,
                    "passport_face": {"detected": True},
                    "live_face": {"detected": True},
                    "liveness": liveness_result,
                    "quality": {"passport_face": passport_qual, "live_face": live_qual}
                }
            }

        raw_similarity = self.compute_similarity(passport_emb, live_emb)
        similarity = round(float(raw_similarity), 4)

        # 7. Evaluate Similarity Score against Configurable Thresholds
        if similarity >= match_threshold:
            sim_status = "PASS"
        elif similarity >= review_threshold:
            sim_status = "REVIEW"
        else:
            sim_status = "FAIL"

        # 8. Combine Similarity & Liveness Dependency Rules
        if liveness_passed:
            if sim_status == "PASS":
                final_status = "PASS"
                reason = "Passport and live face similarity passed the configured threshold."
            elif sim_status == "REVIEW":
                final_status = "REVIEW"
                reason = "Face similarity is inconclusive. Manual verification recommended."
            else:
                final_status = "FAIL"
                reason = "Passport and live face do not meet the configured similarity threshold."
        else:
            if sim_status == "PASS":
                final_status = "REVIEW"
                reason = "Face similarity passed, but liveness verification was not verified."
            elif sim_status == "REVIEW":
                final_status = "REVIEW"
                reason = "Face similarity is inconclusive and liveness was not verified."
            else:
                final_status = "FAIL"
                reason = "Passport and live face do not match and liveness failed."

        # Safe Debug Logging (Zero PII / raw embeddings logged)
        logger.info(
            f"Face verification: passport_face_detected=True, live_face_detected=True, "
            f"liveness={liveness_status}, comparison_available=True, similarity={similarity}, "
            f"threshold={match_threshold}, face_status={final_status}"
        )

        return {
            "success": True,
            "face_verification": {
                "passport_face_detected": True,
                "live_face_detected": True,
                "face_positioned": True,
                "liveness_status": liveness_status,
                "liveness_passed": liveness_passed,
                "comparison_available": True,
                "similarity": similarity,
                "similarity_score": similarity,
                "threshold": match_threshold,
                "match_threshold": match_threshold,
                "review_threshold": review_threshold,
                "status": final_status,
                "reason": reason,
                "message": reason,
                "passport_face": {"detected": True},
                "live_face": {"detected": True},
                "liveness": liveness_result,
                "quality": {"passport_face": passport_qual, "live_face": live_qual}
            }
        }


# Singleton service instance
face_verification_service = FaceVerificationService()
