import unittest
from app.blockchain.hashing import (
    compute_document_hash,
    compute_result_hash,
    compute_case_hash,
    canonicalize_and_hash,
)


class TestBlockchainHashing(unittest.TestCase):
    def test_document_hashing(self):
        sample_bytes = b"PEHCHAAN_IMMUTABLE_PASSPORT_SAMPLE"
        h1 = compute_document_hash(sample_bytes)
        h2 = compute_document_hash(sample_bytes)
        self.assertEqual(h1, h2)
        self.assertTrue(h1.startswith("0x"))
        self.assertEqual(len(h1), 66)

    def test_deterministic_key_ordering(self):
        """Confirm that dictionary key insertion order does NOT change the canonical hash."""
        dict1 = {"z_field": 100, "a_field": "alpha", "m_field": [1, 2, 3]}
        dict2 = {"a_field": "alpha", "m_field": [1, 2, 3], "z_field": 100}
        h1 = canonicalize_and_hash(dict1)
        h2 = canonicalize_and_hash(dict2)
        self.assertEqual(h1, h2)

    def test_result_hash(self):
        res_h1 = compute_result_hash(
            verification_result="PASS",
            risk_score=12.5,
            risk_level="LOW",
            mrz_valid=True,
            tampering_status="LOW_SUSPICION",
            face_status="MATCH",
        )
        res_h2 = compute_result_hash(
            verification_result="PASS",
            risk_score=12.5,
            risk_level="LOW",
            mrz_valid=True,
            tampering_status="LOW_SUSPICION",
            face_status="MATCH",
        )
        self.assertEqual(res_h1, res_h2)
        self.assertTrue(res_h1.startswith("0x"))

        # Altering risk score must alter result hash
        res_h_altered = compute_result_hash(
            verification_result="PASS",
            risk_score=85.0,  # modified
            risk_level="LOW",
            mrz_valid=True,
            tampering_status="LOW_SUSPICION",
            face_status="MATCH",
        )
        self.assertNotEqual(res_h1, res_h_altered)

    def test_case_hash(self):
        doc_h = compute_document_hash(b"test_image")
        res_h = compute_result_hash(verification_result="PASS", risk_score=10.0, risk_level="LOW")
        case_h1 = compute_case_hash(
            case_id="VER-TEST-100",
            document_hash=doc_h,
            result_hash=res_h,
            timestamp_iso="2026-09-01T10:00:00Z",
        )
        case_h2 = compute_case_hash(
            case_id="VER-TEST-100",
            document_hash=doc_h,
            result_hash=res_h,
            timestamp_iso="2026-09-01T10:00:00Z",
        )
        self.assertEqual(case_h1, case_h2)


if __name__ == "__main__":
    unittest.main()
