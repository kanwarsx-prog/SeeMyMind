from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import models
from app.api.deps import get_current_user
from app.ai.rag_service import NoyaRAGService
from app.core.database import get_db
from app.models.ai_noya import AIRun
from app.schemas.ai import (
    AIRunAuditResponse,
    AskNoyaRequest,
    AskNoyaResponse,
    MorningBriefingResponse,
    NoyaCopilotChatRequest,
    NoyaCopilotChatResponse,
)
from app.schemas.pathway import (
    CurriculumMetadataResponse,
    CurriculumUnit,
    LessonPathwayResponse,
    PathwayGenerateRequest,
    PupilCurriculumProgressResponse,
    UnitStatusUpdateRequest,
)
from app.services.oak_service import OakCurriculumService
from app.services.pathway_service import PathwayService

router = APIRouter()


@router.get("/morning-briefing/{child_id}/latest", response_model=MorningBriefingResponse | None)
def get_latest_morning_briefing(child_id: UUID, db: Session = Depends(get_db)):
    """Retrieve the latest cached Morning Briefing without triggering an AI API call."""
    try:
        return NoyaRAGService.get_latest_morning_briefing(db=db, child_id=child_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch latest morning briefing: {e!s}"
        )


@router.post("/morning-briefing/{child_id}", response_model=MorningBriefingResponse)
def generate_morning_briefing(child_id: UUID, db: Session = Depends(get_db)):
    """Generate NOYA's 3-bullet Morning Transition Briefing for classroom staff (Manual AI Trigger)."""
    try:
        return NoyaRAGService.generate_morning_briefing(db=db, child_id=child_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"NOYA generation failed: {e!s}")


@router.post("/ask", response_model=AskNoyaResponse)
def ask_noya(request: AskNoyaRequest, db: Session = Depends(get_db)):
    """Ask NOYA an advisory question grounded in pupil timeline logs and EHCP evidence."""
    try:
        return NoyaRAGService.ask_noya(
            db=db, child_id=request.child_id, question=request.question, top_k=request.top_k
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"NOYA RAG failed: {e!s}")


@router.post("/copilot/chat", response_model=NoyaCopilotChatResponse)
def copilot_chat(
    request: NoyaCopilotChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Context-aware conversational copilot chat powered by Approach C agentic tool calling."""
    try:
        return NoyaRAGService.copilot_chat(
            db=db,
            current_user=current_user,
            request=request,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"NOYA Copilot failed: {e!s}")


@router.get("/pathway/curriculum-units", response_model=list[CurriculumUnit])
def get_curriculum_units(
    year_group: str | None = Query(None, description="Filter by year group, e.g. 'Year 5'"),
    subject: str | None = Query(None, description="Filter by subject, e.g. 'Mathematics'"),
    search: str | None = Query(None, description="Search term for title, strand, or objective"),
    db: Session = Depends(get_db),
):
    """Retrieve National Curriculum units filtered by year group, subject, or keyword."""
    return PathwayService.get_curriculum_units(
        db=db, year_group=year_group, subject=subject, search=search
    )


@router.get("/pathway/curriculum-metadata", response_model=CurriculumMetadataResponse)
def get_curriculum_metadata(db: Session = Depends(get_db)):
    """Retrieve available year groups and subjects from the curriculum database cache."""
    return PathwayService.get_curriculum_metadata(db=db)


@router.post("/pathway/curriculum-sync-oak")
def sync_oak_curriculum(db: Session = Depends(get_db)):
    """Synchronize curriculum units from Oak National Academy API or return cache status."""
    return OakCurriculumService.sync_oak_units(db=db)


@router.post("/pathway/generate", response_model=LessonPathwayResponse)
def generate_lesson_pathway(
    request: PathwayGenerateRequest, db: Session = Depends(get_db)
):
    """Generate a neurodiversity-adapted 4-step scaffolding ladder and TA briefing
    tailored to the pupil's support profile and the lesson objective.
    Uses instant deterministic scaffolding by default, or GPT-4o if use_ai=True.
    """
    try:
        return PathwayService.generate_pathway(db=db, request=request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Pathway generation failed: {e!s}"
        )


@router.get("/audit-runs", response_model=list[AIRunAuditResponse])
def get_ai_audit_runs(
    child_id: UUID | None = Query(None, description="Filter audit logs to a specific pupil"),
    limit: int = Query(50, ge=1, le=200, description="Max audit entries to return"),
    db: Session = Depends(get_db),
):
    """Exposes all AI/LLM and deterministic scaffolding audit runs with complete
    input prompts, raw outputs, token usage, and latency for live transparency.
    """
    query = db.query(AIRun)
    if child_id:
        query = query.filter(AIRun.child_id == child_id)
    runs = query.order_by(AIRun.created_at.desc()).limit(limit).all()
    return runs


@router.delete("/audit-runs")
def clear_ai_audit_runs(
    only_mocks: bool = Query(False, description="If true, only deletes local-mock historical runs"),
    db: Session = Depends(get_db),
):
    """Purge historical AI audit runs for a clean testing slate."""
    query = db.query(AIRun)
    if only_mocks:
        query = query.filter(AIRun.model_name == "local-mock")
    count = query.delete(synchronize_session=False)
    db.commit()
    return {"deleted_count": count}


@router.get("/pathway/progress/{child_id}", response_model=PupilCurriculumProgressResponse)
def get_pupil_curriculum_progress(
    child_id: UUID,
    year_group: str | None = Query(None, description="Filter by year group, e.g. 'Year 5'"),
    db: Session = Depends(get_db),
):
    """Retrieve comprehensive National Curriculum coverage and progress metrics for a pupil."""
    try:
        return PathwayService.get_pupil_curriculum_progress(
            db=db, child_id=child_id, year_group=year_group
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch pupil curriculum progress: {e!s}"
        )


@router.put("/pathway/progress/{child_id}/unit/{unit_id}")
def update_pupil_unit_progress(
    child_id: UUID,
    unit_id: str,
    request: UnitStatusUpdateRequest,
    db: Session = Depends(get_db),
):
    """Update progress status (mastered, in_progress, not_started) for a curriculum unit."""
    try:
        return PathwayService.update_pupil_unit_progress(
            db=db,
            child_id=child_id,
            unit_id=unit_id,
            status=request.status,
            note=request.mastery_note,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update unit progress: {e!s}"
        )



