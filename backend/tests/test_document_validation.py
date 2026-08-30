import unittest
from app.schemas.screening import PassportFields, MRZResponseData, ConsistencyCheckResponse
from app.services.document_validation_service import document_validation_service

class TestDocumentValidationService(unittest.TestCase):
    def test_valid_passport_all_pass(self):
        fields = PassportFields(
            full_name="MEHTA ARJUN",
            passport_number="A1234567",
            nationality="IND",
            date_of_birth="15/08/1990",
            gender="M",
            date_of_issue="10/01/2020",
            date_of_expiry="09/01/2030"
        )
        mrz = MRZResponseData(
            detected=True,
            line1="P<INDMEHTA<<ARJUN<<<<<<<<<<<<<<<<<<<<<<<<<<<",
            line2="A1234567<6IND9008157M3001097<<<<<<<<<<<<<<<4",
            checksum_valid=True
        )
        consistency = ConsistencyCheckResponse(
            name_match=True,
            passport_number_match=True,
            dob_match=True,
            expiry_match=True,
            overall_status="PASS",
            overall_message="Information is consistent between Visual OCR and MRZ."
        )

        res = document_validation_service.validate_document(fields, mrz, consistency, None)

        self.assertEqual(res["overall_status"], "PASS")
        self.assertEqual(res["overall_message"], "Document checks passed")
        self.assertEqual(res["checks"]["mrz_detected"]["status"], "PASS")
        self.assertEqual(res["checks"]["mrz_structure"]["status"], "PASS")
        self.assertEqual(res["checks"]["date_of_expiry"]["status"], "PASS")
        self.assertEqual(res["checks"]["ocr_mrz_consistency"]["status"], "PASS")

    def test_expired_passport_fails(self):
        fields = PassportFields(
            full_name="DOE JOHN",
            passport_number="Z9876543",
            nationality="IND",
            date_of_birth="01/01/1980",
            gender="M",
            date_of_issue="01/01/2010",
            date_of_expiry="01/01/2020" # Past date -> Expired!
        )
        mrz = MRZResponseData(
            detected=True,
            line1="P<INDDOE<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<",
            line2="Z9876543<6IND8001017M2001017<<<<<<<<<<<<<<<4",
            checksum_valid=True
        )
        consistency = ConsistencyCheckResponse(
            name_match=True,
            passport_number_match=True,
            dob_match=True,
            expiry_match=True,
            overall_status="PASS"
        )

        res = document_validation_service.validate_document(fields, mrz, consistency, None)

        self.assertEqual(res["overall_status"], "FAIL")
        self.assertEqual(res["checks"]["date_of_expiry"]["status"], "FAIL")
        self.assertIn("expired", res["checks"]["date_of_expiry"]["message"].lower())

    def test_mismatched_consistency_fails(self):
        fields = PassportFields(
            full_name="MEHTA ARJUN",
            passport_number="A1234567",
            nationality="IND",
            date_of_birth="15/08/1990",
            gender="M",
            date_of_issue="10/01/2020",
            date_of_expiry="09/01/2030"
        )
        mrz = MRZResponseData(
            detected=True,
            line1="P<INDMEHTA<<ARJUN<<<<<<<<<<<<<<<<<<<<<<<<<<<",
            line2="A1234567<6IND9008157M3001097<<<<<<<<<<<<<<<4",
            checksum_valid=True
        )
        consistency = ConsistencyCheckResponse(
            name_match=False,
            passport_number_match=True,
            dob_match=True,
            expiry_match=True,
            overall_status="FAIL",
            overall_message="Conflicting information detected between Visual OCR and MRZ."
        )

        res = document_validation_service.validate_document(fields, mrz, consistency, None)

        self.assertEqual(res["overall_status"], "FAIL")
        self.assertEqual(res["checks"]["ocr_mrz_consistency"]["status"], "FAIL")

    def test_missing_mrz_yields_review(self):
        fields = PassportFields(
            full_name="MEHTA ARJUN",
            passport_number="A1234567",
            nationality="IND",
            date_of_birth="15/08/1990",
            gender="M",
            date_of_issue="10/01/2020",
            date_of_expiry="09/01/2030"
        )
        mrz = MRZResponseData(detected=False)
        consistency = ConsistencyCheckResponse(overall_status="NOT_AVAILABLE")

        res = document_validation_service.validate_document(fields, mrz, consistency, None)

        self.assertEqual(res["overall_status"], "REVIEW")
        self.assertEqual(res["checks"]["mrz_detected"]["status"], "NOT_AVAILABLE")
        self.assertEqual(res["checks"]["mrz_structure"]["status"], "NOT_AVAILABLE")

if __name__ == "__main__":
    unittest.main()
