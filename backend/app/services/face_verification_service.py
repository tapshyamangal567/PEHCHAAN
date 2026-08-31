import os
import urllib.request
import logging
import cv2
import numpy as np
from typing import Dict, Any, Tuple, Optional, List
from app.config import settings
from app.services.liveness_service import BasicLivenessDetector

logger = logging.getLogger(__name__)

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
        Detect face bounding boxes and landmarks in an image.
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
        identifies the primary passport portrait region by area and confidence.
        If ambiguity is high, returns None.
        """
        if not faces:
            return None

        if len(faces) == 1:
            return faces[0]

        # Calculate bounding box area for each face
        # YuNet face format: [x, y, w, h, x_re, y_re, x_le, y_le, x_n, y_n, x_rm, y_rm, x_lm, y_lm, score]
        scored_faces = []
        for face in faces:
            w, h = face[2], face[3]
            score = face[-1]
            area = w * h
            scored_faces.append((area, score, face))

        # Sort descending by bounding box area
        scored_faces.sort(key=lambda x: x[0], reverse=True)

        primary_area, primary_score, primary_face = scored_faces[0]
        second_area, second_score, _ = scored_faces[1]

        # In passports, main portrait is significantly larger than secondary ghost/watermark photo
        if primary_area >= 1.8 * second_area and primary_score >= settings.FACE_DETECTION_CONFIDENCE:
            return primary_face
        
        # If both faces are of comparable size and high confidence, return None to trigger REVIEW
        return None

    def evaluate_face_quality(self, image_bgr: np.ndarray, face: np.ndarray) -> Tuple[str, str]:
        """
        Checks quality of detected face: bounding box size, blur, brightness.
        Returns (quality_status, message).
        """
        x, y, w, h = int(face[0]), int(face[1]), int(face[2]), int(face[3])
        img_h, img_w = image_bgr.shape[:2]

        # Check bounds
        x1, y1 = max(0, x), max(0, y)
        x2, y2 = min(img_w, x + w), min(img_h, y + h)

        if w < 50 or h < 50 or (x2 - x1) < 40 or (y2 - y1) < 40:
            return "POOR", "Face resolution is too low. Move closer to the camera."

        crop = image_bgr[y1:y2, x1:x2]
        if crop.size == 0:
            return "POOR", "Invalid face crop coordinates."

        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)

        # Blur check via Laplacian variance
        blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
        if blur_score < 25.0:
            return "POOR", "Face image is too blurry. Hold the camera steady."

        # Lighting check
        mean_brightness = np.mean(gray)
        if mean_brightness < 25:
            return "POOR", "Lighting is too dark. Move to a well-lit area."
        if mean_brightness > 240:
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
        Computes cosine similarity between two face embedding vectors.
        Returns float score in range [-1.0, 1.0].
        """
        if embedding1 is None or embedding2 is None or self.recognizer is None:
            return 0.0

        try:
            score = self.recognizer.match(embedding1, embedding2, cv2.HISTCMP_COSINE)
            # Ensure float rounding
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
        # Handle development test mode override (must never be enabled by default in production)
        if settings.DEV_TEST_MODE:
            logger.warning("DEV_TEST_MODE is enabled in configuration.")

        # 1. Detect Passport Face
        passport_faces = self.detect_faces(passport_img_bgr)
        passport_face = self.select_passport_portrait(passport_faces, passport_img_bgr.shape) if passport_faces else None

        if passport_face is None:
            return {
                "success": True,
                "face_verification": {
                    "status": "PASSPORT_FACE_NOT_FOUND",
                    "similarity": 0.0,
                    "passport_face": {"detected": False},
                    "live_face": {"detected": False},
                    "liveness": {"status": "FAIL", "confidence": None, "method": "basic_challenge"},
                    "quality": {"passport_face": "POOR", "live_face": "UNKNOWN"},
                    "message": "No clear face could be detected in the passport image."
                }
            }

        # 2. Detect Live Face
        live_faces = self.detect_faces(live_img_bgr)

        if not live_faces:
            return {
                "success": True,
                "face_verification": {
                    "status": "LIVE_FACE_NOT_FOUND",
                    "similarity": 0.0,
                    "passport_face": {"detected": True},
                    "live_face": {"detected": False},
                    "liveness": {"status": "FAIL", "confidence": None, "method": "basic_challenge"},
                    "quality": {"passport_face": "GOOD", "live_face": "POOR"},
                    "message": "No face detected in live camera image. Position the person inside the frame."
                }
            }

        if len(live_faces) > 1:
            return {
                "success": True,
                "face_verification": {
                    "status": "MULTIPLE_FACES",
                    "similarity": 0.0,
                    "passport_face": {"detected": True},
                    "live_face": {"detected": True, "count": len(live_faces)},
                    "liveness": {"status": "FAIL", "confidence": None, "method": "basic_challenge"},
                    "quality": {"passport_face": "GOOD", "live_face": "POOR"},
                    "message": "Multiple faces detected. Please ensure only the person being verified is in the frame."
                }
            }

        live_face = live_faces[0]

        # 3. Evaluate Image Quality
        passport_qual, passport_qual_msg = self.evaluate_face_quality(passport_img_bgr, passport_face)
        live_qual, live_qual_msg = self.evaluate_face_quality(live_img_bgr, live_face)

        if live_qual == "POOR":
            return {
                "success": True,
                "face_verification": {
                    "status": "IMAGE_QUALITY_INSUFFICIENT",
                    "similarity": 0.0,
                    "passport_face": {"detected": True},
                    "live_face": {"detected": True},
                    "liveness": {"status": "FAIL", "confidence": None, "method": "basic_challenge"},
                    "quality": {"passport_face": passport_qual, "live_face": live_qual},
                    "message": f"Live face image quality is insufficient: {live_qual_msg}"
                }
            }

        # 4. Perform Liveness Check
        liveness_result = self.liveness_detector.verify(liveness_payload)
        if liveness_result.get("status") == "FAIL":
            return {
                "success": True,
                "face_verification": {
                    "status": "LIVENESS_FAILED",
                    "similarity": 0.0,
                    "passport_face": {"detected": True},
                    "live_face": {"detected": True},
                    "liveness": liveness_result,
                    "quality": {"passport_face": passport_qual, "live_face": live_qual},
                    "message": f"Liveness check failed: {liveness_result.get('message')}"
                }
            }

        # 5. Extract Embeddings & Compute Cosine Similarity
        passport_emb = self.extract_embedding(passport_img_bgr, passport_face)
        live_emb = self.extract_embedding(live_img_bgr, live_face)

        if passport_emb is None or live_emb is None:
            return {
                "success": True,
                "face_verification": {
                    "status": "REVIEW",
                    "similarity": 0.0,
                    "passport_face": {"detected": True},
                    "live_face": {"detected": True},
                    "liveness": liveness_result,
                    "quality": {"passport_face": passport_qual, "live_face": live_qual},
                    "message": "Facial landmark alignment failed. Recapture or perform manual verification."
                }
            }

        raw_similarity = self.compute_similarity(passport_emb, live_emb)
        similarity = round(float(raw_similarity), 4)

        # Map similarity score to status conservatively
        if similarity >= settings.FACE_MATCH_THRESHOLD:
            final_status = "MATCH"
            msg = "Face similarity is above the configured verification threshold."
        elif similarity >= settings.FACE_BORDERLINE_THRESHOLD:
            final_status = "REVIEW"
            msg = "Face similarity is borderline. Please recapture or perform manual verification."
        else:
            final_status = "MISMATCH"
            msg = "The live face does not sufficiently match the passport photograph."

        return {
            "success": True,
            "face_verification": {
                "status": final_status,
                "similarity": similarity,
                "passport_face": {
                    "detected": True
                },
                "live_face": {
                    "detected": True
                },
                "liveness": liveness_result,
                "quality": {
                    "passport_face": passport_qual,
                    "live_face": live_qual
                },
                "message": msg
            }
        }


# Singleton service instance
face_verification_service = FaceVerificationService()
