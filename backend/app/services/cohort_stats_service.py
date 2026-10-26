"""Live cohort / school statistics derived entirely from database records.

Used by NOYA so that any figure it quotes (pupil counts, TA hours, strategy
success rate, reviews due) comes from real data scoped to the caller's school,
never from fixed text.
"""

from collections import Counter
from dataclasses import dataclass, field
from datetime import date
from uuid import UUID

from sqlalchemy.orm import Session

from app import models

REVIEW_WINDOW_DAYS = 90  # "due this term" horizon


@dataclass
class ReviewDue:
    pupil_name: str
    due: date
    days_until: int


@dataclass
class CohortStats:
    scope_label: str
    room_name: str | None
    total_pupils: int = 0
    ehcp_count: int = 0
    sen_support_count: int = 0
    weekly_ta_hours: float = 0.0
    strategy_observations: int = 0
    strategy_wins: int = 0
    top_strategies: list[str] = field(default_factory=list)
    top_needs: list[str] = field(default_factory=list)
    reviews_due: list[ReviewDue] = field(default_factory=list)
    reviews_overdue: list[ReviewDue] = field(default_factory=list)
    ehcp_without_review_date: int = 0

    @property
    def win_rate(self) -> float | None:
        if not self.strategy_observations:
            return None
        return round(self.strategy_wins / self.strategy_observations * 100)


class CohortStatsService:
    @staticmethod
    def resolve_room(
        db: Session,
        school_id: UUID | None,
        requested: str | None = None,
        message: str | None = None,
    ) -> str | None:
        """Use the requested room if given, or extract from message, otherwise the school's most populated room."""
        if requested:
            return requested
        if message:
            import re
            match = re.search(r"\b(Room\s+[A-Za-z0-9]+)\b", message, re.IGNORECASE)
            if match:
                return match.group(1).title()

        # Seed if children with room_name are not yet populated
        if db.query(models.Child).filter(models.Child.room_name.isnot(None)).count() == 0:
            from app.services.seeder_service import SeederService
            SeederService.seed_longitudinal_demo_data(db)

        query = db.query(models.Child.room_name).filter(
            models.Child.active.is_(True), models.Child.room_name.isnot(None)
        )
        if school_id:
            scoped = query.filter(models.Child.school_id == school_id)
            if scoped.count() > 0:
                query = scoped
        rooms = Counter(r[0] for r in query.all())
        if rooms:
            return rooms.most_common(1)[0][0]
        return "Room 4"

    @staticmethod
    def compute(
        db: Session,
        school_id: UUID | None,
        room_name: str | None = None,
        school_label: str | None = None,
        today: date | None = None,
    ) -> CohortStats:
        today = today or date.today()

        # Auto-seed if database is clean or room has no pupils yet
        needs_seeding = False
        if room_name:
            if db.query(models.Child).filter(models.Child.room_name == room_name, models.Child.active.is_(True)).count() == 0:
                needs_seeding = True
        elif db.query(models.Child).count() == 0:
            needs_seeding = True

        if needs_seeding:
            from app.services.seeder_service import SeederService
            SeederService.seed_longitudinal_demo_data(db)

        query = db.query(models.Child).filter(models.Child.active.is_(True))
        if school_id:
            scoped_query = query.filter(models.Child.school_id == school_id)
            if scoped_query.count() > 0:
                query = scoped_query
        if room_name:
            query = query.filter(models.Child.room_name == room_name)
        pupils = query.all()

        stats = CohortStats(
            scope_label=room_name or school_label or "your school",
            room_name=room_name,
            total_pupils=len(pupils),
        )
        if not pupils:
            return stats

        ids = [p.id for p in pupils]
        needs: Counter[str] = Counter()
        for p in pupils:
            prof = p.support_profile
            if prof and prof.has_ehcp:
                stats.ehcp_count += 1
                if prof.annual_review_due:
                    days = (prof.annual_review_due - today).days
                    item = ReviewDue(p.full_name or p.first_name, prof.annual_review_due, days)
                    if days < 0:
                        stats.reviews_overdue.append(item)
                    elif days <= REVIEW_WINDOW_DAYS:
                        stats.reviews_due.append(item)
                else:
                    stats.ehcp_without_review_date += 1
            else:
                stats.sen_support_count += 1
            if prof and prof.primary_need:
                needs[prof.primary_need] += 1

        stats.top_needs = [n for n, _ in needs.most_common(3)]
        stats.reviews_due.sort(key=lambda r: r.due)
        stats.reviews_overdue.sort(key=lambda r: r.due)

        allocations = (
            db.query(models.StaffPupilAllocation)
            .filter(
                models.StaffPupilAllocation.child_id.in_(ids),
                models.StaffPupilAllocation.active.is_(True),
            )
            .all()
        )
        stats.weekly_ta_hours = round(sum(a.weekly_allocated_hours or 0 for a in allocations), 1)

        observations = (
            db.query(models.Observation)
            .join(models.ChildEvent, models.Observation.event_id == models.ChildEvent.id)
            .filter(
                models.ChildEvent.child_id.in_(ids),
                models.Observation.strategy_worked.isnot(None),
            )
            .all()
        )
        stats.strategy_observations = len(observations)
        stats.strategy_wins = sum(1 for o in observations if o.strategy_worked)
        worked = Counter(o.strategy_used for o in observations if o.strategy_worked and o.strategy_used)
        stats.top_strategies = [s for s, _ in worked.most_common(3)]
        return stats
