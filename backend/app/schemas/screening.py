from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class PassportFields(BaseModel):
    full_name: Optional[str] = Field(default=None, description="Extracted full name")
    passport_number: Optional[str] = Field(default=None, description="Extracted passport number")
    nationality: Optional[str] = Field(default=None, description="Extracted nationality")
    date_of_birth: Optional[str] = Field(default=None, description="Extracted date of birth")
    gender: Optional[str] = Field(default=None, description="Extracted gender (M/F)")
    date_of_issue: Optional[str] = Field(default=None, description="Extracted date of issue")
    date_of_expiry: Optional[str] = Field(default=None, description="Extracted date of expiry")

class FieldConfidenceItem(BaseModel):
    value: Optional[str] = Field(default=None, description="Field value")
    confidence: float = Field(default=0.0, description="Confidence score between 0.0 and 1.0")
    source: str = Field(default="NONE", description="Attributed source: MRZ, VISUAL_OCR, VISUAL_AND_MRZ, or NONE")

class OCRResult(BaseModel):
    raw_text: str = Field(..., description="Raw text detected by OCR")
    confidence: float = Field(..., description="Average OCR confidence (0.0 to 1.0)")

class MRZResponseData(BaseModel):
    detected: bool = Field(default=False, description="Whether TD3 MRZ lines were detected")
    line1: Optional[str] = Field(default=None, description="Normalized MRZ Line 1")
    line2: Optional[str] = Field(default=None, description="Normalized MRZ Line 2")
    checksum_valid: Optional[bool] = Field(default=None, description="Whether all ICAO 9303 check digits are valid")

class ConsistencyCheckResponse(BaseModel):
    name_match: Optional[bool] = Field(default=None, description="Name match boolean")
    passport_number_match: Optional[bool] = Field(default=None, description="Passport number match boolean")
    dob_match: Optional[bool] = Field(default=None, description="Date of birth match boolean")
    expiry_match: Optional[bool] = Field(default=None, description="Date of expiry match boolean")
    name_status: Optional[str] = Field(default="NOT_AVAILABLE", description="Name status: PASS, FAIL, NOT_AVAILABLE")
    passport_number_status: Optional[str] = Field(default="NOT_AVAILABLE", description="Passport number status")
    dob_status: Optional[str] = Field(default="NOT_AVAILABLE", description="Date of birth status")
    expiry_status: Optional[str] = Field(default="NOT_AVAILABLE", description="Date of expiry status")
    gender_status: Optional[str] = Field(default="NOT_AVAILABLE", description="Gender status")
    nationality_status: Optional[str] = Field(default="NOT_AVAILABLE", description="Nationality status")
    overall_status: Optional[str] = Field(default="NOT_AVAILABLE", description="Overall status: PASS, REVIEW, FAIL, NOT_AVAILABLE")
    overall_message: Optional[str] = Field(default=None, description="Overall consistency message")

class ScreeningMetadata(BaseModel):
    processing_time_ms: float = Field(..., description="Total processing time in milliseconds")
    fields_extracted: int = Field(..., description="Number of non-null fields extracted")
    mrz_crop_created: Optional[bool] = Field(default=None, description="Debug: Whether MRZ region crop was created")
    mrz_ocr_variants_tested: Optional[int] = Field(default=None, description="Debug: Number of OCR variants tested")
    mrz_candidates_detected: Optional[int] = Field(default=None, description="Debug: Number of candidate line pairs detected")
    best_candidate_score: Optional[float] = Field(default=None, description="Debug: Highest candidate pair score")

class ValidationCheckItem(BaseModel):
    status: str = Field(..., description="Status: PASS, FAIL, NOT_AVAILABLE, or REVIEW")
    message: str = Field(..., description="Human readable check message")

class ValidationResult(BaseModel):
    overall_status: str = Field(..., description="Overall status: PASS, REVIEW, or FAIL")
    overall_message: str = Field(..., description="Overall summary message")
    checks: Dict[str, ValidationCheckItem] = Field(default_factory=dict)
    passed: int = Field(default=0)
    failed: int = Field(default=0)
    not_available: int = Field(default=0)

from typing import Optional, Dict, Any, List

class SuspiciousRegion(BaseModel):
    x: int
    y: int
    width: int
    height: int
    score: float

class TamperingSignals(BaseModel):
    compression_anomaly: float = Field(default=0.0)
    texture_anomaly: float = Field(default=0.0)
    noise_anomaly: float = Field(default=0.0)
    edge_anomaly: float = Field(default=0.0)
    illumination_anomaly: float = Field(default=0.0)

class TamperingAnalysisResult(BaseModel):
    status: str = Field(..., description="Status: LOW_SUSPICION, MEDIUM_SUSPICION, HIGH_SUSPICION, or INCONCLUSIVE")
    score: float = Field(..., description="Weighted forensic score between 0.0 and 1.0")
    suspicion_score: Optional[float] = Field(default=None, description="Tampering suspicion score (0.0 to 1.0)")
    forensic_confidence: Optional[float] = Field(default=None, description="Forensic confidence (0.0 to 1.0) based on image quality")
    confidence: Optional[float] = Field(default=None, description="Model confidence score")
    signals: TamperingSignals = Field(default_factory=TamperingSignals)
    structured_signals: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="List of individual calculated evidence signals")
    suspicious_regions: List[SuspiciousRegion] = Field(default_factory=list)
    reasons: List[str] = Field(default_factory=list)
    method: str = Field(default="OpenCV Forensic Baseline — image-level screening")
    model_version: str = Field(default="baseline-1.0")

class PassportScreeningResponse(BaseModel):
    success: bool = True
    document_type: str = "passport"
    verification_id: Optional[str] = None
    ocr: OCRResult
    fields: PassportFields
    field_confidence: Dict[str, FieldConfidenceItem] = Field(default_factory=dict)
    mrz: Optional[MRZResponseData] = None
    consistency: ConsistencyCheckResponse = Field(default_factory=ConsistencyCheckResponse)
    validation: Optional[ValidationResult] = None
    tampering_analysis: Optional[TamperingAnalysisResult] = None
    image_quality: Optional[Dict[str, Any]] = Field(default=None, description="Image quality analysis metrics")
    metadata: ScreeningMetadata

class ErrorDetail(BaseModel):
    code: str
    message: str

class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail
