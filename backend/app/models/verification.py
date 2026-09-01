"""
Verification Record model — stores each passport/document verification attempt.
Fields are derived ONLY from data available in the existing screening pipeline.
"""
import uuid
import enum
from datetime import datetime, timezone

from sqlalchemy import Column, String, Float, Boolean, DateTime, Integer, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base


class VerificationStatus(enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class RiskLevel(enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    verification_id = Column(String(50), unique=True, nullable=False, index=True)
    officer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Document metadata — from PassportFields (combination_service output)
    document_type = Column(String(50), nullable=False, default="passport")
    document_number = Column(String(50), nullable=True, index=True)  # passport_number from OCR
    nationality = Column(String(50), nullable=True)
    full_name = Column(String(255), nullable=True)
    date_of_birth = Column(String(20), nullable=True)
    date_of_issue = Column(String(20), nullable=True)
    date_of_expiry = Column(String(20), nullable=True)
    gender = Column(String(10), nullable=True)

    # OCR metadata — from ocr_service output
    ocr_confidence = Column(Float, nullable=True)

    # MRZ metadata — from mrz_parser_service output
    mrz_detected = Column(Boolean, nullable=True)
    mrz_checksum_valid = Column(Boolean, nullable=True)

    # Consistency — from consistency_service output
    consistency_name_match = Column(Boolean, nullable=True)
    consistency_passport_match = Column(Boolean, nullable=True)
    consistency_dob_match = Column(Boolean, nullable=True)
    consistency_expiry_match = Column(Boolean, nullable=True)

    # Verification result
    verification_status = Column(SAEnum(VerificationStatus), nullable=False, default=VerificationStatus.COMPLETED)
    risk_score = Column(Float, nullable=True)
    risk_level = Column(SAEnum(RiskLevel), nullable=True, index=True)
    verification_result = Column(String(50), nullable=True)  # PASS / REVIEW / FAIL

    # Processing & Offline Sync Metadata
    processing_time_ms = Column(Float, nullable=True)
    fields_extracted = Column(Integer, nullable=True)
    local_case_id = Column(String(100), nullable=True, unique=True, index=True)
    is_offline_sync = Column(Boolean, default=False, nullable=True)
    captured_at = Column(DateTime(timezone=True), nullable=True)
    synced_at = Column(DateTime(timezone=True), nullable=True)

    # Blockchain Audit & Integrity Layer (Polygon Amoy)
    blockchain_status = Column(String(50), nullable=True, default="PENDING", index=True)  # PENDING / QUEUED / CONFIRMED / FAILED / NOT_REQUESTED
    blockchain_network = Column(String(50), nullable=True, default="polygon-amoy")
    case_hash = Column(String(66), nullable=True, index=True)
    document_hash = Column(String(66), nullable=True)
    result_hash = Column(String(66), nullable=True)
    blockchain_tx_hash = Column(String(66), nullable=True, index=True)
    blockchain_block_number = Column(Integer, nullable=True)
    blockchain_timestamp = Column(DateTime(timezone=True), nullable=True)
    blockchain_error = Column(String(500), nullable=True)
    blockchain_anchored_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    officer = relationship("User", back_populates="verification_records")
    extracted_fields = relationship("ExtractedField", back_populates="verification", cascade="all, delete-orphan")
    tampering_analysis = relationship("TamperingAnalysis", back_populates="verification", uselist=False, cascade="all, delete-orphan")
    face_verification = relationship("FaceVerification", back_populates="verification", uselist=False, cascade="all, delete-orphan")
    risk_assessment = relationship("RiskAssessment", back_populates="verification", uselist=False, cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="verification", lazy="dynamic")
