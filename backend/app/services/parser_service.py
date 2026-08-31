from __future__ import annotations
import re
from datetime import datetime
from app.schemas.screening import PassportFields

class PassportParserService:
    # List of common passport header words to NEVER return as field values
    KEYWORD_BLACKLIST = {
        "PASSPORT", "PASSPORT NO", "REPUBLIC", "INDIA", "SURNAME", "GIVEN", "NAMES",
        "NATIONALITY", "SEX", "DATE", "BIRTH", "ISSUE", "EXPIRY", "DOCUMENT", "TYPE",
        "CODE", "AUTHORITY", "COUNTRY", "PASSFORT", "TYPE P", "P", "IND"
    }

    @staticmethod
    def parse_passport_text(raw_text: str, text_blocks: list[dict]) -> PassportFields:
        """
        Parses OCR raw text and text blocks into structured PassportFields.
        Robust against multi-line label/value separations common in smartphone photos.
        """
        if not raw_text:
            return PassportFields()

        lines = [line.strip() for line in raw_text.split('\n') if line.strip()]
        
        passport_number = PassportParserService._extract_passport_number(lines, raw_text)
        nationality = PassportParserService._extract_nationality(lines, raw_text)
        date_of_birth = PassportParserService._extract_date(lines, raw_text, ["birth", "dob", "born", "naissance"])
        date_of_issue = PassportParserService._extract_date(lines, raw_text, ["issue", "doi", "delivrance", "given"])
        date_of_expiry = PassportParserService._extract_date(lines, raw_text, ["expiry", "exp", "valid", "until", "doe", "expiration"])
        gender = PassportParserService._extract_gender(lines, raw_text)
        full_name = PassportParserService._extract_full_name(lines)

        # Fallback date assignment if contextual date matching yielded partial results
        if not date_of_birth or not date_of_expiry:
            dob_fb, doi_fb, doe_fb = PassportParserService._fallback_date_sorter(raw_text)
            date_of_birth = date_of_birth or dob_fb
            date_of_issue = date_of_issue or doi_fb
            date_of_expiry = date_of_expiry or doe_fb

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
        # Pattern 1: Standard passport number (1 letter + 7-8 digits)
        pattern1 = r'\b[A-Z][\s\-]?[0-9]{7,8}\b'
        for match in re.finditer(pattern1, raw_text):
            val = match.group(0).upper().replace(' ', '').replace('-', '')
            if val not in PassportParserService.KEYWORD_BLACKLIST:
                return val

        # Pattern 2: Multiline search after PASSPORT or NO label
        generic_pattern = r'\b[A-Z0-9]{8,9}\b'
        for i, line in enumerate(lines):
            line_upper = line.upper()
            if "PASSPORT" in line_upper or "NO" in line_upper or "PASSEPORT" in line_upper or "DOCUMENT" in line_upper:
                # Check current line
                for match in re.finditer(generic_pattern, line_upper):
                    val = match.group(0)
                    if val not in PassportParserService.KEYWORD_BLACKLIST and not val.isalpha():
                        return val
                # Check next line
                if i + 1 < len(lines):
                    next_upper = lines[i + 1].upper()
                    for match in re.finditer(generic_pattern, next_upper):
                        val = match.group(0)
                        if val not in PassportParserService.KEYWORD_BLACKLIST and not val.isalpha():
                            return val

        return None

    @staticmethod
    def _extract_nationality(lines: list[str], raw_text: str) -> str | None:
        common_codes = [
            "IND", "INDIAN", "USA", "AMERICAN", "GBR", "BRITISH",
            "CAN", "CANADIAN", "AUS", "AUSTRALIAN", "DEU", "GERMAN", "FRA", "FRENCH"
        ]
        for code in common_codes:
            if re.search(r'\b' + code + r'\b', raw_text, re.IGNORECASE):
                return code.upper() if len(code) == 3 else ("IND" if code == "INDIAN" else code.upper())

        for i, line in enumerate(lines):
            line_lower = line.lower()
            if "nationality" in line_lower or "nationalite" in line_lower or "code" in line_lower:
                m = re.search(r'\b[A-Z]{3}\b', line.upper())
                if m and m.group(0) not in PassportParserService.KEYWORD_BLACKLIST:
                    return m.group(0)
                if i + 1 < len(lines):
                    m_next = re.search(r'\b[A-Z]{3}\b', lines[i + 1].upper())
                    if m_next and m_next.group(0) not in PassportParserService.KEYWORD_BLACKLIST:
                        return m_next.group(0)

        return None

    @staticmethod
    def _extract_date(lines: list[str], raw_text: str, keywords: list[str]) -> str | None:
        # Regex matching dates separated by slashes, dashes, dots, spaces, commas, or 'I'/'l'/'|'
        date_pattern = r'\b\d{2}[\s\-/\.,Il|]\d{2}[\s\-/\.,Il|]\d{4}\b|\b\d{4}[\s\-/\.,Il|]\d{2}[\s\-/\.,Il|]\d{2}\b|\b\d{2}\s+(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[a-z]*\s+\d{4}\b'

        for i, line in enumerate(lines):
            line_lower = line.lower()
            if any(kw in line_lower for kw in keywords):
                # Search current line
                match = re.search(date_pattern, line, re.IGNORECASE)
                if match:
                    return PassportParserService._normalize_date(match.group(0))
                # Search next 1-2 lines for value
                for offset in [1, 2]:
                    if i + offset < len(lines):
                        next_match = re.search(date_pattern, lines[i + offset], re.IGNORECASE)
                        if next_match:
                            return PassportParserService._normalize_date(next_match.group(0))

        return None

    @staticmethod
    def _normalize_date(s: str) -> str:
        clean = re.sub(r'[\s\-/\.,Il|]+', '/', s.strip())
        parts = clean.split('/')
        if len(parts) == 3:
            return f"{parts[0]:0>2}/{parts[1]:0>2}/{parts[2]}"
        return clean

    @staticmethod
    def _fallback_date_sorter(raw_text: str) -> tuple[str | None, str | None, str | None]:
        """Extracts all date objects from text and sorts chronologically."""
        date_pattern = r'\b(\d{2}[\s\-/\.,Il|]\d{2}[\s\-/\.,Il|]\d{4})\b'
        all_dates = re.findall(date_pattern, raw_text)
        parsed_dates = []

        for d_str in all_dates:
            clean = PassportParserService._normalize_date(d_str)
            try:
                dt = datetime.strptime(clean, "%d/%m/%Y")
                parsed_dates.append((dt, clean))
            except Exception:
                try:
                    dt = datetime.strptime(clean, "%Y/%m/%d")
                    parsed_dates.append((dt, clean))
                except Exception:
                    pass

        parsed_dates.sort(key=lambda x: x[0])
        unique_dates = [d[1] for d in parsed_dates]

        dob = unique_dates[0] if len(unique_dates) >= 1 else None
        doi = unique_dates[1] if len(unique_dates) >= 3 else None
        doe = unique_dates[-1] if len(unique_dates) >= 2 else None

        return dob, doi, doe

    @staticmethod
    def _extract_gender(lines: list[str], raw_text: str) -> str | None:
        for i, line in enumerate(lines):
            line_lower = line.lower()
            if any(term in line_lower for term in ["sex", "gender", "sexe"]):
                if re.search(r'\b(M|MALE)\b', line, re.IGNORECASE):
                    return "M"
                if re.search(r'\b(F|FEMALE)\b', line, re.IGNORECASE):
                    return "F"
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip().upper()
                    if next_line in ["M", "MALE"]:
                        return "M"
                    if next_line in ["F", "FEMALE"]:
                        return "F"

        match = re.search(r'\bSex[:\s]+([MF])\b', raw_text, re.IGNORECASE)
        if match:
            return match.group(1).upper()

        return None

    @staticmethod
    def _extract_full_name(lines: list[str]) -> str | None:
        surname = None
        given_name = None

        for i, line in enumerate(lines):
            line_lower = line.lower()
            
            # Extract Surname
            if ("surname" in line_lower or "last name" in line_lower or "family name" in line_lower) and not surname:
                parts = re.split(r'(?:surname|last\s*name|family\s*name)[:\s]*', line, flags=re.IGNORECASE)
                if len(parts) > 1 and parts[1].strip():
                    cleaned = re.sub(r'[^A-Z\s]', '', parts[1], flags=re.IGNORECASE).strip()
                    if cleaned and cleaned.upper() not in PassportParserService.KEYWORD_BLACKLIST:
                        surname = cleaned
                if not surname and i + 1 < len(lines):
                    next_cleaned = re.sub(r'[^A-Z\s]', '', lines[i + 1], flags=re.IGNORECASE).strip()
                    if next_cleaned and next_cleaned.upper() not in PassportParserService.KEYWORD_BLACKLIST:
                        surname = next_cleaned

            # Extract Given Names
            elif ("given name" in line_lower or "given" in line_lower or "first name" in line_lower or "prenoms" in line_lower) and not given_name:
                parts = re.split(r'(?:given|first)\s*name[s]?[:\s]*', line, flags=re.IGNORECASE)
                if len(parts) > 1 and parts[1].strip():
                    cleaned = re.sub(r'[^A-Z\s]', '', parts[1], flags=re.IGNORECASE).strip()
                    if cleaned and cleaned.upper() not in PassportParserService.KEYWORD_BLACKLIST:
                        given_name = cleaned
                if not given_name and i + 1 < len(lines):
                    next_cleaned = re.sub(r'[^A-Z\s]', '', lines[i + 1], flags=re.IGNORECASE).strip()
                    if next_cleaned and next_cleaned.upper() not in PassportParserService.KEYWORD_BLACKLIST:
                        given_name = next_cleaned

        if surname or given_name:
            full = f"{surname or ''} {given_name or ''}".strip()
            if full:
                return full.upper()

        return None

parser_service = PassportParserService()
