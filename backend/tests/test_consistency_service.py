import unittest
from app.schemas.screening import PassportFields
from app.services.consistency_service import consistency_service

class TestConsistencyService(unittest.TestCase):
    def test_case_1_name_normalization(self):
        fields = PassportFields(full_name="DOE JOHN")
        mrz_data = {"detected": True, "full_name": "DOE<<JOHN"}
        res = consistency_service.check_consistency(fields, mrz_data)
        self.assertEqual(res["name_status"], "PASS")
        self.assertTrue(res["name_match"])

    def test_case_2_passport_number_spaces(self):
        fields = PassportFields(passport_number=" A123 4567 ")
        mrz_data = {"detected": True, "passport_number": "A1234567"}
        res = consistency_service.check_consistency(fields, mrz_data)
        self.assertEqual(res["passport_number_status"], "PASS")
        self.assertTrue(res["passport_number_match"])

    def test_case_3_date_matching(self):
        fields = PassportFields(date_of_birth="15-08-1995")
        mrz_data = {"detected": True, "date_of_birth": "950815"}
        res = consistency_service.check_consistency(fields, mrz_data)
        self.assertEqual(res["dob_status"], "PASS")
        self.assertTrue(res["dob_match"])

    def test_case_4_missing_ocr_dob(self):
        fields = PassportFields(date_of_birth=None)
        mrz_data = {"detected": True, "date_of_birth": "950815"}
        res = consistency_service.check_consistency(fields, mrz_data)
        self.assertEqual(res["dob_status"], "NOT_AVAILABLE")
        self.assertIsNone(res["dob_match"])
        self.assertNotEqual(res["overall_status"], "FAIL")

    def test_case_5_conflicting_passport_number(self):
        fields = PassportFields(passport_number="A1234567")
        mrz_data = {"detected": True, "passport_number": "Z9876543"}
        res = consistency_service.check_consistency(fields, mrz_data)
        self.assertEqual(res["passport_number_status"], "FAIL")
        self.assertFalse(res["passport_number_match"])
        self.assertEqual(res["overall_status"], "FAIL")

    def test_case_6_missing_ocr_expiry(self):
        fields = PassportFields(date_of_expiry=None)
        mrz_data = {"detected": True, "date_of_expiry": "300109"}
        res = consistency_service.check_consistency(fields, mrz_data)
        self.assertEqual(res["expiry_status"], "NOT_AVAILABLE")
        self.assertIsNone(res["expiry_match"])

    def test_case_7_gender_normalization(self):
        fields = PassportFields(gender="Male")
        mrz_data = {"detected": True, "gender": "M"}
        res = consistency_service.check_consistency(fields, mrz_data)
        self.assertEqual(res["gender_status"], "PASS")

    def test_case_8_completely_unrelated(self):
        fields = PassportFields(full_name="SMITH ALICE", passport_number="X1111111")
        mrz_data = {"detected": True, "full_name": "MEHTA ARJUN", "passport_number": "A1234567"}
        res = consistency_service.check_consistency(fields, mrz_data)
        self.assertEqual(res["overall_status"], "FAIL")

if __name__ == "__main__":
    unittest.main()
