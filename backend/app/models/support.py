from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import TimestampedUUIDModel


class ChildSupportProfile(TimestampedUUIDModel):
    __tablename__ = "child_support_profiles"

    child_id = Column(
        UUID(as_uuid=True),
        ForeignKey("children.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    primary_need = Column(
        String(140), nullable=True
    )  # e.g. "Autism Spectrum Condition", "ADHD", "Speech & Language"
    secondary_need = Column(String(140), nullable=True)
    summary = Column(Text, nullable=True)
    communication_preferences = Column(Text, nullable=True)
    sensory_profile = Column(Text, nullable=True)
    strengths_interests = Column(Text, nullable=True)
    has_ehcp = Column(Boolean, default=False, nullable=False)
    annual_review_due = Column(Date, nullable=True)  # next statutory annual review (EHCP pupils)
    active = Column(Boolean, default=True, nullable=False)

    child = relationship("Child", back_populates="support_profile")
    strategies = relationship(
        "ChildSupportStrategy", back_populates="profile", cascade="all, delete-orphan"
    )
    triggers = relationship("ChildTrigger", back_populates="profile", cascade="all, delete-orphan")
    distress_indicators = relationship(
        "ChildDistressIndicator", back_populates="profile", cascade="all, delete-orphan"
    )


class SupportStrategy(TimestampedUUIDModel):
    __tablename__ = "support_strategies"

    title = Column(String(140), nullable=False, index=True)
    category = Column(
        String(50), nullable=False
    )  # "Sensory", "Communication", "Regulation", "Learning", "Transition"
    description = Column(Text, nullable=False)
    suggested_steps = Column(Text, nullable=True)
    evidence_base = Column(Text, nullable=True)
    is_global = Column(Boolean, default=True, nullable=False)


class ChildSupportStrategy(TimestampedUUIDModel):
    __tablename__ = "child_support_strategies"

    profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("child_support_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    strategy_id = Column(
        UUID(as_uuid=True), ForeignKey("support_strategies.id", ondelete="SET NULL"), nullable=True
    )
    custom_title = Column(String(140), nullable=True)
    custom_instructions = Column(Text, nullable=False)
    priority = Column(Integer, default=1)  # 1 (Primary) to 5
    effective_rating = Column(
        String(50), nullable=True
    )  # "Highly Effective", "Moderately Effective", "Trialing"

    profile = relationship("ChildSupportProfile", back_populates="strategies")
    strategy = relationship("SupportStrategy")


class ChildTrigger(TimestampedUUIDModel):
    __tablename__ = "child_triggers"

    profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("child_support_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    trigger_title = Column(String(140), nullable=False)
    trigger_category = Column(
        String(50), nullable=True
    )  # "Sensory (Noise/Light)", "Social", "Transition", "Demand"
    description = Column(Text, nullable=True)
    typical_reaction = Column(Text, nullable=True)

    profile = relationship("ChildSupportProfile", back_populates="triggers")


class ChildDistressIndicator(TimestampedUUIDModel):
    __tablename__ = "child_distress_indicators"

    profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("child_support_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    stage = Column(
        String(50), nullable=False
    )  # "Early Warning (Rumbling)", "Active Distress (Crisis)", "Recovery"
    observable_behaviour = Column(Text, nullable=False)
    recommended_staff_action = Column(Text, nullable=True)

    profile = relationship("ChildSupportProfile", back_populates="distress_indicators")


class PupilTarget(TimestampedUUIDModel):
    __tablename__ = "pupil_targets"

    child_id = Column(
        UUID(as_uuid=True),
        ForeignKey("children.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    academic_year_id = Column(
        UUID(as_uuid=True),
        ForeignKey("academic_years.id", ondelete="SET NULL"),
        nullable=True,
    )
    term = Column(String(50), nullable=False, default="Spring 2026")
    target_area = Column(String(100), nullable=False)  # e.g. "Curriculum & Maths", "Sensory Regulation", "Communication"
    smart_target = Column(Text, nullable=False)
    success_criteria = Column(Text, nullable=True)
    apdr_stage = Column(String(50), nullable=False, default="Review")  # "Assess", "Plan", "Do", "Review"
    review_outcome = Column(String(50), nullable=False, default="Significant Progress")  # "Target Met", "Significant Progress", "Needs Revision", "Escalate to EHCP"
    review_notes = Column(Text, nullable=True)
    breakthrough_notes = Column(Text, nullable=True)
    active = Column(Boolean, default=True, nullable=False)

    child = relationship("Child", back_populates="targets")


class MedicationRegimen(TimestampedUUIDModel):
    __tablename__ = "medication_regimens"

    child_id = Column(
        UUID(as_uuid=True),
        ForeignKey("children.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    medication_name = Column(String(140), nullable=False)
    dosage = Column(String(100), nullable=False)
    formulation = Column(String(140), nullable=True)
    prescribed_schedule = Column(String(100), nullable=False)
    administration_route = Column(String(50), default="Oral", nullable=False)
    prescribing_clinician = Column(String(140), nullable=True)
    clinical_service = Column(String(200), nullable=True)
    peak_window_start = Column(String(20), default="09:00 AM", nullable=True)
    peak_window_end = Column(String(20), default="10:15 AM", nullable=True)
    trough_window_start = Column(String(20), default="10:15 AM", nullable=True)
    trough_window_end = Column(String(20), default="10:45 AM", nullable=True)
    co_administration_rules = Column(Text, nullable=True)
    active = Column(Boolean, default=True, nullable=False)

    child = relationship("Child", back_populates="medication_regimens")

