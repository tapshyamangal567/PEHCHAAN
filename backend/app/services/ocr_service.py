from __future__ import annotations

import gc
import numpy as np
from PIL import Image
import easyocr

from app.utils.validation import ScreeningException


class OCRService:
    def __init__(self):
        self._reader = None

    @property
    def reader(self) -> easyocr.Reader:
        """
        Lazy-load EasyOCR only when OCR is actually required.
        """
        if self._reader is None:
            self._reader = easyocr.Reader(
                ['en'],
                gpu=False,
                verbose=False,
                download_enabled=True,
            )

        return self._reader

    def extract_text(
        self,
        pil_image: Image.Image
    ) -> tuple[str, float, list[dict]]:
        """
        Performs memory-conscious OCR on a PIL image.

        Large camera images are resized before being passed to
        EasyOCR to reduce RAM usage while preserving OCR quality.
        """

        try:
            # Work with RGB only
            image = pil_image.convert("RGB")

            # Limit the largest dimension.
            # Passport images from mobile cameras can be 3000-5000+ pixels.
            MAX_DIMENSION = 1600

            width, height = image.size

            if max(width, height) > MAX_DIMENSION:
                scale = MAX_DIMENSION / max(width, height)

                new_width = max(1, int(width * scale))
                new_height = max(1, int(height * scale))

                image = image.resize(
                    (new_width, new_height),
                    Image.Resampling.LANCZOS
                )

            # Convert only the resized image to NumPy
            img_np = np.asarray(image, dtype=np.uint8)

            # OCR
            results = self.reader.readtext(
                img_np,
                detail=1,
                paragraph=False,
            )

            # Release image array as soon as OCR is finished
            del img_np
            del image

            if not results:
                gc.collect()
                return "", 0.0, []

            detected_texts = []
            confidences = []
            blocks = []

            for bbox, text, prob in results:
                cleaned_text = text.strip()

                if cleaned_text:
                    confidence = float(prob)

                    detected_texts.append(cleaned_text)
                    confidences.append(confidence)

                    blocks.append({
                        "text": cleaned_text,
                        "confidence": round(confidence, 4),
                        "bbox": [
                            [int(coord[0]), int(coord[1])]
                            for coord in bbox
                        ],
                    })

            raw_text = "\n".join(detected_texts)

            avg_confidence = (
                float(np.mean(confidences))
                if confidences
                else 0.0
            )

            gc.collect()

            return (
                raw_text,
                round(avg_confidence, 4),
                blocks,
            )

        except Exception as e:
            gc.collect()

            raise ScreeningException(
                code="OCR_FAILED",
                message=f"Optical character recognition failed: {str(e)}",
                status_code=500,
            )


ocr_service = OCRService()