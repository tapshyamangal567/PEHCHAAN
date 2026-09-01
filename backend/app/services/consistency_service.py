from __future__ import annotations
import re
from datetime import datetime
from typing import Dict, Any, Optional, List, Union

from app.schemas.screening import PassportFields


class ConsistencyService:
    """
    Noise-tolerant, conservative, field-specific consistency validation service
    between Visual OCR and MRZ fields.
    """

    # --- Normalization Utilities ---

    @staticmethod
    def normalize_name(name_str: Optional[str]) -> Optional[str]:
        if not name_str:
            return None
        # Upper, replace '<' filler with space, remove non-alphanumeric except space
        cleaned = name_str.upper().replace('<', ' ')
        cleaned = re.sub(r'[^A-Z0-9\s]', '', cleaned)
        # Collapse multiple spaces
        cleaned = ' '.join(cleaned.split())
        return cleaned if cleaned else None

    @staticmethod
    def normalize_passport_number(pass_str: Optional[str]) -> Optional[str]:
        if not pass_str:
            return None
        # Upper, strip spaces, hyphens, and non-alphanumeric
        cleaned = pass_str.upper().strip()
        cleaned = re.sub(r'[^A-Z0-9]', '', cleaned)
        return cleaned if cleaned else None

    @staticmethod
    def normalize_date(date_str: Optional[str]) -> Optional[str]:
        if not date_str:
            return None
        s = date_str.strip().upper()
        clean_digits = re.sub(r'[^0-9]', '', s)

        # 1. YYMMDD (6 digits, MRZ standard format)
        if len(clean_digits) == 6:
            yy = int(clean_digits[0:2])
            mm = clean_digits[2:4]
            dd = clean_digits[4:6]
            yyyy = 1900 + yy if yy > 50 else 2000 + yy
            return f"{dd.zfill(2)}/{mm.zfill(2)}/{yyyy}"

        # 2. Formats with delimiters like DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD
        parts = re.split(r'[-/.\s]+', s)
        if len(parts) == 3:
            p1, p2, p3 = parts[0], parts[1], parts[2]
            if len(p3) == 4 and len(p1) <= 2:  # DD MM YYYY
                return f"{p1.zfill(2)}/{p2.zfill(2)}/{p3}"
            elif len(p1) == 4 and len(p3) <= 2:  # YYYY MM DD
                return f"{p3.zfill(2)}/{p2.zfill(2)}/{p1}"
            elif len(p1) == 2 and len(p2) == 2 and len(p3) == 2:  # DD MM YY
                yy = int(p3)
                yyyy = 1900 + yy if yy > 50 else 2000 + yy
                return f"{p1.zfill(2)}/{p2.zfill(2)}/{yyyy}"

        # 3. 8 digits DDMMYYYY or YYYYMMDD
        if len(clean_digits) == 8:
            if int(clean_digits[:4]) > 1900:  # YYYYMMDD
                return f"{clean_digits[6:8]}/{clean_digits[4:6]}/{clean_digits[:4]}"
            else:  # DDMMYYYY
                return f"{clean_digits[:2]}/{clean_digits[2:4]}/{clean_digits[4:8]}"

        return None

    @staticmethod
    def normalize_gender(gender_str: Optional[str]) -> Optional[str]:
        if not gender_str:
            return None
        g = gender_str.strip().upper()
        if g in ['M', 'MALE']:
            return 'M'
        if g in ['F', 'FEMALE']:
            return 'F'
        if g in ['X', 'UNSPECIFIED', '<']:
            return 'X'
        return None

    @staticmethod
    def normalize_country_code(country_str: Optional[str]) -> Optional[str]:
        if not country_str:
            return None
        c = country_str.strip().upper()
        mappings = {
            'INDIAN': 'IND',
            'INDIA': 'IND',
            'USA': 'USA',
            'UNITED STATES': 'USA',
            'GBR': 'GBR',
            'UNITED KINGDOM': 'GBR',
            'CAN': 'CAN',
            'CANADA': 'CAN',
            'AUS': 'AUS',
            'AUSTRALIA': 'AUS',
        }
        if c in mappings:
            return mappings[c]
        cleaned = re.sub(r'[^A-Z]', '', c)
        return cleaned[:3] if len(cleaned) >= 3 else cleaned

    # --- Match Logics ---

    @classmethod
    def compare_names(cls, vis_name: Optional[str], mrz_name: Optional[str]) -> str:
        norm_vis = cls.normalize_name(vis_name)
        norm_mrz = cls.normalize_name(mrz_name)

        if not norm_vis or not norm_mrz:
            return "NOT_AVAILABLE"

        vis_tokens = norm_vis.split()
        mrz_tokens = norm_mrz.split()

        set_vis = set(vis_tokens)
        set_mrz = set(mrz_tokens)

        if set_vis == set_mrz or set_vis.issubset(set_mrz) or set_mrz.issubset(set_vis):
            return "PASS"

        # Check token-by-token fuzzy/substring match for OCR noise (e.g., ARJUN vs ARJUNA)
        if len(vis_tokens) == len(mrz_tokens):
            match_count = 0
            for t_vis, t_mrz in zip(vis_tokens, mrz_tokens):
                if t_vis == t_mrz or t_vis in t_mrz or t_mrz in t_vis:
                    match_count += 1
                elif abs(len(t_vis) - len(t_mrz)) <= 2:
                    common = sum(1 for c in set(t_vis) if c in set(t_mrz))
                    if common >= max(len(t_vis), len(t_mrz)) - 2:
                        match_count += 1
            if match_count == len(vis_tokens):
                return "PASS"

        overlap = len(set_vis.intersection(set_mrz))
        if overlap >= max(1, min(len(set_vis), len(set_mrz))):
            return "PASS"

        return "FAIL"

    @classmethod
    def compare_passport_numbers(cls, vis_pass: Optional[str], mrz_pass: Optional[str]) -> str:
        norm_vis = cls.normalize_passport_number(vis_pass)
        norm_mrz = cls.normalize_passport_number(mrz_pass)

        if not norm_vis or not norm_mrz:
            return "NOT_AVAILABLE"

        if norm_vis == norm_mrz:
            return "PASS"

        # Apply conservative OCR character substitutions (O<->0, I<->1, Z<->2, S<->5, B<->8, A<->4, G<->6)
        def soften(s: str) -> str:
            return s.translate(str.maketrans('OIZSBAG0125846', '01258460125846'))

        if soften(norm_vis) == soften(norm_mrz):
            return "PASS"

        return "FAIL"

    @classmethod
    def compare_dates(cls, vis_date: Optional[str], mrz_date: Optional[str]) -> str:
        norm_vis = cls.normalize_date(vis_date)
        norm_mrz = cls.normalize_date(mrz_date)

        if not norm_vis or not norm_mrz:
            return "NOT_AVAILABLE"

        if norm_vis == norm_mrz:
            return "PASS"

        return "FAIL"

    @classmethod
    def compare_genders(cls, vis_gen: Optional[str], mrz_gen: Optional[str]) -> str:
        norm_vis = cls.normalize_gender(vis_gen)
        norm_mrz = cls.normalize_gender(mrz_gen)

        if not norm_vis or not norm_mrz:
            return "NOT_AVAILABLE"

        if norm_vis == norm_mrz:
            return "PASS"

        return "FAIL"

    @classmethod
    def compare_nationalities(cls, vis_nat: Optional[str], mrz_nat: Optional[str]) -> str:
        norm_vis = cls.normalize_country_code(vis_nat)
        norm_mrz = cls.normalize_country_code(mrz_nat)

        if not norm_vis or not norm_mrz:
            return "NOT_AVAILABLE"

        if norm_vis == norm_mrz:
            return "PASS"

        return "FAIL"

    def check_consistency(self, visual_fields: PassportFields, mrz_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Executes robust field-level consistency validation and computes overall status.
        """
        if not mrz_data or not mrz_data.get("detected", False):
            mrz_dict = {}
        else:
            mrz_dict = mrz_data

        name_status = self.compare_names(visual_fields.full_name, mrz_dict.get("full_name"))
        pass_status = self.compare_passport_numbers(visual_fields.passport_number, mrz_dict.get("passport_number"))
        dob_status = self.compare_dates(visual_fields.date_of_birth, mrz_dict.get("date_of_birth"))
        exp_status = self.compare_dates(visual_fields.date_of_expiry, mrz_dict.get("date_of_expiry"))
        gen_status = self.compare_genders(visual_fields.gender, mrz_dict.get("gender") or mrz_dict.get("sex"))
        nat_status = self.compare_nationalities(visual_fields.nationality, mrz_dict.get("nationality"))

        statuses = [name_status, pass_status, dob_status, exp_status, gen_status, nat_status]

        has_fail = "FAIL" in statuses
        pass_count = statuses.count("PASS")
        na_count = statuses.count("NOT_AVAILABLE")

        if has_fail:
            overall_status = "FAIL"
            overall_message = "Conflicting information detected between Visual OCR and MRZ."
        elif pass_count >= 1 and na_count == 0:
            overall_status = "PASS"
            overall_message = "Information is consistent between Visual OCR and MRZ."
        elif pass_count >= 1 and na_count > 0:
            overall_status = "PASS"
            overall_message = "Available fields are consistent between Visual OCR and MRZ."
        elif na_count == len(statuses):
            overall_status = "NOT_AVAILABLE"
            overall_message = "Insufficient data to perform OCR vs MRZ consistency check."
        else:
            overall_status = "REVIEW"
            overall_message = "Some fields could not be compared between Visual OCR and MRZ."

        # Maintain boolean backwards compatibility
        name_match = True if name_status == "PASS" else (False if name_status == "FAIL" else None)
        passport_number_match = True if pass_status == "PASS" else (False if pass_status == "FAIL" else None)
        dob_match = True if dob_status == "PASS" else (False if dob_status == "FAIL" else None)
        expiry_match = True if exp_status == "PASS" else (False if exp_status == "FAIL" else None)

        return {
            "name_match": name_match,
            "passport_number_match": passport_number_match,
            "dob_match": dob_match,
            "expiry_match": expiry_match,
            "name_status": name_status,
            "passport_number_status": pass_status,
            "dob_status": dob_status,
            "expiry_status": exp_status,
            "gender_status": gen_status,
            "nationality_status": nat_status,
            "overall_status": overall_status,
            "overall_message": overall_message,
        }


consistency_service = ConsistencyService()
