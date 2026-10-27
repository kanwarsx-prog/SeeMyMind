from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import TimestampedUUIDModel


class ChildArrival(TimestampedUUIDModel):
    """One operational arrival record per pupil and school day."""

    __tablename__ = "child_arrivals"
    __table_args__ = (UniqueConstraint("child_id", "arrival_date", name="uq_child_arrival_day"),)

    child_id = Column(UUID(as_uuid=True), ForeignKey("children.id", ondelete="CASCADE"), nullable=False, index=True)
    school_id = Column(UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=True, index=True)
    arrival_date = Column(Date, nullable=False, default=date.today, index=True)
    status = Column(String(30), nullable=False, default="unknown")  # present, late, absent, unknown
    arrived_at = Column(DateTime(timezone=True), nullable=True)
    recorded_by = Column(UUID(as_uuid=True), nullable=True)
    recorded_by_name = Column(String(140), nullable=True)
    recorded_by_role = Column(String(50), nullable=True)
    recording_method = Column(String(50), nullable=False, default="staff")
    notes = Column(Text, nullable=True)
