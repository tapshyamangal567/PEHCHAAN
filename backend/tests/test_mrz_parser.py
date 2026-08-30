import unittest
from app.services.mrz_parser_service import MRZParserService
from app.services.mrz_service import MRZService
from app.services.combination_service import CombinationService
from app.schemas.screening import PassportFields

class TestMRZParser(unittest.TestCase):

    def test_1_valid_td3_mrz(self):
        """Test 1: Valid TD3 MRZ parsing and field extraction."""
        line1 = "P<INDMEHTA<<ARJUN<<<<<<<<<<<<<<<<<<<<<<<<<<<"
        line2 = "A1234567<6IND9008157M3001097<<<<<<<<<<<<<<<4"

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
        self.assertTrue(result["checksum_valid"])

    def test_2_noisy_td3_mrz(self):
        """Test 2: Noisy TD3 MRZ with character confusions corrected."""
        # Line 1 has '1' instead of 'I' in country code, line 2 has 'O' instead of '0' in dates
        line1_noisy = "P<1NDMEHTA<<ARJUN<<<<<<<<<<<<<<<<<<<<<<<<<<<"
        line2_noisy = "A1234567<6IND9O08157M3O01O97<<<<<<<<<<<<<<<4"

        result = MRZParserService.parse_td3_mrz(line1_noisy, line2_noisy)
        
        self.assertTrue(result["detected"])
        self.assertEqual(result["issuing_country"], "IND")
        self.assertEqual(result["date_of_birth"], "15/08/1990")
        self.assertEqual(result["date_of_expiry"], "09/01/2030")

    def test_3_incomplete_mrz(self):
        """Test 3: Incomplete MRZ (only 1 line readable) is NOT fabricated."""
        line1 = "P<INDMEHTA<<ARJUN<<<<<<<<<<<<<<<<<<<<<<<<<<<"
        line2_short = "A1234567<3"

        result = MRZParserService.parse_td3_mrz(line1, line2_short)
        self.assertFalse(result["detected"])

    def test_4_normal_text_rejection(self):
        """Test 4: Normal visual document text like 'DATE OF EXPIRE' is rejected."""
        res1 = MRZParserService.parse_td3_mrz(
            "DATE<OF<EXPIRE<<J<<<<<<<<<<<<<<<<<<<<<<<<<<<",
            "AA1112223333<<<<<<<DDMMYY<<<<<<<AAA111222333"
        )
        self.assertFalse(res1["detected"])

        res2 = MRZParserService.parse_td3_mrz(
            "PASSPORT<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<",
            "REPUBLIC<OF<INDIA<<<<<<<<<<<<<<<<<<<<<<<<<<<"
        )
        self.assertFalse(res2["detected"])

    def test_5_random_ocr_text_rejection(self):
        """Test 5: Random OCR text blocks rejected."""
        raw_text = "SAMPLE PASSPORT TEXT\nSOME HEADER HERE\nSURNAME SMITH\nFIRST NAME JOHN"
        blocks = [{"text": line} for line in raw_text.split('\n')]

        detected = MRZService.detect_mrz_lines(raw_text, blocks)
        self.assertIsNone(detected)

    def test_6_checksum_valid_mrz(self):
        """Test 6: Valid MRZ checksum verification."""
        line1 = "P<INDMEHTA<<ARJUN<<<<<<<<<<<<<<<<<<<<<<<<<<<"
        line2 = "A1234567<6IND9008157M3001097<<<<<<<<<<<<<<<4"

        result = MRZParserService.parse_td3_mrz(line1, line2)
        self.assertTrue(result["detected"])
        self.assertTrue(result["checksum_valid"])

    def test_7_checksum_invalid_mrz(self):
        """Test 7: MRZ with invalid check digits returns checksum_valid = False."""
        line1 = "P<INDMEHTA<<ARJUN<<<<<<<<<<<<<<<<<<<<<<<<<<<"
        # Changed check digit of passport number from 6 to 9
        line2_bad_check = "A1234567<9IND9008157M3001097<<<<<<<<<<<<<<<4"

        result = MRZParserService.parse_td3_mrz(line1, line2_bad_check)
        self.assertTrue(result["detected"])
        self.assertFalse(result["checksum_valid"])

if __name__ == "__main__":
    unittest.main()
