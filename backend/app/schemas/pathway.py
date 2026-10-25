from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class PathwayStepSchema(BaseModel):
    number: int
    title: str
    description: str
    status: str = "next"  # 'done' | 'active' | 'next' | 'locked'
    badge: str
    sensory_pause_after: bool = False


class PeerAdaptationSchema(BaseModel):
    initials: str
    name: str
    need: str
    route: str
    method: str = "Visual"  # 'Auditory' | 'Kinesthetic' | 'Written' | 'Visual'
    color: str = "bg-purple-50 text-purple-800 border border-purple-200"


class PathwayGenerateRequest(BaseModel):
    child_id: UUID
    subject: str = "Mathematics"
    topic: str
    learning_objective: str | None = None
    scaffolding_method: str | None = None  # e.g. "Concrete-Pictorial-Abstract", "Dual-Coding", "Kinesthetic-Chunking"


class LessonPathwayResponse(BaseModel):
    child_id: UUID
    child_name: str
    subject: str
    topic: str
    learning_objective: str
    cognitive_rationale: str
    steps: list[PathwayStepSchema]
    ta_briefing: str
    peer_adaptations: list[PeerAdaptationSchema] = Field(default_factory=list)
    generated_at: datetime
    model_used: str = "noya-gpt4o"


class CurriculumUnit(BaseModel):
    id: str
    subject: str
    year_group: str
    title: str
    strand: str
    default_objective: str
