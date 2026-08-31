"""
Face Verification model — placeholder for future face verification.
All fields are NULLABLE because no face verification service exists yet.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, Float, Boolean, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base


class FaceVerification(Base):
    __tablename__ = "face_verifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    verification_id = Column(UUID(as_uuid=True), ForeignKey("verification_records.id"), nullable=False, unique=True, index=True)

    # All nullable — no face verification service exists yet
    face_detected = Column(Boolean, nullable=True)
    face_match = Column(Boolean, nullable=True)
    similarity_score = Column(Float, nullable=True)
    result = Column(String(50), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationship
    verification = relationship("VerificationRecord", back_populates="face_verification")
