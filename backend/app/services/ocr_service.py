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
        Lazy initialization of EasyOCR reader so it is created only once
        rather than on every API request.
        """
        if self._reader is None:
            # Initialize for English OCR on CPU with verbose=False to prevent stdout progress bar encoding issues
            self._reader = easyocr.Reader(['en'], gpu=False, verbose=False)
        return self._reader

    def extract_text(self, pil_image: Image.Image) -> tuple[str, float, list[dict]]:
        """
        Performs OCR on a PIL Image using EasyOCR.
        Returns (raw_text, average_confidence, text_blocks).
        """
        try:
            img_np = np.array(pil_image)
            results = self.reader.readtext(img_np)

            if not results:
                return "", 0.0, []

            detected_texts = []
            confidences = []
            blocks = []

            for bbox, text, prob in results:
                cleaned_text = text.strip()
                if cleaned_text:
                    detected_texts.append(cleaned_text)
                    confidences.append(float(prob))
                    blocks.append({
                        "text": cleaned_text,
                        "confidence": round(float(prob), 4),
                        "bbox": [[int(coord[0]), int(coord[1])] for coord in bbox]
                    })

            raw_text = "\n".join(detected_texts)
            avg_confidence = float(np.mean(confidences)) if confidences else 0.0

            return raw_text, round(avg_confidence, 4), blocks

        except Exception as e:
            raise ScreeningException(
                code="OCR_FAILED",
                message=f"Optical character recognition failed: {str(e)}",
                status_code=500
            )

ocr_service = OCRService()
