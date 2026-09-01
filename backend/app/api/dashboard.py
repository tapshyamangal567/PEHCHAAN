"""
Database-driven Dashboard API routes — for Officers and Supervisors.
All queries compute real metrics strictly from Supabase PostgreSQL.
"""
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, desc
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.verification import VerificationRecord, VerificationStatus, RiskLevel
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    RiskDistribution,
    DashboardCaseItem,
    DashboardAlertItem,
    ActiveOfficerActivity,
    DashboardTrendItem,
)

router = APIRouter()


def format_time_ago(dt: Optional[datetime]) -> str:
    if not dt:
        return "N/A"
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    diff = now - dt
    seconds = int(diff.total_seconds())
    if seconds < 0:
        return "Just now"
    if seconds < 60:
        return "Just now"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes} min ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours} hr ago" if hours == 1 else f"{hours} hrs ago"
    days = hours // 24
    if days == 1:
        return "Yesterday"
    if days < 7:
        return f"{days} days ago"
    return dt.strftime("%d %b %Y")


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    summary="Get Database-Driven Dashboard Summary Metrics",
)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    is_officer = current_user.role == UserRole.OFFICER

    # Base query filters
    if is_officer:
        base_today = db.query(VerificationRecord).filter(
            VerificationRecord.officer_id == current_user.id,
            VerificationRecord.created_at >= today_start,
        )
        base_all = db.query(VerificationRecord).filter(
            VerificationRecord.officer_id == current_user.id
        )
    else:
        base_today = db.query(VerificationRecord).filter(
            VerificationRecord.created_at >= today_start
        )
        base_all = db.query(VerificationRecord)

    # 1. Screened Today
    screened_today = base_today.count()

    # 2. Cleared Today (PASS or LOW risk)
    cleared_today = base_today.filter(
        or_(
            VerificationRecord.verification_result == "PASS",
            VerificationRecord.risk_level == RiskLevel.LOW,
        )
    ).count()

    # 3. Flagged Today (FAIL, HIGH, or CRITICAL risk)
    flagged_today = base_today.filter(
        or_(
            VerificationRecord.verification_result == "FAIL",
            VerificationRecord.risk_level.in_([RiskLevel.HIGH, RiskLevel.CRITICAL]),
        )
    ).count()

    # 4. Under Review Today (REVIEW or MEDIUM risk)
    under_review_today = base_today.filter(
        or_(
            VerificationRecord.verification_result == "REVIEW",
            VerificationRecord.risk_level == RiskLevel.MEDIUM,
        )
    ).count()

    # 5. Total Verifications
    total_verifications = base_all.count()

    # 6. Pending Review Count (Total cases requiring supervisor review across system)
    pending_review_count = db.query(VerificationRecord).filter(
        or_(
            VerificationRecord.verification_result == "REVIEW",
            VerificationRecord.risk_level.in_([RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL]),
        )
    ).count()

    # 7. Active Officers Count Today
    active_officers_count = db.query(
        func.count(func.distinct(VerificationRecord.officer_id))
    ).filter(VerificationRecord.created_at >= today_start).scalar() or 0

    # 8. Risk Distribution across all historical verifications in DB
    total_all = db.query(func.count(VerificationRecord.id)).scalar() or 0
    if total_all > 0:
        low_count = db.query(func.count(VerificationRecord.id)).filter(
            VerificationRecord.risk_level == RiskLevel.LOW
        ).scalar() or 0
        med_count = db.query(func.count(VerificationRecord.id)).filter(
            VerificationRecord.risk_level == RiskLevel.MEDIUM
        ).scalar() or 0
        high_count = db.query(func.count(VerificationRecord.id)).filter(
            VerificationRecord.risk_level.in_([RiskLevel.HIGH, RiskLevel.CRITICAL])
        ).scalar() or 0

        low_pct = round((low_count / total_all) * 100)
        med_pct = round((med_count / total_all) * 100)
        high_pct = round((high_count / total_all) * 100)
    else:
        low_pct, med_pct, high_pct = 0, 0, 0

    return DashboardSummaryResponse(
        screened_today=screened_today,
        cleared_today=cleared_today,
        flagged_today=flagged_today,
        under_review_today=under_review_today,
        total_verifications=total_verifications,
        pending_review_count=pending_review_count,
        active_officers_count=active_officers_count,
        risk_distribution=RiskDistribution(
            low_percentage=low_pct,
            medium_percentage=med_pct,
            high_percentage=high_pct,
        ),
    )


