
import io
from typing import Optional

from PIL import Image
from app.config import settings


class ScreeningException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


def validate_image_file(
    file_bytes: bytes,
    content_type: Optional[str]
) -> None:
    # 1. Size check
    if not file_bytes or len(file_bytes) == 0:
        raise ScreeningException(
            code="INVALID_IMAGE",
            message="Uploaded file is empty.",
            status_code=400
        )

    if len(file_bytes) > settings.MAX_FILE_SIZE_BYTES:
        raise ScreeningException(
            code="FILE_TOO_LARGE",
            message="File size exceeds maximum limit of 10 MB.",
            status_code=400
        )

    # 2. Content-Type Header check
    if content_type and content_type.lower() not in settings.ALLOWED_MIME_TYPES:
        raise ScreeningException(
            code="INVALID_FILE_TYPE",
            message="Unsupported file format. Please upload a JPG or PNG image.",
            status_code=400
        )

    # 3. Actual Image Content Verification using Pillow
    try:
        image_stream = io.BytesIO(file_bytes)
        img = Image.open(image_stream)
        img.verify()
    except Exception:
        raise ScreeningException(
            code="INVALID_IMAGE",
            message="The uploaded file is not a valid or readable image.",
            status_code=400
        )

