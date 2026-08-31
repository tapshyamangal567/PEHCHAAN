from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.screening import router as screening_router
from app.api.face_verification import router as face_verification_router
from app.api.risk import router as risk_router

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
    description="Returns API status for system monitoring."
)
async def health_check():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME
    }

# Include Screening API router
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)


