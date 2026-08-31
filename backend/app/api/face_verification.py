import json
import logging
import numpy as np
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, status
from app.services.image_service import image_service
from app.services.face_verification_service import face_verification_service
from app.utils.validation import ScreeningException

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post(
    "/face",
    summary="Live Face Verification Endpoint",
    description="Compares passport photograph face embedding with live camera capture face embedding."
)
async def verify_face(
    passport_image: UploadFile = File(..., description="Passport data-page image file"),
    live_face_image: UploadFile = File(..., description="Live camera capture image file"),
    liveness_data: Optional[str] = Form(None, description="JSON string with liveness challenge responses")
):
    try:
        # Read passport image bytes
        passport_bytes = await passport_image.read()
        passport_pil = image_service.process_upload_bytes(passport_bytes, passport_image.content_type)
        # Convert PIL RGB to OpenCV BGR
        passport_bgr = np.array(passport_pil)[:, :, ::-1]

        # Read live face image bytes
        live_bytes = await live_face_image.read()
        live_pil = image_service.process_upload_bytes(live_bytes, live_face_image.content_type)
        # Convert PIL RGB to OpenCV BGR
        live_bgr = np.array(live_pil)[:, :, ::-1]

        # Parse liveness payload if provided
        liveness_payload = None
        if liveness_data:
            try:
                liveness_payload = json.loads(liveness_data)
            except Exception:
                logger.warning("Failed to parse liveness_data JSON parameter.")

        # Execute face verification service
        result = face_verification_service.verify_faces(
            passport_img_bgr=passport_bgr,
            live_img_bgr=live_bgr,
            liveness_payload=liveness_payload
        )

        return result

    except ScreeningException as se:
        raise HTTPException(
            status_code=se.status_code,
            detail={
                "code": se.code,
                "message": se.message
            }
        )
    except Exception as e:
        logger.error(f"Unhandled error in face verification endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "FACE_VERIFICATION_FAILED",
                "message": f"Unable to process face verification: {str(e)}"
            }
        )
