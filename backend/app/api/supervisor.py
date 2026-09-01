"""
Supervisor API routes — dashboard, search, officer activity, audit logs.
All routes require SUPERVISOR or ADMIN role.
"""
import math
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User, UserRole
from app.models.verification import VerificationRecord, VerificationStatus, RiskLevel
from app.models.audit_log import AuditLog
from app.schemas.dashboard import (
    DashboardStats,
    RecentVerification,
    OfficerActivity,
    AuditLogResponse,
)
from app.schemas.verification import VerificationSummary, PaginatedVerifications

router = APIRouter()


@router.get(
    "/dashboard",
    response_model=DashboardStats,
    summary="Supervisor Dashboard Statistics",
)
def get_dashboard(
    db: Session = Depends(get_db),
    supervisor: User = Depends(require_role("SUPERVISOR", "ADMIN")),
):
    total = db.query(func.count(VerificationRecord.id)).scalar() or 0

    verified = db.query(func.count(VerificationRecord.id)).filter(
        VerificationRecord.verification_status == VerificationStatus.COMPLETED,
        VerificationRecord.verification_result == "PASS",
    ).scalar() or 0

    failed = db.query(func.count(VerificationRecord.id)).filter(
        VerificationRecord.verification_result == "FAIL",
    ).scalar() or 0

    high_risk = db.query(func.count(VerificationRecord.id)).filter(
        VerificationRecord.risk_level == RiskLevel.HIGH,
    ).scalar() or 0

    critical_risk = db.query(func.count(VerificationRecord.id)).filter(
        VerificationRecord.risk_level == RiskLevel.CRITICAL,
    ).scalar() or 0

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_count = db.query(func.count(VerificationRecord.id)).filter(
        VerificationRecord.created_at >= today_start,
    ).scalar() or 0

    return DashboardStats(
        total_verifications=total,
        verified_documents=verified,
        failed_documents=failed,
        high_risk_documents=high_risk,
        critical_risk_documents=critical_risk,
        today_verifications=today_count,
    )


@router.get(
    "/verifications",
    response_model=PaginatedVerifications,
    summary="Search All Verifications (Supervisor)",
)
def search_verifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    risk_level: str = Query(None),
    document_number: str = Query(None),
    verification_id: str = Query(None),
    date_from: str = Query(None, description="Filter from date (YYYY-MM-DD)"),
    date_to: str = Query(None, description="Filter to date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    supervisor: User = Depends(require_role("SUPERVISOR", "ADMIN")),
):
    query = db.query(VerificationRecord)

    if risk_level:
        query = query.filter(VerificationRecord.risk_level == risk_level)
    if document_number:
        query = query.filter(VerificationRecord.document_number.ilike(f"%{document_number}%"))
    if verification_id:
        query = query.filter(VerificationRecord.verification_id.ilike(f"%{verification_id}%"))
    if date_from:
        try:
            dt_from = datetime.strptime(date_from, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            query = query.filter(VerificationRecord.created_at >= dt_from)
        except ValueError:
            pass
    if date_to:
        try:
            dt_to = datetime.strptime(date_to, "%Y-%m-%d").replace(tzinfo=timezone.utc) + timedelta(days=1)
            query = query.filter(VerificationRecord.created_at < dt_to)
        except ValueError:
            pass

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    offset = (page - 1) * page_size

    records = query.order_by(VerificationRecord.created_at.desc()).offset(offset).limit(page_size).all()

    items = []
    for r in records:
        items.append(VerificationSummary(
            id=str(r.id),
            verification_id=r.verification_id,
            document_type=r.document_type,
            document_number=r.document_number,
            full_name=r.full_name,
            nationality=r.nationality,
            risk_score=r.risk_score,
            risk_level=r.risk_level.value if r.risk_level else None,
            verification_status=r.verification_status.value,
            verification_result=r.verification_result,
            created_at=r.created_at,
        ))

    return PaginatedVerifications(
        items=items, total=total, page=page, page_size=page_size, total_pages=total_pages,
    )


@router.get(
    "/officers",
    response_model=List[OfficerActivity],
    summary="Officer Activity Summary",
)
def get_officer_activity(
    db: Session = Depends(get_db),
    supervisor: User = Depends(require_role("SUPERVISOR", "ADMIN")),
):
    officers = db.query(User).filter(User.role == UserRole.OFFICER).all()

    result = []
    for officer in officers:
        total_ver = db.query(func.count(VerificationRecord.id)).filter(
            VerificationRecord.officer_id == officer.id,
        ).scalar() or 0

        high_risk_count = db.query(func.count(VerificationRecord.id)).filter(
            VerificationRecord.officer_id == officer.id,
            VerificationRecord.risk_level.in_([RiskLevel.HIGH, RiskLevel.CRITICAL]),
        ).scalar() or 0

        last_ver = db.query(func.max(VerificationRecord.created_at)).filter(
            VerificationRecord.officer_id == officer.id,
        ).scalar()

        result.append(OfficerActivity(
            officer_id=str(officer.id),
            username=officer.username,
            badge_id=officer.badge_id,
            total_verifications=total_ver,
            high_risk_count=high_risk_count,
            last_activity=last_ver,
        ))

    return result


@router.get(
    "/recent",
    response_model=List[RecentVerification],
    summary="Recent Verification Activity",
)
def get_recent_verifications(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    supervisor: User = Depends(require_role("SUPERVISOR", "ADMIN")),
):
    records = db.query(VerificationRecord).order_by(
        VerificationRecord.created_at.desc()
    ).limit(limit).all()

    result = []
    for r in records:
        officer = db.query(User).filter(User.id == r.officer_id).first()
        result.append(RecentVerification(
            verification_id=r.verification_id,
            document_number=r.document_number,
            full_name=r.full_name,
            risk_level=r.risk_level.value if r.risk_level else None,
            verification_result=r.verification_result,
            officer_username=officer.username if officer else None,
            created_at=r.created_at,
        ))

    return result


@router.get(
    "/audit-logs",
    response_model=List[AuditLogResponse],
    summary="System Audit Logs",
)
def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    supervisor: User = Depends(require_role("SUPERVISOR", "ADMIN")),
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()

    result = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first()
        ver_record = None
        if log.verification_id:
            ver_record = db.query(VerificationRecord).filter(
                VerificationRecord.id == log.verification_id
            ).first()

        result.append(AuditLogResponse(
            id=str(log.id),
            user_id=str(log.user_id),
            username=user.username if user else None,
            action=log.action.value,
            verification_id=ver_record.verification_id if ver_record else None,
            ip_address=log.ip_address,
            details=log.details,
            created_at=log.created_at,
        ))

    return result
