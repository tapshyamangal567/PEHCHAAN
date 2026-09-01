"""
Automated Test Suite for Database-Driven Dashboard Endpoints
Tests PostgreSQL aggregations, role-based authorization, and real-time updates.
"""
import os
import sys
import uuid
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import get_db, check_db_connection
from app.models.user import User, UserRole
from app.models.verification import VerificationRecord, VerificationStatus, RiskLevel

client = TestClient(app)


def test_supabase_database_connection():
    """Verify backend is connected to Supabase PostgreSQL"""
    connected = check_db_connection()
    assert connected is True, "Database connection to Supabase failed"


def test_officer_dashboard_summary_and_cases():
    """Verify Officer dashboard endpoints calculate real values from PostgreSQL"""
    # 1. Login as Officer
    r_login = client.post(
        "/api/auth/login",
        json={"username": "OFF-8842", "password": "Password@123", "role": "OFFICER"},
    )
    assert r_login.status_code == 200, f"Login failed: {r_login.text}"
    token = r_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get Summary
    r_summary = client.get("/api/dashboard/summary", headers=headers)
    assert r_summary.status_code == 200
    sum_data = r_summary.json()
    assert "screened_today" in sum_data
    assert "cleared_today" in sum_data
    assert "flagged_today" in sum_data
    assert "total_verifications" in sum_data
    assert "risk_distribution" in sum_data
    assert isinstance(sum_data["screened_today"], int)
    assert isinstance(sum_data["total_verifications"], int)

    # 3. Get Recent Cases
    r_cases = client.get("/api/dashboard/recent-cases", headers=headers)
    assert r_cases.status_code == 200
    cases_data = r_cases.json()
    assert isinstance(cases_data, list)
    if len(cases_data) > 0:
        c = cases_data[0]
        assert "case_id" in c
        assert "holder_name" in c
        assert "passport_number" in c
        assert "risk_level" in c
        assert "status" in c

    # 4. Get Alerts
    r_alerts = client.get("/api/dashboard/alerts", headers=headers)
    assert r_alerts.status_code == 200
    alerts_data = r_alerts.json()
    assert isinstance(alerts_data, list)


def test_supervisor_dashboard_and_officer_activity():
    """Verify Supervisor dashboard endpoints calculate full checkpoint metrics"""
    # 1. Login as Supervisor
    r_login = client.post(
        "/api/auth/login",
        json={"username": "SUP-1090", "password": "Password@123", "role": "SUPERVISOR"},
    )
    assert r_login.status_code == 200, f"Login failed: {r_login.text}"
    token = r_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get Summary
    r_summary = client.get("/api/dashboard/summary", headers=headers)
    assert r_summary.status_code == 200
    sum_data = r_summary.json()
    assert "pending_review_count" in sum_data
    assert "active_officers_count" in sum_data
    assert "risk_distribution" in sum_data

    # 3. Get Officer Activity
    r_act = client.get("/api/dashboard/officer-activity", headers=headers)
    assert r_act.status_code == 200
    act_data = r_act.json()
    assert isinstance(act_data, list)
    if len(act_data) > 0:
        officer = act_data[0]
        assert "name" in officer
        assert "screenings_today" in officer
        assert "status" in officer


def test_role_authorization_and_unauthenticated_access():
    """Verify security: unauthenticated requests and officer access to supervisor endpoints are blocked"""
    # 1. Unauthenticated request must return 401
    r_unauth = client.get("/api/dashboard/summary")
    assert r_unauth.status_code in [401, 403]

    # 2. Officer attempting supervisor officer-activity must return 403
    r_login = client.post(
        "/api/auth/login",
        json={"username": "OFF-8842", "password": "Password@123", "role": "OFFICER"},
    )
    off_token = r_login.json()["access_token"]
    r_forbidden = client.get(
        "/api/dashboard/officer-activity",
        headers={"Authorization": f"Bearer {off_token}"},
    )
    assert r_forbidden.status_code == 403


def test_real_time_metric_increment_on_database_insert():
    """Verify that adding a record to PostgreSQL immediately increments dashboard statistics"""
    db: Session = next(get_db())
    try:
        officer = db.query(User).filter(User.username == "OFF-8842").first()
        assert officer is not None, "Officer user OFF-8842 not found"

        # Read initial summary
        r_login = client.post(
            "/api/auth/login",
            json={"username": "OFF-8842", "password": "Password@123", "role": "OFFICER"},
        )
        token = r_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        initial_summary = client.get("/api/dashboard/summary", headers=headers).json()
        initial_total = initial_summary["total_verifications"]
        initial_today = initial_summary["screened_today"]

        # Insert test verification record directly into Supabase PostgreSQL
        test_case_id = f"TEST-CASE-{uuid.uuid4().hex[:6].upper()}"
        test_record = VerificationRecord(
            id=uuid.uuid4(),
            verification_id=test_case_id,
            officer_id=officer.id,
            document_type="passport",
            document_number="Z9999999",
            nationality="IND",
            full_name="Test Verification Candidate",
            verification_status=VerificationStatus.COMPLETED,
            verification_result="PASS",
            risk_score=5.0,
            risk_level=RiskLevel.LOW,
            created_at=datetime.now(timezone.utc),
        )
        db.add(test_record)
        db.commit()

        # Re-fetch summary via dashboard API
        new_summary = client.get("/api/dashboard/summary", headers=headers).json()
        assert new_summary["total_verifications"] == initial_total + 1
        assert new_summary["screened_today"] == initial_today + 1

        # Clean up test record
        db.delete(test_record)
        db.commit()

    finally:
        db.close()


if __name__ == "__main__":
    print("Running dashboard test suite...")
    test_supabase_database_connection()
    print("PASS: test_supabase_database_connection")
    test_officer_dashboard_summary_and_cases()
    print("PASS: test_officer_dashboard_summary_and_cases")
    test_supervisor_dashboard_and_officer_activity()
    print("PASS: test_supervisor_dashboard_and_officer_activity")
    test_role_authorization_and_unauthenticated_access()
    print("PASS: test_role_authorization_and_unauthenticated_access")
    test_real_time_metric_increment_on_database_insert()
    print("PASS: test_real_time_metric_increment_on_database_insert")
    print("\nALL 5 DASHBOARD DATABASE TESTS PASSED SUCCESSFULLY!")
