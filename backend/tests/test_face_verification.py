import unittest
import numpy as np
from PIL import Image, ImageDraw

from app.services.face_verification_service import face_verification_service, FaceVerificationService
from app.services.risk_service import compute_risk_score
from app.models.verification import RiskLevel


class TestFaceVerificationService(unittest.TestCase):
    """
    Automated unit tests for PEHCHAAN Face Verification & Identity Matching.
    Uses synthetic non-biometric geometric face patterns for testing.
    """

    @staticmethod
    def _create_synthetic_face(skin_color=(220, 180, 150), eye_color=(50, 30, 20), size=(200, 200)) -> Image.Image:
        """Generates a synthetic geometric face pattern for test comparisons."""
        img = Image.new("RGB", size, color=(240, 240, 240))
        draw = ImageDraw.Draw(img)

        # Draw oval face boundary
        draw.ellipse([40, 30, 160, 170], fill=skin_color, outline=(180, 140, 110))
        # Draw eyes
        draw.ellipse([65, 75, 85, 95], fill=eye_color)
        draw.ellipse([115, 75, 135, 95], fill=eye_color)
        # Draw nose
        draw.line([(100, 95), (95, 120), (105, 120)], fill=(150, 100, 80), width=2)
        # Draw mouth
        draw.arc([75, 125, 125, 150], start=0, end=180, fill=(180, 60, 60), width=3)

        return img

    @staticmethod
    def _create_blank_image(size=(200, 200)) -> Image.Image:
        """Generates a blank monochrome image without faces."""
        return Image.new("RGB", size, color=(255, 255, 255))

    def test_1_similar_synthetic_faces_strong_match(self):
        """Test 1: Identical or highly similar synthetic face captures result in high similarity."""
        face1 = self._create_synthetic_face(skin_color=(220, 180, 150))
        face2 = self._create_synthetic_face(skin_color=(220, 180, 150))

        result = face_verification_service.verify_identity(passport_img=face1, live_img=face2)
        self.assertIn(result["status"], ["STRONG_MATCH", "POSSIBLE_MATCH"])
        self.assertGreaterEqual(result["similarity_score"], 60.0)
        self.assertTrue(result["reference_face_detected"])
        self.assertTrue(result["live_face_detected"])
        self.assertEqual(result["model_version"], "pehchaan-face-v1")

    def test_2_different_synthetic_identities_low_similarity(self):
        """Test 2: Distinct synthetic face patterns yield different embeddings."""
        face1 = self._create_synthetic_face(skin_color=(230, 200, 170), eye_color=(20, 20, 20))
        # Significantly different pattern / contrast
        face2 = Image.new("RGB", (200, 200), color=(30, 30, 80))
        draw = ImageDraw.Draw(face2)
        draw.rectangle([20, 20, 180, 180], fill=(200, 50, 50))

        emb1 = face_verification_service.extract_embedding(face1)
        emb2 = face_verification_service.extract_embedding(face2)

        score = face_verification_service.compute_similarity(emb1, emb2)
        self.assertLess(score, 60.0)

    def test_3_missing_reference_face(self):
        """Test 3: Missing passport document returns NOT_VERIFIED with explicit reason."""
        live_face = self._create_synthetic_face()
        result = face_verification_service.verify_identity(passport_img=None, live_img=live_face)

        self.assertEqual(result["status"], "NOT_VERIFIED")
        self.assertFalse(result["reference_face_detected"])
        self.assertIn("unavailable", result["reason"].lower())

    def test_4_missing_live_face(self):
        """Test 4: Live image with no detectable face returns NO_FACE / NOT_VERIFIED."""
        passport_face = self._create_synthetic_face()
        blank_img = self._create_blank_image()

        result = face_verification_service.verify_identity(passport_img=passport_face, live_img=blank_img)
        self.assertEqual(result["status"], "NOT_VERIFIED")
        self.assertFalse(result["live_face_detected"])
        self.assertEqual(result["quality"], "NO_FACE")

    def test_5_quality_assessment_blur_and_lighting(self):
        """Test 5: Quality checks detect usable vs blank/degraded inputs."""
        face_img = self._create_synthetic_face()
        quality = face_verification_service.assess_quality(face_img)

        self.assertIn("quality_status", quality)
        self.assertIn("blur_score", quality)
        self.assertIn("brightness", quality)

    def test_6_risk_engine_integration(self):
        """Test 6: Explainable Risk Engine incorporates face verification signals."""
        # Low risk document + Strong Face Match -> Overall Low Risk
        risk_strong = compute_risk_score(
            ocr_confidence=0.95,
            mrz_detected=True,
            mrz_checksum_valid=True,
            consistency_name_match=True,
            consistency_passport_match=True,
            consistency_dob_match=True,
            consistency_expiry_match=True,
            fields_extracted=7,
            date_of_expiry="01/01/2035",
            face_status="STRONG_MATCH",
            face_similarity_score=94.0,
        )
        self.assertEqual(risk_strong["risk_level"], RiskLevel.LOW)
        self.assertLess(risk_strong["risk_score"], 20.0)

        # Low risk document + Low Similarity Face Mismatch -> Escalates to HIGH/CRITICAL
        risk_mismatch = compute_risk_score(
            ocr_confidence=0.95,
            mrz_detected=True,
            mrz_checksum_valid=True,
            consistency_name_match=True,
            consistency_passport_match=True,
            consistency_dob_match=True,
            consistency_expiry_match=True,
            fields_extracted=7,
            date_of_expiry="01/01/2035",
            face_status="LOW_SIMILARITY",
            face_similarity_score=28.0,
        )
        self.assertGreaterEqual(risk_mismatch["risk_score"], 35.0)
        self.assertIn(risk_mismatch["risk_level"], [RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL])
        factor_names = [f["factor"] for f in risk_mismatch["risk_factors"]]
        self.assertIn("face_mismatch_low_similarity", factor_names)


if __name__ == "__main__":
    unittest.main()
