from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.screening import router as screening_router

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
