"""
Models Package — imports all models so Alembic autogenerate can discover them.
"""
from app.models.base import Base
from app.models.user import User, UserRole
from app.models.verification import VerificationRecord, VerificationStatus, RiskLevel
from app.models.extracted_field import ExtractedField
from app.models.tampering import TamperingAnalysis
from app.models.face_verification import FaceVerification
from app.models.risk_assessment import RiskAssessment
from app.models.audit_log import AuditLog, AuditAction

__all__ = [
    "Base",
    "User", "UserRole",
    "VerificationRecord", "VerificationStatus", "RiskLevel",
    "ExtractedField",
    "TamperingAnalysis",
    "FaceVerification",
    "RiskAssessment",
    "AuditLog", "AuditAction",
]
