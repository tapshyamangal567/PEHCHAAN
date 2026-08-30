import re
from app.schemas.screening import PassportFields

class PassportParserService:
    # List of common passport header words to NEVER return as field values
    KEYWORD_BLACKLIST = {
        "PASSPORT", "PASSPORT NO", "REPUBLIC", "INDIA", "SURNAME", "GIVEN", "NAMES",
        "NATIONALITY", "SEX", "DATE", "BIRTH", "ISSUE", "EXPIRY", "DOCUMENT", "TYPE",
        "CODE", "AUTHORITY", "COUNTRY"
    }

    @staticmethod
    def parse_passport_text(raw_text: str, text_blocks: list[dict]) -> PassportFields:
        """
        Parses OCR raw text and text blocks into structured PassportFields.
        Returns None for fields that cannot be confidently detected.
        """
        if not raw_text:
            return PassportFields()

        lines = [line.strip() for line in raw_text.split('\n') if line.strip()]
        
        passport_number = PassportParserService._extract_passport_number(lines, raw_text)
        nationality = PassportParserService._extract_nationality(lines, raw_text)
        date_of_birth = PassportParserService._extract_date(raw_text, ["birth", "dob", "born"])
        date_of_issue = PassportParserService._extract_date(raw_text, ["issue", "doi", "given", "date of issue"])
        date_of_expiry = PassportParserService._extract_date(raw_text, ["expiry", "exp", "valid until", "doe", "date of expiry"])
        gender = PassportParserService._extract_gender(lines, raw_text)
        full_name = PassportParserService._extract_full_name(lines)

        return PassportFields(
            full_name=full_name,
            passport_number=passport_number,
            nationality=nationality,
            date_of_birth=date_of_birth,
            gender=gender,
            date_of_issue=date_of_issue,
            date_of_expiry=date_of_expiry,
        )

    @staticmethod
    def _extract_passport_number(lines: list[str], raw_text: str) -> str | None:
        # Pattern 1: Standard uppercase alphanumeric passport number (1 letter + 7-8 digits)
        pattern = r'\b[A-Z][0-9]{7,8}\b'
        for match in re.finditer(pattern, raw_text):
            val = match.group(0).upper()
            if val not in PassportParserService.KEYWORD_BLACKLIST:
                return val

        # Pattern 2: Search line containing "passport" or "no" for valid alphanumeric string
        generic_pattern = r'\b[A-Z0-9]{8,9}\b'
        for line in lines:
            line_upper = line.upper()
            if "PASSPORT" in line_upper or "NO" in line_upper:
                for match in re.finditer(generic_pattern, line_upper):
                    val = match.group(0)
                    if val not in PassportParserService.KEYWORD_BLACKLIST and not val.isalpha():
                        return val

        return None

    @staticmethod
    def _extract_nationality(lines: list[str], raw_text: str) -> str | None:
        # Check for common nationality ISO codes or terms
        common_codes = [
            "IND", "INDIAN", "USA", "AMERICAN", "GBR", "BRITISH",
            "CAN", "CANADIAN", "AUS", "AUSTRALIAN", "DEU", "GERMAN", "FRA", "FRENCH"
        ]
        for code in common_codes:
            if re.search(r'\b' + code + r'\b', raw_text, re.IGNORECASE):
                return code.upper() if len(code) == 3 else ("IND" if code == "INDIAN" else code.upper())

        # Contextual search near "Nationality"
        for i, line in enumerate(lines):
            if "nationality" in line.lower() or "code" in line.lower():
                m = re.search(r'\b[A-Z]{3}\b', line.upper())
                if m and m.group(0) not in PassportParserService.KEYWORD_BLACKLIST:
                    return m.group(0)
                if i + 1 < len(lines):
                    m_next = re.search(r'\b[A-Z]{3}\b', lines[i + 1].upper())
                    if m_next and m_next.group(0) not in PassportParserService.KEYWORD_BLACKLIST:
                        return m_next.group(0)

        return None

    @staticmethod
    def _extract_date(raw_text: str, keywords: list[str]) -> str | None:
        # Regex for dates: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD.MM.YYYY, or DD,MM/YYYY
        date_pattern = r'\b\d{2}[-/\.,]\d{2}[-/\.,]\d{4}\b|\b\d{4}[-/\.,]\d{2}[-/\.,]\d{2}\b|\b\d{2}\s+(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[a-z]*\s+\d{4}\b'

        lines = raw_text.split('\n')
        for line in lines:
            line_lower = line.lower()
            if any(kw in line_lower for kw in keywords):
                match = re.search(date_pattern, line, re.IGNORECASE)
                if match:
                    clean_date = match.group(0).replace(',', '/').replace('.', '/')
                    return clean_date

        return None

    @staticmethod
    def _extract_gender(lines: list[str], raw_text: str) -> str | None:
        for line in lines:
            line_lower = line.lower()
            if any(term in line_lower for term in ["sex", "gender", "sexe"]):
                if re.search(r'\b(M|MALE)\b', line, re.IGNORECASE):
                    return "M"
                if re.search(r'\b(F|FEMALE)\b', line, re.IGNORECASE):
                    return "F"

        match = re.search(r'\bSex[:\s]+([MF])\b', raw_text, re.IGNORECASE)
        if match:
            return match.group(1).upper()

        return None

    @staticmethod
    def _extract_full_name(lines: list[str]) -> str | None:
        surname = None
        given_name = None

        for line in lines:
            line_lower = line.lower()
            if "surname" in line_lower:
                parts = re.split(r'surname[:\s]*', line, flags=re.IGNORECASE)
                if len(parts) > 1 and parts[1].strip():
                    cleaned = re.sub(r'[^A-Z\s]', '', parts[1], flags=re.IGNORECASE).strip()
                    if cleaned and cleaned.upper() not in PassportParserService.KEYWORD_BLACKLIST:
                        surname = cleaned
            elif "given name" in line_lower or "given" in line_lower or "first name" in line_lower:
                parts = re.split(r'(?:given|first)\s*name[s]?[:\s]*', line, flags=re.IGNORECASE)
                if len(parts) > 1 and parts[1].strip():
                    cleaned = re.sub(r'[^A-Z\s]', '', parts[1], flags=re.IGNORECASE).strip()
                    if cleaned and cleaned.upper() not in PassportParserService.KEYWORD_BLACKLIST:
                        given_name = cleaned

        if surname or given_name:
            full = f"{surname or ''} {given_name or ''}".strip()
            if full:
                return full.upper()

        return None

parser_service = PassportParserService()
