from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ChildSupportProfileBase(BaseModel):
    primary_need: str | None = None
    secondary_need: str | None = None
    summary: str | None = None
    communication_preferences: str | None = None
    sensory_profile: str | None = None
    strengths_interests: str | None = None
    has_ehcp: bool = False


class ChildSupportProfileResponse(ChildSupportProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    child_id: UUID
    created_at: datetime


class ChildBase(BaseModel):
    first_name: str
    last_name: str
    preferred_name: str | None = None
    date_of_birth: date
    sex: str = "Prefer not to say"
    year_group: str | None = None
    room_name: str | None = None
    school_id: UUID | None = None
    active: bool = True


class ChildCreate(ChildBase):
    primary_need: str | None = None
    has_ehcp: bool = False


class ChildResponse(ChildBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str | None = None
    created_at: datetime
    updated_at: datetime
    support_profile: ChildSupportProfileResponse | None = None
