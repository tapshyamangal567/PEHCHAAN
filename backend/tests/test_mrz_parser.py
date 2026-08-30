import unittest
from app.services.mrz_parser_service import MRZParserService
from app.services.mrz_service import MRZService
from app.services.combination_service import CombinationService
from app.services.consistency_service import ConsistencyService
from app.schemas.screening import PassportFields

class TestMRZParser(unittest.TestCase):

    def test_calculate_check_digit(self):
        """Test ICAO 9303 7-3-1 check digit calculation algorithm."""
        check_digit = MRZParserService.calculate_check_digit("L898902C<")
        self.assertEqual(check_digit, "3")

        dob_check = MRZParserService.calculate_check_digit("740812")
        self.assertEqual(dob_check, "2")

    def test_parse_valid_td3_mrz(self):
        """Test complete valid TD3 passport MRZ line 1 and line 2 parsing."""
        line1 = "P<INDMEHTA<<ARJUN<<<<<<<<<<<<<<<<<<<<<<<<<<<"
        line2 = "A1234567<3IND9008154M3001095<<<<<<<<<<<<<<02"

        result = MRZParserService.parse_td3_mrz(line1, line2)
        
        self.assertTrue(result["detected"])
        self.assertEqual(result["document_type"], "P")
        self.assertEqual(result["issuing_country"], "IND")
        self.assertEqual(result["surname"], "MEHTA")
        self.assertEqual(result["given_names"], "ARJUN")
        self.assertEqual(result["full_name"], "MEHTA ARJUN")
        self.assertEqual(result["passport_number"], "A1234567")
        self.assertEqual(result["nationality"], "IND")
        self.assertEqual(result["date_of_birth"], "15/08/1990")
        self.assertEqual(result["sex"], "M")
        self.assertEqual(result["date_of_expiry"], "09/01/2030")

    def test_reject_ordinary_document_labels_as_mrz(self):
        """Verify that ordinary visual OCR text & document labels are NEVER detected as MRZ."""
        # 1. DATE OF EXPIRE label
        res1 = MRZParserService.parse_td3_mrz(
            "DATE<OF<EXPIRE<<J<<<<<<<<<<<<<<<<<<<<<<<<<<<",
            "AA1112223333<<<<<<<DDMMYY<<<<<<<AAA111222333"
        )
        self.assertFalse(res1["detected"])

        # 2. PASSPORT label
        res2 = MRZParserService.parse_td3_mrz(
            "PASSPORT<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<",
            "REPUBLIC<OF<INDIA<<<<<<<<<<<<<<<<<<<<<<<<<<<"
        )
        self.assertFalse(res2["detected"])

        # 3. DATE OF BIRTH label
        res3 = MRZParserService.parse_td3_mrz(
            "DATE<OF<BIRTH<15081990<<<<<<<<<<<<<<<<<<<<<<",
            "NATIONALITY<IND<<<<<<<<<<<<<<<<<<<<<<<<<<<<<"
        )
        self.assertFalse(res3["detected"])

    def test_reject_false_candidates_in_mrz_service(self):
        """Verify that MRZService candidate search rejects ordinary text lines."""
        raw_text = "PASSFORT\nREPUBLIC OF INDIA\nPASSFORT NO A1234567\nSURNAME MEHTA\nGIVEN NAME ARJUN\nDATE OF EXPIRE 09/01/2030"
        blocks = [{"text": line} for line in raw_text.split('\n')]

        detected = MRZService.detect_mrz_lines(raw_text, blocks)
        self.assertIsNone(detected)

    def test_positional_character_correction(self):
        """Test positional letter/digit corrections."""
        fixed_pass = MRZParserService._fix_numeric_alpha_mix("A123456O7")
        self.assertEqual(fixed_pass, "A12345607")

        fixed_alpha = MRZParserService._fix_alpha("IN1")
        self.assertEqual(fixed_alpha, "INI")

    def test_field_combination_priority(self):
        """Test that MRZ values take priority over Visual OCR values ONLY when valid MRZ is present."""
        visual = PassportFields(
            full_name="JOHN DOE",
            passport_number="A1234567",
            nationality="IND",
            date_of_birth="15/08/1990",
            gender="M"
        )
        
        mrz_data = {
            "detected": True,
            "passport_number": "A1234567",
            "nationality": "IND",
            "date_of_birth": "15/08/1990",
            "sex": "M",
            "date_of_expiry": "09/01/2030",
            "full_name": "DOE JOHN",
            "checksum_valid": True
        }

        combined, confidence = CombinationService.combine_fields(visual, mrz_data, 0.85)
        
        self.assertEqual(combined.passport_number, "A1234567")
        self.assertEqual(confidence["passport_number"].source, "MRZ")

if __name__ == "__main__":
    unittest.main()
