
from __future__ import annotations
import re
import logging
from datetime import datetime

logger = logging.getLogger("pehchaan.mrz_parser_service")

class MRZParserService:
    @staticmethod
    def calculate_check_digit(data_str: str) -> str:
        """
        Calculates ICAO 9303 check digit using 7-3-1 weighting sequence.
        Char values: '0'..'9' -> 0..9, 'A'..'Z' -> 10..35, '<' -> 0.
        """
        weights = [7, 3, 1]
        total = 0

        for i, char in enumerate(data_str):
            if char.isdigit():
                val = int(char)
            elif 'A' <= char <= 'Z':
                val = ord(char) - ord('A') + 10
            elif char == '<':
                val = 0
            else:
                val = 0

            weight = weights[i % 3]
            total += val * weight

        return str(total % 10)

    @staticmethod
    def parse_td3_mrz(line1: str, line2: str) -> dict:
        """
        Parses a 2-line TD3 Passport MRZ after running field-specific character correction
        and strict structural/checksum validation.
        Returns detected=False if candidate fails structural MRZ checks.
        """
        if not line1 or not line2 or len(line1) < 15 or len(line2) < 15:
            return {
                "detected": False,
                "status": "NOT_AVAILABLE",
                "structure_valid": False,
                "checksum_valid": None
            }

        # Normalize lines to standard 44 chars for TD3 positional slicing
        line1_norm = line1.ljust(44, '<')[:44]
        line2_norm = line2.ljust(44, '<')[:44]

        # Auto-normalize P + 3-letter country code if chevron was dropped by OCR (e.g., PIND -> P<IND)
        if line1_norm.startswith('P') and not line1_norm.startswith('P<'):
            if len(line1_norm) >= 4 and MRZParserService._fix_alpha(line1_norm[1:4]).isalpha():
                line1_norm = 'P<' + line1_norm[1:]

        # ----------------- STRUCTURAL VALIDATION GATEKEEPER -----------------
        structure_valid = MRZParserService._validate_td3_structure(line1_norm, line2_norm)
        if not structure_valid:
            return {
                "detected": False,
                "status": "REVIEW",
                "structure_valid": False,
                "checksum_valid": None
            }

        # ----------------- PARSE LINE 1 (Positional Expectations: Alpha) -----------------
        document_type = line1_norm[0:2].replace('<', '')
        issuing_country = MRZParserService._fix_alpha(line1_norm[2:5]).replace('<', '')

        name_section = line1_norm[5:44]
        name_parts = name_section.split('<<')
        
        surname_raw = name_parts[0].replace('<', ' ') if len(name_parts) > 0 and name_parts[0] else None
        given_raw = name_parts[1].replace('<', ' ') if len(name_parts) > 1 and name_parts[1] else None

        surname = MRZParserService._fix_alpha(surname_raw).strip() if surname_raw else None
        given_names = MRZParserService._fix_alpha(given_raw).strip() if given_raw else None
        
        full_name = f"{surname or ''} {given_names or ''}".strip() or None

        # ----------------- PARSE LINE 2 (Positional Expectations: Digit / Alpha) -----------------
        raw_passport_num = line2_norm[0:9]
        passport_num_check = MRZParserService._fix_digits(line2_norm[9:10])
        
        # Try digit/alpha fix on passport number with check digit matching
        fixed_passport_num = MRZParserService._try_fix_passport_number_with_checksum(raw_passport_num, passport_num_check)
        passport_number = fixed_passport_num.replace('<', '') or None

        nationality = MRZParserService._fix_alpha(line2_norm[10:13]).replace('<', '') or None
        
        raw_dob_str = line2_norm[13:19]
        dob_check = MRZParserService._fix_digits(line2_norm[19:20])
        fixed_dob_str = MRZParserService._try_fix_digit_with_checksum(
            MRZParserService._fix_digits(raw_dob_str), dob_check
        )
        date_of_birth = MRZParserService._format_mrz_date(fixed_dob_str, is_birth=True)

        raw_sex_char = line2_norm[20:21].upper()
        if raw_sex_char in ['M', 'F']:
            sex = raw_sex_char
        elif raw_sex_char in ['0', 'O']:
            sex = 'M'
        else:
            sex = None

        raw_expiry_str = line2_norm[21:27]
        expiry_check = MRZParserService._fix_digits(line2_norm[27:28])
        fixed_expiry_str = MRZParserService._try_fix_digit_with_checksum(
            MRZParserService._fix_digits(raw_expiry_str), expiry_check
        )
        date_of_expiry = MRZParserService._format_mrz_date(fixed_expiry_str, is_birth=False)

        raw_optional = line2_norm[28:42]
        opt_check = MRZParserService._fix_digits(line2_norm[42:43])
        optional_data = raw_optional.replace('<', '') or None

        composite_check = MRZParserService._fix_digits(line2_norm[43:44])

        # ----------------- CHECKSUM VALIDATION -----------------
        pass_num_calc = MRZParserService.calculate_check_digit(fixed_passport_num)
        pass_num_valid = (pass_num_calc == passport_num_check) if passport_num_check.isdigit() else False

        dob_calc = MRZParserService.calculate_check_digit(fixed_dob_str)
        dob_valid = (dob_calc == dob_check) if (fixed_dob_str.isdigit() and len(fixed_dob_str) == 6 and dob_check.isdigit()) else False

        expiry_calc = MRZParserService.calculate_check_digit(fixed_expiry_str)
        expiry_valid = (expiry_calc == expiry_check) if (fixed_expiry_str.isdigit() and len(fixed_expiry_str) == 6 and expiry_check.isdigit()) else False

        optional_valid = True
        if raw_optional.replace('<', '') and opt_check.isdigit():
            optional_valid = (MRZParserService.calculate_check_digit(raw_optional) == opt_check)

        composite_valid = None
        if composite_check.isdigit():
            composite_input = line2_norm[0:10] + line2_norm[13:20] + line2_norm[21:43]
            composite_calc = MRZParserService.calculate_check_digit(composite_input)
            composite_valid = (composite_calc == composite_check)

        if pass_num_valid and dob_valid and expiry_valid and (composite_valid is not False):
            checksum_valid = True
            mrz_status = "PASS"
        elif pass_num_valid or dob_valid or expiry_valid:
            checksum_valid = False
            mrz_status = "REVIEW"
        else:
            checksum_valid = False
            mrz_status = "FAIL"

        checksum_details = {
            "passport_number": {
                "value": fixed_passport_num,
                "check_digit": passport_num_check,
                "valid": pass_num_valid
            },
            "date_of_birth": {
                "value": fixed_dob_str,
                "check_digit": dob_check,
                "valid": dob_valid
            },
            "date_of_expiry": {
                "value": fixed_expiry_str,
                "check_digit": expiry_check,
                "valid": expiry_valid
            },
            "optional": {
                "value": raw_optional,
                "check_digit": opt_check,
                "valid": optional_valid
            },
            "composite": {
                "check_digit": composite_check,
                "valid": composite_valid if composite_valid is not None else True
            }
        }

        # Safe debug logging (No PII / passport numbers logged)
        logger.info(
            f"MRZ validation: lines=2, lengths=[{len(line1_norm)},{len(line2_norm)}], "
            f"structure={'PASS' if structure_valid else 'FAIL'}, "
            f"passport_checksum={'PASS' if pass_num_valid else 'FAIL'}, "
            f"dob_checksum={'PASS' if dob_valid else 'FAIL'}, "
            f"expiry_checksum={'PASS' if expiry_valid else 'FAIL'}, "
            f"composite_checksum={'PASS' if composite_valid else 'FAIL'}, "
            f"final_status={mrz_status}"
        )

        return {
            "detected": True,
            "status": mrz_status,
            "structure_valid": structure_valid,
            "line1": line1,
            "line2": line2,
            "document_type": document_type,
            "issuing_country": issuing_country,
            "surname": surname,
            "given_names": given_names,
            "full_name": full_name,
            "passport_number": passport_number,
            "nationality": nationality,
            "date_of_birth": date_of_birth,
            "sex": sex,
            "date_of_expiry": date_of_expiry,
            "optional_data": optional_data,
            "checksum_valid": checksum_valid,
            "checksum_details": checksum_details
        }

    @staticmethod
    def _validate_td3_structure(line1: str, line2: str) -> bool:
        """
        Validates structural TD3 MRZ characteristics before accepting candidate pair:
        - Line 1 starts with P / P< or contains '<'
        - Line 1 issuing country is 3 alpha characters (or fixable)
        - Line 2 passport number contains alphanumeric structure (not visual text words)
        """
        l1 = line1.ljust(44, '<')[:44]
        l2 = line2.ljust(44, '<')[:44]

        if l1.startswith('P') and not l1.startswith('P<'):
            if len(l1) >= 4 and MRZParserService._fix_alpha(l1[1:4]).isalpha():
                l1 = 'P<' + l1[1:]

        # Ensure line 1 and line 2 are not visual text words
        if any(w in l1.upper() for w in ["PASSPORT", "PASSFORT", "REPUBLIC", "DATEOF", "EXPIRE"]):
            return False
        if any(w in l2.upper() for w in ["PASSPORT", "PASSFORT", "REPUBLIC", "DATEOF", "EXPIRE", "INDIA"]):
            return False

        # 1. Document code check: TD3 Passport MRZ Line 1 must start with 'P'
        if not (l1.startswith('P<') or l1.startswith('P')):
            return False

        # 2. Passport number check (Positions 0-8 of Line 2)
        pass_num = MRZParserService._fix_passport_number(l2[0:9]).replace('<', '')
        if len(pass_num) < 4:
            return False

        return True

    @staticmethod
    def _fix_alpha(s: str) -> str:
        """Fixes OCR character confusion for strictly alphabetical MRZ fields."""
        if not s:
            return ""
        res = s.upper()
        res = res.replace('RN', 'M')
        res = res.replace('0', 'O').replace('1', 'I').replace('8', 'B').replace('5', 'S').replace('6', 'G')
        return res

    @staticmethod
    def _fix_digits(s: str) -> str:
        """Fixes OCR character confusion for strictly numerical MRZ fields."""
        if not s:
            return ""
        res = s.upper()
        res = res.replace('O', '0').replace('I', '1').replace('L', '1').replace('Z', '2').replace('S', '5').replace('B', '8').replace('G', '6')
        return res

    @staticmethod
    def _try_fix_digit_with_checksum(digit_str: str, check_digit: str) -> str:
        """
        Attempts single-character OCR digit substitution if initial string fails check digit calculation.
        """
        if len(digit_str) != 6 or not check_digit.isdigit():
            return digit_str

        if MRZParserService.calculate_check_digit(digit_str) == check_digit:
            return digit_str

        confusions = {
            '0': ['8', '6', '9'],
            '8': ['0', '3', '6'],
            '6': ['5', '0', '8'],
            '1': ['7', '4'],
            '7': ['1', '2'],
            '3': ['8', '5'],
            '5': ['6', '3'],
            '4': ['1', '9'],
            '9': ['4', '0']
        }

        chars = list(digit_str)
        for i, char in enumerate(chars):
            if char in confusions:
                for replacement in confusions[char]:
                    chars[i] = replacement
                    candidate = "".join(chars)
                    if MRZParserService.calculate_check_digit(candidate) == check_digit:
                        return candidate
                chars[i] = char

        return digit_str

    @staticmethod
    def _try_fix_passport_number_with_checksum(pass_str: str, check_digit: str) -> str:
        """
        Attempts OCR substitution on raw passport number if check digit doesn't match initially.
        """
        if not pass_str or not check_digit.isdigit():
            return MRZParserService._fix_passport_number(pass_str)

        initial = MRZParserService._fix_passport_number(pass_str)
        if MRZParserService.calculate_check_digit(initial) == check_digit:
            return initial

        confusions_pos0 = {'4': 'A', '0': 'O', '1': 'I', '8': 'B', '5': 'S', '6': 'G', '2': 'Z', '7': 'T', '9': 'P', '3': 'B'}
        
        # Test pos 0 fix
        chars = list(initial)
        if chars[0] in confusions_pos0:
            candidate_list = list(chars)
            candidate_list[0] = confusions_pos0[chars[0]]
            candidate = "".join(candidate_list)
            if MRZParserService.calculate_check_digit(candidate) == check_digit:
                return candidate

        # Positional substitution table for digits
        for i in range(1, len(chars)):
            orig = chars[i]
            if orig in confusions_pos0:
                chars[i] = confusions_pos0[orig]
                candidate = "".join(chars)
                if MRZParserService.calculate_check_digit(candidate) == check_digit:
                    return candidate
                chars[i] = orig

        return initial

    @staticmethod
    def _fix_passport_number(s: str) -> str:
        """
        Fixes passport number characters: position 0 is usually a letter (if digit '0', fix to 'O'),
        while positions 1-8 are primarily digits unless alphanumeric.
        """
        if not s:
            return ""
        res = list(s.upper())
        if res[0] == '0':
            res[0] = 'O'
        elif res[0] == '1':
            res[0] = 'I'
        elif res[0] == '4':
            res[0] = 'A'
            
        for i in range(1, len(res)):
            if res[i] in ['O', 'I', 'L', 'Z', 'S', 'B', 'G']:
                res[i] = MRZParserService._fix_digits(res[i])
        return "".join(res)

    @staticmethod
    def _format_mrz_date(yymmdd: str, is_birth: bool = False) -> str | None:
        if len(yymmdd) != 6 or not yymmdd.isdigit():
            return None

        yy = int(yymmdd[0:2])
        mm = int(yymmdd[2:4])
        dd = int(yymmdd[4:6])

        if mm < 1 or mm > 12 or dd < 1 or dd > 31:
            return None

        current_year = datetime.now().year
        current_century = (current_year // 100) * 100
        two_digit_current = current_year % 100

        if is_birth:
            yyyy = (current_century - 100 + yy) if yy > two_digit_current else (current_century + yy)
        else:
            yyyy = (current_century + yy) if yy < 50 else (current_century - 100 + yy)

        return f"{dd:02d}/{mm:02d}/{yyyy}"

mrz_parser_service = MRZParserService()
