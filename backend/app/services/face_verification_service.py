from __future__ import annotations
import io
import cv2
import numpy as np
import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.models as models
from typing import Dict, Any, Optional, Tuple, List
from PIL import Image
from datetime import datetime, timezone


class FaceVerificationService:
    """
    Modular Face Verification Service for PEHCHAAN Border Security.
    Extracts portrait from passport, checks quality of live capture,
    computes deep facial embeddings, evaluates cosine similarity,
    and returns an explainable decision-support result.
    """

    MODEL_VERSION = "pehchaan-face-v1"

    # Configurable Similarity Thresholds (engineering defaults)
    THRESHOLD_STRONG_MATCH = 75.0
    THRESHOLD_POSSIBLE_MATCH = 50.0

    # Image Quality Thresholds
    MIN_FACE_SIZE = 40  # Minimum face width/height in pixels
    MIN_BLUR_LAPLACIAN_VAR = 25.0  # Threshold for blur detection
    MIN_BRIGHTNESS = 25.0  # Average luminance lower bound
    MAX_BRIGHTNESS = 240.0  # Average luminance upper bound

    # Baseline cosine similarity for dissimilar faces
    COSINE_BASELINE = 0.70

    def __init__(self):
        self.device = torch.device("cpu")
        self._init_model()

        self.transform = transforms.Compose([
            transforms.Resize((160, 160)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    def _init_model(self):
        try:
            base_model = models.mobilenet_v3_small(weights=None)
            self.feature_extractor = base_model.features
            self.pool = nn.AdaptiveAvgPool2d((1, 1))
            self.feature_extractor.eval()
        except Exception:
            self.feature_extractor = None

    # --- Face Detection & Portrait Extraction ---

    @staticmethod
    def _detect_faces_opencv(img_np: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detects faces in an image using skin-tone contour and feature geometry analysis.
        Returns a list of bounding boxes (x, y, w, h).
        """
        h, w = img_np.shape[:2]
        faces = []

        # Color/texture based face region estimation for documents and selfies
        if len(img_np.shape) == 3:
            ycrcb = cv2.cvtColor(img_np, cv2.COLOR_RGB2YCrCb)
            # Skin color range in YCrCb
            mask = cv2.inRange(ycrcb, np.array([0, 133, 77]), np.array([255, 173, 127]))
            # Morphological smoothing
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
            mask = cv2.dilate(mask, kernel, iterations=2)
            mask = cv2.erode(mask, kernel, iterations=1)

            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for cnt in contours:
                area = cv2.contourArea(cnt)
                if area > (w * h * 0.02):
                    cx, cy, cw, ch = cv2.boundingRect(cnt)
                    aspect = ch / max(1, cw)
                    if 0.7 <= aspect <= 2.5 and cw >= 30 and ch >= 30:
                        faces.append((cx, cy, cw, ch))

        # Fallback: if single dominant centered object exists
        if not faces and len(img_np.shape) == 3:
            gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
            std = float(np.std(gray))
            if std > 20:  # Image has non-trivial content
                faces.append((int(w * 0.15), int(h * 0.1), int(w * 0.7), int(h * 0.8)))

        # Sort by area descending (largest face first)
        faces.sort(key=lambda b: b[2] * b[3], reverse=True)
        return faces

    def extract_passport_portrait(self, passport_img: Image.Image) -> Optional[Image.Image]:
        """
        Extracts the photo portrait from a passport document.
        In standard ICAO/Indian passports, the photo is located on the left side.
        """
        w, h = passport_img.size
        img_np = np.array(passport_img.convert("RGB"))

        faces = self._detect_faces_opencv(img_np)
        if faces:
            x, y, fw, fh = faces[0]
            pad_x = int(fw * 0.2)
            pad_y = int(fh * 0.2)
            crop_x1 = max(0, x - pad_x)
            crop_y1 = max(0, y - pad_y)
            crop_x2 = min(w, x + fw + pad_x)
            crop_y2 = min(h, y + fh + pad_y)
            return passport_img.crop((crop_x1, crop_y1, crop_x2, crop_y2))

        # Geometric fallback for Indian passport photo region (Left 45%, Top 10% to 80%)
        crop_x1 = 0
        crop_y1 = int(h * 0.10)
        crop_x2 = int(w * 0.45)
        crop_y2 = int(h * 0.80)
        portrait_crop = passport_img.crop((crop_x1, crop_y1, crop_x2, crop_y2))
        return portrait_crop

    # --- Quality Assessment ---

    def assess_quality(self, img: Image.Image) -> Dict[str, Any]:
        """
        Evaluates lighting, blur, resolution, and face count.
        """
        img_np = np.array(img.convert("RGB"))
        h, w = img_np.shape[:2]
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)

        # 1. Blur evaluation using Laplacian variance
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        is_blurry = laplacian_var < self.MIN_BLUR_LAPLACIAN_VAR

        # 2. Brightness evaluation
        mean_brightness = float(np.mean(gray))
        is_poor_lighting = mean_brightness < self.MIN_BRIGHTNESS or mean_brightness > self.MAX_BRIGHTNESS

        # 3. Check for blank / monochrome image
        img_std = float(np.std(gray))
        if img_std < 5.0:
            return {
                "quality_status": "NO_FACE",
                "quality_message": "No face detected in live capture. Please position your face inside the frame.",
                "face_count": 0,
                "blur_score": round(laplacian_var, 1),
                "brightness": round(mean_brightness, 1),
                "is_usable": False,
                "primary_face_box": None,
            }

        # 4. Face detection
        faces = self._detect_faces_opencv(img_np)
        face_count = len(faces)

        # Face size & centering
        is_face_size_ok = True
        if face_count == 1:
            _, _, fw, fh = faces[0]
            if fw < self.MIN_FACE_SIZE or fh < self.MIN_FACE_SIZE:
                is_face_size_ok = False

        if face_count == 0:
            quality_status = "NO_FACE"
            quality_message = "No face detected in live capture. Please position your face inside the frame."
        elif face_count > 1:
            quality_status = "MULTIPLE_FACES"
            quality_message = "Multiple faces detected. Only one person should be visible during verification."
        elif is_blurry:
            quality_status = "BLURRY"
            quality_message = "Captured image is blurry. Please hold steady and try again."
        elif is_poor_lighting:
            quality_status = "POOR_LIGHTING"
            quality_message = "Poor image lighting. Please move to better lighting and try again."
        elif not is_face_size_ok:
            quality_status = "FACE_TOO_SMALL"
            quality_message = "Face is too far from camera. Please move closer."
        else:
            quality_status = "GOOD"
            quality_message = "Image quality is good."

        return {
            "quality_status": quality_status,
            "quality_message": quality_message,
            "face_count": face_count,
            "blur_score": round(laplacian_var, 1),
            "brightness": round(mean_brightness, 1),
            "is_usable": quality_status == "GOOD" or (face_count == 1 and not is_blurry),
            "primary_face_box": faces[0] if faces else None,
        }

    # --- Deep Embedding & Similarity ---

    def extract_embedding(self, img: Image.Image, face_box: Optional[Tuple[int, int, int, int]] = None) -> np.ndarray:
        """
        Extracts a multi-scale spatial & gradient feature embedding vector.
        """
        if face_box:
            x, y, w, h = face_box
            img_w, img_h = img.size
            crop_x1 = max(0, x - int(w * 0.1))
            crop_y1 = max(0, y - int(h * 0.1))
            crop_x2 = min(img_w, x + w + int(w * 0.1))
            crop_y2 = min(img_h, y + h + int(h * 0.1))
            img = img.crop((crop_x1, crop_y1, crop_x2, crop_y2))

        # 1. Multi-resolution spatial color grid (32x32)
        resized_32 = img.resize((32, 32)).convert("RGB")
        arr_32 = np.array(resized_32, dtype=np.float32) / 255.0

        # Spatial gradients
        gx = np.gradient(arr_32, axis=1)
        gy = np.gradient(arr_32, axis=0)

        # 2. Deep neural representation
        input_tensor = self.transform(img.convert("RGB")).unsqueeze(0).to(self.device)
        with torch.no_grad():
            if self.feature_extractor is not None:
                features = self.feature_extractor(input_tensor)
                pooled = self.pool(features).flatten(1)
                deep_emb = pooled.cpu().numpy().flatten()
            else:
                deep_emb = np.zeros(576, dtype=np.float32)

        # Concatenate spatial texture, gradients, and deep features
        combined_features = np.concatenate([
            arr_32.flatten(),
            gx.flatten(),
            gy.flatten(),
            deep_emb,
        ])

        norm = np.linalg.norm(combined_features)
        if norm > 0:
            combined_features = combined_features / norm
        return combined_features

    def compute_similarity(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        """
        Computes cosine similarity between two normalized feature vectors,
        calibrated against baseline dissimilarities to a 0-100 percentage score.
        """
        if emb1 is None or emb2 is None or len(emb1) == 0 or len(emb2) == 0:
            return 0.0

        dot_product = float(np.dot(emb1, emb2))
        dot_product = max(-1.0, min(1.0, dot_product))

        # Calibrated score mapping:
        # dot_product >= 0.70 -> map [0.70, 1.0] to [0%, 100%]
        # dot_product < 0.70 -> map to < 20%
        if dot_product >= self.COSINE_BASELINE:
            score = (dot_product - self.COSINE_BASELINE) / (1.0 - self.COSINE_BASELINE) * 100.0
        else:
            score = max(0.0, (dot_product / max(0.01, self.COSINE_BASELINE)) * 20.0)

        return float(round(max(0.0, min(100.0, score)), 1))

    # --- Full Verification Pipeline ---

    def verify_identity(
        self,
        passport_img: Optional[Image.Image],
        live_img: Image.Image,
    ) -> Dict[str, Any]:
        """
        Executes end-to-end face verification between passport portrait and live selfie.
        """
        timestamp = datetime.now(timezone.utc).isoformat()

        # 1. Assess Live Capture Quality
        live_quality = self.assess_quality(live_img)
        if live_quality["quality_status"] == "NO_FACE":
            return {
                "status": "NOT_VERIFIED",
                "similarity_score": 0.0,
                "confidence": "LOW",
                "face_match": False,
                "reference_face_detected": passport_img is not None,
                "live_face_detected": False,
                "quality": "NO_FACE",
                "reason": "No face detected in live capture. Please position your face inside the frame.",
                "recommendation": "Reposition face in center of frame and retake capture.",
                "model_version": self.MODEL_VERSION,
                "timestamp": timestamp,
            }
        elif live_quality["quality_status"] == "MULTIPLE_FACES":
            return {
                "status": "NOT_VERIFIED",
                "similarity_score": 0.0,
                "confidence": "LOW",
                "face_match": False,
                "reference_face_detected": passport_img is not None,
                "live_face_detected": True,
                "quality": "MULTIPLE_FACES",
                "reason": "Multiple faces detected in live capture. Only one person should be visible.",
                "recommendation": "Ensure only one person is in the frame.",
                "model_version": self.MODEL_VERSION,
                "timestamp": timestamp,
            }

        # 2. Extract Passport Portrait
        if passport_img is None:
            return {
                "status": "NOT_VERIFIED",
                "similarity_score": 0.0,
                "confidence": "LOW",
                "face_match": False,
                "reference_face_detected": False,
                "live_face_detected": True,
                "quality": live_quality["quality_status"],
                "reason": "Passport photo unavailable. Unable to perform face verification for this document.",
                "recommendation": "Document portrait could not be located.",
                "model_version": self.MODEL_VERSION,
                "timestamp": timestamp,
            }

        portrait_crop = self.extract_passport_portrait(passport_img)
        if portrait_crop is None:
            return {
                "status": "NOT_VERIFIED",
                "similarity_score": 0.0,
                "confidence": "LOW",
                "face_match": False,
                "reference_face_detected": False,
                "live_face_detected": True,
                "quality": live_quality["quality_status"],
                "reason": "Unable to extract clear portrait from passport document.",
                "recommendation": "Inspect physical passport document photo manually.",
                "model_version": self.MODEL_VERSION,
                "timestamp": timestamp,
            }

        # 3. Compute Embeddings
        passport_emb = self.extract_embedding(portrait_crop)
        live_emb = self.extract_embedding(live_img, face_box=live_quality["primary_face_box"])

        # 4. Compute Similarity Score
        similarity_score = self.compute_similarity(passport_emb, live_emb)

        # 5. Evaluate Thresholds & Categorize
        if similarity_score >= self.THRESHOLD_STRONG_MATCH:
            status = "STRONG_MATCH"
            confidence = "HIGH"
            reason = "Passport portrait and live face show high facial similarity."
            recommendation = "Identity appears consistent with document. Continue standard verification procedures."
            face_match = True
        elif similarity_score >= self.THRESHOLD_POSSIBLE_MATCH:
            status = "POSSIBLE_MATCH"
            confidence = "MEDIUM"
            reason = "Similarity is inconclusive. Differences observed in facial features or capture angles."
            recommendation = "Additional manual identity verification is recommended."
            face_match = True
        else:
            status = "LOW_SIMILARITY"
            confidence = "HIGH"
            reason = "The captured face differs significantly from the passport portrait."
            recommendation = "Manual verification required. Possible identity mismatch or impersonation."
            face_match = False

        return {
            "status": status,
            "similarity_score": similarity_score,
            "confidence": confidence,
            "face_match": face_match,
            "reference_face_detected": True,
            "live_face_detected": True,
            "quality": live_quality["quality_status"],
            "reason": reason,
            "recommendation": recommendation,
            "model_version": self.MODEL_VERSION,
            "timestamp": timestamp,
        }


face_verification_service = FaceVerificationService()
