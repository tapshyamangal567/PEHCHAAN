"""
Audit logging service — creates audit trail entries.
"""
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog, AuditAction


def create_audit_log(
    db: Session,
    user_id: UUID,
    action: AuditAction,
    verification_id: Optional[UUID] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    details: Optional[dict] = None,
) -> AuditLog:
    """Creates an audit log entry. Does NOT commit — caller manages the transaction."""
    log = AuditLog(
        user_id=user_id,
        action=action,
        verification_id=verification_id,
        ip_address=ip_address,
        user_agent=user_agent,
        details=details,
    )
    db.add(log)
    return log
