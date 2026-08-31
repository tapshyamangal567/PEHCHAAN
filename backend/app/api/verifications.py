"""
Verification API routes — CRUD for verification records.
POST reuses existing screening services via verification_service.
"""
import math
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.models.verification import VerificationRecord
from app.models.audit_log import AuditAction
from app.services.verification_service import run_verification
from app.services.audit_service import create_audit_log
from app.schemas.screening import PassportScreeningResponse, ErrorResponse, ErrorDetail
from app.schemas.verification import (
    VerificationSummary,
    VerificationDetailResponse,
    RiskAssessmentResponse,
    ExtractedFieldResponse,
    TamperingAnalysisResponse,
    FaceVerificationResponse,
    PaginatedVerifications,
)
from app.schemas.dashboard import AuditLogResponse
from app.utils.validation import ScreeningException
from fastapi.responses import JSONResponse

router = APIRouter()


@router.post(
    "",
    response_model=PassportScreeningResponse,
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
    summary="Submit Passport Verification",
    description="Upload passport image, run OCR pipeline, compute risk, and persist to PostgreSQL.",
)
async def create_verification(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    officer: User = Depends(require_role("OFFICER", "ADMIN")),
):
    try:
        result = await run_verification(
            file=file,
            officer=officer,
            db=db,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
        return result
    except ScreeningException as exc:
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(
                success=False,
                error=ErrorDetail(code=exc.code, message=exc.message),
            ).model_dump(),
        )
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ErrorResponse(
                success=False,
                error=ErrorDetail(
                    code="VERIFICATION_FAILED",
                    message="An unexpected error occurred during verification.",
                ),
            ).model_dump(),
        )


@router.get(
    "",
    response_model=PaginatedVerifications,
    summary="List Verifications (Officer's own or Supervisor's all)",
)
def list_verifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    risk_level: str = Query(None, description="Filter by risk level: LOW, MEDIUM, HIGH, CRITICAL"),
    document_number: str = Query(None, description="Search by passport/document number"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(VerificationRecord)

    # Officers can only see their own verifications
    if current_user.role.value == "OFFICER":
        query = query.filter(VerificationRecord.officer_id == current_user.id)

    # Filters
    if risk_level:
        query = query.filter(VerificationRecord.risk_level == risk_level)
    if document_number:
        query = query.filter(VerificationRecord.document_number.ilike(f"%{document_number}%"))

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    offset = (page - 1) * page_size

    records = query.order_by(VerificationRecord.created_at.desc()).offset(offset).limit(page_size).all()

    items = []
    for r in records:
        items.append(VerificationSummary(
            id=str(r.id),
            verification_id=r.verification_id,
            document_type=r.document_type,
            document_number=r.document_number,
            full_name=r.full_name,
            nationality=r.nationality,
            risk_score=r.risk_score,
            risk_level=r.risk_level.value if r.risk_level else None,
            verification_status=r.verification_status.value,
            verification_result=r.verification_result,
            created_at=r.created_at,
        ))

    return PaginatedVerifications(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/{verification_id}",
    response_model=VerificationDetailResponse,
    summary="Get Verification Detail",
)
def get_verification(
    verification_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(VerificationRecord).filter(
        VerificationRecord.verification_id == verification_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Verification not found.")

    # Officers can only view their own
    if current_user.role.value == "OFFICER" and record.officer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    # Audit log for viewing
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action=AuditAction.RECORD_VIEWED,
        verification_id=record.id,
        ip_address=request.client.host if request.client else None,
    )
    db.commit()

    # Build response
    extracted = [
        ExtractedFieldResponse(
            field_name=ef.field_name,
            extracted_value=ef.extracted_value,
            confidence_score=ef.confidence_score,
            source=ef.source,
        )
        for ef in record.extracted_fields
    ]

    risk_resp = None
    if record.risk_assessment:
        ra = record.risk_assessment
        risk_resp = RiskAssessmentResponse(
            risk_score=ra.risk_score,
            risk_level=ra.risk_level.value,
            risk_factors=ra.risk_factors,
            model_version=ra.model_version,
            created_at=ra.created_at,
        )

    tampering_resp = None
    if record.tampering_analysis:
        ta = record.tampering_analysis
        tampering_resp = TamperingAnalysisResponse(
            tampering_detected=ta.tampering_detected,
            tampering_score=ta.tampering_score,
            detected_regions=ta.detected_regions,
            analysis_details=ta.analysis_details,
            created_at=ta.created_at,
        )

    face_resp = None
    if record.face_verification:
        fv = record.face_verification
        face_resp = FaceVerificationResponse(
            face_detected=fv.face_detected,
            face_match=fv.face_match,
            similarity_score=fv.similarity_score,
            result=fv.result,
            created_at=fv.created_at,
        )

    return VerificationDetailResponse(
        id=str(record.id),
        verification_id=record.verification_id,
        officer_id=str(record.officer_id),
        document_type=record.document_type,
        document_number=record.document_number,
        nationality=record.nationality,
        full_name=record.full_name,
        date_of_birth=record.date_of_birth,
        date_of_issue=record.date_of_issue,
        date_of_expiry=record.date_of_expiry,
        gender=record.gender,
        ocr_confidence=record.ocr_confidence,
        mrz_detected=record.mrz_detected,
        mrz_checksum_valid=record.mrz_checksum_valid,
        consistency_name_match=record.consistency_name_match,
        consistency_passport_match=record.consistency_passport_match,
        consistency_dob_match=record.consistency_dob_match,
        consistency_expiry_match=record.consistency_expiry_match,
        verification_status=record.verification_status.value,
        risk_score=record.risk_score,
        risk_level=record.risk_level.value if record.risk_level else None,
        verification_result=record.verification_result,
        processing_time_ms=record.processing_time_ms,
        fields_extracted=record.fields_extracted,
        created_at=record.created_at,
        extracted_fields=extracted,
        risk_assessment=risk_resp,
        tampering_analysis=tampering_resp,
        face_verification=face_resp,
    )


@router.get(
    "/{verification_id}/risk",
    response_model=RiskAssessmentResponse,
    summary="Get Risk Assessment for a Verification",
)
def get_risk_assessment(
    verification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(VerificationRecord).filter(
        VerificationRecord.verification_id == verification_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Verification not found.")
    if current_user.role.value == "OFFICER" and record.officer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
    if not record.risk_assessment:
        raise HTTPException(status_code=404, detail="Risk assessment not available.")

    ra = record.risk_assessment
    return RiskAssessmentResponse(
        risk_score=ra.risk_score,
        risk_level=ra.risk_level.value,
        risk_factors=ra.risk_factors,
        model_version=ra.model_version,
        created_at=ra.created_at,
    )


@router.get(
    "/{verification_id}/audit",
    response_model=list[AuditLogResponse],
    summary="Get Audit Trail for a Verification (Supervisor only)",
)
def get_verification_audit(
    verification_id: str,
    db: Session = Depends(get_db),
    supervisor: User = Depends(require_role("SUPERVISOR", "ADMIN")),
):
    record = db.query(VerificationRecord).filter(
        VerificationRecord.verification_id == verification_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Verification not found.")

    from app.models.audit_log import AuditLog
    logs = db.query(AuditLog).filter(
        AuditLog.verification_id == record.id
    ).order_by(AuditLog.created_at.desc()).all()

    result = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first()
        result.append(AuditLogResponse(
            id=str(log.id),
            user_id=str(log.user_id),
            username=user.username if user else None,
            action=log.action.value,
            verification_id=verification_id,
            ip_address=log.ip_address,
            details=log.details,
            created_at=log.created_at,
        ))

    return result
