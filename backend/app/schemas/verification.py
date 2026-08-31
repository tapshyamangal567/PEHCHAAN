"""
Verification Pydantic schemas — for API responses and list views.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class VerificationSummary(BaseModel):
    """Compact verification record for list views."""
    id: str
    verification_id: str
    document_type: str
    document_number: Optional[str] = None
    full_name: Optional[str] = None
    nationality: Optional[str] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    verification_status: str
    verification_result: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ExtractedFieldResponse(BaseModel):
    field_name: str
    extracted_value: Optional[str] = None
    confidence_score: Optional[float] = None
    source: Optional[str] = None

    model_config = {"from_attributes": True}


class RiskAssessmentResponse(BaseModel):
    risk_score: float
    risk_level: str
    risk_factors: Optional[List[Dict[str, Any]]] = None
    model_version: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TamperingAnalysisResponse(BaseModel):
    tampering_detected: Optional[bool] = None
    tampering_score: Optional[float] = None
    detected_regions: Optional[Any] = None
    analysis_details: Optional[Any] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class FaceVerificationResponse(BaseModel):
    face_detected: Optional[bool] = None
    face_match: Optional[bool] = None
    similarity_score: Optional[float] = None
    result: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class VerificationDetailResponse(BaseModel):
    """Full verification record with all related data."""
    id: str
    verification_id: str
    officer_id: str
    document_type: str
    document_number: Optional[str] = None
    nationality: Optional[str] = None
    full_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    date_of_issue: Optional[str] = None
    date_of_expiry: Optional[str] = None
    gender: Optional[str] = None

    ocr_confidence: Optional[float] = None
    mrz_detected: Optional[bool] = None
    mrz_checksum_valid: Optional[bool] = None

    consistency_name_match: Optional[bool] = None
    consistency_passport_match: Optional[bool] = None
    consistency_dob_match: Optional[bool] = None
    consistency_expiry_match: Optional[bool] = None

    verification_status: str
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    verification_result: Optional[str] = None
    processing_time_ms: Optional[float] = None
    fields_extracted: Optional[int] = None

    created_at: datetime

    extracted_fields: List[ExtractedFieldResponse] = []
    risk_assessment: Optional[RiskAssessmentResponse] = None
    tampering_analysis: Optional[TamperingAnalysisResponse] = None
    face_verification: Optional[FaceVerificationResponse] = None

    model_config = {"from_attributes": True}


class PaginatedVerifications(BaseModel):
    items: List[VerificationSummary]
    total: int
    page: int
    page_size: int
    total_pages: int
