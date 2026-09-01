"""
SQLAlchemy 2.x Database Engine, Session Factory, and FastAPI Dependency.
"""
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from app.config import settings

logger = logging.getLogger("pehchaan.database")

db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
# Strip ?pgbouncer=true or &pgbouncer=true which is unsupported by libpq / psycopg2 DSN
if "?pgbouncer=true" in db_url:
    db_url = db_url.replace("?pgbouncer=true", "")
elif "&pgbouncer=true" in db_url:
    db_url = db_url.replace("&pgbouncer=true", "")

# Create synchronous engine with connection pooling
engine = create_engine(
    db_url,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=300,    # Recycle connections every 5 minutes to prevent stale/dropped TCP sockets
    echo=False,
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base for all models
Base = declarative_base()


def get_db():
    """
    FastAPI dependency that provides a database session.
    Ensures the session is closed after each request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    """
    Tests database connectivity. Returns True if connected, False otherwise.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error("Database connection failed: %s", str(e))
        return False
