import unittest
import io
import uuid
import asyncio
from PIL import Image, ImageDraw
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from app.models.user import User, UserRole
from app.models.verification import VerificationRecord, RiskLevel
from app.services.verification_service import run_verification
from app.schemas.screening import PassportScreeningResponse


class TestOfflineSync(unittest.TestCase):
    """Unit tests for PEHCHAAN Offline Synchronization & Idempotency."""

    def setUp(self):
        self.officer = User(
            id=uuid.uuid4(),
            username="OFF-8842",
            email="officer8842@gov.in",
            password_hash="mockhash",
            role=UserRole.OFFICER,
            is_active=True,
        )

    @staticmethod
    def _create_synthetic_passport_bytes() -> bytes:
        img = Image.new("RGB", (600, 400), color=(240, 240, 240))
        d = ImageDraw.Draw(img)
        d.rectangle([20, 20, 200, 260], fill=(200, 160, 140))
        d.text((230, 40), "REPUBLIC OF INDIA", fill=(0, 0, 0))
        d.text((230, 80), "P<INDTEST<<SAMPLE<<<<<<<<<<<<<<<<<<<", fill=(0, 0, 0))
        b = io.BytesIO()
        img.save(b, format="JPEG")
        return b.getvalue()

    def test_idempotent_offline_sync_duplicate_prevention(self):
        """Test: If a local_case_id was already synced, repeat call returns existing record without duplicates."""
        mock_db = MagicMock()

        existing_record = VerificationRecord(
            id=uuid.uuid4(),
            verification_id="VER-1234567890AB",
            local_case_id="OFF-20260831-00042",
            officer_id=self.officer.id,
            document_type="passport",
            document_number="Z1234567",
            nationality="IND",
            full_name="SAMPLE TEST",
            is_offline_sync=True,
            risk_score=10.0,
            risk_level=RiskLevel.LOW,
        )

        mock_query = MagicMock()
        mock_filter = MagicMock()
        mock_filter.first.return_value = existing_record
        mock_query.filter.return_value = mock_filter
        mock_db.query.return_value = mock_query

        mock_upload_file = MagicMock()
        mock_upload_file.read = MagicMock(return_value=self._create_synthetic_passport_bytes())
        mock_upload_file.content_type = "image/jpeg"

        res = asyncio.run(
            run_verification(
                file=mock_upload_file,
                officer=self.officer,
                db=mock_db,
                local_case_id="OFF-20260831-00042",
                is_offline_sync=True,
            )
        )

        self.assertTrue(res.success)
        self.assertEqual(res.verification_id, "VER-1234567890AB")
        self.assertEqual(res.fields.passport_number, "Z1234567")
        # Ensure add was NOT called on the duplicate
        mock_db.add.assert_not_called()


if __name__ == "__main__":
    unittest.main()
