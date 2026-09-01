"""
Dashboard Pydantic schemas — for database-driven officer and supervisor views.
"""
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


class RiskDistribution(BaseModel):
    low_percentage: int
    medium_percentage: int
    high_percentage: int


class DashboardSummaryResponse(BaseModel):
    screened_today: int
    cleared_today: int
    flagged_today: int
    under_review_today: int
    total_verifications: int
    pending_review_count: int
    active_officers_count: int
    risk_distribution: RiskDistribution


class DashboardCaseItem(BaseModel):
    id: str
    case_id: str
    document_type: str
    holder_name: str
    passport_number: str
    nationality: str
    risk_level: str
    status: str
    risk_score: int
    match_score: int
    timestamp: str
    created_at: datetime
    officer_name: Optional[str] = None
    officer_badge: Optional[str] = None
    reason: Optional[str] = None
    mrz_status: Optional[str] = None
    watchlist_match: Optional[bool] = None


class DashboardAlertItem(BaseModel):
    id: str
    case_id: str
    title: str
    description: str
    risk_level: str
    timestamp: str
    passport_number: Optional[str] = None
    nationality: Optional[str] = None


class ActiveOfficerActivity(BaseModel):
    id: str
    name: str
    badge_id: str
    screenings_today: int
    total_verifications: int
    status: str
    last_active: str


class DashboardTrendItem(BaseModel):
    date: str
    total: int
    cleared: int
    flagged: int


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
