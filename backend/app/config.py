import os

class Settings:
    PROJECT_NAME: str = "PEHCHAAN API"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Secure Identity Screening Backend"
    
    # Validation constraints
    MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_MIME_TYPES: set = {"image/jpeg", "image/png", "image/jpg"}
    
    # CORS
    CORS_ORIGINS: list = ["*"]

settings = Settings()
