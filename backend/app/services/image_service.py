import io
from PIL import Image, ImageEnhance, ImageFilter
from app.utils.validation import validate_image_file, ScreeningException

class ImageService:
    @staticmethod
    def process_upload_bytes(file_bytes: bytes, content_type: str | None) -> Image.Image:
        """
        Validates file size and format, loads with Pillow, converts to RGB,
        and returns the PIL Image object without writing to disk.
        """
        # 1. Validate size, content-type header, and image header integrity
        validate_image_file(file_bytes, content_type)

        # 2. Re-open stream for RGB conversion
        try:
            image_stream = io.BytesIO(file_bytes)
            pil_image = Image.open(image_stream)
            
            # Convert RGBA/Palette/Grayscale to RGB
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
    def preprocess_for_ocr(image: Image.Image) -> Image.Image:
        """
        Applies subtle image enhancement (contrast, sharpness) to optimize
        OCR recognition accuracy without distorting document geometry.
        """
        try:
            # 1. Resize if image resolution is too small for clear OCR
            width, height = image.size
            if width < 1000 or height < 700:
                scale_factor = max(1000 / width, 700 / height)
                new_size = (int(width * scale_factor), int(height * scale_factor))
                image = image.resize(new_size, Image.Resampling.LANCZOS)

            # 2. Enhance contrast slightly
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.2)

            # 3. Enhance sharpness slightly
            sharpness = ImageEnhance.Sharpness(image)
            image = sharpness.enhance(1.3)

            return image
        except Exception:
            # Fallback to original image if enhancement fails
            return image

image_service = ImageService()
