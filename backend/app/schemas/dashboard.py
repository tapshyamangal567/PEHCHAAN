"""
Dashboard Pydantic schemas — for supervisor views.
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class DashboardStats(BaseModel):
    total_verifications: int
    verified_documents: int
    failed_documents: int
    high_risk_documents: int
    critical_risk_documents: int
    today_verifications: int


class RecentVerification(BaseModel):
    verification_id: str
    document_number: Optional[str] = None
    full_name: Optional[str] = None
    risk_level: Optional[str] = None
    verification_result: Optional[str] = None
    officer_username: Optional[str] = None
    created_at: datetime


class OfficerActivity(BaseModel):
    officer_id: str
    username: str
    badge_id: Optional[str] = None
    total_verifications: int
    high_risk_count: int
    last_activity: Optional[datetime] = None


class AuditLogResponse(BaseModel):
    id: str
    user_id: str
    username: Optional[str] = None
    action: str
    verification_id: Optional[str] = None
    ip_address: Optional[str] = None
    details: Optional[dict] = None
    created_at: datetime
