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
    name_match: Optional[bool] = Field(default=None, description="Name match between Visual OCR and MRZ")
    passport_number_match: Optional[bool] = Field(default=None, description="Passport number match")
    dob_match: Optional[bool] = Field(default=None, description="Date of birth match")
    expiry_match: Optional[bool] = Field(default=None, description="Date of expiry match")

class ScreeningMetadata(BaseModel):
    processing_time_ms: float = Field(..., description="Total processing time in milliseconds")
    fields_extracted: int = Field(..., description="Number of non-null fields extracted")

class PassportScreeningResponse(BaseModel):
    success: bool = True
    document_type: str = "passport"
    ocr: OCRResult
    fields: PassportFields
    field_confidence: Dict[str, FieldConfidenceItem] = Field(default_factory=dict)
    mrz: Optional[MRZResponseData] = None
    consistency: ConsistencyCheckResponse = Field(default_factory=ConsistencyCheckResponse)
    metadata: ScreeningMetadata

class ErrorDetail(BaseModel):
    code: str
    message: str

class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail
