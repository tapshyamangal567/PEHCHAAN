import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.services.risk_scoring_service import risk_scoring_service, RuleBasedRiskScoringEngine

class TestRiskScoringEngine(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.engine = RuleBasedRiskScoringEngine()

    def test_1_everything_passes_returns_low_risk(self):
        """TEST 1: Everything passes -> LOW risk, 0 score, 100% coverage."""
        payload = {
            "tampering_analysis": {"status": "LOW_SUSPICION"},
            "face_verification": {"status": "MATCH", "liveness": {"status": "PASS"}},
            "mrz": {"detected": True, "checksum_valid": True},
            "consistency": {"overall_status": "PASS"},
            "validation": {"overall_status": "PASS", "checks": {}},
            "liveness": {"status": "PASS"},
            "fields": {"date_of_expiry": "2030-12-31"}
        }
        res = self.engine.assess(payload)
        self.assertEqual(res["score"], 0)
        self.assertEqual(res["level"], "LOW")
        self.assertEqual(res["coverage"]["percentage"], 100)
        self.assertFalse(res["verification_incomplete"])
        self.assertEqual(res["recommendation"], "Proceed to officer review")

    def test_2_medium_tampering_increases_score(self):
        """TEST 2: Medium tampering suspicion -> Score increases by 15 pts."""
        payload = {
            "tampering_analysis": {"status": "MEDIUM_SUSPICION"},
            "face_verification": {"status": "MATCH"},
            "mrz": {"detected": True, "checksum_valid": True},
            "consistency": {"overall_status": "PASS"},
            "validation": {"overall_status": "PASS"},
            "liveness": {"status": "PASS"},
            "fields": {"date_of_expiry": "2030-12-31"}
        }
        res = self.engine.assess(payload)
        self.assertEqual(res["score"], 15)
        self.assertEqual(res["level"], "LOW")

    def test_3_high_tampering_and_face_mismatch_yields_high_risk(self):
        """TEST 3: High tampering (30) + face mismatch (25) + mrz failure (15) -> HIGH risk."""
        payload = {
            "tampering_analysis": {"status": "HIGH_SUSPICION"},
            "face_verification": {"status": "MISMATCH"},
            "mrz": {"detected": True, "checksum_valid": False},
            "consistency": {"overall_status": "PASS"},
            "validation": {"overall_status": "PASS"},
            "liveness": {"status": "PASS"},
            "fields": {"date_of_expiry": "2030-12-31"}
        }
        res = self.engine.assess(payload)
        self.assertGreaterEqual(res["score"], 60)
        self.assertEqual(res["level"], "HIGH")
        self.assertEqual(res["recommendation"], "Manual verification required")

    def test_4_expired_passport_deduplication(self):
        """TEST 4: Expired passport deduplicates failure penalty between Validation & Expiry factors."""
        payload = {
            "tampering_analysis": {"status": "LOW_SUSPICION"},
            "face_verification": {"status": "MATCH"},
            "mrz": {"detected": True, "checksum_valid": True},
            "consistency": {"overall_status": "PASS"},
            "validation": {
                "overall_status": "FAIL",
                "checks": {"expiry_date": {"status": "FAIL", "message": "Document expired"}}
            },
            "liveness": {"status": "PASS"},
            "fields": {"date_of_expiry": "2020-01-01"}
        }
        res = self.engine.assess(payload)
        # Validation gets 10 pts; Expiry gets 0 pts due to deduplication (already counted)
        self.assertEqual(res["score"], 10)
        expiry_factor = next(f for f in res["risk_factors"] if f["name"] == "Expiry Check")
        self.assertEqual(expiry_factor["points"], 0)
        self.assertIn("failure accounted for", expiry_factor["reason"].lower())

    def test_5_missing_data_does_not_artificially_spike_risk(self):
        """TEST 5: Missing fields yield NOT_AVAILABLE status, no fake score spike, set incomplete flag."""
        payload = {
            "tampering_analysis": {"status": "LOW_SUSPICION"},
            # Face verification, MRZ, consistency missing
            "validation": {"overall_status": "PASS"},
            "fields": {"date_of_expiry": "2030-12-31"}
        }
        res = self.engine.assess(payload)
        self.assertEqual(res["score"], 0)
        self.assertEqual(res["level"], "LOW")
        self.assertTrue(res["verification_incomplete"])
        self.assertLess(res["coverage"]["percentage"], 100)
        self.assertEqual(res["recommendation"], "Additional verification recommended")

    def test_6_face_mismatch_increases_score(self):
        """TEST 6: Face mismatch adds 25 pts to score."""
        payload = {
            "tampering_analysis": {"status": "LOW_SUSPICION"},
            "face_verification": {"status": "MISMATCH"},
            "mrz": {"detected": True, "checksum_valid": True},
            "consistency": {"overall_status": "PASS"},
            "validation": {"overall_status": "PASS"},
            "liveness": {"status": "PASS"},
            "fields": {"date_of_expiry": "2030-12-31"}
        }
        res = self.engine.assess(payload)
        self.assertEqual(res["score"], 25)
        self.assertEqual(res["level"], "LOW")

    def test_7_liveness_failed_increases_score(self):
        """TEST 7: Liveness failed adds 5 pts."""
        payload = {
            "tampering_analysis": {"status": "LOW_SUSPICION"},
            "face_verification": {"status": "MATCH"},
            "mrz": {"detected": True, "checksum_valid": True},
            "consistency": {"overall_status": "PASS"},
            "validation": {"overall_status": "PASS"},
            "liveness": {"status": "FAIL"},
            "fields": {"date_of_expiry": "2030-12-31"}
        }
        res = self.engine.assess(payload)
        self.assertEqual(res["score"], 5)

    def test_8_all_checks_unavailable_returns_insufficient_verification(self):
        """TEST 8: All checks missing returns insufficient verification recommendation, 0% coverage."""
        res = self.engine.assess({})
        self.assertEqual(res["coverage"]["percentage"], 0)
        self.assertTrue(res["verification_incomplete"])
        self.assertIn("insufficient", res["recommendation"].lower())

    def test_9_deterministic_score_reproducibility(self):
        """TEST 9: Same input repeated twice yields identical score and result."""
        payload = {
            "tampering_analysis": {"status": "MEDIUM_SUSPICION"},
            "face_verification": {"status": "REVIEW"},
            "mrz": {"detected": True, "checksum_valid": True},
            "consistency": {"overall_status": "PASS"},
            "validation": {"overall_status": "PASS"},
            "liveness": {"status": "PASS"},
            "fields": {"date_of_expiry": "2030-12-31"}
        }
        res1 = self.engine.assess(payload)
        res2 = self.engine.assess(payload)
        self.assertEqual(res1["score"], res2["score"])
        self.assertEqual(res1["level"], res2["level"])
        self.assertEqual(res1["risk_factors"], res2["risk_factors"])

    def test_10_api_endpoint_post_risk_assess(self):
        """TEST 10: API endpoint POST /api/risk/assess integration."""
        payload = {
            "tampering_analysis": {"status": "LOW_SUSPICION"},
            "face_verification": {"status": "MATCH"},
            "mrz": {"detected": True, "checksum_valid": True},
            "consistency": {"overall_status": "PASS"},
            "validation": {"overall_status": "PASS"},
            "liveness": {"status": "PASS"},
            "fields": {"date_of_expiry": "2030-12-31"}
        }
        response = self.client.post("/api/risk/assess", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("risk_assessment", data)
        ra = data["risk_assessment"]
        self.assertEqual(ra["score"], 0)
        self.assertEqual(ra["level"], "LOW")

if __name__ == "__main__":
    unittest.main()
