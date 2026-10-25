from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore"
    )

    APP_ENV: str = "development"
    PROJECT_NAME: str = "See My Mind & NOYA AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "insecure-dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Database: Supabase or Local PostgreSQL with pgvector
    DATABASE_URL: str = (
        "postgresql+psycopg://seemymind:seemymind_dev_password@localhost:5432/seemymind_db"
    )

    # OpenAI / Azure OpenAI Configuration for NOYA RAG
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSION: int = 1536

    # Oak National Academy Curriculum API Configuration
    OAK_API_KEY: str = ""
    OAK_API_BASE_URL: str = "https://open-api.thenational.academy/api/v1"

    # Transactional Email (Resend & SMTP)
    RESEND_API_KEY: str = ""
    FROM_EMAIL: str = "See My Mind <onboarding@resend.dev>"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    # CORS configuration
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:8081",
        "http://localhost:19006",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:4173",
        "http://127.0.0.1:8081",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)


settings = Settings()
