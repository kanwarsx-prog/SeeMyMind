from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models
from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.schemas.auth import (
    AuthTokenResponse,
    DemoLoginRequest,
    LoginRequest,
    ThemePreferenceRequest,
)
from app.schemas.registration import UserResponse
from app.services.seeder_service import SeederService

router = APIRouter()

DEMO_ACCOUNTS = {
    "admin": {
        "email": "admin@trust.seemy-mind.org",
        "full_name": "Dr. Alistair Vance",
        "role": "admin",
    },
    "senco": {
        "email": "senco@stjudes.sch.uk",
        "full_name": "Ms Amara Okafor",
        "role": "senco",
    },
    "teacher": {
        "email": "teacher@stjudes.sch.uk",
        "full_name": "Ms Clara Johnson",
        "role": "teacher",
    },
    "ta": {
        "email": "ta@stjudes.sch.uk",
        "full_name": "Melissa Grant",
        "role": "ta",
    },
    "parent": {
        "email": "dana.carter@example.com",
        "full_name": "Dana Carter",
        "role": "parent",
    },
    "child": {
        "email": "phoenix@pupil.stjudes.sch.uk",
        "full_name": "Phoenix Carter",
        "role": "child",
        "username": "phoenix",
        "pin": "1234",
    },
}

DEMO_PERSONAS = [
    {
        "role": "admin",
        "name": "Dr. Alistair Vance",
        "subtitle": "Platform Governance Lead",
        "icon": "building",
        "color": "from-indigo-600 to-slate-800",
        "text_color": "text-indigo-400",
        "badge": "Admin Hub",
        "description": "Multi-school onboarding, persona provisioning and GDPR audit logs",
    },
    {
        "role": "teacher",
        "name": "Ms Clara Johnson",
        "subtitle": "Classroom Teacher",
        "icon": "graduation-cap",
        "color": "from-purple-600 to-indigo-600",
        "text_color": "text-purple-600",
        "badge": "Teacher View",
        "description": "Morning handovers, adapted lessons and visual task cards",
    },
    {
        "role": "senco",
        "name": "Ms Amara Okafor",
        "subtitle": "SENCO and Inclusion Lead",
        "icon": "shield",
        "color": "from-teal to-teal-dark",
        "text_color": "text-teal",
        "badge": "SENCO View",
        "description": "SEND register, statutory EHCPs, child registration and parent invites",
    },
    {
        "role": "parent",
        "name": "Dana Carter",
        "subtitle": "Phoenix's Mum",
        "icon": "heart-handshake",
        "color": "from-amber-600 to-orange-600",
        "text_color": "text-amber-600",
        "badge": "Parent Hub",
        "description": "Morning handovers, read receipts, tonight tips and learning wins",
    },
    {
        "role": "child",
        "name": "Phoenix Carter",
        "subtitle": "Pupil Voice",
        "icon": "user",
        "color": "from-coral to-rose-600",
        "text_color": "text-coral",
        "badge": "Pupil Voice",
        "description": "Daily emoji check-in, visual worksheets and celebrating wins",
    },
    {
        "role": "ta",
        "name": "Melissa Grant",
        "subtitle": "Teaching Assistant and 1-to-1 Support",
        "icon": "users",
        "color": "from-emerald-600 to-teal",
        "text_color": "text-emerald-600",
        "badge": "TA View",
        "description": "Key transition schedule and quick classroom notes under 30 seconds",
    },
]


