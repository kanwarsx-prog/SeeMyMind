from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.ai.rag_service import NoyaRAGService
from app.core.database import get_db
from app.schemas.ai import AskNoyaRequest, AskNoyaResponse, MorningBriefingResponse
from app.schemas.pathway import (
    CurriculumUnit,
    LessonPathwayResponse,
    PathwayGenerateRequest,
)
from app.services.pathway_service import PathwayService

router = APIRouter()


@router.post("/morning-briefing/{child_id}", response_model=MorningBriefingResponse)
def generate_morning_briefing(child_id: UUID, db: Session = Depends(get_db)):
    """Generate NOYA's 3-bullet Morning Transition Briefing for classroom staff."""
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


@router.get("/pathway/curriculum-units", response_model=list[CurriculumUnit])
def get_curriculum_units():
    """Retrieve pre-curated National Curriculum units for quick lesson selection."""
    return PathwayService.get_curriculum_units()


@router.post("/pathway/generate", response_model=LessonPathwayResponse)
def generate_lesson_pathway(
    request: PathwayGenerateRequest, db: Session = Depends(get_db)
):
    """Generate a neurodiversity-adapted 4-step scaffolding ladder and TA briefing
    tailored to the pupil's support profile and the lesson objective.
    """
    try:
        return PathwayService.generate_pathway(db=db, request=request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Pathway generation failed: {e!s}"
        )
