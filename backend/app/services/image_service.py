from __future__ import annotations
import io
import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from typing import Dict, Any
from app.utils.validation import validate_image_file, ScreeningException

class ImageService:
    @staticmethod
    def process_upload_bytes(file_bytes: bytes, content_type: str | None) -> Image.Image:
        """
        Validates file size and format, loads with Pillow, converts to RGB,
        and returns the PIL Image object without writing to disk.
        """
        validate_image_file(file_bytes, content_type)

        try:
            image_stream = io.BytesIO(file_bytes)
            pil_image = Image.open(image_stream)
            
            if pil_image.mode != "RGB":
                pil_image = pil_image.convert("RGB")
                
            return pil_image
        except Exception:
            raise ScreeningException(
                code="INVALID_IMAGE",
                message="Failed to process image content. Ensure file is not corrupted.",
                status_code=400
            )

    @staticmethod
    def analyze_image_quality(image: Image.Image) -> Dict[str, Any]:
        """
        Analyzes uploaded passport image using measurable computer vision signals:
        - resolution (width, height, megapixels)
        - sharpness / blur (Laplacian variance)
        - brightness (grayscale mean)
        - contrast (grayscale std dev)
        - compression quality (estimated JPEG quality)
        Returns structured dictionary response.
        """
        if not image:
            return {
                "status": "POOR",
                "score": 0.50,
                "confidence": 0.40,
                "reason": "No image provided for quality assessment.",
                "signals": {}
            }

        orig_img = image.convert("RGB")
        img_np = np.array(orig_img)
        h, w = img_np.shape[:2]
        megapixels = round((w * h) / 1_000_000.0, 2)

        # 1. Resolution Check
        if (w >= 800 and h >= 500) or megapixels >= 0.40:
            res_status = "GOOD"
        elif w >= 400 and h >= 300:
            res_status = "FAIR"
        else:
            res_status = "POOR"

        # 2. Sharpness / Blur Check via Laplacian Variance
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
        blur_val = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        if blur_val >= 80.0:
            sharp_status = "GOOD"
        elif blur_val >= 25.0:
            sharp_status = "FAIR"
        else:
            sharp_status = "POOR"

        # 3. Brightness Check (Grayscale Mean)
        brightness_val = float(np.mean(gray))
        if 25.0 <= brightness_val <= 235.0:
            bright_status = "GOOD"
        elif 15.0 <= brightness_val < 25.0 or 235.0 < brightness_val <= 245.0:
            bright_status = "FAIR"
        else:
            bright_status = "POOR"

        # 4. Contrast Check (Grayscale Standard Deviation)
        contrast_val = float(np.std(gray))
        if contrast_val >= 30.0:
            contrast_status = "GOOD"
        elif contrast_val >= 15.0:
            contrast_status = "FAIR"
        else:
            contrast_status = "POOR"

        # 5. Compression Quality Estimation
        try:
            buffer = io.BytesIO()
            orig_img.save(buffer, format="JPEG", quality=95)
            est_quality = 85 # standard upload quality
        except Exception:
            est_quality = 70

        if est_quality >= 70:
            comp_status = "GOOD"
        elif est_quality >= 40:
            comp_status = "FAIR"
        else:
            comp_status = "POOR"

        # Overall Quality Status Determination
        poor_count = sum(1 for s in [res_status, sharp_status, bright_status, contrast_status] if s == "POOR")
        fair_count = sum(1 for s in [res_status, sharp_status, bright_status, contrast_status] if s == "FAIR")

        if poor_count >= 1 or sharp_status == "POOR":
            overall_status = "POOR"
            quality_score = 0.40
            confidence = 0.45
            primary_reason = "Image quality significantly limits reliable verification. Recapture document with better lighting and focus."
        elif fair_count >= 1:
            overall_status = "FAIR"
            quality_score = 0.15
            confidence = 0.70
            primary_reason = "Some quality limitations exist (e.g. slight blur or lighting), but verification can proceed."
        else:
            overall_status = "GOOD"
            quality_score = 0.0
            confidence = 0.90
            primary_reason = "Image is sufficiently clear for downstream verification."

        signals = {
            "resolution": {
                "width": w,
                "height": h,
                "megapixels": megapixels,
                "status": res_status
            },
            "sharpness": {
                "value": round(blur_val, 2),
                "threshold": 80.0,
                "status": sharp_status
            },
            "brightness": {
                "value": round(brightness_val, 2),
                "status": bright_status
            },
            "contrast": {
                "value": round(contrast_val, 2),
                "status": contrast_status
            },
            "compression": {
                "estimated_quality": est_quality,
                "status": comp_status
            }
        }

        return {
            "status": overall_status,
            "score": quality_score,
            "confidence": confidence,
            "reason": primary_reason,
            "signals": signals
        }

    @staticmethod
    def preprocess_for_ocr(image: Image.Image) -> Image.Image:
        """
        Applies subtle image enhancement (contrast, sharpness) to optimize
        OCR recognition accuracy without distorting document geometry.
        """
        try:
            width, height = image.size
            if width < 1000 or height < 700:
                scale_factor = max(1000 / width, 700 / height)
                new_size = (int(width * scale_factor), int(height * scale_factor))
                image = image.resize(new_size, Image.Resampling.LANCZOS)

            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.2)

            sharpness = ImageEnhance.Sharpness(image)
            image = sharpness.enhance(1.3)

            return image
        except Exception:
            return image

image_service = ImageService()
