import time
from fastapi import APIRouter, UploadFile, File, status
from fastapi.responses import JSONResponse

from app.schemas.screening import (
    PassportScreeningResponse,
    OCRResult,
    MRZResponseData,
    ConsistencyCheckResponse,
    ScreeningMetadata,
    ErrorResponse,
    ErrorDetail,
)
from app.services.image_service import image_service
from app.services.ocr_service import ocr_service
from app.services.mrz_service import mrz_service
from app.services.mrz_parser_service import mrz_parser_service
from app.services.parser_service import parser_service
from app.services.combination_service import combination_service
from app.services.consistency_service import consistency_service
from app.utils.validation import ScreeningException

router = APIRouter()

@router.post(
    "/passport",
    response_model=PassportScreeningResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid file, image, or size constraint error"},
        422: {"model": ErrorResponse, "description": "Unprocessable upload"},
        500: {"model": ErrorResponse, "description": "Internal server or OCR error"},
    },
    summary="Process and Extract Passport Information",
    description="Accepts a passport data page image file, validates image content, runs EasyOCR and TD3 MRZ extraction, validates check digits, cross-checks fields, and returns structured data."
)
async def process_passport(file: UploadFile = File(...)):
    start_time = time.time()
    
    try:
        # 1. Read file bytes asynchronously
        file_bytes = await file.read()
        
        # 2. Validate and load image into memory
        pil_image = image_service.process_upload_bytes(
            file_bytes=file_bytes,
            content_type=file.content_type
        )
        
        # 3. Preprocess Image for higher OCR accuracy
        preprocessed_image = image_service.preprocess_for_ocr(pil_image)

        # 4. Perform Optical Character Recognition (EasyOCR)
        raw_text, avg_confidence, text_blocks = ocr_service.extract_text(preprocessed_image)

        # 5. Detect and Parse TD3 MRZ Lines
        mrz_lines = mrz_service.detect_mrz_lines(raw_text, text_blocks)
        mrz_parsed = None
        mrz_response_data = None

        if mrz_lines and mrz_lines.get("detected"):
            line1 = mrz_lines["line1"]
            line2 = mrz_lines["line2"]
            mrz_parsed = mrz_parser_service.parse_td3_mrz(line1, line2)
            
            mrz_response_data = MRZResponseData(
                detected=True,
                line1=line1,
                line2=line2,
                checksum_valid=mrz_parsed.get("checksum_valid") if mrz_parsed else None
            )

        # 6. Parse Visual OCR Fields
        visual_fields = parser_service.parse_passport_text(raw_text, text_blocks)

        # 7. Combine Fields based on Priority (MRZ > Visual OCR) and score confidence
        combined_fields, field_confidence = combination_service.combine_fields(
            visual_fields=visual_fields,
            mrz_data=mrz_parsed,
            base_ocr_confidence=avg_confidence
        )

        # 8. Check Visual vs MRZ Consistency
        consistency_dict = consistency_service.check_consistency(visual_fields, mrz_parsed)
        consistency_response = ConsistencyCheckResponse(**consistency_dict)

        # 9. Calculate Metadata
        processing_time_ms = round((time.time() - start_time) * 1000, 2)
        combined_dict = combined_fields.model_dump()
        fields_extracted = sum(1 for val in combined_dict.values() if val is not None)

        return PassportScreeningResponse(
            success=True,
            document_type="passport",
            ocr=OCRResult(
                raw_text=raw_text,
                confidence=avg_confidence
            ),
            fields=combined_fields,
            field_confidence=field_confidence,
            mrz=mrz_response_data,
            consistency=consistency_response,
            metadata=ScreeningMetadata(
                processing_time_ms=processing_time_ms,
                fields_extracted=fields_extracted
            )
        )

    except ScreeningException as exc:
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(
                success=False,
                error=ErrorDetail(code=exc.code, message=exc.message)
            ).model_dump()
        )
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ErrorResponse(
                success=False,
                error=ErrorDetail(
                    code="PROCESSING_FAILED",
                    message="An unexpected error occurred while processing the document."
                )
            ).model_dump()
        )
