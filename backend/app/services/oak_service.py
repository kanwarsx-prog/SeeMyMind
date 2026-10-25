import logging
import httpx
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.curriculum import CurriculumUnitModel
from app.schemas.pathway import CurriculumUnit

logger = logging.getLogger(__name__)


class OakCurriculumService:
    @staticmethod
    def sync_oak_units(db: Session) -> dict:
        """
        Synchronizes curriculum units from Oak National Academy API if OAK_API_KEY is configured,
        or verifies and hydrates the database cache.
        """
        from app.services.pathway_service import PathwayService
        PathwayService.ensure_seeded(db)

        if not settings.OAK_API_KEY:
            logger.info("OAK_API_KEY not configured; using local high-fidelity UK National Curriculum library.")
            count = db.query(CurriculumUnitModel).count()
            return {
                "status": "cached",
                "message": f"Operating on local National Curriculum database cache ({count} units available). To enable live Oak ingestion, configure OAK_API_KEY.",
                "units_count": count,
                "provider": "Oak National Academy (Standard OGL v3.0)",
            }

        headers = {
            "Authorization": f"Bearer {settings.OAK_API_KEY}",
            "Accept": "application/json",
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.get(f"{settings.OAK_API_BASE_URL}/subjects", headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    logger.info("Oak National Academy API responded successfully: %s", data)
                    return {
                        "status": "synced",
                        "message": "Successfully communicated with Oak National Academy API.",
                        "units_count": db.query(CurriculumUnitModel).count(),
                        "provider": "Oak National Academy Live API",
                    }
                else:
                    logger.warning("Oak API returned status %s: %s", resp.status_code, resp.text)
                    return {
                        "status": "api_error",
                        "message": f"Oak API returned {resp.status_code}. Retained cached database units.",
                        "units_count": db.query(CurriculumUnitModel).count(),
                        "provider": "Oak National Academy (Cached Fallback)",
                    }
        except Exception as e:
            logger.error("Failed connecting to Oak API: %s", e)
            return {
                "status": "connection_error",
                "message": f"Could not reach Oak API ({e!s}). Using cached database units.",
                "units_count": db.query(CurriculumUnitModel).count(),
                "provider": "Oak National Academy (Cached Fallback)",
            }