@router.get(
    "/recent-cases",
    response_model=List[DashboardCaseItem],
    summary="Get Database-Driven Recent Cases",
)
def get_recent_cases(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(VerificationRecord)

    # Officers only see their own recent cases, Supervisors/Admins see all
    if current_user.role == UserRole.OFFICER:
        query = query.filter(VerificationRecord.officer_id == current_user.id)

    records = query.order_by(desc(VerificationRecord.created_at)).limit(limit).all()

    result: List[DashboardCaseItem] = []
    for r in records:
        # Determine status string for badge
        if r.verification_result == "FAIL" or (r.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]):
            status_str = "FLAGGED"
        elif r.verification_result == "REVIEW" or r.risk_level == RiskLevel.MEDIUM:
            status_str = "PENDING"
        else:
            status_str = "VERIFIED"

        risk_level_str = r.risk_level.value if r.risk_level else "LOW"
        risk_score_val = int(r.risk_score or 0)

        # Match score from face verification or derived from low risk
        if r.face_verification and r.face_verification.similarity_score is not None:
            match_score_val = int(r.face_verification.similarity_score)
        else:
            match_score_val = max(0, min(100, 100 - risk_score_val))

        officer_name = r.officer.username if r.officer else "Officer"
        officer_badge = r.officer.badge_id if r.officer else "N/A"

        result.append(
            DashboardCaseItem(
                id=str(r.id),
                case_id=r.verification_id,
                document_type=(r.document_type or "Passport").capitalize(),
                holder_name=r.full_name or "Unknown Holder",
                passport_number=r.document_number or "N/A",
                nationality=r.nationality or "IND",
                risk_level=risk_level_str,
                status=status_str,
                risk_score=risk_score_val,
                match_score=match_score_val,
                timestamp=format_time_ago(r.created_at),
                created_at=r.created_at,
                officer_name=officer_name,
                officer_badge=officer_badge,
                reason=f"Risk Score: {risk_score_val}/100 • Result: {r.verification_result or 'COMPLETED'}",
                mrz_status="PASSED" if r.mrz_checksum_valid else ("FAILED" if r.mrz_checksum_valid is False else "N/A"),
                watchlist_match=bool(r.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]),
            )
        )

    return result


@router.get(
    "/alerts",
    response_model=List[DashboardAlertItem],
    summary="Get Database-Driven Security Alerts",
)
def get_dashboard_alerts(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(VerificationRecord).filter(
        or_(
            VerificationRecord.risk_level.in_([RiskLevel.HIGH, RiskLevel.CRITICAL, RiskLevel.MEDIUM]),
            VerificationRecord.verification_result.in_(["FAIL", "REVIEW"]),
        )
    )

    if current_user.role == UserRole.OFFICER:
        query = query.filter(VerificationRecord.officer_id == current_user.id)

    records = query.order_by(desc(VerificationRecord.created_at)).limit(limit).all()

    alerts: List[DashboardAlertItem] = []
    for r in records:
        risk_lvl = r.risk_level.value if r.risk_level else "HIGH"
        if risk_lvl in ["HIGH", "CRITICAL"]:
            title = "Passport anomaly flagged for high risk"
            desc_text = f"Document {r.document_number or r.verification_id} exceeded risk threshold ({int(r.risk_score or 0)}/100)."
        else:
            title = "Document requires secondary review"
            desc_text = f"Document {r.document_number or r.verification_id} marked for review by automated pipeline."

        alerts.append(
            DashboardAlertItem(
                id=f"ALT-{r.verification_id}",
                case_id=r.verification_id,
                title=title,
                description=desc_text,
                risk_level=risk_lvl,
                timestamp=format_time_ago(r.created_at),
                passport_number=r.document_number,
                nationality=r.nationality,
            )
        )

    return alerts


@router.get(
    "/officer-activity",
    response_model=List[ActiveOfficerActivity],
    summary="Get Database-Driven Officer Operations Activity",
)
def get_dashboard_officer_activity(
    db: Session = Depends(get_db),
    supervisor: User = Depends(require_role("SUPERVISOR", "ADMIN")),
):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    officers = db.query(User).filter(User.role == UserRole.OFFICER).all()

    result: List[ActiveOfficerActivity] = []
    for off in officers:
        screenings_today = db.query(func.count(VerificationRecord.id)).filter(
            VerificationRecord.officer_id == off.id,
            VerificationRecord.created_at >= today_start,
        ).scalar() or 0

        total_ver = db.query(func.count(VerificationRecord.id)).filter(
            VerificationRecord.officer_id == off.id,
        ).scalar() or 0

        last_ver = db.query(VerificationRecord.created_at).filter(
            VerificationRecord.officer_id == off.id,
        ).order_by(desc(VerificationRecord.created_at)).first()

        last_active_str = format_time_ago(last_ver[0]) if last_ver else "No activity"

        result.append(
            ActiveOfficerActivity(
                id=str(off.id),
                name=off.username,
                badge_id=off.badge_id or off.username,
                screenings_today=screenings_today,
                total_verifications=total_ver,
                status="ACTIVE" if screenings_today > 0 else "INACTIVE",
                last_active=last_active_str,
            )
        )

    # Sort by screenings today descending
    result.sort(key=lambda x: x.screenings_today, reverse=True)
    return result


@router.get(
    "/trends",
    response_model=List[DashboardTrendItem],
    summary="Get Database-Driven 7-Day Verification Trends",
)
def get_dashboard_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    trends: List[DashboardTrendItem] = []

    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        date_label = day_start.strftime("%Y-%m-%d")

        query = db.query(VerificationRecord).filter(
            VerificationRecord.created_at >= day_start,
            VerificationRecord.created_at < day_end,
        )

        if current_user.role == UserRole.OFFICER:
            query = query.filter(VerificationRecord.officer_id == current_user.id)

        day_total = query.count()
        day_cleared = query.filter(
            or_(
                VerificationRecord.verification_result == "PASS",
                VerificationRecord.risk_level == RiskLevel.LOW,
            )
        ).count()
        day_flagged = query.filter(
            or_(
                VerificationRecord.verification_result == "FAIL",
                VerificationRecord.risk_level.in_([RiskLevel.HIGH, RiskLevel.CRITICAL]),
            )
        ).count()

        trends.append(
            DashboardTrendItem(
                date=date_label,
                total=day_total,
                cleared=day_cleared,
                flagged=day_flagged,
            )
        )

    return trends
