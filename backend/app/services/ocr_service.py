from __future__ import annotations

import gc
import os
import shutil
import logging
import numpy as np
from PIL import Image
from typing import Tuple, List, Dict, Any, Optional

from app.utils.validation import ScreeningException

logger = logging.getLogger("pehchaan.ocr_service")


class OCRService:
    """
    Lightweight, production-ready OCR Service powered by Tesseract (pytesseract).
    Designed to run efficiently within constrained environments (e.g., Railway 1GB RAM)
    without PyTorch/EasyOCR memory overhead.
    """

    def __init__(self):
        self._tesseract_configured = False
        self._setup_tesseract_binary()

    def _setup_tesseract_binary(self) -> None:
        """
        Locates the Tesseract binary across standard Linux/Railway and Windows environments.
        """
        try:
            import pytesseract

            # 1. If already in system PATH (Linux / Nixpacks / Homebrew)
            if shutil.which("tesseract"):
                self._tesseract_configured = True
                return

            # 2. Check standard Windows installations
            windows_paths = [
                r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
                os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"),
            ]
            for path in windows_paths:
                if os.path.isfile(path):
                    pytesseract.pytesseract.tesseract_cmd = path
                    self._tesseract_configured = True
                    return

            # Default fallback to standard command name
            self._tesseract_configured = True
        except Exception as e:
            logger.warning(f"Tesseract initialization notice: {e}")

    def extract_text(
        self,
        pil_image: Image.Image
    ) -> Tuple[str, float, List[Dict[str, Any]]]:
        """
        Performs memory-conscious OCR on a PIL image using Tesseract.
        Returns:
            - raw_text (str): Full detected text string
            - avg_confidence (float): Average confidence score (0.0 to 1.0)
            - blocks (list[dict]): Text blocks with bounding boxes and confidences
        """
        try:
            import pytesseract

            # 1. Convert to RGB
            image = pil_image.convert("RGB")

            # 2. Limit largest dimension for memory optimization
            MAX_DIMENSION = 1600
            width, height = image.size

            if max(width, height) > MAX_DIMENSION:
                scale = MAX_DIMENSION / max(width, height)
                new_width = max(1, int(width * scale))
                new_height = max(1, int(height * scale))
                image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)

            # 3. Extract word-level data dictionary from Tesseract
            # Output dict contains: 'text', 'conf', 'left', 'top', 'width', 'height', 'line_num', 'block_num'
            data = pytesseract.image_to_data(
                image,
                lang="eng",
                output_type=pytesseract.Output.DICT,
                config="--oem 3 --psm 3",
            )

            # Release resized image buffer
            del image

            detected_texts = []
            confidences = []
            blocks = []

            num_boxes = len(data.get("text", []))

            for i in range(num_boxes):
                text = str(data["text"][i]).strip()
                conf_raw = data["conf"][i]

                # Tesseract returns -1 for blocks/lines without confident text
                try:
                    conf_val = float(conf_raw)
                except (ValueError, TypeError):
                    conf_val = -1.0

                if text and conf_val >= 0:
                    # Normalize confidence from 0-100 to 0.0-1.0
                    conf_norm = round(min(1.0, max(0.0, conf_val / 100.0)), 4)

                    x = int(data["left"][i])
                    y = int(data["top"][i])
                    w = int(data["width"][i])
                    h = int(data["height"][i])

                    detected_texts.append(text)
                    confidences.append(conf_norm)

                    blocks.append({
                        "text": text,
                        "confidence": conf_norm,
                        "bbox": [
                            [x, y],
                            [x + w, y],
                            [x + w, y + h],
                            [x, y + h],
                        ],
                    })

            raw_text = "\n".join(detected_texts) if detected_texts else ""
            avg_confidence = float(np.mean(confidences)) if confidences else 0.0

            gc.collect()

            return (
                raw_text,
                round(avg_confidence, 4),
                blocks,
            )

        except Exception as e:
            gc.collect()
            logger.error(f"OCR extraction exception: {e}")
            raise ScreeningException(
                code="OCR_FAILED",
                message=f"Optical character recognition failed: {str(e)}",
                status_code=500,
            )

    def extract_mrz_text(
        self,
        mrz_image: Image.Image | np.ndarray
    ) -> List[Dict[str, Any]]:
        """
        Specialized MRZ extraction with ICAO character whitelisting and uniform block PSM.
        """
        try:
            import pytesseract

            if isinstance(mrz_image, np.ndarray):
                pil_img = Image.fromarray(mrz_image)
            else:
                pil_img = mrz_image

            # Tesseract config for MRZ: whitelist uppercase alphanumerics and chevron '<'
            mrz_config = (
                "--oem 3 --psm 6 "
                "-c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<"
            )

            data = pytesseract.image_to_data(
                pil_img,
                lang="eng",
                output_type=pytesseract.Output.DICT,
                config=mrz_config,
            )

            blocks = []
            num_boxes = len(data.get("text", []))

            for i in range(num_boxes):
                text = str(data["text"][i]).strip()
                conf_raw = data["conf"][i]

                try:
                    conf_val = float(conf_raw)
                except (ValueError, TypeError):
                    conf_val = -1.0

                if text and conf_val >= 0:
                    conf_norm = round(min(1.0, max(0.0, conf_val / 100.0)), 4)
                    x = int(data["left"][i])
                    y = int(data["top"][i])
                    w = int(data["width"][i])
                    h = int(data["height"][i])

                    blocks.append({
                        "text": text,
                        "confidence": conf_norm,
                        "bbox": [
                            [x, y],
                            [x + w, y],
                            [x + w, y + h],
                            [x, y + h],
                        ],
                    })

            return blocks
        except Exception as e:
            logger.warning(f"Specialized MRZ OCR notice: {e}")
            return []


ocr_service = OCRService()