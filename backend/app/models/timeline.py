from datetime import UTC, datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import TimestampedUUIDModel


class ChildEvent(TimestampedUUIDModel):
    """The canonical Transactional Spine of See My Mind.
    Every observation, transition, check-in, incident, or message roots here.
    """

    __tablename__ = "child_events"

    child_id = Column(
        UUID(as_uuid=True),
        ForeignKey("children.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    school_id = Column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=True, index=True
    )
    event_time = Column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False, index=True
    )
    event_type = Column(
        String(50), nullable=False, index=True
    )  # "Observation", "Transition", "CheckIn", "Incident", "Action"

    reporter_type = Column(
        String(50), nullable=False
    )  # "Teacher", "TA", "Parent", "Child", "SENCO", "System"
    reporter_name = Column(String(140), nullable=True)
    reporter_id = Column(UUID(as_uuid=True), nullable=True)

    title = Column(String(200), nullable=False)
    summary = Column(Text, nullable=False)

    # Governance & presentation
    significance = Column(
        String(50), default="Routine"
    )  # "Routine", "Notable Win", "Concern", "High Priority"
    visibility = Column(
        String(50), default="Shared"
    )  # "Shared" (Parent+School), "Internal School Only", "Safeguarding Restricted"
    status = Column(
        String(50), default="Logged"
    )  # "Logged", "Acknowledged", "Reviewed", "Action Required"

    # Relationships
    child = relationship("Child", back_populates="events")
    observation = relationship(
        "Observation", back_populates="event", uselist=False, cascade="all, delete-orphan"
    )
    transition_log = relationship(
        "TransitionLog", back_populates="event", uselist=False, cascade="all, delete-orphan"
    )
    child_check_in = relationship(
        "ChildCheckIn", back_populates="event", uselist=False, cascade="all, delete-orphan"
    )
    incident = relationship(
        "BehaviouralIncident", back_populates="event", uselist=False, cascade="all, delete-orphan"
    )
    follow_up_actions = relationship(
        "FollowUpAction", back_populates="event", cascade="all, delete-orphan"
    )


class Observation(TimestampedUUIDModel):
    __tablename__ = "observations"

    event_id = Column(
        UUID(as_uuid=True),
        ForeignKey("child_events.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    activity_context = Column(
        String(140), nullable=True
    )  # e.g. "Independent Maths Task", "Playground / Breaktime"
    engagement_level = Column(
        String(50), nullable=True
    )  # "High", "Engaged with Support", "Passive", "Dysregulated"
    strategy_used = Column(String(140), nullable=True)
    strategy_worked = Column(Boolean, nullable=True)
    strengths_observed = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    event = relationship("ChildEvent", back_populates="observation")


class TransitionLog(TimestampedUUIDModel):
    __tablename__ = "transition_logs"

    event_id = Column(
        UUID(as_uuid=True),
        ForeignKey("child_events.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    transition_type = Column(
        String(50), nullable=False
    )  # "Morning Handover (Home)", "School Arrival", "End of Day (School)"
    sleep_quality = Column(
        String(50), nullable=True
    )  # "Good", "Restless", "Poor (<5 hrs)", "Unknown"
    morning_mood = Column(
        String(50), nullable=True
    )  # "Calm & Happy", "Anxious", "Frustrated", "Tired"
    breakfast_eaten = Column(Boolean, nullable=True)
    medication_given = Column(Boolean, nullable=True)
    special_notes_for_day = Column(Text, nullable=True)
    acknowledged_by_staff = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)

    event = relationship("ChildEvent", back_populates="transition_log")

    @property
    def event_time(self):
        return self.event.event_time if self.event else self.created_at


class ChildCheckIn(TimestampedUUIDModel):
    __tablename__ = "child_check_ins"

    event_id = Column(
        UUID(as_uuid=True),
        ForeignKey("child_events.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    mood_emoji = Column(String(20), nullable=False)  # "😊", "😐", "😟", "😡", "😴"
    mood_label = Column(
        String(50), nullable=False
    )  # "Great", "Okay", "Worried", "Angry", "Exhausted"
    energy_level = Column(Integer, nullable=True)  # 1 to 5
    self_regulation_need = Column(
        String(140), nullable=True
    )  # "Quiet space", "Movement break", "Drink of water"
    voice_note_text = Column(Text, nullable=True)

    event = relationship("ChildEvent", back_populates="child_check_in")


class BehaviouralIncident(TimestampedUUIDModel):
    """Structured ABC (Antecedent - Behaviour - Consequence) incident model."""

    __tablename__ = "behavioural_incidents"

    event_id = Column(
        UUID(as_uuid=True),
        ForeignKey("child_events.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    location = Column(
        String(100), nullable=True
    )  # "Classroom", "Corridor", "Dining Hall", "Playground"
    severity = Column(
        String(50), nullable=False
    )  # "Low", "Moderate", "High", "Safeguarding Incident"

    # ABC Chain
    antecedent = Column(
        Text, nullable=False
    )  # What happened immediately before? (Trigger/Environment)
    behaviour = Column(Text, nullable=False)  # Observable behaviour during incident
    consequence = Column(
        Text, nullable=False
    )  # What happened after? How was it resolved/de-escalated?

    de_escalation_strategy_used = Column(String(140), nullable=True)
    recovery_time_minutes = Column(Integer, nullable=True)
    parent_notified = Column(Boolean, default=False, nullable=False)

    event = relationship("ChildEvent", back_populates="incident")


class FollowUpAction(TimestampedUUIDModel):
    __tablename__ = "follow_up_actions"

    event_id = Column(
        UUID(as_uuid=True),
        ForeignKey("child_events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    assigned_to_role = Column(
        String(50), nullable=True
    )  # "SENCO", "Class Teacher", "Parent", "DSL"
    assigned_to_name = Column(String(140), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    event = relationship("ChildEvent", back_populates="follow_up_actions")
