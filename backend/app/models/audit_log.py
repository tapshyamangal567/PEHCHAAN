"""
Audit Log model — tracks all user actions for border security compliance.
"""
import uuid
import enum
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.models.base import Base


class AuditAction(enum.Enum):
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED"
    DOCUMENT_VERIFIED = "DOCUMENT_VERIFIED"
    VERIFICATION_FAILED = "VERIFICATION_FAILED"
    RISK_SCORE_GENERATED = "RISK_SCORE_GENERATED"
    RECORD_VIEWED = "RECORD_VIEWED"
    RECORD_UPDATED = "RECORD_UPDATED"
    USER_CREATED = "USER_CREATED"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    action = Column(SAEnum(AuditAction), nullable=False)
    verification_id = Column(UUID(as_uuid=True), ForeignKey("verification_records.id"), nullable=True, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    details = Column(JSONB, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
    verification = relationship("VerificationRecord", back_populates="audit_logs")