def _ensure_demo_entities(db: Session) -> tuple[models.School, models.Child]:
    """Ensure baseline school, secondary tenant, and demo accounts exist."""
    school = db.query(models.School).filter(models.School.school_reference == "SCH-STJUDES").first()
    if not school:
        school = db.query(models.School).first()
    if not school:
        school = models.School(
            school_name="St. Jude's Inclusive Academy",
            school_reference="SCH-STJUDES",
            urn_number="138942",
            phase="Primary",
            local_authority="Southwark",
            lead_senco_name="Ms Amara Okafor",
            town_city="London",
            postcode="SE1 7PB",
            main_email="admin@stjudes.sch.uk",
        )
        db.add(school)
        db.flush()
    else:
        if not school.urn_number:
            school.urn_number = "138942"
        if not school.phase:
            school.phase = "Primary"
        if not school.local_authority:
            school.local_authority = "Southwark"
        if not school.lead_senco_name:
            school.lead_senco_name = "Ms Amara Okafor"
        db.flush()

    # Seed secondary school tenant (Oakwood Community Primary) for multi-tenancy testing
    oakwood = db.query(models.School).filter(models.School.school_reference == "SCH-OAKWOOD").first()
    if not oakwood:
        oakwood = models.School(
            school_name="Oakwood Community Primary",
            school_reference="SCH-OAKWOOD",
            urn_number="142109",
            phase="Primary",
            local_authority="Camden",
            lead_senco_name="Mr David Davies",
            town_city="London",
            postcode="NW3 2QL",
            main_email="office@oakwood.sch.uk",
        )
        db.add(oakwood)
        db.flush()

        # Seed an Oakwood pupil to demonstrate data segregation
        oakwood_child = models.Child(
            first_name="Liam",
            last_name="Campbell",
            full_name="Liam Campbell",
            preferred_name="Liam",
            date_of_birth=datetime(2016, 3, 22, tzinfo=UTC).date(),
            sex="Male",
            year_group="Year 4",
            school_id=oakwood.id,
            active=True,
        )
        db.add(oakwood_child)
        db.flush()

    child = db.query(models.Child).filter(models.Child.first_name == "Phoenix").first()
    if not child:
        child = models.Child(
            first_name="Phoenix",
            last_name="Carter",
            full_name="Phoenix Carter",
            preferred_name="Phoenix",
            date_of_birth=datetime(2015, 6, 15, tzinfo=UTC).date(),
            sex="Male",
            year_group="Year 5",
            school_id=school.id,
            active=True,
        )
        db.add(child)
        db.flush()

        profile = models.ChildSupportProfile(
            child_id=child.id,
            primary_need="Autism Spectrum Condition (ASC)",
            secondary_need="Working Memory & Auditory Processing",
            has_ehcp=True,
            active=True,
            summary="Thrives with visual structure and pre-flight morning handover checks.",
        )
        db.add(profile)
        db.flush()

    # Ensure Phoenix has a ChildAccount
    phoenix_acc = (
        db.query(models.ChildAccount)
        .filter(models.ChildAccount.child_id == child.id)
        .first()
    )
    if not phoenix_acc:
        phoenix_acc = models.ChildAccount(
            child_id=child.id,
            username="phoenix",
            pin_hash=get_password_hash("1234"),
            avatar_emoji="⭐",
        )
        db.add(phoenix_acc)
        db.flush()

    # Seed baseline audit log events if empty
    if db.query(models.AuditLog).count() == 0:
        log1 = models.AuditLog(
            actor_name="Dr. Alistair Vance",
            actor_role="admin",
            school_id=school.id,
            action="ONBOARD_SCHOOL",
            target_type="school",
            target_id=school.id,
            target_name=school.school_name,
            details="Onboarded St. Jude's Inclusive Academy into Trust Portfolio with Section 44 Statutory Framework.",
        )
        log2 = models.AuditLog(
            actor_name="Dr. Alistair Vance",
            actor_role="admin",
            school_id=school.id,
            action="APPOINT_SENCO",
            target_type="user",
            target_name="Ms Amara Okafor",
            details="Appointed Ms Amara Okafor as Lead SENCO with delegated school admissions and EHCP authority.",
        )
        log3 = models.AuditLog(
            actor_name="Ms Amara Okafor",
            actor_role="senco",
            school_id=school.id,
            action="REGISTER_PUPIL",
            target_type="pupil",
            target_id=child.id,
            target_name=child.full_name,
            details="Registered Phoenix Carter to Year 5 SEND roster with Band E High-Needs provision.",
        )
        db.add_all([log1, log2, log3])
        db.flush()

    # Ensure longitudinal multi-pupil telemetry and Room 4 allocations exist.
    # Demo authentication must remain usable if an older Render database has
    # one incompatible telemetry row.  The core school/pupil records above are
    # still enough to issue a valid session while the seed failure is logged.
    try:
        SeederService.seed_longitudinal_demo_data(db)
    except Exception as exc:
        print(f"Demo telemetry seed skipped after recoverable error: {exc}")
        db.rollback()

        school = (
            db.query(models.School)
            .filter(models.School.school_reference == "SCH-STJUDES")
            .first()
        ) or db.query(models.School).first()
        child = (
            db.query(models.Child)
            .filter(
                models.Child.first_name == "Phoenix",
                models.Child.school_id == school.id if school else False,
            )
            .first()
            if school
            else None
        )

        if not school:
            school = models.School(
                school_name="St. Jude's Inclusive Academy",
                school_reference="SCH-STJUDES",
                phase="Primary",
                lead_senco_name="Ms Amara Okafor",
            )
            db.add(school)
            db.flush()

        if not child:
            child = models.Child(
                first_name="Phoenix",
                last_name="Carter",
                full_name="Phoenix Carter",
                preferred_name="Phoenix",
                date_of_birth=datetime(2015, 6, 15, tzinfo=UTC).date(),
                sex="Male",
                year_group="Year 5",
                school_id=school.id,
                active=True,
            )
            db.add(child)
            db.flush()

        db.commit()

    return school, child


