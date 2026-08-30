from app.schemas.screening import PassportFields

class ConsistencyService:
    @staticmethod
    def check_consistency(visual_fields: PassportFields, mrz_data: dict | None) -> dict[str, bool | None]:
        """
        Compares Visual OCR extracted fields against MRZ extracted fields.
        Returns match status (True, False, or None if comparison is impossible).
        """
        if not mrz_data or not mrz_data.get("detected", False):
            return {
                "name_match": None,
                "passport_number_match": None,
                "dob_match": None,
                "expiry_match": None,
            }

        # 1. Name Match
        vis_name = visual_fields.full_name
        mrz_name = mrz_data.get("full_name")
        if vis_name and mrz_name:
            vis_clean = vis_name.replace(' ', '').upper()
            mrz_clean = mrz_name.replace(' ', '').upper()
            name_match = (vis_clean in mrz_clean) or (mrz_clean in vis_clean)
        else:
            name_match = None

        # 2. Passport Number Match
        vis_pass = visual_fields.passport_number
        mrz_pass = mrz_data.get("passport_number")
        if vis_pass and mrz_pass:
            passport_number_match = (vis_pass.upper() == mrz_pass.upper())
        else:
            passport_number_match = None

        # 3. DOB Match
        vis_dob = visual_fields.date_of_birth
        mrz_dob = mrz_data.get("date_of_birth")
        if vis_dob and mrz_dob:
            dob_match = (vis_dob == mrz_dob)
        else:
            dob_match = None

        # 4. Expiry Match
        vis_exp = visual_fields.date_of_expiry
        mrz_exp = mrz_data.get("date_of_expiry")
        if vis_exp and mrz_exp:
            expiry_match = (vis_exp == mrz_exp)
        else:
            expiry_match = None

        return {
            "name_match": name_match,
            "passport_number_match": passport_number_match,
            "dob_match": dob_match,
            "expiry_match": expiry_match,
        }

consistency_service = ConsistencyService()
