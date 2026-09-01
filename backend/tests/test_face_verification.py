import unittest
import io
import numpy as np
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.services.face_verification_service import face_verification_service
from app.services.liveness_service import BasicLivenessDetector


class TestFaceVerification(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        self.liveness_detector = BasicLivenessDetector()

        # Create a synthetic blank image without a face
        blank_np = np.full((300, 300, 3), 200, dtype=np.uint8)
        self.blank_image_bgr = blank_np.copy()

        # Create JPEG bytes for API upload testing
        pil_blank = Image.fromarray(blank_np)
        buf_blank = io.BytesIO()
        pil_blank.save(buf_blank, format="JPEG")
        self.blank_bytes = buf_blank.getvalue()

    def test_liveness_detector_basic(self):
        """Test BasicLivenessDetector challenge evaluation."""

        # Empty payload -> PASS
        res_empty = self.liveness_detector.verify(None)

        self.assertEqual(res_empty["status"], "PASS")
        self.assertIsNone(res_empty["confidence"])
        self.assertEqual(res_empty["method"], "basic_challenge")

        # Passed challenge
        res_pass = self.liveness_detector.verify({
            "challenges_completed": [
                "look_camera",
                "turn_head_left"
            ],
            "passed": True,
            "motion_detected": True
        })

        self.assertEqual(res_pass["status"], "PASS")
        self.assertIsNone(res_pass["confidence"])

        # Failed challenge
        res_fail = self.liveness_detector.verify({
            "challenges_completed": ["look_camera"],
            "passed": False,
            "motion_detected": False
        })

        self.assertEqual(res_fail["status"], "FAIL")
        self.assertIsNone(res_fail["confidence"])

    def test_passport_without_face_returns_passport_face_not_found(self):
        """Image with no face should yield PASSPORT_FACE_NOT_FOUND."""

        res = face_verification_service.verify_faces(
            passport_img_bgr=self.blank_image_bgr,
            live_img_bgr=self.blank_image_bgr
        )

        self.assertTrue(res["success"])

        verification = res["face_verification"]

        self.assertEqual(
            verification["status"],
            "PASSPORT_FACE_NOT_FOUND"
        )

        self.assertFalse(
            verification["passport_face"]["detected"]
        )

    def test_live_face_missing_returns_live_face_not_found(self):
        """Passport face exists but live face is missing."""

        original_detect = face_verification_service.detect_faces

        dummy_face = np.array(
            [
                50, 50, 100, 100,
                70, 70,
                120, 70,
                95, 95,
                75, 120,
                115, 120,
                0.95
            ],
            dtype=np.float32
        )

        def mock_detect(img):
            if (
                img.shape == self.blank_image_bgr.shape
                and np.array_equal(img, self.blank_image_bgr)
            ):
                return [dummy_face]

            return []

        face_verification_service.detect_faces = mock_detect

        try:
            live_blank = np.zeros(
                (300, 300, 3),
                dtype=np.uint8
            )

            res = face_verification_service.verify_faces(
                passport_img_bgr=self.blank_image_bgr,
                live_img_bgr=live_blank
            )

            self.assertEqual(
                res["face_verification"]["status"],
                "LIVE_FACE_NOT_FOUND"
            )

            self.assertTrue(
                res["face_verification"]["passport_face"]["detected"]
            )

            self.assertFalse(
                res["face_verification"]["live_face"]["detected"]
            )

        finally:
            face_verification_service.detect_faces = original_detect

    def test_multiple_live_faces_returns_multiple_faces(self):
        """Multiple faces should return MULTIPLE_FACES."""

        original_detect = face_verification_service.detect_faces

        dummy_face1 = np.array(
            [
                10, 10, 80, 80,
                30, 30,
                70, 30,
                50, 50,
                35, 70,
                65, 70,
                0.9
            ],
            dtype=np.float32
        )

        dummy_face2 = np.array(
            [
                150, 150, 80, 80,
                170, 170,
                210, 170,
                190, 190,
                175, 210,
                205, 210,
                0.9
            ],
            dtype=np.float32
        )

        def mock_detect(img):
            if img.shape[0] == 300:
                if img[0, 0, 0] == 200:
                    return [dummy_face1]

                return [dummy_face1, dummy_face2]

            return []

        face_verification_service.detect_faces = mock_detect

        try:
            live_multi = (
                np.ones((300, 300, 3), dtype=np.uint8) * 50
            )

            res = face_verification_service.verify_faces(
                passport_img_bgr=self.blank_image_bgr,
                live_img_bgr=live_multi
            )

            self.assertEqual(
                res["face_verification"]["status"],
                "MULTIPLE_FACES"
            )

        finally:
            face_verification_service.detect_faces = original_detect

    def test_similarity_status_mapping(self):
        """Test MATCH, REVIEW and MISMATCH thresholds."""

        original_detect = face_verification_service.detect_faces
        original_quality = face_verification_service.evaluate_face_quality
        original_embed = face_verification_service.extract_embedding
        original_match = face_verification_service.compute_similarity

        dummy_face = np.array(
            [
                50, 50, 100, 100,
                70, 70,
                120, 70,
                95, 95,
                75, 120,
                115, 120,
                0.95
            ],
            dtype=np.float32
        )

        dummy_emb = np.ones(
            (1, 128),
            dtype=np.float32
        )

        face_verification_service.detect_faces = (
            lambda img: [dummy_face]
        )

        face_verification_service.evaluate_face_quality = (
            lambda img, face: ("GOOD", "Sufficient")
        )

        face_verification_service.extract_embedding = (
            lambda img, face: dummy_emb
        )

        try:

            # High similarity -> MATCH
            face_verification_service.compute_similarity = (
                lambda e1, e2: 0.85
            )

            res_match = face_verification_service.verify_faces(
                self.blank_image_bgr,
                self.blank_image_bgr
            )

            self.assertEqual(
                res_match["face_verification"]["status"],
                "MATCH"
            )

            self.assertEqual(
                res_match["face_verification"]["similarity"],
                0.85
            )

            # Borderline similarity -> REVIEW
            face_verification_service.compute_similarity = (
                lambda e1, e2: 0.42
            )

            res_review = face_verification_service.verify_faces(
                self.blank_image_bgr,
                self.blank_image_bgr
            )

            self.assertEqual(
                res_review["face_verification"]["status"],
                "REVIEW"
            )

            # Low similarity -> MISMATCH
            face_verification_service.compute_similarity = (
                lambda e1, e2: 0.20
            )

            res_mismatch = face_verification_service.verify_faces(
                self.blank_image_bgr,
                self.blank_image_bgr
            )

            self.assertEqual(
                res_mismatch["face_verification"]["status"],
                "MISMATCH"
            )

        finally:
            face_verification_service.detect_faces = original_detect
            face_verification_service.evaluate_face_quality = original_quality
            face_verification_service.extract_embedding = original_embed
            face_verification_service.compute_similarity = original_match

    def test_api_endpoint(self):
        """Test POST /api/verification/face endpoint."""

        files = {
            "passport_image": (
                "passport.jpg",
                self.blank_bytes,
                "image/jpeg"
            ),
            "live_face_image": (
                "live.jpg",
                self.blank_bytes,
                "image/jpeg"
            )
        }

        response = self.client.post(
            "/api/verification/face",
            files=files
        )

        self.assertEqual(
            response.status_code,
            200
        )

        data = response.json()

        self.assertTrue(data["success"])
        self.assertIn(
            "face_verification",
            data
        )

        verification = data["face_verification"]

        self.assertIn(
            "status",
            verification
        )

        self.assertIn(
            "similarity",
            verification
        )

        self.assertIn(
            "liveness",
            verification
        )


if __name__ == "__main__":
    unittest.main()