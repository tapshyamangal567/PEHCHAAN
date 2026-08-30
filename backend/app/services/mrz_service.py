import re
import logging
import numpy as np
import cv2
from PIL import Image, ImageEnhance, ImageFilter

from app.services.mrz_parser_service import mrz_parser_service

logger = logging.getLogger("pehchaan.mrz_service")

class MRZService:
    """
    Dedicated MRZ Extraction Pipeline for TD3 Passport Data Pages.
    Steps: Multi-Region Detection -> Preprocessing Variants -> Dedicated EasyOCR ->
           Line Reconstruction -> Candidate Scoring -> TD3 Validation.
    """
    DOCUMENT_LABEL_KEYWORDS = [
        "DATE OF BIRTH", "DATE OF EXPIRE", "DATE OF EXPIRY", "DATE OF ISSUE",
        "DATE", "BIRTH", "EXPIRE", "EXPIRY", "ISSUE", "SURNAME", "GIVEN", "FIRST", "LAST",
        "NAME", "NATIONALITY", "COUNTRY", "REPUBLIC", "PASSPORT", "PASSFORT", "DOCUMENT",
        "SEX", "TYPE", "CODE", "PLACE", "AUTHORITY", "DD-MM-YYYY", "DDMMYY", "MM/DD/YYYY"
    ]

    @staticmethod
    def detect_mrz_regions(pil_image: Image.Image) -> list[tuple[Image.Image, dict]]:
        """
        Generates candidate crop regions for MRZ detection:
        - Region 1: Lower 45% (standard passport framing)
        - Region 2: Lower 65% (centered/wide camera framing)
        - Region 3: Full image (un-cropped)
        """
        width, height = pil_image.size
        regions = []

        # Region 1: Lower 45%
        y1 = int(height * 0.55)
        r1_box = (0, y1, width, height)
        regions.append((pil_image.crop(r1_box), {"y_start": y1, "name": "Lower 45%"}))

        # Region 2: Lower 65%
        y2 = int(height * 0.35)
        r2_box = (0, y2, width, height)
        regions.append((pil_image.crop(r2_box), {"y_start": y2, "name": "Lower 65%"}))

        # Region 3: Full image
        regions.append((pil_image, {"y_start": 0, "name": "Full Image"}))

        return regions

    @staticmethod
    def create_preprocessing_variants(mrz_crop: Image.Image) -> list[dict]:
        """
        Creates preprocessing variants of the MRZ crop image to optimize OCR clarity:
        - Variant A: Grayscale, Upscale 2.5x, Contrast enhancement, Sharpening
        - Variant B: Grayscale, Adaptive Thresholding, Denoise
        - Variant C: Grayscale, OTSU Thresholding
        - Variant D: High Contrast, Sharpening
        """
        crop_np = np.array(mrz_crop)
        if len(crop_np.shape) == 3:
            gray = cv2.cvtColor(crop_np, cv2.COLOR_RGB2GRAY)
        else:
            gray = crop_np.copy()

        variants = []

        # Variant A: Grayscale + Upscale 2.5x + Contrast + Mild Sharpening
        h, w = gray.shape[:2]
        upscaled_a = cv2.resize(gray, (int(w * 2.5), int(h * 2.5)), interpolation=cv2.INTER_CUBIC)
        contrast_a = cv2.convertScaleAbs(upscaled_a, alpha=1.5, beta=0)
        kernel_sharpen = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
        sharpened_a = cv2.filter2D(contrast_a, -1, kernel_sharpen)
        variants.append({"name": "Variant A (Upscale + Contrast)", "image": sharpened_a})

        # Variant D: High Contrast + Sharpening
        contrast_d = cv2.convertScaleAbs(gray, alpha=2.0, beta=-20)
        sharpened_d = cv2.filter2D(contrast_d, -1, kernel_sharpen)
        variants.append({"name": "Variant D (High Contrast)", "image": sharpened_d})

        # Variant B: Grayscale + Adaptive Thresholding + Denoise
        blur_b = cv2.GaussianBlur(gray, (3, 3), 0)
        adaptive_b = cv2.adaptiveThreshold(
            blur_b, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 10
        )
        denoised_b = cv2.medianBlur(adaptive_b, 3)
        variants.append({"name": "Variant B (Adaptive Threshold)", "image": denoised_b})

        # Variant C: Grayscale + OTSU Thresholding
        blur_c = cv2.GaussianBlur(gray, (5, 5), 0)
        _, otsu_c = cv2.threshold(blur_c, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        variants.append({"name": "Variant C (Otsu Threshold)", "image": otsu_c})

        return variants

    @staticmethod
    def extract_mrz_candidates_from_ocr(reader, image_np: np.ndarray) -> list[dict]:
        """
        Runs EasyOCR on an MRZ crop variant with allowlist: ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<
        Returns formatted text blocks with bounding boxes and confidences.
        """
        results = reader.readtext(image_np, allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<')
        blocks = []
        for bbox, text, prob in results:
            cleaned = text.strip().upper()
            if cleaned:
                blocks.append({
                    "text": cleaned,
                    "confidence": float(prob),
                    "bbox": [[int(pt[0]), int(pt[1])] for pt in bbox]
                })
        return blocks

    @staticmethod
    def reconstruct_lines_from_blocks(text_blocks: list[dict]) -> list[str]:
        """
        Groups OCR blocks by similar Y-coordinates (horizontal lines) and sorts left-to-right.
        Joins block strings and normalizes to uppercase valid MRZ characters without arbitrary padding.
        """
        if not text_blocks:
            return []

        parsed_blocks = []
        for b in text_blocks:
            text = b.get("text", "")
            bbox = b.get("bbox")
            if text and bbox and len(bbox) == 4:
                y_center = (bbox[0][1] + bbox[2][1]) / 2.0
                x_left = bbox[0][0]
                height = abs(bbox[2][1] - bbox[0][1])
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
            threshold = max(10.0, avg_height * 0.6)

            if abs(b["y_center"] - last_y) <= threshold:
                current_group.append(b)
            else:
                current_group.sort(key=lambda item: item["x_left"])
                line_str = "".join([item["text"] for item in current_group])
                cleaned = re.sub(r'[^A-Z0-9<]', '', line_str)
                if cleaned:
                    lines.append(cleaned)
                current_group = [b]

        if current_group:
            current_group.sort(key=lambda item: item["x_left"])
            line_str = "".join([item["text"] for item in current_group])
            cleaned = re.sub(r'[^A-Z0-9<]', '', line_str)
            if cleaned:
                lines.append(cleaned)

        return lines

    @staticmethod
    def score_mrz_candidate_pair(line1: str, line2: str) -> float:
        """
        Calculates a confidence score (0.0 to 1.0) for a candidate TD3 MRZ line pair.
        Evaluates length (44 chars target), 'P<' prefix, chevron density, digit count,
        line length parity, TD3 structure, and check digit validity.
        """
        if not line1 or not line2:
            return 0.0

        score = 0.0

        len1 = len(line1)
        len2 = len(line2)
        
        if 40 <= len1 <= 46:
            score += 0.20
        elif 30 <= len1 < 40 or 46 < len1 <= 50:
            score += 0.10

        if 40 <= len2 <= 46:
            score += 0.20
        elif 30 <= len2 < 40 or 46 < len2 <= 50:
            score += 0.10

        if abs(len1 - len2) <= 4:
            score += 0.10

        if line1.startswith('P<') or line1.startswith('P'):
            score += 0.15

        if line1.count('<') >= 3:
            score += 0.10

        digits_line2 = sum(1 for c in line2 if c.isdigit())
        if digits_line2 >= 10:
            score += 0.15
        elif digits_line2 >= 5:
            score += 0.08

        if line2.count('<') >= 2:
            score += 0.05

        if mrz_parser_service._validate_td3_structure(line1, line2):
            score += 0.15

        parsed = mrz_parser_service.parse_td3_mrz(line1, line2)
        if parsed.get("checksum_valid") is True:
            score += 0.25
        elif parsed.get("detected") is True:
            score += 0.15

        return round(min(1.0, score), 4)

    @staticmethod
    def extract_mrz_from_image(pil_image: Image.Image, easyocr_reader) -> dict:
        """
        Executes multi-region target MRZ pipeline on document image with early exit:
        Candidate Crop Regions -> Preprocess Variants -> Dedicated EasyOCR -> Line Reconstruction -> Scoring.
        """
        debug_metadata = {
            "mrz_crop_created": False,
            "mrz_ocr_variants_tested": 0,
            "mrz_candidates_detected": 0,
            "best_candidate_score": 0.0
        }

        try:
            regions = MRZService.detect_mrz_regions(pil_image)
            debug_metadata["mrz_crop_created"] = True

            best_pair = None
            best_score = 0.0
            total_candidates = 0
            total_variants = 0

            for crop_img, meta in regions:
                variants = MRZService.create_preprocessing_variants(crop_img)

                for variant in variants:
                    total_variants += 1
                    blocks = MRZService.extract_mrz_candidates_from_ocr(easyocr_reader, variant["image"])
                    lines = MRZService.reconstruct_lines_from_blocks(blocks)

                    for i in range(len(lines) - 1):
                        cand_l1 = lines[i]
                        cand_l2 = lines[i + 1]
                        
                        if not (cand_l1.startswith('P') or '<' in cand_l1):
                            continue

                        total_candidates += 1
                        cand_score = MRZService.score_mrz_candidate_pair(cand_l1, cand_l2)

                        if cand_score > best_score:
                            best_score = cand_score
                            best_pair = (cand_l1, cand_l2)

                            # Early exit if candidate score is strong (>= 0.65)
                            if best_score >= 0.65:
                                parsed = mrz_parser_service.parse_td3_mrz(cand_l1, cand_l2)
                                if parsed.get("detected"):
                                    debug_metadata["mrz_ocr_variants_tested"] = total_variants
                                    debug_metadata["mrz_candidates_detected"] = total_candidates
                                    debug_metadata["best_candidate_score"] = best_score
                                    return {
                                        "detected": True,
                                        "line1": parsed["line1"],
                                        "line2": parsed["line2"],
                                        "score": best_score,
                                        "parsed": parsed,
                                        "debug_metadata": debug_metadata
                                    }

            debug_metadata["mrz_ocr_variants_tested"] = total_variants
            debug_metadata["mrz_candidates_detected"] = total_candidates
            debug_metadata["best_candidate_score"] = best_score

            ACCEPTANCE_THRESHOLD = 0.40
            if best_pair and best_score >= ACCEPTANCE_THRESHOLD:
                line1, line2 = best_pair
                parsed = mrz_parser_service.parse_td3_mrz(line1, line2)
                if parsed.get("detected"):
                    return {
                        "detected": True,
                        "line1": parsed["line1"],
                        "line2": parsed["line2"],
                        "score": best_score,
                        "parsed": parsed,
                        "debug_metadata": debug_metadata
                    }

            return {
                "detected": False,
                "line1": None,
                "line2": None,
                "score": best_score,
                "parsed": None,
                "debug_metadata": debug_metadata
            }

        except Exception as e:
            logger.warning("MRZ multi-region extraction pipeline encountered exception: %s", str(e))
            return {
                "detected": False,
                "line1": None,
                "line2": None,
                "score": 0.0,
                "parsed": None,
                "debug_metadata": debug_metadata
            }

    @staticmethod
    def detect_mrz_lines(raw_text: str, text_blocks: list[dict]) -> dict | None:
        """
        Fallback / Legacy MRZ line extraction from general OCR raw text and text blocks.
        """
        if not raw_text and not text_blocks:
            return None

        # 1. Spatial reconstruction from text blocks first
        if text_blocks:
            lines = MRZService.reconstruct_lines_from_blocks(text_blocks)
            for i in range(len(lines) - 1):
                l1 = lines[i]
                l2 = lines[i + 1]
                if (l1.startswith('P<') or l1.startswith('P')) and sum(1 for c in l2 if c.isdigit()) >= 5:
                    norm1 = l1.ljust(44, '<')[:44]
                    norm2 = l2.ljust(44, '<')[:44]
                    parsed = mrz_parser_service.parse_td3_mrz(norm1, norm2)
                    if parsed.get("detected"):
                        return {
                            "detected": True,
                            "line1": norm1,
                            "line2": norm2
                        }

        # 2. Text line fallback
        raw_lines = [line.strip() for line in raw_text.split('\n') if line.strip()]
        candidate_lines = []
        for line in raw_lines:
            upper = line.upper()
            if any(kw in upper for kw in MRZService.DOCUMENT_LABEL_KEYWORDS):
                continue
            cleaned = re.sub(r'[^A-Z0-9<]', '', upper)
            if len(cleaned) >= 15 and ('<' in cleaned or cleaned.startswith('P')):
                candidate_lines.append(cleaned)

        if len(candidate_lines) >= 2:
            for i in range(len(candidate_lines) - 1):
                l1 = candidate_lines[i]
                l2 = candidate_lines[i + 1]
                if (l1.startswith('P<') or l1.startswith('P')) and sum(1 for c in l2 if c.isdigit()) >= 5:
                    norm1 = l1.ljust(44, '<')[:44]
                    norm2 = l2.ljust(44, '<')[:44]
                    parsed = mrz_parser_service.parse_td3_mrz(norm1, norm2)
                    if parsed.get("detected"):
                        return {
                            "detected": True,
                            "line1": norm1,
                            "line2": norm2
                        }

        return None

mrz_service = MRZService()
