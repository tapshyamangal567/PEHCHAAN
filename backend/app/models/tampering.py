"""
Tampering Analysis model — placeholder for future tampering detection.
All fields are NULLABLE because no tampering detection service exists yet.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.models.base import Base


class TamperingAnalysis(Base):
    __tablename__ = "tampering_analyses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    verification_id = Column(UUID(as_uuid=True), ForeignKey("verification_records.id"), nullable=False, unique=True, index=True)

    # All nullable — no tampering detection service exists yet
    tampering_detected = Column(Boolean, nullable=True)
    tampering_score = Column(Float, nullable=True)
    detected_regions = Column(JSONB, nullable=True)  # List of region dicts if available
    analysis_details = Column(JSONB, nullable=True)  # Raw AI output if available

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationship
    verification = relationship("VerificationRecord", back_populates="tampering_analysis")
