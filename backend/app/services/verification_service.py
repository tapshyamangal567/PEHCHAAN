"""
Verification persistence service — saves verification results to PostgreSQL.
Reuses the existing screening services rather than duplicating their logic.
Uses transactions for multi-table writes.
"""
import uuid
import time
from typing import Optional

from sqlalchemy.orm import Session
from fastapi import UploadFile

from app.models.verification import VerificationRecord, VerificationStatus, RiskLevel
from app.models.extracted_field import ExtractedField
from app.models.risk_assessment import RiskAssessment
from app.models.audit_log import AuditAction
from app.models.user import User

# Import existing services — DO NOT duplicate their logic
from app.services.image_service import image_service
from app.services.ocr_service import ocr_service
from app.services.mrz_service import mrz_service
from app.services.mrz_parser_service import mrz_parser_service
from app.services.parser_service import parser_service
from app.services.combination_service import combination_service
from app.services.consistency_service import consistency_service
from app.services.risk_service import compute_risk_score
from app.services.audit_service import create_audit_log

from app.schemas.screening import (
    PassportScreeningResponse,
    OCRResult,
    MRZResponseData,
    ConsistencyCheckResponse,
    ScreeningMetadata,
)


def generate_verification_id() -> str:
    """Generate a unique, human-readable verification ID."""
    short_uuid = uuid.uuid4().hex[:12].upper()
    return f"VER-{short_uuid}"


async def run_verification(
    file: UploadFile,
    officer: User,
    db: Session,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> PassportScreeningResponse:
    """
    Full verification workflow that reuses existing screening services and persists
    results to PostgreSQL in a single transaction.

    Flow:
    1. Run existing OCR pipeline (same as /api/screening/passport)
    2. Compute risk score from available data
    3. Persist verification record + extracted fields + risk assessment + audit log
    4. Commit transaction (rollback on any error)
    5. Return PassportScreeningResponse with verification_id
    """
    start_time = time.time()
    ver_id = generate_verification_id()

    # === STEP 1: Run existing screening pipeline (UNCHANGED) ===
    file_bytes = await file.read()

    pil_image = image_service.process_upload_bytes(
        file_bytes=file_bytes,
        content_type=file.content_type,
    )
    preprocessed_image = image_service.preprocess_for_ocr(pil_image)

    raw_text, avg_confidence, text_blocks = ocr_service.extract_text(preprocessed_image)

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
            checksum_valid=mrz_parsed.get("checksum_valid") if mrz_parsed else None,
        )

    visual_fields = parser_service.parse_passport_text(raw_text, text_blocks)

    combined_fields, field_confidence = combination_service.combine_fields(
        visual_fields=visual_fields,
        mrz_data=mrz_parsed,
        base_ocr_confidence=avg_confidence,
    )

    consistency_dict = consistency_service.check_consistency(visual_fields, mrz_parsed)
    consistency_response = ConsistencyCheckResponse(**consistency_dict)

    processing_time_ms = round((time.time() - start_time) * 1000, 2)
    combined_dict = combined_fields.model_dump()
    fields_extracted = sum(1 for val in combined_dict.values() if val is not None)

    # === STEP 2: Compute risk score ===
    risk_result = compute_risk_score(
        ocr_confidence=avg_confidence,
        mrz_detected=mrz_parsed.get("detected") if mrz_parsed else None,
        mrz_checksum_valid=mrz_parsed.get("checksum_valid") if mrz_parsed else None,
        consistency_name_match=consistency_dict.get("name_match"),
        consistency_passport_match=consistency_dict.get("passport_number_match"),
        consistency_dob_match=consistency_dict.get("dob_match"),
        consistency_expiry_match=consistency_dict.get("expiry_match"),
        fields_extracted=fields_extracted,
        date_of_expiry=combined_fields.date_of_expiry,
    )

    # === STEP 3: Persist to PostgreSQL (single transaction) ===
    try:
        # Create verification record
        verification = VerificationRecord(
            verification_id=ver_id,
            officer_id=officer.id,
            document_type="passport",
            document_number=combined_fields.passport_number,
            nationality=combined_fields.nationality,
            full_name=combined_fields.full_name,
            date_of_birth=combined_fields.date_of_birth,
            date_of_issue=combined_fields.date_of_issue,
            date_of_expiry=combined_fields.date_of_expiry,
            gender=combined_fields.gender,
            ocr_confidence=avg_confidence,
            mrz_detected=mrz_parsed.get("detected") if mrz_parsed else False,
            mrz_checksum_valid=mrz_parsed.get("checksum_valid") if mrz_parsed else None,
            consistency_name_match=consistency_dict.get("name_match"),
            consistency_passport_match=consistency_dict.get("passport_number_match"),
            consistency_dob_match=consistency_dict.get("dob_match"),
            consistency_expiry_match=consistency_dict.get("expiry_match"),
            verification_status=VerificationStatus.COMPLETED,
            risk_score=risk_result["risk_score"],
            risk_level=risk_result["risk_level"],
            verification_result=risk_result["verification_result"],
            processing_time_ms=processing_time_ms,
            fields_extracted=fields_extracted,
        )
        db.add(verification)
        db.flush()  # Get verification.id without committing

        # Save extracted fields (from field_confidence dict)
        for field_name, conf_item in field_confidence.items():
            extracted = ExtractedField(
                verification_id=verification.id,
                field_name=field_name,
                extracted_value=conf_item.value,
                confidence_score=conf_item.confidence,
                source=conf_item.source,
            )
            db.add(extracted)

        # Save risk assessment
        risk_assessment = RiskAssessment(
            verification_id=verification.id,
            risk_score=risk_result["risk_score"],
            risk_level=risk_result["risk_level"],
            risk_factors=risk_result["risk_factors"],
            model_version="rule_based_v1",
        )
        db.add(risk_assessment)

        # Create audit log
        create_audit_log(
            db=db,
            user_id=officer.id,
            action=AuditAction.DOCUMENT_VERIFIED,
            verification_id=verification.id,
            ip_address=ip_address,
            user_agent=user_agent,
            details={
                "verification_id": ver_id,
                "document_type": "passport",
                "risk_level": risk_result["risk_level"].value,
                "verification_result": risk_result["verification_result"],
            },
        )

        # Commit the entire transaction
        db.commit()

    except Exception:
        db.rollback()
        raise

    # === STEP 4: Return response ===
    return PassportScreeningResponse(
        success=True,
        document_type="passport",
        verification_id=ver_id,
        ocr=OCRResult(raw_text=raw_text, confidence=avg_confidence),
        fields=combined_fields,
        field_confidence=field_confidence,
        mrz=mrz_response_data,
        consistency=consistency_response,
        metadata=ScreeningMetadata(
            processing_time_ms=processing_time_ms,
            fields_extracted=fields_extracted,
        ),
    )