@router.post(
    "/login",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User or Pupil login",
)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate either via email + password (staff/parent) or username + 4-digit PIN (pupil voice)."""
    identifier = body.email_or_username.strip().lower()
    secret = body.password_or_pin.strip()

    # 1. Check if identifier is a child voice account username
    child_acc = (
        db.query(models.ChildAccount)
        .filter(models.ChildAccount.username == identifier)
        .first()
    )
    if child_acc:
        if not child_acc.pin_hash or not verify_password(secret, child_acc.pin_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect 4-digit PIN for pupil voice login.",
            )

        child = db.query(models.Child).filter(models.Child.id == child_acc.child_id).first()
        child_email = f"{child_acc.username}@pupil.stjudes.sch.uk"
        user = db.query(models.User).filter(models.User.email == child_email).first()
        if not user:
            user = models.User(
                email=child_email,
                hashed_password=child_acc.pin_hash,
                full_name=child.full_name if child else child_acc.username,
                role="child",
                is_active=True,
                is_verified=True,
                child_id=child_acc.child_id,
                school_id=child.school_id if child else None,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        token = create_access_token(subject=user.id)
        child_school = db.query(models.School).filter(models.School.id == user.school_id).first() if user.school_id else None
        return AuthTokenResponse(
            access_token=token,
            token_type="bearer",
            user={
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "role": "child",
                "school_id": str(user.school_id) if user.school_id else None,
                "school_name": child_school.school_name if child_school else None,
                "child_id": str(user.child_id) if user.child_id else None,
                "avatar_emoji": child_acc.avatar_emoji,
                "username": child_acc.username,
                "theme_preference": getattr(user, "theme_preference", "system") or "system",
            },
        )

    # 2. Standard user login by email
    user = db.query(models.User).filter(models.User.email == identifier).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found with this email address or username.",
        )

    if not verify_password(secret, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please try again.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact your school administrator.",
        )

    if user.role == "parent" and not user.guardian_id:
        guardian = db.query(models.Guardian).filter(models.Guardian.email == user.email).first()
        if guardian:
            user.guardian_id = guardian.id
            db.commit()
            db.refresh(user)

    user_school = db.query(models.School).filter(models.School.id == user.school_id).first() if user.school_id else None
    token = create_access_token(subject=user.id)
    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user={
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "school_id": str(user.school_id) if user.school_id else None,
            "school_name": user_school.school_name if user_school else None,
            "child_id": str(user.child_id) if user.child_id else None,
            "guardian_id": str(user.guardian_id) if getattr(user, "guardian_id", None) else None,
            "theme_preference": getattr(user, "theme_preference", "system") or "system",
        },
    )


@router.get(
    "/demo-personas",
    response_model=list[dict],
    status_code=status.HTTP_200_OK,
    summary="List available demo personas",
)
def get_demo_personas():
    """Return the backend-owned persona catalogue used by the demo login screen."""
    return DEMO_PERSONAS


@router.post(
    "/demo-login",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="1-Click demo authentication for evaluators",
)
def demo_login(body: DemoLoginRequest, db: Session = Depends(get_db)):
    """Instantly authenticate into one of the 5 personas (senco, teacher, parent, child, ta)
    with a legitimate JWT token for evaluation.
    """
    role = body.role.lower().strip()
    if role not in DEMO_ACCOUNTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid demo role '{role}'. Expected one of: {list(DEMO_ACCOUNTS.keys())}",
        )

    try:
        school, child = _ensure_demo_entities(db)
    except Exception as exc:
        # A demo session should not be blocked by a non-essential seed row.
        # This is especially important for persistent Render databases that
        # may contain data created by an earlier schema revision.
        print(f"Demo entity seed failed; using core fallback: {exc}")
        db.rollback()
        school = (
            db.query(models.School)
            .filter(models.School.school_reference == "SCH-STJUDES")
            .first()
        ) or db.query(models.School).first()
        if not school:
            school = models.School(
                school_name="St. Jude's Inclusive Academy",
                school_reference="SCH-STJUDES",
                phase="Primary",
                lead_senco_name="Ms Amara Okafor",
            )
            db.add(school)
            db.flush()

        child = (
            db.query(models.Child)
            .filter(
                models.Child.first_name == "Phoenix",
                models.Child.school_id == school.id,
            )
            .first()
        )
        if not child:
            child = models.Child(
                first_name="Phoenix",
                last_name="Carter",
                full_name="Phoenix Carter",
                preferred_name="Phoenix",
                date_of_birth=datetime(2015, 6, 15, tzinfo=UTC).date(),
                sex="Male",
                year_group="Year 5",
                school_id=school.id,
                active=True,
            )
            db.add(child)
            db.flush()
        db.commit()
    cfg = DEMO_ACCOUNTS[role]
    email = cfg["email"]

    guardian = None
    if role == "parent":
        guardian = db.query(models.Guardian).filter(models.Guardian.email == email).first()

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = models.User(
            email=email,
            hashed_password=get_password_hash("password123"),
            full_name=cfg["full_name"],
            role=role,
            is_active=True,
            is_verified=True,
            school_id=school.id,
            child_id=child.id if role in ["parent", "child"] else None,
            guardian_id=guardian.id if guardian else None,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if role == "parent" and guardian and not user.guardian_id:
            user.guardian_id = guardian.id
            db.commit()
            db.refresh(user)

    user_school = db.query(models.School).filter(models.School.id == user.school_id).first() if user.school_id else None
    token = create_access_token(subject=user.id)
    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user={
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "school_id": str(user.school_id) if user.school_id else None,
            "school_name": user_school.school_name if user_school else None,
            "child_id": str(user.child_id) if user.child_id else None,
            "guardian_id": str(user.guardian_id) if getattr(user, "guardian_id", None) else None,
            "theme_preference": getattr(user, "theme_preference", "system") or "system",
        },
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get authenticated current user profile",
)
def get_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return the profile and role of the currently logged-in user."""
    user_school = db.query(models.School).filter(models.School.id == current_user.school_id).first() if current_user.school_id else None
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        child_id=current_user.child_id,
        guardian_id=current_user.guardian_id,
        school_id=current_user.school_id,
        school_name=user_school.school_name if user_school else None,
        theme_preference=getattr(current_user, "theme_preference", "system") or "system",
        created_at=current_user.created_at or datetime.now(UTC),
    )


@router.patch(
    "/theme",
    summary="Update authenticated user theme preference",
)
def update_theme_preference(
    payload: ThemePreferenceRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Persist the user's UI theme choice ('light', 'dark', 'system') in PostgreSQL."""
    current_user.theme_preference = payload.theme
    db.commit()
    db.refresh(current_user)
    return {
        "status": "updated",
        "theme_preference": current_user.theme_preference,
    }

