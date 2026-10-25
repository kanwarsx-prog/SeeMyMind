from sqlalchemy import Boolean, Column, Index, String, Text

from app.core.database import Base


class CurriculumUnitModel(Base):
    __tablename__ = "curriculum_units"

    id = Column(String(100), primary_key=True)
    key_stage = Column(String(20), nullable=False, default="KS2")
    year_group = Column(String(20), nullable=False, index=True)
    subject = Column(String(50), nullable=False, index=True)
    strand = Column(String(100), nullable=True)
    title = Column(String(250), nullable=False)
    default_objective = Column(Text, nullable=False)
    source = Column(String(50), nullable=False, default="National Curriculum (Oak)")
    external_slug = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    __table_args__ = (
        Index("ix_curriculum_year_subject", "year_group", "subject"),
    )
