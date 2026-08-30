import re
import logging

logger = logging.getLogger("pehchaan.mrz_service")

class MRZService:
    # Comprehensive blacklist of document field labels that must NEVER be treated as MRZ candidates
    DOCUMENT_LABEL_KEYWORDS = [
        "DATE OF BIRTH", "DATE OF EXPIRE", "DATE OF EXPIRY", "DATE OF ISSUE",
        "DATE", "BIRTH", "EXPIRE", "EXPIRY", "ISSUE", "SURNAME", "GIVEN", "FIRST", "LAST",
        "NAME", "NATIONALITY", "COUNTRY", "REPUBLIC", "PASSPORT", "PASSFORT", "DOCUMENT",
        "SEX", "TYPE", "CODE", "PLACE", "AUTHORITY", "DD-MM-YYYY", "DDMMYY", "MM/DD/YYYY"
    ]

    @staticmethod
    def detect_mrz_lines(raw_text: str, text_blocks: list[dict]) -> dict | None:
        """
        Detects candidate TD3 passport MRZ lines using spatial bottom-page filtering,
        strict evidence-based candidate selection, and zero synthetic padding.
        Returns {"detected": True, "line1": "...", "line2": "..."} or None.
        """
        if not raw_text and not text_blocks:
            return None

        # 1. Spatial line grouping using bounding boxes
        grouped_lines_with_bbox = MRZService._group_blocks_by_line_with_meta(text_blocks)
        
        # 2. Extract candidate strings while excluding document header labels
        candidate_items = []
        
        # From text blocks (with spatial position metadata)
        for item in grouped_lines_with_bbox:
            line_str = item["text"].strip()
            if MRZService._is_potential_mrz_line(line_str):
                candidate_items.append({
                    "text": line_str,
                    "y_center": item["y_center"],
                    "is_bottom": item.get("is_bottom", False)
                })

        # From raw text lines (fallback)
        raw_lines = [line.strip() for line in raw_text.split('\n') if line.strip()]
        for line in raw_lines:
            if MRZService._is_potential_mrz_line(line):
                if not any(c["text"] == line for c in candidate_items):
                    candidate_items.append({
                        "text": line,
                        "y_center": 999999.0, # Unknown vertical coordinate
                        "is_bottom": False
                    })

        logger.debug("MRZ potential candidates found: %d", len(candidate_items))

        # 3. Find candidate MRZ Line 1 and Line 2 pair
        line1_cand, line2_cand = MRZService._find_candidate_pair(candidate_items)

        if not line1_cand or not line2_cand:
            return None

        # 4. Clean candidate strings without forcing artificial length or synthetic padding
        norm_line1 = MRZService._clean_mrz_string(line1_cand)
        norm_line2 = MRZService._clean_mrz_string(line2_cand)

        if len(norm_line1) < 26 or len(norm_line2) < 26:
            return None

        return {
            "detected": True,
            "line1": norm_line1,
            "line2": norm_line2
        }

    @staticmethod
    def _is_potential_mrz_line(line_str: str) -> bool:
        if not line_str or len(line_str) < 15:
            return False

        upper_line = line_str.upper()

        # Reject any line containing visual field headers or date labels
        for label in MRZService.DOCUMENT_LABEL_KEYWORDS:
            if label in upper_line:
                return False

        # Must naturally contain at least 2 '<' chevrons in raw OCR (zero padding requirement)
        if upper_line.count('<') < 2 and not upper_line.startswith('P<'):
            return False

        return True

    @staticmethod
    def _group_blocks_by_line_with_meta(text_blocks: list[dict]) -> list[dict]:
        if not text_blocks:
            return []

        parsed_blocks = []
        max_y = 0.0

        for block in text_blocks:
            text = block.get("text", "").strip()
            bbox = block.get("bbox", [])
            if text and len(bbox) == 4:
                y_center = (bbox[0][1] + bbox[2][1]) / 2.0
                x_left = bbox[0][0]
                height = abs(bbox[2][1] - bbox[0][1])
                if y_center > max_y:
                    max_y = y_center
                parsed_blocks.append({
                    "text": text,
                    "y_center": y_center,
                    "x_left": x_left,
                    "height": height
                })

        if not parsed_blocks:
            return []

        parsed_blocks.sort(key=lambda b: b["y_center"])

        lines = []
        current_group = [parsed_blocks[0]]

        for b in parsed_blocks[1:]:
            last_y = current_group[-1]["y_center"]
            avg_height = (current_group[-1]["height"] + b["height"]) / 2.0
            threshold = max(15.0, avg_height * 0.6)

            if abs(b["y_center"] - last_y) <= threshold:
                current_group.append(b)
            else:
                current_group.sort(key=lambda item: item["x_left"])
                line_str = " ".join([item["text"] for item in current_group])
                avg_y = sum(item["y_center"] for item in current_group) / len(current_group)
                is_bottom = (avg_y >= 0.5 * max_y) if max_y > 0 else False
                lines.append({
                    "text": line_str,
                    "y_center": avg_y,
                    "is_bottom": is_bottom
                })
                current_group = [b]

        if current_group:
            current_group.sort(key=lambda item: item["x_left"])
            line_str = " ".join([item["text"] for item in current_group])
            avg_y = sum(item["y_center"] for item in current_group) / len(current_group)
            is_bottom = (avg_y >= 0.5 * max_y) if max_y > 0 else False
            lines.append({
                "text": line_str,
                "y_center": avg_y,
                "is_bottom": is_bottom
            })

        return lines

    @staticmethod
    def _find_candidate_pair(candidate_items: list[dict]) -> tuple[str | None, str | None]:
        line1_cand = None
        line2_cand = None

        # Sort candidates prioritizing bottom-page lines first
        sorted_candidates = sorted(candidate_items, key=lambda c: (not c["is_bottom"], c["y_center"]))

        # Line 1 candidate check: starts with P/P< AND contains '<<' or 4+ chevrons
        for c in sorted_candidates:
            text = c["text"].upper()
            if not line1_cand:
                cleaned = re.sub(r'[^A-Z0-9<]', '', text)
                if (cleaned.startswith('P<') or (cleaned.startswith('P') and '<<' in cleaned)) and cleaned.count('<') >= 3:
                    line1_cand = text
                    continue

        # Line 2 candidate check: contains digits AND chevrons (passport # / dates)
        for c in sorted_candidates:
            text = c["text"].upper()
            if text != line1_cand and not line2_cand:
                cleaned = re.sub(r'[^A-Z0-9<]', '', text)
                digit_count = sum(1 for char in cleaned if char.isdigit())
                chevron_count = cleaned.count('<')
                if digit_count >= 5 and chevron_count >= 3 and len(cleaned) >= 20:
                    line2_cand = text
                    continue

        return line1_cand, line2_cand

    @staticmethod
    def _clean_mrz_string(s: str) -> str:
        if not s:
            return ""
        # Uppercase and remove any invalid non-MRZ characters (only keep A-Z, 0-9, and '<')
        cleaned = re.sub(r'[^A-Z0-9<]', '', s.upper())
        return cleaned

mrz_service = MRZService()
