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