from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AdultClue(BaseModel):
    source: str
    role: str
    time: str
    observation: str
    significance: str
    marker_type: str = "Sensory/Masking"


class DecompressionStep(BaseModel):
    step: int
    title: str
    subtitle: str
    description: str
    icon_type: str
    tag: str


class DecompressionBridgeResponse(BaseModel):
    child_id: UUID
    child_name: str
    battery_percentage: int = Field(ge=0, le=100)
    battery_status: str
    battery_color: str  # "rose", "amber", "emerald"
    masking_level: str  # "High Masking Detected", "Moderate Masking", "Low Masking"
    masking_explanation: str
    draining_factors: list[str]
    recharging_factors: list[str]
    adult_observation_clues: list[AdultClue]
    decompression_recipe: list[DecompressionStep]
    recommended_evening_activities: list[str]
    guidance_confidence: str
    guidance_basis: list[str]
    generated_at: datetime


class EveningCheckInCreate(BaseModel):
    child_id: UUID
    parent_name: str = "Dana Carter"
    after_school_decompression: str = "Mild Sensory Wobble (10-15m)"
    evening_mood: str = "Tired but Regulated"
    dinner_eaten: bool = True
    screen_free_downtime_minutes: int = 30
    notes_for_tomorrow: str | None = None


class EveningCheckInResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    event_id: UUID
    child_id: UUID
    parent_name: str
    after_school_decompression: str
    evening_mood: str
    dinner_eaten: bool
    screen_free_downtime_minutes: int
    notes_for_tomorrow: str | None
    logged_at: datetime


class CorrelationInsightItem(BaseModel):
    factor: str
    incident_rate: str
    effect: str
    confidence: str
    status: str  # "positive", "warning", "neutral"


class MedicationCorrelationResponse(BaseModel):
    child_id: UUID
    child_name: str
    medication_name: str
    morning_window: str
    dip_window: str
    total_days_analyzed: int
    optimal_conditions: list[str]
    correlation_insights: list[CorrelationInsightItem]
    pediatrician_summary: str
    generated_at: datetime


class ParentWinsGalleryItem(BaseModel):
    id: str
    child_id: UUID
    title: str
    date: str
    category: str
    description: str
    teacher_quote: str
    celebration_badge: str
    tags: list[str]
