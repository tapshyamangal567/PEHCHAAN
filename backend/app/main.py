from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.screening import router as screening_router
from app.api.face_verification import router as face_verification_router
from app.api.risk import router as risk_router
from app.api.auth import router as auth_router
from app.api.verifications import router as verifications_router
from app.api.supervisor import router as supervisor_router
from app.core.database import check_db_connection


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.DESCRIPTION,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)


# Configure CORS for local React Native / mobile development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(
    "/health",
    tags=["health"],
    summary="Health Check Endpoint",
    description="Returns API and database status for system monitoring."
)
async def health_check():
    db_connected = check_db_connection()
    return {
        "status": "healthy" if db_connected else "degraded",
        "service": settings.PROJECT_NAME,
        "database": "connected" if db_connected else "disconnected",
    }


# Include existing Screening API router
# Preserved for backward compatibility
app.include_router(
    screening_router,
    prefix="/api/screening",
    tags=["screening"]
)


# Include Face Verification API router
app.include_router(
    face_verification_router,
    prefix="/api/verification",
    tags=["verification"]
)


# Include Risk Assessment API router
app.include_router(
    risk_router,
    prefix="/api/risk",
    tags=["risk"]
)


# Authentication routes
app.include_router(
    auth_router,
    prefix="/api/auth",
    tags=["authentication"]
)


# Verification routes (JWT protected)
app.include_router(
    verifications_router,
    prefix="/api/verifications",
    tags=["verifications"]
)


# Supervisor routes (Supervisor/Admin only)
app.include_router(
    supervisor_router,
    prefix="/api/supervisor",
    tags=["supervisor"]
)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )