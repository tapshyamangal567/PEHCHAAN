"""
Risk Assessment model — stores computed risk scores.
Risk is computed from AVAILABLE data only: OCR confidence, MRZ validity,
consistency checks, and field extraction count.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, Float, String, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.models.base import Base
from app.models.verification import RiskLevel


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    verification_id = Column(UUID(as_uuid=True), ForeignKey("verification_records.id"), nullable=False, unique=True, index=True)

    risk_score = Column(Float, nullable=False)  # 0.0 to 100.0
    risk_level = Column(SAEnum(RiskLevel), nullable=False)
    risk_factors = Column(JSONB, nullable=True)  # List of factor dicts explaining the score
    model_version = Column(String(50), nullable=True, default="rule_based_v1")

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationship
    verification = relationship("VerificationRecord", back_populates="risk_assessment")
