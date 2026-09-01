from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List, Set


class Settings(BaseSettings):
    # Application settings
    PROJECT_NAME: str = "PEHCHAAN API"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Secure Identity Screening Backend"

    # Validation constraints
    MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_MIME_TYPES: Set[str] = {
        "image/jpeg",
        "image/png",
        "image/jpg",
    }

    # Face Verification & Liveness Settings
    FACE_MATCH_THRESHOLD: float = 0.50
    FACE_BORDERLINE_THRESHOLD: float = 0.363
    FACE_DETECTION_CONFIDENCE: float = 0.50
    LIVENESS_CHALLENGE_TIMEOUT: float = 15.0
    DEV_TEST_MODE: bool = False

    # Risk Scoring Thresholds & Baseline Max Weights
    RISK_LOW_MAX: int = 29
    RISK_MEDIUM_MAX: int = 59

    WEIGHT_TAMPERING: int = 30
    WEIGHT_FACE_MATCH: int = 25
    WEIGHT_MRZ: int = 15
    WEIGHT_CONSISTENCY: int = 10
    WEIGHT_VALIDATION: int = 10
    WEIGHT_LIVENESS: int = 5
    WEIGHT_EXPIRY: int = 5

    # CORS
    CORS_ORIGINS: List[str] = ["*"]

    # Database - Supabase transaction pooler
    DATABASE_URL: str = Field(
        default="postgresql+psycopg2://pehchaan:pehchaan@localhost:5432/pehchaan_db",
        description="PostgreSQL connection string for the application",
    )

    # Database - Supabase session pooler for Alembic
    DIRECT_URL: str = Field(
        default="postgresql+psycopg2://pehchaan:pehchaan@localhost:5432/pehchaan_db",
        description="PostgreSQL connection string for Alembic migrations",
    )

    # JWT Authentication
    SECRET_KEY: str = Field(
        default="CHANGE-THIS-IN-PRODUCTION-USE-A-REAL-SECRET-KEY",
        description="JWT signing secret key",
    )

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8-hour shift

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }


settings = Settings()
