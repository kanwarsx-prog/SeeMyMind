from datetime import UTC, date, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.arrival import ChildArrival
from app.schemas.arrival import ChildArrivalCreate, ChildArrivalResponse

router = APIRouter()


@router.get("/children/{child_id}/today", response_model=ChildArrivalResponse | None)
def get_today_arrival(
    child_id: UUID,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = datetime.now(UTC).date()
    return (
        db.query(ChildArrival)
        .filter(ChildArrival.child_id == child_id, ChildArrival.arrival_date == today)
        .first()
    )


@router.post("/children/{child_id}", response_model=ChildArrivalResponse, status_code=status.HTTP_201_CREATED)
def record_arrival(
    child_id: UUID,
    arrival_in: ChildArrivalCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    child = db.query(models.Child).filter(models.Child.id == child_id, models.Child.active.is_(True)).first()
    if not child:
        raise HTTPException(status_code=404, detail="Pupil not found")

    today = date.today()
    arrival = (
        db.query(ChildArrival)
        .filter(ChildArrival.child_id == child_id, ChildArrival.arrival_date == today)
        .first()
    )
    arrived_at = arrival_in.arrived_at
    if arrival_in.status in {"present", "late"} and arrived_at is None:
        arrived_at = datetime.now(UTC)

    if not arrival:
        arrival = ChildArrival(child_id=child_id, arrival_date=today)
        db.add(arrival)

    arrival.school_id = child.school_id
    arrival.status = arrival_in.status
    arrival.arrived_at = arrived_at
    arrival.recorded_by = current_user.id
    arrival.recorded_by_name = current_user.full_name
    arrival.recorded_by_role = current_user.role
    arrival.recording_method = arrival_in.recording_method
    arrival.notes = arrival_in.notes
    db.commit()
    db.refresh(arrival)
    return arrival
