from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

import app.models  # registers all models
from app.api.v1.api import api_router
from app.core.config import settings
from app.core.database import Base, engine

STATIC_DIR = Path(__file__).resolve().parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure configuration & tables ready
    print(f"Starting {settings.PROJECT_NAME} in [{settings.APP_ENV}] mode...")
    if settings.APP_ENV != "test":
        Base.metadata.create_all(bind=engine)
        # Ensure migration columns exist on existing tables
        try:
            from sqlalchemy import text

            with engine.begin() as conn:
                conn.execute(
                    text("ALTER TABLE schools ADD COLUMN IF NOT EXISTS urn_number VARCHAR(20);")
                )
                conn.execute(
                    text(
                        "ALTER TABLE schools ADD COLUMN IF NOT EXISTS phase VARCHAR(50) DEFAULT 'Primary';"
                    )
                )
                conn.execute(
                    text(
                        "ALTER TABLE schools ADD COLUMN IF NOT EXISTS local_authority VARCHAR(100);"
                    )
                )
                conn.execute(
                    text(
                        "ALTER TABLE schools ADD COLUMN IF NOT EXISTS lead_senco_name VARCHAR(140);"
                    )
                )
                conn.execute(
                    text(
                        "ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(20) DEFAULT 'system';"
                    )
                )
                conn.execute(
                    text(
                        "ALTER TABLE children ADD COLUMN IF NOT EXISTS room_name VARCHAR(50);"
                    )
                )
                conn.execute(
                    text(
                        "ALTER TABLE children ADD COLUMN IF NOT EXISTS buddy_name VARCHAR(140);"
                    )
                )
                conn.execute(
                    text(
                        "CREATE INDEX IF NOT EXISTS ix_children_room_name ON children (room_name);"
                    )
                )
                conn.execute(
                    text(
                        "ALTER TABLE ai_runs ADD COLUMN IF NOT EXISTS child_id UUID;"
                    )
                )
                conn.execute(
                    text(
                        "ALTER TABLE ai_runs ADD COLUMN IF NOT EXISTS input_prompt TEXT;"
                    )
                )
                conn.execute(
                    text(
                        "ALTER TABLE ai_runs ADD COLUMN IF NOT EXISTS output_text TEXT;"
                    )
                )
                conn.execute(
                    text(
                        "ALTER TABLE ai_runs ADD COLUMN IF NOT EXISTS execution_steps JSON;"
                    )
                )
                conn.execute(
                    text(
                        "ALTER TABLE child_support_profiles ADD COLUMN IF NOT EXISTS annual_review_due DATE;"
                    )
                )
        except Exception as e:
            print(f"Schema migration startup note: {e}")
    yield
    # Shutdown
    print(f"Stopping {settings.PROJECT_NAME}...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|.*\.onrender\.com|.*\.vercel\.app)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get(f"{settings.API_V1_STR}", tags=["Root"])
def api_root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} Core API",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "version": "0.1.0",
    }


# Static frontend hosting & SPA fallback
if STATIC_DIR.exists() and (STATIC_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")


@app.get("/", tags=["Root"])
def root(request: Request):
    accept = request.headers.get("accept", "")
    index_file = STATIC_DIR / "index.html"

    # Explicit JSON request (e.g. API clients, testing)
    if "application/json" in accept and "text/html" not in accept:
        return {
            "message": f"Welcome to {settings.PROJECT_NAME} Core API",
            "docs": "/docs",
            "health": f"{settings.API_V1_STR}/health",
            "version": "0.1.0",
        }

    # Serve compiled React frontend
    if index_file.exists():
        return FileResponse(index_file)

    return {
        "message": f"Welcome to {settings.PROJECT_NAME} Core API",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "version": "0.1.0",
    }


@app.get("/{full_path:path}", tags=["Frontend"])
def serve_frontend_spa(full_path: str):
    if full_path.startswith(("api", "docs", "redoc", "openapi.json")):
        raise HTTPException(status_code=404, detail="Not Found")

    file_path = STATIC_DIR / full_path
    if file_path.is_file():
        return FileResponse(file_path)

    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)

    raise HTTPException(status_code=404, detail="Not Found")
