from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.timeline import ChildEvent, TransitionLog
from app.schemas.timeline import ChildEventCreate, TransitionLogCreate
from app.services.timeline_service import TimelineService


class TransitionService:
    @staticmethod
    def log_morning_handover(
        db: Session,
        child_id: UUID,
        school_id: UUID,
        parent_name: str,
        transition_data: TransitionLogCreate,
    ) -> ChildEvent:
        """Helper to create a Morning Transition event directly from home."""
        summary_text = (
            f"Morning check-in from {parent_name}. "
            f"Mood: {transition_data.morning_mood or 'Normal'}, "
            f"Sleep: {transition_data.sleep_quality or 'Normal'}."
        )
        if transition_data.special_notes_for_day:
            summary_text += f" Note: {transition_data.special_notes_for_day}"

        event_in = ChildEventCreate(
            child_id=child_id,
            school_id=school_id,
            event_type="Transition",
            reporter_type="Parent",
            reporter_name=parent_name,
            title="Morning Home Handover",
            summary=summary_text,
            significance="Notable Win"
            if transition_data.morning_mood == "Calm & Happy"
            else "Routine",
            visibility="Shared",
            transition_log=transition_data,
        )
        return TimelineService.create_event(db, event_in)

    @staticmethod
    def acknowledge_transition(db: Session, transition_id: UUID) -> TransitionLog:
        """Staff acknowledges receipt of morning handover."""
        trans = db.query(TransitionLog).filter(TransitionLog.id == transition_id).first()
        if not trans:
            raise ValueError("Transition log not found")

        trans.acknowledged_by_staff = True
        trans.acknowledged_at = datetime.now(UTC)
        if trans.event:
            trans.event.status = "Acknowledged"
        db.commit()
        db.refresh(trans)
        return trans

    @staticmethod
    def get_latest_handover(db: Session, child_id: UUID) -> TransitionLog | None:
        """Retrieve the most recent morning handover for a child (excluding evening check-ins)."""
        return (
            db.query(TransitionLog)
            .join(ChildEvent, TransitionLog.event_id == ChildEvent.id)
            .filter(
                ChildEvent.child_id == child_id,
                TransitionLog.transition_type != "End of Day (Home)",
            )
            .order_by(ChildEvent.event_time.desc())
            .first()
        )
