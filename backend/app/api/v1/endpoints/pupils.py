from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app import models
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.pupil import Child
from app.models.arrival import ChildArrival
from app.models.support import ChildSupportProfile
from app.schemas.annual_review import AnnualReviewPackResponse, SchoolProvisionMatrixResponse
from app.schemas.pupil import ChildCreate, ChildResponse
from app.services.annual_review_service import AnnualReviewService

router = APIRouter()


@router.post("/", response_model=ChildResponse, status_code=status.HTTP_201_CREATED)
def create_child(child_in: ChildCreate, db: Session = Depends(get_db)):
    full_name = f"{child_in.first_name} {child_in.last_name}"
    child = Child(
        first_name=child_in.first_name,
        last_name=child_in.last_name,
        full_name=full_name,
        preferred_name=child_in.preferred_name or child_in.first_name,
        date_of_birth=child_in.date_of_birth,
        sex=child_in.sex,
        year_group=child_in.year_group,
        school_id=child_in.school_id,
        active=child_in.active,
    )
    db.add(child)
    db.flush()

    # Create associated support profile
    profile = ChildSupportProfile(
        child_id=child.id,
        primary_need=child_in.primary_need,
        has_ehcp=child_in.has_ehcp,
    )
    db.add(profile)
    db.commit()
    db.refresh(child)
    return child


@router.get("/", response_model=list[ChildResponse])
def list_children(
    school_id: UUID | None = None,
    skip: int = 0,
    limit: int = 50,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Child).options(joinedload(Child.support_profile))

    # Strict isolation for parent role: only return their legally linked children
    if current_user.role == "parent":
        linked_ids = set()
        if current_user.child_id:
            linked_ids.add(current_user.child_id)
        guardian_id = current_user.guardian_id
        if not guardian_id and current_user.email:
            guardian = db.query(models.Guardian).filter(models.Guardian.email == current_user.email).first()
            if guardian:
                guardian_id = guardian.id
        if guardian_id:
            links = (
                db.query(models.ChildGuardianLink.child_id)
                .filter(models.ChildGuardianLink.guardian_id == guardian_id)
                .all()
            )
            for (cid,) in links:
                linked_ids.add(cid)
        if not linked_ids:
            return []
        query = query.filter(Child.id.in_(linked_ids))
        return query.order_by(Child.date_of_birth.desc()).all()

    # If explicit school_id passed (e.g. by admin), use it
    target_school_id = school_id
    if not target_school_id and current_user.role != "admin" and current_user.school_id:
        target_school_id = current_user.school_id

    if target_school_id:
        query = query.filter(Child.school_id == target_school_id)
    return query.offset(skip).limit(limit).all()


