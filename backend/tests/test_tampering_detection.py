import unittest
import numpy as np
from PIL import Image
from app.services.tampering_detection_service import tampering_detection_service, ForensicBaselineDetector

class TestTamperingDetectionService(unittest.TestCase):
    def setUp(self):
        # Create a synthetic passport image (800x600)
        img_np = np.full((600, 800, 3), 240, dtype=np.uint8)
        # Add some text / texture noise
        noise = np.random.randint(0, 20, (600, 800, 3), dtype=np.uint8)
        img_np = np.clip(img_np.astype(int) - noise.astype(int), 0, 255).astype(np.uint8)
        self.sample_image = Image.fromarray(img_np)

    def test_normal_image_analysis(self):
        res = tampering_detection_service.analyze(self.sample_image)
        self.assertIn(res["status"], ["LOW_SUSPICION", "MEDIUM_SUSPICION", "HIGH_SUSPICION", "INCONCLUSIVE"])
        self.assertIsNone(res["confidence"])
        self.assertEqual(res["method"], "opencv_forensic_baseline")
        self.assertEqual(res["model_version"], "baseline-1.0")
        
        signals = res["signals"]
        self.assertIn("compression_anomaly", signals)
        self.assertIn("texture_anomaly", signals)
        self.assertIn("noise_anomaly", signals)
        self.assertIn("edge_anomaly", signals)
        self.assertIn("illumination_anomaly", signals)

    def test_low_quality_image_yields_inconclusive(self):
        # Extremely small low-res image (10x10)
        tiny_img = Image.new("RGB", (10, 10), color="white")
        res = tampering_detection_service.analyze(tiny_img)
        self.assertEqual(res["status"], "INCONCLUSIVE")
        self.assertIn("quality is too low", res["reasons"][0].lower())

    def test_detector_inheritance(self):
        detector = ForensicBaselineDetector()
        res = detector.analyze(self.sample_image)
        self.assertIsNotNone(res)

if __name__ == "__main__":
    unittest.main()
