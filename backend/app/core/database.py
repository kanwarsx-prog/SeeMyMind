from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.core.config import settings

# Handle pool sizing and ssl parameters gracefully for Supabase pooling & local development
engine_args = {
    "pool_pre_ping": True,
}

if "sqlite" in settings.DATABASE_URL:
    engine_args["connect_args"] = {"check_same_thread": False}
else:
    engine_args["pool_size"] = 10
    engine_args["max_overflow"] = 20
    # Disable server-side prepared statements for Supabase/PgBouncer transaction pooling
    # Prevents psycopg.errors.DuplicatePreparedStatement: prepared statement "_pg3_0" already exists
    engine_args["connect_args"] = {"prepare_threshold": None}

engine = create_engine(settings.DATABASE_URL, **engine_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency that provides an independent database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
