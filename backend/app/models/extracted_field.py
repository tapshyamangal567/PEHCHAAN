"""
Extracted Field model — stores per-field OCR results from combination_service.
Maps directly to FieldConfidenceItem data structure.
"""
import uuid
from sqlalchemy import Column, String, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base


class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    verification_id = Column(UUID(as_uuid=True), ForeignKey("verification_records.id"), nullable=False, index=True)

    # From FieldConfidenceItem: field_name is the dict key (e.g. "full_name", "passport_number")
    field_name = Column(String(100), nullable=False)
    extracted_value = Column(String(500), nullable=True)
    confidence_score = Column(Float, nullable=True)
    source = Column(String(50), nullable=True)  # MRZ, VISUAL_OCR, VISUAL_AND_MRZ, NONE
    validation_status = Column(String(50), nullable=True)  # For future validation

    # Relationship
    verification = relationship("VerificationRecord", back_populates="extracted_fields")
