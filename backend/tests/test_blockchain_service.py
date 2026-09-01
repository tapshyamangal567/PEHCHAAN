import unittest
import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock

from app.models.verification import VerificationRecord, VerificationStatus, RiskLevel
from app.models.user import User, UserRole
from app.blockchain.service import blockchain_service


class TestBlockchainService(unittest.TestCase):
    def setUp(self):
        self.officer = User(
            id=uuid.uuid4(),
            username="OFF-8842",
            role=UserRole.OFFICER,
            is_active=True,
        )

    def test_anchor_and_tamper_detection(self):
        # 1. Create a pristine verification record
        rec = VerificationRecord(
            id=uuid.uuid4(),
            verification_id="VER-BC-TEST-001",
            officer_id=self.officer.id,
            document_type="passport",
            document_number="Z1234567",
            nationality="IND",
            full_name="Tapasya Mangal",
            verification_status=VerificationStatus.COMPLETED,
            risk_score=15.0,
            risk_level=RiskLevel.LOW,
            verification_result="PASS",
            created_at=datetime.now(timezone.utc),
        )

        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_filter = MagicMock()
        mock_filter.first.return_value = rec
        mock_query.filter.return_value = mock_filter
        mock_db.query.return_value = mock_query

        # 2. Anchor to blockchain
        res = blockchain_service.prepare_and_anchor(
            db=mock_db,
            verification_id="VER-BC-TEST-001",
            raw_image_bytes=b"sample_passport_image_bytes",
        )
        self.assertTrue(res["success"])
        self.assertEqual(res["status"], "CONFIRMED")
        self.assertIsNotNone(res["tx_hash"])
        self.assertIsNotNone(res["case_hash"])
        self.assertEqual(rec.blockchain_status, "CONFIRMED")

        # 3. Verify integrity of untouched database record -> MUST BE VALID
        int_res1 = blockchain_service.verify_integrity(mock_db, "VER-BC-TEST-001")
        self.assertTrue(int_res1["success"])
        self.assertEqual(int_res1["integrity"], "VALID")
        self.assertEqual(int_res1["case_id"], "VER-BC-TEST-001")

        # 4. Duplicate prevention test -> Repeated anchor call returns same tx_hash without duplicate
        dup_res = blockchain_service.prepare_and_anchor(
            db=mock_db,
            verification_id="VER-BC-TEST-001",
        )
        self.assertTrue(dup_res["success"])
        self.assertEqual(dup_res["tx_hash"], res["tx_hash"])
        self.assertTrue(dup_res.get("is_duplicate"))

        # 5. Tampering Demonstration: Malicious actor edits risk_score directly in DB
        rec.risk_score = 95.0
        rec.risk_level = RiskLevel.CRITICAL
        rec.verification_result = "FAIL"

        # 6. Verify integrity -> MUST FAIL AND FLAG TAMPERING
        int_res2 = blockchain_service.verify_integrity(mock_db, "VER-BC-TEST-001")
        self.assertTrue(int_res2["success"])
        self.assertEqual(int_res2["integrity"], "FAILED")
        self.assertIn("Tampering Detected", int_res2["reason"])


if __name__ == "__main__":
    unittest.main()
