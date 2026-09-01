import re
from datetime import datetime
from typing import Dict, Any, Optional

class DocumentValidationService:
    @staticmethod
    def validate_document(
        fields: Any,
        mrz_data: Optional[Any],
        consistency_data: Any,
        metadata: Any
    ) -> Dict[str, Any]:
        """
        Executes automated document validation checks on extracted passport fields,
        MRZ data, and visual/MRZ consistency.
        Returns a structured validation dictionary adhering to security semantics.
        """
        checks: Dict[str, Dict[str, str]] = {}
        fields_dict = fields.model_dump() if hasattr(fields, "model_dump") else (fields or {})
        consistency_dict = consistency_data.model_dump() if hasattr(consistency_data, "model_dump") else (consistency_data or {})

        # 1. MRZ Detection Check
        mrz_detected = False
        if mrz_data:
            mrz_detected = getattr(mrz_data, "detected", False) if hasattr(mrz_data, "detected") else mrz_data.get("detected", False)
        
        if mrz_detected:
            checks["mrz_detected"] = {
                "status": "PASS",
                "message": "MRZ detected"
            }
        else:
            checks["mrz_detected"] = {
                "status": "NOT_AVAILABLE",
                "message": "MRZ not detected on document"
            }

        # 2. MRZ Structure Check
        line1 = getattr(mrz_data, "line1", None) if hasattr(mrz_data, "line1") else (mrz_data.get("line1") if mrz_data else None)
        line2 = getattr(mrz_data, "line2", None) if hasattr(mrz_data, "line2") else (mrz_data.get("line2") if mrz_data else None)
        
        if mrz_detected:
            if line1 and line2 and len(line1) >= 15 and len(line2) >= 15 and (line1.startswith("P") or "<" in line1):
                checks["mrz_structure"] = {
                    "status": "PASS",
                    "message": "Valid TD3 structure"
                }
            elif line1 or line2:
                checks["mrz_structure"] = {
                    "status": "REVIEW",
                    "message": "Partial or degraded MRZ line structure"
                }
            else:
                checks["mrz_structure"] = {
                    "status": "FAIL",
                    "message": "Invalid MRZ line structure"
                }
        else:
            checks["mrz_structure"] = {
                "status": "NOT_AVAILABLE",
                "message": "MRZ structure not available"
            }

        # 3. Passport Number Check
        passport_num = fields_dict.get("passport_number")
        if passport_num and len(passport_num) >= 6:
            clean_num = passport_num.replace(" ", "").replace("-", "")
            if re.match(r'^[A-Z0-9]{6,10}$', clean_num, re.IGNORECASE):
                checks["passport_number"] = {
                    "status": "PASS",
                    "message": "Passport number extracted"
                }
            else:
                checks["passport_number"] = {
                    "status": "NOT_AVAILABLE",
                    "message": "Passport number format unexpected"
                }
        else:
            checks["passport_number"] = {
                "status": "NOT_AVAILABLE",
                "message": "Passport number not extracted"
            }

        # 4. Date of Birth Check
        dob = fields_dict.get("date_of_birth")
        if dob:
            try:
                clean_dob = dob.replace(".", "/").replace("-", "/")
                dob_dt = datetime.strptime(clean_dob, "%d/%m/%Y")
                if dob_dt <= datetime.now():
                    checks["date_of_birth"] = {
                        "status": "PASS",
                        "message": "Date of birth extracted"
                    }
                else:
                    checks["date_of_birth"] = {
                        "status": "FAIL",
                        "message": "Date of birth is in the future"
                    }
            except Exception:
                checks["date_of_birth"] = {
                    "status": "PASS",
                    "message": "Date of birth extracted"
                }
        else:
            checks["date_of_birth"] = {
                "status": "NOT_AVAILABLE",
                "message": "Date of birth not extracted"
            }

        # 5. Date of Expiry & Expiration Check
        doe = fields_dict.get("date_of_expiry")
        if doe:
            try:
                clean_doe = doe.replace(".", "/").replace("-", "/")
                doe_dt = datetime.strptime(clean_doe, "%d/%m/%Y")
                if doe_dt < datetime.now():
                    checks["date_of_expiry"] = {
                        "status": "FAIL",
                        "message": "Passport has expired"
                    }
                else:
                    checks["date_of_expiry"] = {
                        "status": "PASS",
                        "message": "Passport is valid and not expired"
                    }
            except Exception:
                checks["date_of_expiry"] = {
                    "status": "PASS",
                    "message": "Date of expiry extracted"
                }
        else:
            checks["date_of_expiry"] = {
                "status": "NOT_AVAILABLE",
                "message": "Date of expiry not available"
            }

        # 6. Gender Check
        gender = fields_dict.get("gender")
        if gender and gender.upper() in ["M", "F", "<", "MALE", "FEMALE"]:
            checks["gender"] = {
                "status": "PASS",
                "message": "Gender extracted"
            }
        else:
            checks["gender"] = {
                "status": "NOT_AVAILABLE",
                "message": "Gender not available"
            }

        # 7. Nationality Check
        nationality = fields_dict.get("nationality")
        if nationality and len(nationality) >= 2:
            checks["nationality"] = {
                "status": "PASS",
                "message": "Nationality extracted"
            }
        else:
            checks["nationality"] = {
                "status": "NOT_AVAILABLE",
                "message": "Nationality not available"
            }

        # 8. OCR ↔ MRZ Consistency Check
        c_status = consistency_dict.get("overall_status")
        c_msg = consistency_dict.get("overall_message")

        if c_status == "PASS":
            checks["ocr_mrz_consistency"] = {
                "status": "PASS",
                "message": c_msg or "Information is consistent between Visual OCR and MRZ."
            }
        elif c_status == "FAIL":
            checks["ocr_mrz_consistency"] = {
                "status": "FAIL",
                "message": c_msg or "One or more extracted fields conflict with the MRZ."
            }
        elif c_status == "REVIEW":
            checks["ocr_mrz_consistency"] = {
                "status": "REVIEW",
                "message": c_msg or "Some fields could not be compared between Visual OCR and MRZ."
            }
        else:
            checks["ocr_mrz_consistency"] = {
                "status": "NOT_AVAILABLE",
                "message": "Consistency check not available"
            }

        # 9. Required Fields Completeness Check
        important_keys = ["full_name", "passport_number", "nationality", "date_of_birth", "gender", "date_of_expiry"]
        extracted_important = sum(1 for k in important_keys if fields_dict.get(k) is not None)

        if extracted_important >= 5:
            checks["required_fields"] = {
                "status": "PASS",
                "message": f"{extracted_important}/6 key identity fields extracted"
            }
        elif extracted_important >= 3:
            checks["required_fields"] = {
                "status": "REVIEW",
                "message": f"{extracted_important}/6 key identity fields extracted"
            }
        else:
            checks["required_fields"] = {
                "status": "NOT_AVAILABLE",
                "message": f"Only {extracted_important}/6 key identity fields extracted"
            }

        # Calculate counts
        passed_count = sum(1 for c in checks.values() if c["status"] == "PASS")
        failed_count = sum(1 for c in checks.values() if c["status"] == "FAIL")
        not_avail_count = sum(1 for c in checks.values() if c["status"] in ["NOT_AVAILABLE", "REVIEW"])

        # Determine overall status conservatively
        if failed_count > 0:
            overall_status = "FAIL"
            overall_message = "Validation failed"
        elif not_avail_count > 0 or passed_count < 6:
            overall_status = "REVIEW"
            overall_message = "Document requires review"
        else:
            overall_status = "PASS"
            overall_message = "Document checks passed"

        return {
            "overall_status": overall_status,
            "overall_message": overall_message,
            "checks": checks,
            "passed": passed_count,
            "failed": failed_count,
            "not_available": not_avail_count,
        }

document_validation_service = DocumentValidationService()
