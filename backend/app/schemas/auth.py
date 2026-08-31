"""
Authentication Pydantic schemas.
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, description="Official ID, Username, or Email")
    password: str = Field(..., min_length=1, description="Password")
    role: Optional[str] = Field(default=None, description="Optional role filter: OFFICER, SUPERVISOR, or ADMIN")


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150, description="Full Name")
    official_id: str = Field(..., min_length=3, max_length=50, description="Official Officer ID or Supervisor ID")
    email: str = Field(..., description="Official Email Address")
    department: Optional[str] = Field(default=None, max_length=100, description="Department / Unit / Checkpoint")
    designation: Optional[str] = Field(default=None, max_length=100, description="Designation / Rank")
    phone_number: Optional[str] = Field(default=None, max_length=25, description="Official Contact Number")
    password: str = Field(..., min_length=8, description="Password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)")
    role: str = Field(default="OFFICER", description="OFFICER or SUPERVISOR")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserProfileResponse(BaseModel):
    id: str
    username: str
    email: str
    name: str
    role: str
    badge_id: Optional[str] = None
    checkpoint: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse
