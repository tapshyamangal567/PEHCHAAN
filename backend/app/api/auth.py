"""
Authentication API routes for Investigating Officers and Supervisors.
"""
import re
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.security import (
    verify_password,
    create_access_token,
    get_current_user,
    require_role,
    hash_password,
)
from app.models.user import User, UserRole
from app.models.audit_log import AuditAction
from app.schemas.auth import LoginRequest, RegisterRequest, LoginResponse, UserProfileResponse
from app.services.audit_service import create_audit_log

router = APIRouter()


def validate_password_strength(password: str) -> None:
    """
    Validates password criteria:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
    """
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long.",
        )
    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter.",
        )
    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one lowercase letter.",
        )
    if not re.search(r"[0-9]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one number.",
        )
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-+=\[\]\\\/]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one special character.",
        )


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Officer/Supervisor Login",
    description="Authenticate with Official ID or Email and Password. Returns JWT access token.",
)
def login(
    request: Request,
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    identifier = login_data.username.strip()

    # Find user by username, email, or badge_id
    user = db.query(User).filter(
        or_(
            User.username.ilike(identifier),
            User.email.ilike(identifier),
            User.badge_id.ilike(identifier),
        )
    ).first()

    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please check your Official ID / Email and password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact your system administrator.",
        )

    # If login requested a specific role (e.g. Officer tab vs Supervisor tab)
    if login_data.role:
        expected_role = login_data.role.strip().upper()
        if user.role.value != expected_role and user.role.value != "ADMIN":
            role_label = "Investigating Officer" if user.role.value == "OFFICER" else "Supervisor"
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: This account is registered as a {role_label}. Please select the '{role_label}' tab to sign in.",
            )

    # Create JWT token with user identity and role
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value, "email": user.email}
    )

    # Log successful login in audit trail
    create_audit_log(
        db=db,
        user_id=user.id,
        action=AuditAction.LOGIN,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        details={"method": "password", "role": user.role.value},
    )
    db.commit()

    # Build user profile response
    user_profile = UserProfileResponse(
        id=str(user.id),
        username=user.username,
        email=user.email,
        name=user.username,
        role=user.role.value,
        badge_id=user.badge_id or user.username,
        checkpoint=user.checkpoint or "Border Checkpoint Alpha",
        is_active=user.is_active,
    )

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_profile,
    )


@router.post(
    "/register",
    response_model=UserProfileResponse,
    summary="Register Authorized Personnel Account",
    description="Register a new Investigating Officer or Supervisor account.",
    status_code=status.HTTP_201_CREATED,
)
def register_personnel(
    request: Request,
    reg_data: RegisterRequest,
    db: Session = Depends(get_db),
):
    # 1. Validate role
    role_str = reg_data.role.strip().upper()
    try:
        user_role = UserRole(role_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role: {reg_data.role}. Allowed roles are OFFICER and SUPERVISOR.",
        )

    # 2. Validate password strength
    validate_password_strength(reg_data.password)

    # 3. Check duplicate Email
    email_clean = reg_data.email.strip().lower()
    existing_email = db.query(User).filter(User.email.ilike(email_clean)).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this Official Email already exists.",
        )

    # 4. Check duplicate Official ID / Username / Badge ID
    official_id_clean = reg_data.official_id.strip()
    existing_id = db.query(User).filter(
        or_(
            User.username.ilike(official_id_clean),
            User.badge_id.ilike(official_id_clean),
        )
    ).first()
    if existing_id:
        role_name = "Officer ID" if role_str == "OFFICER" else "Supervisor ID"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An account with this {role_name} ('{official_id_clean}') already exists.",
        )

    # 5. Create new User
    new_user = User(
        username=official_id_clean,
        email=email_clean,
        password_hash=hash_password(reg_data.password),
        role=user_role,
        is_active=True,
        badge_id=official_id_clean,
        checkpoint=reg_data.department.strip() if reg_data.department else "Main Checkpoint",
    )
    db.add(new_user)
    db.flush()

    # 6. Audit log for user registration
    create_audit_log(
        db=db,
        user_id=new_user.id,
        action=AuditAction.USER_CREATED,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        details={
            "created_official_id": official_id_clean,
            "full_name": reg_data.full_name,
            "role": role_str,
            "department": reg_data.department,
            "designation": reg_data.designation,
        },
    )
    db.commit()
    db.refresh(new_user)

    return UserProfileResponse(
        id=str(new_user.id),
        username=new_user.username,
        email=new_user.email,
        name=reg_data.full_name or new_user.username,
        role=new_user.role.value,
        badge_id=new_user.badge_id,
        checkpoint=new_user.checkpoint,
        is_active=new_user.is_active,
    )


@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Get Current User Profile",
)
def get_me(current_user: User = Depends(get_current_user)):
    return UserProfileResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        name=current_user.username,
        role=current_user.role.value,
        badge_id=current_user.badge_id or current_user.username,
        checkpoint=current_user.checkpoint or "Border Checkpoint Alpha",
        is_active=current_user.is_active,
    )