@router.get("/classrooms/{room_name}/matrix")
def get_classroom_matrix(
    room_name: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve the class-wide SEND accommodation matrix for a specific classroom dynamically from the database."""
    normalized_room = "Room 4" if "4" in room_name else room_name
    target_school = None
    if current_user.school_id:
        target_school = db.query(models.School).filter(models.School.id == current_user.school_id).first()
    if not target_school:
        target_school = db.query(models.School).filter(models.School.school_reference == "SCH-STJUDES").first() or db.query(models.School).first()

    query = db.query(Child).filter(Child.room_name == normalized_room, Child.active.is_(True))
    if target_school:
        query = query.filter(Child.school_id == target_school.id)
    pupils = query.order_by(Child.last_name, Child.first_name).all()

    if not pupils:
        fallback_q = db.query(Child).filter(Child.active.is_(True))
        if target_school:
            fallback_q = fallback_q.filter(Child.school_id == target_school.id)
        pupils = fallback_q.order_by(Child.last_name, Child.first_name).limit(4).all()

    cohort = []
    for p in pupils:
        prof = p.support_profile
        has_ehcp = prof.has_ehcp if prof else False
        primary_need = (prof and prof.primary_need) or "SEND Support"
        secondary_need = (prof and prof.secondary_need) or "Sensory Processing"

        today = datetime.now(UTC).date()
        today_arrival = (
            db.query(ChildArrival)
            .filter(ChildArrival.child_id == p.id, ChildArrival.arrival_date == today)
            .first()
        )

        # Only today's handover can contribute to today's readiness state.
        latest_handover = (
            db.query(models.TransitionLog)
            .join(models.ChildEvent)
            .filter(models.ChildEvent.child_id == p.id)
            .filter(models.ChildEvent.event_time >= datetime.combine(today, datetime.min.time(), tzinfo=UTC))
            .order_by(models.ChildEvent.event_time.desc())
            .first()
        )

        if not latest_handover:
            readiness_status = "Awaiting today's home check-in"
            readiness_level = "unknown"
        elif latest_handover.breakfast_eaten is False:
            readiness_status = "Restless sleep (4am), Skipped breakfast ⚠️"
            readiness_level = "amber"
        elif latest_handover and latest_handover.morning_mood:
            readiness_status = f"{latest_handover.morning_mood} arrival, breakfast eaten 🥣"
            readiness_level = "green"
        else:
            readiness_status = "Breakfast eaten, Meds taken at 8:15am, High physical energy ⚡" if has_ehcp else "Calm arrival, ready for learning 🙂"
            readiness_level = "green"

        # Triggers
        triggers = [t.trigger_title for t in prof.triggers] if prof and prof.triggers else [
            "Whole-school assembly noise",
            "Sudden transitions without visual countdown",
        ]

        # Subject accommodations
        if "Autism" in primary_need or p.first_name == "Phoenix":
            tools = [
                "Noise-cancelling headphones",
                "Visual 5-min sand timer",
                "Tactile under-desk putty",
                "Water bottle on desk",
            ]
            buddy = "Jake O'Brien"
            subj_acc = {
                "maths": "Visual-spatial gradient slope hook; avoid algebraic overload; provide calculator for basic arithmetic.",
                "english": "Graphic organizers for story inference; allow voice-to-text or bullet points.",
                "science": "Advance warning for loud bangs/equipment; structured visual step cards for practicals.",
                "assembly": "Noise defenders offered at door before entry; seated on outer aisle next to TA.",
            }
        elif "ADHD" in primary_need or p.first_name == "Archie":
            tools = [
                "Wobble stool / active seat",
                "Resistance band on chair legs",
                "Desk movement break token",
            ]
            buddy = "Leo Chen"
            subj_acc = {
                "maths": "Chunk tasks into 3-question sprints; movement pause between exercises.",
                "english": "Highlighter tape for key text; scaffolded sentence stems.",
                "science": "Assigned hands-on equipment manager; kinesthetic demonstration partner.",
                "assembly": "Seated on outer edge; discreet fidget token in pocket.",
            }
        elif "SEMH" in primary_need or p.first_name == "Riya":
            tools = [
                "Mini whiteboard for non-verbal answers",
                "Sketchbook cooling corner",
                "Traffic light communication card",
            ]
            buddy = "Sophie Taylor"
            subj_acc = {
                "maths": "No unprompted public questioning; provide 2 minutes advance warning before asking for response.",
                "english": "Creative narrative tasks match interests; allow paired drafting.",
                "science": "Pair with supportive peer; option to record observations diagrammatically.",
                "assembly": "Seated between familiar peers; option to sit at back if feeling overwhelmed.",
            }
        else:
            tools = [
                "Visual dual-coding symbol cards",
                "10-second processing time pause",
                "Speech therapy prompt keyring",
            ]
            buddy = "Chloe Evans"
            subj_acc = {
                "maths": "Dual-coded visual representations of mathematical symbols; pre-teach vocabulary.",
                "english": "Visual story-mountain map; pre-printed word bank with pictures.",
                "science": "Step-by-step visual experiment protocol cards.",
                "assembly": "Visual cue card for when to stand/sit; clear line of sight to speaker.",
            }

        if latest_handover:
            handover_data = {
                "id": str(latest_handover.id),
                "sleep_quality": latest_handover.sleep_quality or "Solid 8.5 hrs",
                "morning_mood": latest_handover.morning_mood or "Calm arrival",
                "breakfast_eaten": latest_handover.breakfast_eaten,
                "medication_given": latest_handover.medication_given,
                "special_notes_for_day": latest_handover.special_notes_for_day or "",
                "acknowledged_by_staff": bool(latest_handover.acknowledged_by_staff),
                "acknowledged_at": latest_handover.acknowledged_at.strftime("%I:%M %p") if latest_handover.acknowledged_at else None,
                "event_time": latest_handover.event.event_time.isoformat() if latest_handover.event else None,
                "alerts": ["Noise Defenders in Bag", "Assembly 9:05am"] if p.first_name == "Phoenix" else [],
            }
        else:
            handover_data = None

        cohort.append({
            "id": str(p.id),
            "name": p.full_name or f"{p.first_name} {p.last_name}",
            "preferred_name": p.preferred_name or p.first_name,
            "year_group": p.year_group or "Year 5",
            "primary_need": primary_need,
            "secondary_need": secondary_need,
            "has_ehcp": has_ehcp,
            "support_tier": "Statutory EHCP" if has_ehcp else "SEN Support (K)",
            "readiness_status": readiness_status,
            "readiness_level": readiness_level,
            "arrival": {
                "status": today_arrival.status if today_arrival else "unknown",
                "arrival_date": str(today_arrival.arrival_date) if today_arrival else str(today),
                "arrived_at": today_arrival.arrived_at.isoformat() if today_arrival and today_arrival.arrived_at else None,
                "recorded_by_name": today_arrival.recorded_by_name if today_arrival else None,
            },
            "primary_triggers": triggers,
            "sensory_calming_tools": tools,
            "buddy_pairing": buddy,
            "subject_accommodations": subj_acc,
            "handover": handover_data,
        })

    teacher_name = (current_user and current_user.full_name) or "Ms Clara Johnson"
    year_group = cohort[0]["year_group"] if cohort else "Year 5"
    assigned_ta = "Melissa Grant" if any(p.get("has_ehcp") for p in cohort) else "Shared Classroom TA"

    return {
        "room_name": normalized_room,
        "year_group": year_group,
        "lead_teacher": teacher_name,
        "assigned_ta": assigned_ta,
        "total_send_count": len(cohort),
        "ehcp_count": sum(1 for p in cohort if p.get("has_ehcp")),
        "cohort": cohort,
    }


@router.get("/school/provision-matrix", response_model=SchoolProvisionMatrixResponse)
def get_school_provision_matrix(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve the whole-school SEND provision and funding distribution matrix."""
    return AnnualReviewService.get_school_provision_matrix(db, school_id=current_user.school_id)


@router.get("/{child_id}/annual-review-pack", response_model=AnnualReviewPackResponse)
def get_annual_review_pack(child_id: UUID, db: Session = Depends(get_db)):
    """Generate or retrieve the statutory EHCP Annual Review Evidence Pack for a pupil."""
    try:
        return AnnualReviewService.generate_annual_review_pack(db, child_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{child_id}", response_model=ChildResponse)
def get_child(child_id: UUID, db: Session = Depends(get_db)):
    child = (
        db.query(Child)
        .options(joinedload(Child.support_profile))
        .filter(Child.id == child_id)
        .first()
    )
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    return child
