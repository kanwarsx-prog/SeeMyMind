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
    use_ai: bool = False


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
    key_stage: str | None = None
    title: str
    strand: str
    default_objective: str
    source: str | None = "National Curriculum (Oak)"
    external_slug: str | None = None


class CurriculumMetadataResponse(BaseModel):
    year_groups: list[str]
    subjects: list[str]
    total_units: int


class SubjectProgressSchema(BaseModel):
    subject: str
    total_units: int
    completed_units: int
    in_progress_units: int
    percentage: float


class UnitProgressItemSchema(BaseModel):
    unit_id: str
    title: str
    subject: str
    strand: str
    year_group: str
    default_objective: str
    status: str  # "mastered" | "in_progress" | "adapted_ready" | "not_started"
    last_scaffolded_at: str | None = None
    accommodations_used: list[str] = Field(default_factory=list)
    mastery_note: str | None = None


class PupilCurriculumProgressResponse(BaseModel):
    child_id: UUID
    child_name: str
    year_group: str
    primary_need: str
    total_statutory_units: int
    total_completed_units: int
    total_in_progress_units: int
    coverage_percentage: float
    subjects_breakdown: list[SubjectProgressSchema]
    units: list[UnitProgressItemSchema]
    strengths_summary: str
    next_recommended_units: list[str] = Field(default_factory=list)


class UnitStatusUpdateRequest(BaseModel):
    status: str  # "mastered" | "in_progress" | "not_started"
    mastery_note: str | None = None

