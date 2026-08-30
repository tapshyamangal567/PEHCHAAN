from app.schemas.screening import PassportFields, FieldConfidenceItem

class CombinationService:
    @staticmethod
    def combine_fields(
        visual_fields: PassportFields,
        mrz_data: dict | None,
        base_ocr_confidence: float
    ) -> tuple[PassportFields, dict[str, FieldConfidenceItem]]:
        """
        Combines Visual OCR fields and parsed MRZ fields based on source priority:
        MRZ > Visual OCR for passport_number, nationality, date_of_birth, gender, date_of_expiry.
        Generates per-field value, confidence, and source attribution.
        """
        has_mrz = mrz_data is not None and mrz_data.get("detected", False)
        mrz_valid = has_mrz and mrz_data.get("checksum_valid", False)

        mrz_conf = 0.96 if mrz_valid else (0.88 if has_mrz else 0.0)
        vis_conf = round(max(0.65, base_ocr_confidence), 2)

        # 1. Passport Number
        if has_mrz and mrz_data.get("passport_number"):
            pass_val = mrz_data["passport_number"]
            pass_conf = mrz_conf
            pass_src = "MRZ"
        elif visual_fields.passport_number:
            pass_val = visual_fields.passport_number
            pass_conf = vis_conf
            pass_src = "VISUAL_OCR"
        else:
            pass_val = None
            pass_conf = 0.0
            pass_src = "NONE"

        # 2. Nationality
        if has_mrz and mrz_data.get("nationality"):
            nat_val = mrz_data["nationality"]
            nat_conf = mrz_conf
            nat_src = "MRZ"
        elif visual_fields.nationality:
            nat_val = visual_fields.nationality
            nat_conf = vis_conf
            nat_src = "VISUAL_OCR"
        else:
            nat_val = None
            nat_conf = 0.0
            nat_src = "NONE"

        # 3. Date of Birth
        if has_mrz and mrz_data.get("date_of_birth"):
            dob_val = mrz_data["date_of_birth"]
            dob_conf = mrz_conf
            dob_src = "MRZ"
        elif visual_fields.date_of_birth:
            dob_val = visual_fields.date_of_birth
            dob_conf = vis_conf
            dob_src = "VISUAL_OCR"
        else:
            dob_val = None
            dob_conf = 0.0
            dob_src = "NONE"

        # 4. Gender
        if has_mrz and mrz_data.get("sex"):
            gen_val = mrz_data["sex"]
            gen_conf = mrz_conf
            gen_src = "MRZ"
        elif visual_fields.gender:
            gen_val = visual_fields.gender
            gen_conf = vis_conf
            gen_src = "VISUAL_OCR"
        else:
            gen_val = None
            gen_conf = 0.0
            gen_src = "NONE"

        # 5. Date of Expiry
        if has_mrz and mrz_data.get("date_of_expiry"):
            exp_val = mrz_data["date_of_expiry"]
            exp_conf = mrz_conf
            exp_src = "MRZ"
        elif visual_fields.date_of_expiry:
            exp_val = visual_fields.date_of_expiry
            exp_conf = vis_conf
            exp_src = "VISUAL_OCR"
        else:
            exp_val = None
            exp_conf = 0.0
            exp_src = "NONE"

        # 6. Full Name
        if has_mrz and mrz_data.get("full_name"):
            mrz_name = mrz_data["full_name"]
            vis_name = visual_fields.full_name
            if vis_name and (vis_name in mrz_name or mrz_name in vis_name):
                name_val = mrz_name
                name_conf = round(min(0.99, mrz_conf + 0.03), 2)
                name_src = "VISUAL_AND_MRZ"
            else:
                name_val = mrz_name
                name_conf = mrz_conf
                name_src = "MRZ"
        elif visual_fields.full_name:
            name_val = visual_fields.full_name
            name_conf = vis_conf
            name_src = "VISUAL_OCR"
        else:
            name_val = None
            name_conf = 0.0
            name_src = "NONE"

        # 7. Date of Issue (Only available in Visual OCR)
        if visual_fields.date_of_issue:
            doi_val = visual_fields.date_of_issue
            doi_conf = vis_conf
            doi_src = "VISUAL_OCR"
        else:
            doi_val = None
            doi_conf = 0.0
            doi_src = "NONE"

        combined_fields = PassportFields(
            full_name=name_val,
            passport_number=pass_val,
            nationality=nat_val,
            date_of_birth=dob_val,
            gender=gen_val,
            date_of_issue=doi_val,
            date_of_expiry=exp_val,
        )

        field_confidence = {
            "full_name": FieldConfidenceItem(value=name_val, confidence=name_conf, source=name_src),
            "passport_number": FieldConfidenceItem(value=pass_val, confidence=pass_conf, source=pass_src),
            "nationality": FieldConfidenceItem(value=nat_val, confidence=nat_conf, source=nat_src),
            "date_of_birth": FieldConfidenceItem(value=dob_val, confidence=dob_conf, source=dob_src),
            "gender": FieldConfidenceItem(value=gen_val, confidence=gen_conf, source=gen_src),
            "date_of_issue": FieldConfidenceItem(value=doi_val, confidence=doi_conf, source=doi_src),
            "date_of_expiry": FieldConfidenceItem(value=exp_val, confidence=exp_conf, source=exp_src),
        }

        return combined_fields, field_confidence

combination_service = CombinationService()
