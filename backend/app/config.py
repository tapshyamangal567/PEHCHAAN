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

settings = Settings()


