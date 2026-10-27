from datetime import UTC, date, datetime, timedelta

from sqlalchemy.orm import Session

from app import models
from app.core.security import get_password_hash


class SeederService:
    @staticmethod
    def seed_demo_day_snapshot(
        db: Session,
        school: models.School,
        pupils: dict[str, models.Child],
        teacher: models.StaffMember,
        ta: models.StaffMember,
    ) -> None:
        """Create one realistic, repeatable current-day snapshot for each demo pupil.

        This keeps the demo useful after the longitudinal history is established,
        while never duplicating or overwriting staff-recorded entries.
        """
        now = datetime.now(UTC)
        today = now.date()
        snapshot = {
            "Phoenix": {
                "arrival": ("present", 8, 42, "Arrived with visual timetable and headphones ready."),
                "mood": "Calm",
                "sleep": "Good",
                "breakfast": True,
                "medication": True,
                "strategy": "Visual Task Strip / 5-Min Timer",
                "context": "Independent Maths Task",
                "worked": True,
                "observation": "Completed a three-step visual maths task with one prompt.",
            },
            "Archie": {
                "arrival": ("late", 9, 3, "Late arrival recorded by classroom staff; settled after movement break."),
                "mood": "High energy",
                "sleep": "Restless",
                "breakfast": True,
                "medication": None,
                "strategy": "Purposeful Movement Break",
                "context": "Morning Literacy",
                "worked": True,
                "observation": "Returned to the task after a two-minute movement break and visual countdown.",
            },
            "Riya": {
                "arrival": ("present", 8, 51, "Calm handover; requested a quiet seat before maths."),
                "mood": "Calm",
                "sleep": "Good",
                "breakfast": True,
                "medication": None,
                "strategy": "Fraction Bar Models",
                "context": "Maths Small Group",
                "worked": True,
                "observation": "Attempted four fraction questions using visual manipulatives.",
            },
            "Leo": {
                "arrival": ("present", 8, 47, "Used the visual arrival card and joined the morning check-in."),
                "mood": "Ready",
                "sleep": "Good",
                "breakfast": True,
                "medication": None,
                "strategy": "Visual Prompt Cards",
                "context": "Science Discussion",
                "worked": True,
                "observation": "Contributed one hypothesis using a visual communication prompt.",
            },
        }

        for name, child in pupils.items():
            item = snapshot[name]
            arrival_status, arrival_hour, arrival_minute, arrival_note = item["arrival"]
            arrival = (
                db.query(models.ChildArrival)
                .filter(
                    models.ChildArrival.child_id == child.id,
                    models.ChildArrival.arrival_date == today,
                )
                .first()
            )
            if not arrival:
                arrival = models.ChildArrival(child_id=child.id, arrival_date=today)
                db.add(arrival)
            if not arrival.recorded_by or arrival.recording_method == "demo_seed":
                arrival.school_id = school.id
                arrival.status = arrival_status
                arrival.arrived_at = now.replace(hour=arrival_hour, minute=arrival_minute, second=0, microsecond=0)
                arrival.recorded_by = teacher.id
                arrival.recorded_by_name = teacher.first_name + " " + teacher.last_name
                arrival.recorded_by_role = "teacher"
                arrival.recording_method = "demo_seed"
                arrival.notes = arrival_note

            handover_title = f"Morning Home Handover {today.isoformat()}"
            handover = (
                db.query(models.ChildEvent)
                .filter(
                    models.ChildEvent.child_id == child.id,
                    models.ChildEvent.title.in_([
                        handover_title,
                        f"Demo morning handover {today.isoformat()}",
                    ]),
                )
                .first()
            )
            if not handover:
                handover = models.ChildEvent(
                    child_id=child.id,
                    school_id=school.id,
                    event_time=now.replace(hour=8, minute=20, second=0, microsecond=0),
                    event_type="Transition",
                    reporter_type="Parent",
                    reporter_name="Parent / Carer",
                    title=handover_title,
                    summary=arrival_note,
                    significance="Routine" if arrival_status == "present" else "Concern",
                    visibility="Shared",
                    status="Acknowledged",
                )
                db.add(handover)
                db.flush()
                db.add(
                    models.TransitionLog(
                        event_id=handover.id,
                        transition_type="Morning Handover (Home)",
                        sleep_quality=item["sleep"],
                        morning_mood=item["mood"],
                        breakfast_eaten=item["breakfast"],
                        medication_given=item["medication"],
                        special_notes_for_day=arrival_note,
                        acknowledged_by_staff=True,
                        acknowledged_at=now.replace(hour=8, minute=35, second=0, microsecond=0),
                    )
                )
            else:
                # Refresh only rows owned by this repeatable demo snapshot.
                # Real staff-recorded handovers must remain untouched.
                demo_transition = handover.transition_log
                if demo_transition:
                    handover.event_time = now.replace(hour=8, minute=20, second=0, microsecond=0)
                    handover.title = handover_title
                    handover.reporter_name = "Parent / Carer"
                    handover.summary = arrival_note
                    handover.status = "Acknowledged"
                    demo_transition.sleep_quality = item["sleep"]
                    demo_transition.morning_mood = item["mood"]
                    demo_transition.breakfast_eaten = item["breakfast"]
                    demo_transition.medication_given = item["medication"]
                    demo_transition.special_notes_for_day = arrival_note
                    demo_transition.acknowledged_by_staff = True
                    demo_transition.acknowledged_at = now.replace(hour=8, minute=35, second=0, microsecond=0)

            observation_title = f"Classroom Observation {today.isoformat()}"
            observation_event = (
                db.query(models.ChildEvent)
                .filter(
                    models.ChildEvent.child_id == child.id,
                    models.ChildEvent.title.in_([
                        observation_title,
                        f"Demo classroom observation {today.isoformat()}",
                    ]),
                )
                .first()
            )
            if not observation_event:
                observation_event = models.ChildEvent(
                    child_id=child.id,
                    school_id=school.id,
                    event_time=now.replace(hour=10, minute=15, second=0, microsecond=0),
                    event_type="Observation",
                    reporter_type="TA",
                    reporter_name=ta.first_name + " " + ta.last_name,
                    title=observation_title,
                    summary=item["observation"],
                    significance="Notable Win" if item["worked"] else "Routine",
                    visibility="Shared",
                    status="Logged",
                )
                db.add(observation_event)
                db.flush()
                db.add(
                    models.Observation(
                        event_id=observation_event.id,
                        activity_context=item["context"],
                        engagement_level="High" if item["worked"] else "Engaged with Support",
                        strategy_used=item["strategy"],
                        strategy_worked=item["worked"],
                        strengths_observed=item["observation"],
                        notes=arrival_note,
                    )
                )
            else:
                observation_event.title = observation_title
                observation_event.reporter_name = ta.first_name + " " + ta.last_name

        db.flush()

    @staticmethod
    def seed_longitudinal_demo_data(db: Session, force_refresh: bool = False) -> dict:
        """Seeds or updates the complete 30-day longitudinal SEND telemetry for St. Jude's
        Inclusive Academy (Room 4 cohort).
        Ensures all 4 pupils, staff allocations, medication regimens, APDR targets,
        and chronological events are present in real database rows.
        """
        # 1. School
        school = (
            db.query(models.School).filter(models.School.school_reference == "SCH-STJUDES").first()
        )
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
                main_telephone="020 7946 0192",
                active=True,
            )
            db.add(school)
            db.flush()
        else:
            school.urn_number = "138942"
            school.lead_senco_name = "Ms Amara Okafor"
            school.local_authority = "Southwark"
            db.flush()

        # 2. Staff Members
        senco = db.query(models.StaffMember).filter(models.StaffMember.email == "senco@stjudes.sch.uk").first()
        if not senco:
            senco = models.StaffMember(
                first_name="Amara",
                last_name="Okafor",
                email="senco@stjudes.sch.uk",
                telephone="020 7946 0193",
                active=True,
            )
            db.add(senco)
            db.flush()

        teacher = db.query(models.StaffMember).filter(models.StaffMember.email == "teacher@stjudes.sch.uk").first()
        if not teacher:
            teacher = models.StaffMember(
                first_name="Clara",
                last_name="Johnson",
                email="teacher@stjudes.sch.uk",
                telephone="020 7946 0194",
                active=True,
            )
            db.add(teacher)
            db.flush()

        ta = db.query(models.StaffMember).filter(models.StaffMember.email == "ta@stjudes.sch.uk").first()
        if not ta:
            ta = models.StaffMember(
                first_name="Melissa",
                last_name="Grant",
                email="ta@stjudes.sch.uk",
                telephone="020 7946 0195",
                active=True,
            )
            db.add(ta)
            db.flush()

        # School Assignments
        for staff_obj, role_title in [
            (senco, ("SENCO", "Head of SEND")),
            (teacher, ("Teacher", "Year 5 Class Teacher (Room 4)")),
            (ta, ("TA", "1:1 & Targeted Teaching Assistant")),
        ]:
            assign = (
                db.query(models.StaffSchoolAssignment)
                .filter(
                    models.StaffSchoolAssignment.staff_id == staff_obj.id,
                    models.StaffSchoolAssignment.school_id == school.id,
                )
                .first()
            )
            if not assign:
                db.add(
                    models.StaffSchoolAssignment(
                        staff_id=staff_obj.id,
                        school_id=school.id,
                        role=role_title[0],
                        job_title=role_title[1],
                        active=True,
                    )
                )

        # 3. Room 4 Cohort Pupils
        pupils_spec = [
            {
                "first_name": "Phoenix",
                "last_name": "Carter",
                "preferred_name": "Phoenix",
                "dob": date(2015, 4, 12),
                "sex": "Male",
                "year_group": "Year 5",
                "room_name": "Room 4",
                "buddy_name": "Jake O'Brien",
                "has_ehcp": True,
                "primary_need": "Autism Spectrum Condition & ADHD",
                "secondary_need": "Sensory Processing (Acoustic >78 dB)",
                "sensory_profile": "High acoustic defensiveness (>78 dB triggers fight/flight avoidance). Mid-morning medication dip if breakfast is missed.",
                "summary": "Inquisitive, highly capable student with strong visual-spatial reasoning. Experiences acoustic defensiveness in high-echo environments (assemblies, dining hall) and mid-morning medication dip if breakfast is missed.",
                "weekly_ta_hours": 15.0,
                "ta_role": "1:1 Key Worker TA",
                "funding": "High-Needs Band 3 EHCP",
                "annual_review_due": date(2026, 11, 5),
            },
            {
                "first_name": "Archie",
                "last_name": "Watson",
                "preferred_name": "Archie",
                "dob": date(2015, 7, 20),
                "sex": "Male",
                "year_group": "Year 5",
                "room_name": "Room 4",
                "buddy_name": "Leo Chen",
                "has_ehcp": True,
                "primary_need": "ADHD & Working Memory Delay",
                "secondary_need": "Kinesthetic Sensory Seeking",
                "summary": "High energy learner who excels with kinesthetic movement pauses, active seating, and 2-step chunked visual checklists.",
                "weekly_ta_hours": 10.0,
                "ta_role": "1:1 Dedicated TA",
                "funding": "High-Needs Band 2 EHCP",
                "annual_review_due": date(2026, 12, 12),
            },
            {
                "first_name": "Riya",
                "last_name": "Patel",
                "preferred_name": "Riya",
                "dob": date(2015, 11, 5),
                "sex": "Female",
                "year_group": "Year 5",
                "room_name": "Room 4",
                "buddy_name": "Sophie Taylor",
                "has_ehcp": False,
                "primary_need": "SEMH & Dyscalculia",
                "secondary_need": "Performance Anxiety & Acoustic Sensitivity",
                "summary": "Gentle, creative pupil who experiences acute maths anxiety with abstract numbers. Flourishes with fraction bar models and calm seating.",
                "weekly_ta_hours": 5.0,
                "ta_role": "Targeted Small Group TA",
                "funding": "Notional SEN Budget (K)",
            },
            {
                "first_name": "Leo",
                "last_name": "Campbell",
                "preferred_name": "Leo",
                "dob": date(2015, 9, 14),
                "sex": "Male",
                "year_group": "Year 5",
                "room_name": "Room 4",
                "buddy_name": "Chloe Evans",
                "has_ehcp": False,
                "primary_need": "Speech, Language & Communication (SLCN)",
                "secondary_need": "Expressive Language Processing Delay",
                "summary": "Engaged learner who benefits from visual task cards, dual coding, and peer partner pairing for verbal group discussions.",
                "weekly_ta_hours": 4.0,
                "ta_role": "Targeted Small Group TA",
                "funding": "Notional SEN Budget (K)",
            },
        ]

        pupils_map: dict[str, models.Child] = {}

        for p_spec in pupils_spec:
            child = (
                db.query(models.Child)
                .filter(
                    models.Child.first_name == p_spec["first_name"],
                    models.Child.school_id == school.id,
                )
                .first()
            )
            if not child:
                child = models.Child(
                    first_name=p_spec["first_name"],
                    last_name=p_spec["last_name"],
                    full_name=f"{p_spec['first_name']} {p_spec['last_name']}",
                    preferred_name=p_spec["preferred_name"],
                    date_of_birth=p_spec["dob"],
                    sex=p_spec["sex"],
                    year_group=p_spec["year_group"],
                    room_name=p_spec["room_name"],
                    buddy_name=p_spec.get("buddy_name"),
                    school_id=school.id,
                    active=True,
                )
                db.add(child)
                db.flush()
            else:
                child.room_name = p_spec["room_name"]
                child.year_group = p_spec["year_group"]
                child.buddy_name = p_spec.get("buddy_name")
                db.flush()

            pupils_map[p_spec["first_name"]] = child

            # Support profile
            prof = (
                db.query(models.ChildSupportProfile)
                .filter(models.ChildSupportProfile.child_id == child.id)
                .first()
            )
            if not prof:
                prof = models.ChildSupportProfile(
                    child_id=child.id,
                    primary_need=p_spec["primary_need"],
                    secondary_need=p_spec["secondary_need"],
                    sensory_profile=p_spec.get("sensory_profile"),
                    has_ehcp=p_spec["has_ehcp"],
                    annual_review_due=p_spec.get("annual_review_due"),
                    summary=p_spec["summary"],
                    active=True,
                )
                db.add(prof)
                db.flush()
            else:
                prof.primary_need = p_spec["primary_need"]
                prof.secondary_need = p_spec["secondary_need"]
                prof.sensory_profile = p_spec.get("sensory_profile")
                prof.has_ehcp = p_spec["has_ehcp"]
                prof.annual_review_due = p_spec.get("annual_review_due")
                prof.summary = p_spec["summary"]
                db.flush()

            # Staff TA Allocation
            alloc = (
                db.query(models.StaffPupilAllocation)
                .filter(
                    models.StaffPupilAllocation.child_id == child.id,
                    models.StaffPupilAllocation.staff_id == ta.id,
                )
                .first()
            )
            if not alloc:
                db.add(
                    models.StaffPupilAllocation(
                        staff_id=ta.id,
                        child_id=child.id,
                        role_type=p_spec["ta_role"],
                        weekly_allocated_hours=p_spec["weekly_ta_hours"],
                        weekly_delivered_hours=p_spec["weekly_ta_hours"],
                        funding_source=p_spec["funding"],
                        active=True,
                    )
                )
            else:
                alloc.weekly_allocated_hours = p_spec["weekly_ta_hours"]
                alloc.weekly_delivered_hours = p_spec["weekly_ta_hours"]
                alloc.funding_source = p_spec["funding"]

        phoenix = pupils_map["Phoenix"]
        archie = pupils_map["Archie"]
        riya = pupils_map["Riya"]
        leo_campbell = pupils_map["Leo"]

        # 4. Guardian for Phoenix
        guardian = db.query(models.Guardian).filter(models.Guardian.email == "dana.carter@example.com").first()
        if not guardian:
            guardian = models.Guardian(
                first_name="Dana",
                last_name="Carter",
                email="dana.carter@example.com",
                mobile_phone="07700 900123",
                relationship_to_child="Mother",
                active=True,
            )
            db.add(guardian)
            db.flush()

        g_link = (
            db.query(models.ChildGuardianLink)
            .filter(
                models.ChildGuardianLink.child_id == phoenix.id,
                models.ChildGuardianLink.guardian_id == guardian.id,
            )
            .first()
        )
        if not g_link:
            db.add(
                models.ChildGuardianLink(
                    child_id=phoenix.id,
                    guardian_id=guardian.id,
                    parental_responsibility=True,
                    emergency_contact=True,
                    primary_carer=True,
                    receive_daily_updates=True,
                )
            )

        # Sibling: Leo Carter (Year 3) linked to Dana Carter
        leo_sibling = db.query(models.Child).filter(models.Child.first_name == "Leo", models.Child.last_name == "Carter").first()
        if not leo_sibling:
            leo_sibling = models.Child(
                school_id=school.id,
                first_name="Leo",
                last_name="Carter",
                full_name="Leo Carter",
                preferred_name="Leo",
                date_of_birth=date(2017, 3, 14),
                sex="Male",
                year_group="Year 3",
                room_name="Room 2",
                active=True,
            )
            db.add(leo_sibling)
            db.flush()

            leo_profile = models.ChildSupportProfile(
                child_id=leo_sibling.id,
                primary_need="Speech, Language and Communication Needs (SLCN)",
                secondary_need="Sensory Processing Sensitivity",
                has_ehcp=False,
                summary="Responds exceptionally well to visual cue cards and sensory pauses during numeracy.",
            )
            db.add(leo_profile)
            db.flush()

        leo_link = (
            db.query(models.ChildGuardianLink)
            .filter(
                models.ChildGuardianLink.child_id == leo_sibling.id,
                models.ChildGuardianLink.guardian_id == guardian.id,
            )
            .first()
        )
        if not leo_link:
            db.add(
                models.ChildGuardianLink(
                child_id=leo_sibling.id,
                    guardian_id=guardian.id,
                    parental_responsibility=True,
                    emergency_contact=True,
                    primary_carer=True,
                    receive_daily_updates=True,
                )
            )
            db.flush()

        # 5. Pupil Voice Account for Phoenix
        phoenix_acc = (
            db.query(models.ChildAccount)
            .filter(models.ChildAccount.child_id == phoenix.id)
            .first()
        )
        if not phoenix_acc:
            db.add(
                models.ChildAccount(
                    child_id=phoenix.id,
                    username="phoenix",
                    pin_hash=get_password_hash("1234"),
                    avatar_emoji="⭐",
                )
            )

        # 6. Medication Regimen for Phoenix
        med = (
            db.query(models.MedicationRegimen)
            .filter(models.MedicationRegimen.child_id == phoenix.id)
            .first()
        )
        if not med:
            db.add(
                models.MedicationRegimen(
                    child_id=phoenix.id,
                    medication_name="Equasym XL (Methylphenidate Hydrochloride)",
                    dosage="18mg once daily",
                    formulation="Extended-Release Biphasic Capsule (30% immediate release, 70% modified release)",
                    prescribed_schedule="07:30 - 08:00 AM daily with food",
                    administration_route="Oral",
                    prescribing_clinician="Dr. Sarah Al-Husseini (Consultant Child & Adolescent Psychiatrist)",
                    clinical_service="Southwark & Greenwich CAMHS Neurodevelopmental Team",
                    peak_window_start="09:00 AM",
                    peak_window_end="10:15 AM",
                    trough_window_start="10:15 AM",
                    trough_window_end="10:45 AM",
                    co_administration_rules="Requires caloric breakfast co-administration. Skipping food correlates with a 16:1 mid-morning dysregulation ratio.",
                    active=True,
                )
            )

        # 7. APDR Pupil Targets
        targets_spec = [
            (
                phoenix.id,
                "Curriculum & Maths",
                "Complete 3-step visual maths tasks using gradient slope representations without adult escalation",
                "Independently solves gradient problems on 4 out of 5 consecutive days",
                "Significant Progress",
                "Drew gradient triangle independently in Week 3 without escalation.",
                "Connected mathematical slope vectors to video game physics.",
            ),
            (
                phoenix.id,
                "Sensory & Assembly",
                "Independently transition to whole-school assembly using galaxy noise defenders before decibel threshold reaches 78 dB",
                "Access assembly seated on aisle for 20 minutes without acute distress",
                "Target Met",
                "Spontaneous self-advocacy logged on 4 consecutive Mondays.",
                "Reminded TA Melissa to get headphones before leaving Room 4.",
            ),
            (
                phoenix.id,
                "Self-Advocacy & De-escalation",
                "Self-advocate for quiet movement break using desk token before rising to amber agitation",
                "Uses token proactively at early rumbling stage",
                "Significant Progress",
                "Used break token 8 times independently before escalating to amber.",
                "Requested quiet drawing in Room 4 pod.",
            ),
            (
                archie.id,
                "Executive Function & Working Memory",
                "Follow chunked 2-step instructional sequences using visual checklist without adult prompting on 4/5 days",
                "Completes both steps independently",
                "Target Met",
                "91.0% win rate using visual sand timers and desk checklists.",
                "Completed morning literacy independent task without leaving seat.",
            ),
            (
                riya.id,
                "Maths Confidence & SEMH",
                "Access fraction bar models and visual manipulatives without experiencing acute performance anxiety",
                "Attempts 5 visual questions independently",
                "Significant Progress",
                "89.5% win rate with kinesthetic chunking and movement breaks.",
                "Volunteered fraction answer during small group session.",
            ),
            (
                leo_campbell.id,
                "Speech, Language & Peer Scaffolding",
                "Use visual prompt cards and paired peer scaffolding to contribute to group science discussions",
                "Contributes at least 1 hypothesis per lesson",
                "Significant Progress",
                "93.0% win rate when paired with peer partner Jake.",
                "Explained magnetic attraction using visual task card.",
            ),
        ]

        for cid, area, smart, crit, outcome, notes, b_notes in targets_spec:
            pt = (
                db.query(models.PupilTarget)
                .filter(
                    models.PupilTarget.child_id == cid,
                    models.PupilTarget.target_area == area,
                )
                .first()
            )
            if not pt:
                db.add(
                    models.PupilTarget(
                        child_id=cid,
                        term="Spring 2026",
                        target_area=area,
                        smart_target=smart,
                        success_criteria=crit,
                        apdr_stage="Review",
                        review_outcome=outcome,
                        review_notes=notes,
                        breakthrough_notes=b_notes,
                        active=True,
                    )
                )

        db.flush()

        # 8. Longitudinal Telemetry Events (Last 30 Days)
        event_count = db.query(models.ChildEvent).filter(models.ChildEvent.child_id == phoenix.id).count()
        if event_count < 15 or force_refresh:
            now = datetime.now(UTC)
            fasted_day_offsets = {3, 10, 17, 24}

            for day_offset in range(29, -1, -1):
                cur_date = now - timedelta(days=day_offset)
                is_weekend = cur_date.weekday() in (5, 6)
                if is_weekend:
                    continue

                is_fasted = day_offset in fasted_day_offsets

                # Morning Handover (08:30 AM)
                handover_time = cur_date.replace(hour=8, minute=30, second=0, microsecond=0)
                handover_event = models.ChildEvent(
                    child_id=phoenix.id,
                    school_id=school.id,
                    event_time=handover_time,
                    event_type="Transition",
                    reporter_type="Parent",
                    reporter_name="Dana Carter",
                    title="Morning Pre-Flight Handover",
                    summary=(
                        "Restless sleep, refused breakfast, took Equasym at 7:45am. Watch out for 10am dip."
                        if is_fasted
                        else "Slept well, ate porridge, took morning Equasym at 7:45am. Ready for school."
                    ),
                    significance="Concern" if is_fasted else "Routine",
                    visibility="Shared",
                    status="Acknowledged",
                )
                db.add(handover_event)
                db.flush()

                db.add(
                    models.TransitionLog(
                        event_id=handover_event.id,
                        transition_type="Morning Handover (Home)",
                        sleep_quality="Poor (<5 hrs)" if is_fasted else "Good",
                        morning_mood="Anxious" if is_fasted else "Calm & Happy",
                        breakfast_eaten=not is_fasted,
                        medication_given=True,
                        special_notes_for_day=(
                            "Skipped breakfast. Please ensure 10am snack bridge is ready."
                            if is_fasted
                            else "No major concerns. Looking forward to science practical."
                        ),
                        acknowledged_by_staff=True,
                        acknowledged_at=handover_time + timedelta(minutes=18),
                    )
                )

                # Mid-Morning Behavioral Incident (Only on fasted days during dip window!)
                if is_fasted:
                    incident_time = cur_date.replace(hour=10, minute=20 + (day_offset % 20), second=0, microsecond=0)
                    inc_event = models.ChildEvent(
                        child_id=phoenix.id,
                        school_id=school.id,
                        event_time=incident_time,
                        event_type="Incident",
                        reporter_type="Teacher",
                        reporter_name="Ms Clara Johnson",
                        title="Mid-Morning Task Refusal & Sensory Agitation (Fasted State)",
                        summary="Sensory agitation triggered during abstract maths task during 10:15am medication dip. Resolved with carbohydrate snack bridge and noise defenders.",
                        significance="Concern",
                        visibility="Shared",
                        status="Reviewed",
                    )
                    db.add(inc_event)
                    db.flush()

                    db.add(
                        models.BehaviouralIncident(
                            event_id=inc_event.id,
                            location="Room 4 Maths",
                            severity="Moderate",
                            antecedent="Abstract multi-step algebra combined with 10:15 AM medication dip and skipped breakfast.",
                            behaviour="Paced room, covered ears, pushed worksheet off desk.",
                            consequence="De-escalated by TA Melissa with 10:00 AM snack bridge crackers and noise defenders. Settled in 8 minutes.",
                            de_escalation_strategy_used="Carbohydrate Snack Bridge + Noise Defenders",
                            recovery_time_minutes=8,
                            parent_notified=True,
                        )
                    )

                # Routine Daily Classroom Observations
                strategies_cycle = [
                    ("Purposeful Movement Break", True, "Year 5 Maths", "Carried book box to library; returned regulated."),
                    ("Purposeful Movement Break", True, "English Writing", "Movement break errand to reception settled restless energy."),
                    ("Noise-Cancelling Headphones / Galaxy Defenders", True, "Assembly Transition", "Put on headphones before hall echo; sat calmly."),
                    ("Visual Task Strip / 5-Min Timer", True, "Science Practical", "Followed 3-step checklist independently."),
                    ("Noise-Cancelling Headphones / Galaxy Defenders", True, "Dining Hall Lunch", "Wore defenders throughout busy lunch period."),
                    ("Purposeful Movement Break", True, "Afternoon Art", "Kinesthetic stretch break prevented frustration."),
                    ("Visual Task Strip / 5-Min Timer", True, "Maths Problem Solving", "Visual gradient timer sustained on-task focus."),
                    ("Purposeful Movement Break", True, "Class Transition", "Errand with peer partner Jake successful."),
                    ("Noise-Cancelling Headphones / Galaxy Defenders", True, "Music & Echo Hall", "Noise defenders prevented sensory overload."),
                    ("Direct Verbal Questioning", False, "Whole-Class Phonics", "Repeated verbal questions caused withdrawal and head on desk."),
                    ("Visual Task Strip / 5-Min Timer", True, "Literacy Independent Task", "Completed visual checklist without adult prompting."),
                    ("Purposeful Movement Break", True, "Spelling Sprint", "Motor pause restored regulation."),
                ]

                strat = strategies_cycle[day_offset % len(strategies_cycle)]
                obs_time = cur_date.replace(hour=11, minute=15, second=0, microsecond=0)
                obs_event = models.ChildEvent(
                    child_id=phoenix.id,
                    school_id=school.id,
                    event_time=obs_time,
                    event_type="Observation",
                    reporter_type="TA",
                    reporter_name="Melissa Grant",
                    title=f"Classroom Observation: {strat[0]}",
                    summary=strat[3],
                    significance="Notable Win" if strat[1] else "Routine",
                    visibility="Shared",
                    status="Logged",
                )
                db.add(obs_event)
                db.flush()

                db.add(
                    models.Observation(
                        event_id=obs_event.id,
                        activity_context=strat[2],
                        engagement_level="High" if strat[1] else "Passive",
                        strategy_used=strat[0],
                        strategy_worked=strat[1],
                        strengths_observed="Visual comprehension & self-regulation" if strat[1] else None,
                        notes=strat[3],
                    )
                )

                # Pupil Voice Check-In (Every other school day)
                if day_offset % 2 == 0:
                    ci_time = cur_date.replace(hour=13, minute=10, second=0, microsecond=0)
                    ci_event = models.ChildEvent(
                        child_id=phoenix.id,
                        school_id=school.id,
                        event_time=ci_time,
                        event_type="CheckIn",
                        reporter_type="Child",
                        reporter_name="Phoenix Carter",
                        title="Pupil Voice Check-In",
                        summary="Phoenix shared how he feels after lunch.",
                        significance="Routine",
                        visibility="Shared",
                        status="Logged",
                    )
                    db.add(ci_event)
                    db.flush()

                    db.add(
                        models.ChildCheckIn(
                            event_id=ci_event.id,
                            mood_emoji="😊" if not is_fasted else "😐",
                            mood_label="Great" if not is_fasted else "Okay",
                            energy_level=4 if not is_fasted else 2,
                            self_regulation_need="Quiet space" if is_fasted else "Movement break",
                            voice_note_text="I liked building the slope in maths today with Melissa.",
                        )
                    )

            # Add one acoustic incident for assembly (decibel spike >78dB)
            spike_date = now - timedelta(days=8)
            spike_time = spike_date.replace(hour=9, minute=12, second=0, microsecond=0)
            hall_event = models.ChildEvent(
                child_id=phoenix.id,
                school_id=school.id,
                event_time=spike_time,
                event_type="Incident",
                reporter_type="Teacher",
                reporter_name="Ms Clara Johnson",
                title="School Hall Acoustic Trigger Spike (>82 dB)",
                summary="Sudden microphone feedback squeal in school hall caused immediate acute acoustic distress.",
                significance="High Priority",
                visibility="Shared",
                status="Reviewed",
            )
            db.add(hall_event)
            db.flush()

            db.add(
                models.BehaviouralIncident(
                    event_id=hall_event.id,
                    location="School Hall",
                    severity="Moderate",
                    antecedent="Sudden PA microphone acoustic feedback screech >82 dB during Monday assembly.",
                    behaviour="Hands clamped over ears, dropped to floor under bench.",
                    consequence="TA Melissa escorted Phoenix back to Room 4 sensory corner. Recovered in 6 minutes.",
                    de_escalation_strategy_used="Acoustic Shelter & Deep Pressure Putty",
                    recovery_time_minutes=6,
                    parent_notified=True,
                )
            )

        SeederService.seed_demo_day_snapshot(
            db=db,
            school=school,
            pupils={"Phoenix": phoenix, "Archie": archie, "Riya": riya, "Leo": leo_campbell},
            teacher=teacher,
            ta=ta,
        )

        db.commit()

        return {
            "school_id": str(school.id),
            "school_name": school.school_name,
            "pupils": {name: str(p.id) for name, p in pupils_map.items()},
            "staff": {
                "senco": str(senco.id),
                "teacher": str(teacher.id),
                "ta": str(ta.id),
            },
            "total_events": db.query(models.ChildEvent).count(),
        }
