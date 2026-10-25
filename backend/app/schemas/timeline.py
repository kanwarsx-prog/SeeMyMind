from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ObservationCreate(BaseModel):
    activity_context: str | None = None
    engagement_level: str | None = "Engaged"
    strategy_used: str | None = None
    strategy_worked: bool | None = None
    strengths_observed: str | None = None
    notes: str | None = None


class ObservationResponse(ObservationCreate):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    event_id: UUID


class TransitionLogCreate(BaseModel):
    transition_type: str = "Morning Handover (Home)"  # or "School Arrival", "End of Day (School)"
    sleep_quality: str | None = None
    morning_mood: str | None = None
    breakfast_eaten: bool | None = True
    medication_given: bool | None = False
    special_notes_for_day: str | None = None


class TransitionLogResponse(TransitionLogCreate):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    event_id: UUID
    acknowledged_by_staff: bool
    acknowledged_at: datetime | None = None
    created_at: datetime | None = None
    event_time: datetime | None = None


class ChildCheckInCreate(BaseModel):
    mood_emoji: str
    mood_label: str
    energy_level: int | None = 3
    self_regulation_need: str | None = None
    voice_note_text: str | None = None


class ChildCheckInResponse(ChildCheckInCreate):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    event_id: UUID


class BehaviouralIncidentCreate(BaseModel):
    location: str | None = "Classroom"
    severity: str = "Low"
    antecedent: str
    behaviour: str
    consequence: str
    de_escalation_strategy_used: str | None = None
    recovery_time_minutes: int | None = None
    parent_notified: bool = False


class BehaviouralIncidentResponse(BehaviouralIncidentCreate):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    event_id: UUID


class ChildEventCreate(BaseModel):
    child_id: UUID
    school_id: UUID | None = None
    event_type: str  # "Observation", "Transition", "CheckIn", "Incident"
    reporter_type: str  # "Teacher", "TA", "Parent", "Child", "SENCO"
    reporter_name: str | None = None
    title: str
    summary: str
    significance: str = "Routine"
    visibility: str = "Shared"

    # Optional nested payloads depending on event_type
    observation: ObservationCreate | None = None
    transition_log: TransitionLogCreate | None = None
    check_in: ChildCheckInCreate | None = None
    incident: BehaviouralIncidentCreate | None = None


class ChildEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    child_id: UUID
    school_id: UUID | None = None
    event_time: datetime
    event_type: str
    reporter_type: str
    reporter_name: str | None = None
    title: str
    summary: str
    significance: str
    visibility: str
    status: str
    created_at: datetime

    observation: ObservationResponse | None = None
    transition_log: TransitionLogResponse | None = None
    child_check_in: ChildCheckInResponse | None = None
    incident: BehaviouralIncidentResponse | None = None
