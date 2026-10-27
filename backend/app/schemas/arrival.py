from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ChildArrivalCreate(BaseModel):
    status: str = Field(default="present", pattern="^(present|late|absent|unknown)$")
    arrived_at: datetime | None = None
    notes: str | None = None
    recording_method: str = "staff"


class ChildArrivalResponse(ChildArrivalCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    child_id: UUID
    school_id: UUID | None = None
    arrival_date: date
    recorded_by: UUID | None = None
    recorded_by_name: str | None = None
    recorded_by_role: str | None = None
    created_at: datetime
    updated_at: datetime
