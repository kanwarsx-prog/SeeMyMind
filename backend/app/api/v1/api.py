from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    analytics,
    arrivals,
    auth,
    documents,
    health,
    incidents,
    noya,
    pupils,
    registration,
    schools,
    timeline,
    transitions,
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Identity"])
api_router.include_router(
    admin.router, prefix="/admin", tags=["Trust & Multi-School Governance"]
)
api_router.include_router(schools.router, prefix="/schools", tags=["Schools"])
api_router.include_router(pupils.router, prefix="/pupils", tags=["Pupils"])
api_router.include_router(timeline.router, prefix="/timeline", tags=["Transactional Spine"])
api_router.include_router(
    transitions.router, prefix="/transitions", tags=["Transitions & Handovers"]
)
api_router.include_router(
    incidents.router, prefix="/incidents", tags=["ABC Incidents & Safeguarding"]
)
api_router.include_router(documents.router, prefix="/documents", tags=["EHCP & Document Storage"])
api_router.include_router(noya.router, prefix="/noya", tags=["NOYA AI & RAG Engine"])
api_router.include_router(
    registration.router, prefix="/registration", tags=["Child Registration & Onboarding"]
)
api_router.include_router(
    analytics.router, prefix="/analytics", tags=["Reporting & Analytics"]
)
api_router.include_router(
    arrivals.router, prefix="/arrivals", tags=["Daily Arrival Records"]
)

