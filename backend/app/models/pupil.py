from sqlalchemy import Boolean, Column, Date, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import TimestampedUUIDModel


class Child(TimestampedUUIDModel):
    __tablename__ = "children"

    first_name = Column(String(140), nullable=False)
    last_name = Column(String(140), nullable=False)
    full_name = Column(String(280), nullable=True)
    preferred_name = Column(String(140), nullable=True)
    date_of_birth = Column(Date, nullable=False)
    sex = Column(String(20), nullable=False)  # "Male", "Female", "Other", "Prefer not to say"
    year_group = Column(String(50), nullable=True)  # e.g. "Year 4", "Year 10"
    room_name = Column(String(50), default=None, nullable=True, index=True)
    buddy_name = Column(String(140), default=None, nullable=True)
    school_id = Column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="SET NULL"), nullable=True, index=True
    )
    active = Column(Boolean, default=True, nullable=False)

    # Relationships
    school = relationship("School", back_populates="pupils")
    guardian_links = relationship(
        "ChildGuardianLink", back_populates="child", cascade="all, delete-orphan"
    )
    enrolments = relationship(
        "ChildSchoolEnrolment", back_populates="child", cascade="all, delete-orphan"
    )
    support_profile = relationship(
        "ChildSupportProfile", back_populates="child", uselist=False, cascade="all, delete-orphan"
    )
    events = relationship("ChildEvent", back_populates="child", cascade="all, delete-orphan")
    ai_insights = relationship("AIInsight", back_populates="child", cascade="all, delete-orphan")
    targets = relationship("PupilTarget", back_populates="child", cascade="all, delete-orphan")
    medication_regimens = relationship("MedicationRegimen", back_populates="child", cascade="all, delete-orphan")
    staff_allocations = relationship("StaffPupilAllocation", back_populates="child", cascade="all, delete-orphan")


class Guardian(TimestampedUUIDModel):
    __tablename__ = "guardians"

    first_name = Column(String(140), nullable=False)
    last_name = Column(String(140), nullable=False)
    email = Column(String(140), unique=True, nullable=False, index=True)
    mobile_phone = Column(String(50), nullable=True)
    relationship_to_child = Column(
        String(50), nullable=True
    )  # "Mother", "Father", "Foster Carer", "Legal Guardian"
    active = Column(Boolean, default=True, nullable=False)

    children_links = relationship(
        "ChildGuardianLink", back_populates="guardian", cascade="all, delete-orphan"
    )


class ChildGuardianLink(TimestampedUUIDModel):
    __tablename__ = "child_guardian_links"

    child_id = Column(
        UUID(as_uuid=True),
        ForeignKey("children.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    guardian_id = Column(
        UUID(as_uuid=True),
        ForeignKey("guardians.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    parental_responsibility = Column(Boolean, default=True, nullable=False)
    emergency_contact = Column(Boolean, default=True, nullable=False)
    primary_carer = Column(Boolean, default=False, nullable=False)
    receive_daily_updates = Column(Boolean, default=True, nullable=False)

    child = relationship("Child", back_populates="guardian_links")
    guardian = relationship("Guardian", back_populates="children_links")


class ChildSchoolEnrolment(TimestampedUUIDModel):
    __tablename__ = "child_school_enrolments"

    child_id = Column(
        UUID(as_uuid=True),
        ForeignKey("children.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    school_id = Column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True
    )
    academic_year_id = Column(
        UUID(as_uuid=True), ForeignKey("academic_years.id", ondelete="SET NULL"), nullable=True
    )
    year_group = Column(String(50), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    current = Column(Boolean, default=True, nullable=False)

    child = relationship("Child", back_populates="enrolments")
