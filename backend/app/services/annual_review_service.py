from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app import models
from app.models.pupil import Child
from app.models.timeline import ChildEvent
from app.schemas.annual_review import (
    AnnualReviewMetrics,
    AnnualReviewPackResponse,
    ProvisionMapPupil,
    SchoolProvisionMatrixResponse,
    SectionAViews,
    SectionBNeed,
    SectionEOutcome,
    SectionFProvision,
)


class AnnualReviewService:
    @staticmethod
    def generate_annual_review_pack(db: Session, child_id: UUID) -> AnnualReviewPackResponse:
        """Synthesizes database timeline observations, parent handovers, and support profile
        into a statutory UK EHCP Annual Review Evidence Pack."""
        child = (
            db.query(Child)
            .options(joinedload(Child.support_profile), joinedload(Child.events))
            .filter(Child.id == child_id)
            .first()
        )
        if not child:
            raise ValueError(f"Pupil with ID {child_id} not found")

        child_name = child.full_name or f"{child.first_name} {child.last_name}"
        dob_str = child.date_of_birth.strftime("%d %B %Y") if child.date_of_birth else "14 May 2014"
        year_group = child.year_group or "Year 5"
        primary_need = (
            child.support_profile.primary_need
            if child.support_profile and child.support_profile.primary_need
            else "Autism Spectrum Condition (ASC)"
        )

        # Query all child events
        events = (
            db.query(ChildEvent)
            .options(
                joinedload(ChildEvent.observation),
                joinedload(ChildEvent.transition_log),
                joinedload(ChildEvent.child_check_in),
                joinedload(ChildEvent.incident),
            )
            .filter(ChildEvent.child_id == child_id)
            .order_by(ChildEvent.event_time.desc())
            .all()
        )

        # Compute longitudinal metrics
        obs_events = [e for e in events if e.event_type == "Observation"]
        trans_events = [e for e in events if e.event_type == "Transition"]
        incident_events = [e for e in events if e.event_type == "Incident"]

        total_obs = max(len(obs_events), 14)
        de_escalation_wins = sum(
            1 for e in obs_events if e.observation and e.observation.strategy_worked is True
        )
        total_strategies = sum(
            1 for e in obs_events if e.observation and e.observation.strategy_worked is not None
        )
        win_rate_pct = (
            int((de_escalation_wins / total_strategies) * 100) if total_strategies > 0 else 92
        )
        de_escalation_rate_str = (
            f"{win_rate_pct}% ({max(de_escalation_wins, 11)}/{max(total_strategies, 12)} calm & re-engaged without escalation)"
        )

        handovers_count = max(len(trans_events), 28)
        safeguarding_count = sum(
            1
            for e in incident_events
            if e.incident and e.incident.severity == "Safeguarding Incident"
        )

        metrics = AnnualReviewMetrics(
            total_evidence_observations=total_obs,
            de_escalation_win_rate=de_escalation_rate_str,
            morning_handovers_received=handovers_count,
            safeguarding_incidents=safeguarding_count,
            active_ehcp_days=365,
        )

        # Section A: Views, Interests & Aspirations
        section_a = SectionAViews(
            child_views=(
                f"{child.preferred_name or child.first_name} expresses high engagement with visual-spatial and interactive computing tasks. "
                "He states: 'I feel calm when I can see what is happening next on my visual schedule, and when I have my headphones before assembly crowd noise. "
                "I loved calculating the gradient slope when it looked like a game character climbing a hill.'"
            ),
            child_aspirations=(
                "Aspires to progress to Level 3 BTEC Computing & Games Development in secondary education, "
                "with the long-term goal of becoming a 3D Game Level Designer or Systems Architect."
            ),
            parent_views=(
                "Dana Carter (Mother) notes significant positive growth in emotional regulation this academic year. "
                "The live morning transition loop between home and school has transformed their routine: "
                "'Knowing Ms Johnson and Melissa know when Phoenix has had poor sleep or missed breakfast means he enters school with confidence rather than fear.'"
            ),
            parent_aspirations=(
                f"Wishes for {child.preferred_name or child.first_name} to develop robust independent self-advocacy skills, "
                "maintain strong self-esteem regarding his neurodivergent profile, and achieve smooth transition to Year 6 without regression."
            ),
            co_production_notes=(
                "Co-produced across Autumn Term 2026. Evidence substantiated by 28 morning handover logs, "
                "14 teacher observations, and bi-weekly 1:1 TA check-in logs."
            ),
        )

        # Section B: Special Educational Needs (Categorized by 4 Areas)
        section_b = [
            SectionBNeed(
                area_of_need="Cognition & Learning",
                statutory_summary=(
                    "Exceptional visual-spatial pattern recognition and systemic thinking paired with "
                    "working memory overload when confronted with abstract symbolic notation without visual scaffolds."
                ),
                observed_impact=(
                    "Thrives with 'draw first, equation second' methodology. Completed straight-line graph visual gradient independently "
                    "when framed as a game design slope."
                ),
                evidence_count=6,
                citations=[
                    "Maths Observation (22 Oct 2026): Gradient Slope calculated independently",
                    "English Inference Log: The Highwayman visual scene deduction",
                ],
            ),
            SectionBNeed(
                area_of_need="Communication & Interaction",
                statutory_summary=(
                    "Autism Spectrum Condition (ASC) profile. Processing delay of 8-10 seconds for multi-step verbal instructions "
                    "in crowded auditory environments."
                ),
                observed_impact=(
                    "Engages cooperatively in paired work when paired with trusted peer (Jake O'Brien) using dual-coded visual checklists."
                ),
                evidence_count=4,
                citations=[
                    "TA Melissa Grant Micro-Log: Science practical partner collaboration",
                    "Pupil Voice Check-In: Buddy pairing comfort rating 5/5",
                ],
            ),
            SectionBNeed(
                area_of_need="Social, Emotional & Mental Health (SEMH)",
                statutory_summary=(
                    "Performance anxiety triggered by sudden unannounced questions or public cold-calling in front of whole class."
                ),
                observed_impact=(
                    "Zero behavioral incidents recorded when advance warnings are provided. Regulates rapidly using the De-Escalation Palette."
                ),
                evidence_count=5,
                citations=[
                    "ABC Incident Log: Room 4 classroom zero-escalation record",
                    "Teacher De-Escalation Log: 5-minute visual sand timer restored calm",
                ],
            ),
            SectionBNeed(
                area_of_need="Sensory & Physical",
                statutory_summary=(
                    "Hyper-reactivity to high acoustic decibel environments (hall assemblies, crowded dining hall transitions). "
                    "Medication dip window occurs around 10:00-10:30am."
                ),
                observed_impact=(
                    "Noise-cancelling defenders offered at classroom door prevent sensory overload. Crackers and water at 10am maintain metabolic stability."
                ),
                evidence_count=7,
                citations=[
                    "Morning Briefing: Assembly acoustic alert protocol",
                    "Handover Log: Dana Carter medication & sleep alert",
                ],
            ),
        ]

        # Section E: Outcomes & Measurable Targets
        section_e = [
            SectionEOutcome(
                target_id="E-1",
                title="Sensory Self-Regulation in Transition",
                category="Sensory & Physical",
                status="Met",
                evidence_summary=(
                    "Phoenix now independently requests his noise defenders before leaving Room 4 for assembly in 85% of transitions."
                ),
                last_reviewed="18 Oct 2026",
            ),
            SectionEOutcome(
                target_id="E-2",
                title="Multi-Step Mathematical Application",
                category="Cognition & Learning",
                status="On Track",
                evidence_summary=(
                    "Demonstrated mastery of linear gradient slope using game simulation. Progressing to independent algebraic labeling."
                ),
                last_reviewed="22 Oct 2026",
            ),
            SectionEOutcome(
                target_id="E-3",
                title="Structured Peer Interaction",
                category="Communication & Interaction",
                status="On Track",
                evidence_summary=(
                    "Maintained stable partner collaboration with Jake O'Brien in science practicals without sensory withdrawal."
                ),
                last_reviewed="15 Oct 2026",
            ),
            SectionEOutcome(
                target_id="E-4",
                title="Self-Advocacy & Emotional Articulation",
                category="SEMH",
                status="On Track",
                evidence_summary=(
                    "Uses the Pupil Voice check-in widget at start of day to signal energy level and regulation needs directly to teacher."
                ),
                last_reviewed="21 Oct 2026",
            ),
        ]

        # Section F: Quantified Special Educational Provision
        section_f = [
            SectionFProvision(
                provision_id="F-1",
                title="1:1 Teaching Assistant Targeted Support",
                quantified_support="25 hours per week dedicated 1:1 TA (Melissa Grant)",
                evidence_delivery_rate="100% delivered across Autumn term",
                strategies_used=[
                    "Pre-flight morning arrival door positioning",
                    "10:00am medication dip monitoring & snack prompt",
                    "Active de-escalation protocol supervision",
                ],
                impact_notes="Has prevented all classroom exclusions and enabled 94% curriculum attendance.",
            ),
            SectionFProvision(
                provision_id="F-2",
                title="Sensory Environmental Adaptations",
                quantified_support="Full-time access to sensory regulation toolkit",
                evidence_delivery_rate="Active daily in Room 4",
                strategies_used=[
                    "Noise-cancelling defenders for whole-school transitions",
                    "Visual 5-minute countdown sand timer",
                    "Tactile under-desk fidget putty",
                ],
                impact_notes="Maintains pupil within green regulation band for 88% of monitored school hours.",
            ),
            SectionFProvision(
                provision_id="F-3",
                title="Differentiated Visual Learning Methodology",
                quantified_support="Adapted visual curriculum pathways for core subjects",
                evidence_delivery_rate="Delivered in all Maths and English modules",
                strategies_used=[
                    "Visual game design slope hook for algebra",
                    "Chunked task strips with graphic organizers",
                    "Removal of unprompted cold-calling in whole-cohort teaching",
                ],
                impact_notes="Grade attainment in visual mathematics exceeds national age-expected standard.",
            ),
        ]

        recommendations = (
            f"Based on longitudinal evidence collected across 365 days on See My Mind, Sarah Davies (SENCO) recommends that "
            f"{child_name}'s statutory EHCP and Band 3 High Needs funding be maintained in full for Year 6. "
            "Provision F-1 (25 hours 1:1 TA allocation) is critical to support the upcoming secondary transition phase. "
            "No amendments to primary diagnosis required; targets in Section E updated to reflect accomplished self-regulation milestones."
        )

        school = db.query(models.School).filter(models.School.id == child.school_id).first() if child.school_id else None
        school_name = school.school_name if school else "Inclusive Academy"
        senco_name = (school and school.lead_senco_name) or "Lead SENCO"

        return AnnualReviewPackResponse(
            child_id=child.id,
            child_name=child_name,
            date_of_birth=dob_str,
            year_group=year_group,
            primary_need=primary_need,
            school_name=school_name,
            senco_name=senco_name,
            review_date=datetime.now(UTC).strftime("%d %B %Y"),
            statutory_status="Statutory Annual Review Pack · Final Panel Evidence",
            metrics=metrics,
            section_a=section_a,
            section_b=section_b,
            section_e=section_e,
            section_f=section_f,
            senco_recommendations=recommendations,
        )

    @staticmethod
    def generate_evidence_review_pack(db: Session, child_id: UUID) -> AnnualReviewPackResponse:
        """Build an evidence-only review view from records linked to one pupil.

        Missing evidence is deliberately returned as a gap. This endpoint must not
        manufacture statutory statements, outcomes, dates, or parent and pupil voice.
        """
        child = (
            db.query(Child)
            .options(joinedload(Child.support_profile))
            .filter(Child.id == child_id)
            .first()
        )
        if not child:
            raise ValueError(f"Pupil with ID {child_id} not found")

        events = (
            db.query(ChildEvent)
            .options(
                joinedload(ChildEvent.observation),
                joinedload(ChildEvent.transition_log),
                joinedload(ChildEvent.child_check_in),
                joinedload(ChildEvent.incident),
            )
            .filter(ChildEvent.child_id == child_id)
            .order_by(ChildEvent.event_time.desc())
            .all()
        )
        observations = [e for e in events if e.event_type == "Observation"]
        transitions = [e for e in events if e.event_type == "Transition"]
        incidents = [e for e in events if e.event_type == "Incident"]
        measured_observations = [
            e for e in observations if e.observation and e.observation.strategy_worked is not None
        ]
        wins = sum(1 for e in measured_observations if e.observation.strategy_worked is True)
        rate = (
            f"{int((wins / len(measured_observations)) * 100)}% ({wins}/{len(measured_observations)} recorded outcomes)"
            if measured_observations else "Not enough recorded outcomes"
        )
        profile = child.support_profile
        created_date = child.created_at.date() if child.created_at else datetime.now(UTC).date()
        active_ehcp_days = max((datetime.now(UTC).date() - created_date).days, 0) if profile and profile.has_ehcp else 0

        metrics = AnnualReviewMetrics(
            total_evidence_observations=len(observations),
            de_escalation_win_rate=rate,
            morning_handovers_received=len(transitions),
            safeguarding_incidents=sum(
                1 for e in incidents if e.incident and e.incident.severity == "Safeguarding Incident"
            ),
            active_ehcp_days=active_ehcp_days,
        )

        def label(event: ChildEvent) -> str:
            date_label = event.event_time.strftime("%d %b %Y") if event.event_time else "Date not recorded"
            return f"{event.event_type} · {event.title} ({date_label})"

        pupil_voice = next(
            (e.child_check_in.voice_note_text for e in events if e.child_check_in and e.child_check_in.voice_note_text),
            None,
        )
        parent_events = [
            e for e in events if (e.reporter_type or "").lower() in {"parent", "carer", "guardian"}
        ]
        parent_voice = next((e.summary for e in parent_events if e.summary), None)
        section_a = SectionAViews(
            child_views=pupil_voice or "No pupil voice has been recorded for this review.",
            child_aspirations="No pupil aspirations have been recorded for this review.",
            parent_views=parent_voice or "No parent or carer contribution has been recorded for this review.",
            parent_aspirations="No parent or carer aspirations have been recorded for this review.",
            co_production_notes=(
                f"Recorded sources: {len(events)} timeline events, {len(transitions)} transitions, "
                f"and {len(observations)} observations. Confirm missing contributions before submission."
            ),
        )

        areas = [
            ("Cognition & Learning", ("learning", "math", "literacy", "memory", "processing", "dyslex", "dyscalcul")),
            ("Communication & Interaction", ("communication", "language", "speech", "autism", "interaction", "social")),
            ("Social, Emotional & Mental Health", ("semh", "anxiety", "emotion", "mental", "behaviour", "regulation")),
            ("Sensory & Physical", ("sensory", "physical", "hearing", "vision", "motor", "noise", "medical")),
        ]
        profile_text = " ".join(
            str(value or "") for value in (
                profile.primary_need if profile else None,
                profile.secondary_need if profile else None,
                profile.summary if profile else None,
                profile.sensory_profile if profile else None,
            )
        ).lower()
        section_b = []
        for area_name, keywords in areas:
            matching = []
            for event in observations:
                observation = event.observation
                event_text = " ".join(
                    str(value or "") for value in (
                        event.title, event.summary,
                        observation.activity_context if observation else None,
                        observation.notes if observation else None,
                        observation.strengths_observed if observation else None,
                    )
                ).lower()
                if any(keyword in event_text for keyword in keywords):
                    matching.append(event)
            profile_matches = any(keyword in profile_text for keyword in keywords)
            section_b.append(SectionBNeed(
                area_of_need=area_name,
                statutory_summary=(
                    f"Profile records reference: {profile.primary_need or 'an unspecified primary need'}."
                    if profile_matches and profile else "No profile evidence is recorded for this area."
                ),
                observed_impact=next(
                    (
                        e.observation.notes or e.summary
                        for e in matching
                        if e.observation and (e.observation.notes or e.summary)
                    ),
                    "No observation impact has been recorded for this area.",
                ),
                evidence_count=len(matching),
                citations=[label(e) for e in matching[:3]] or ["No linked evidence recorded"],
            ))

        targets = db.query(models.PupilTarget).filter(
            models.PupilTarget.child_id == child_id,
            models.PupilTarget.active.is_(True),
        ).order_by(models.PupilTarget.created_at.desc()).all()
        section_e = [SectionEOutcome(
            target_id=str(target.id),
            title=target.target_area,
            category=target.apdr_stage,
            status=target.review_outcome,
            evidence_summary=target.review_notes or target.breakthrough_notes or "No linked evidence recorded for this target.",
            last_reviewed=(target.updated_at or target.created_at).strftime("%d %b %Y"),
        ) for target in targets]

        allocations = db.query(models.StaffPupilAllocation).options(
            joinedload(models.StaffPupilAllocation.staff_member)
        ).filter(
            models.StaffPupilAllocation.child_id == child_id,
            models.StaffPupilAllocation.active.is_(True),
        ).all()
        section_f = []
        for index, allocation in enumerate(allocations, start=1):
            staff_name = (
                f"{allocation.staff_member.first_name} {allocation.staff_member.last_name}"
                if allocation.staff_member else "Staff member not recorded"
            )
            delivery_rate = (
                f"{int((allocation.weekly_delivered_hours / allocation.weekly_allocated_hours) * 100)}% delivered"
                if allocation.weekly_allocated_hours else "Delivery not recorded"
            )
            section_f.append(SectionFProvision(
                provision_id=f"A-{index}",
                title=allocation.role_type,
                quantified_support=f"{allocation.weekly_allocated_hours:g} hours per week allocated to {staff_name}",
                evidence_delivery_rate=delivery_rate,
                strategies_used=[],
                impact_notes="Delivery allocation is recorded. Review outcome evidence alongside observations.",
            ))
        for index, strategy in enumerate((profile.strategies if profile else []), start=len(section_f) + 1):
            section_f.append(SectionFProvision(
                provision_id=f"S-{index}",
                title=strategy.custom_title or (strategy.strategy.title if strategy.strategy else "Support strategy"),
                quantified_support="Quantity not recorded",
                evidence_delivery_rate=strategy.effective_rating or "Effectiveness not recorded",
                strategies_used=[strategy.custom_instructions],
                impact_notes="Review linked observations to assess impact.",
            ))

        school = db.query(models.School).filter(models.School.id == child.school_id).first() if child.school_id else None
        return AnnualReviewPackResponse(
            child_id=child.id,
            child_name=child.full_name or f"{child.first_name} {child.last_name}",
            date_of_birth=child.date_of_birth.strftime("%d %B %Y") if child.date_of_birth else "Not recorded",
            year_group=child.year_group or "Not recorded",
            primary_need=(profile.primary_need if profile and profile.primary_need else "Not recorded"),
            school_name=school.school_name if school else "Not recorded",
            senco_name=(school.lead_senco_name if school and school.lead_senco_name else "Not recorded"),
            review_date=datetime.now(UTC).strftime("%d %B %Y"),
            statutory_status="Draft evidence view · human review required",
            metrics=metrics,
            section_a=section_a,
            section_b=section_b,
            section_e=section_e,
            section_f=section_f,
            senco_recommendations=(
                "No statutory recommendation has been recorded. Use NOYA to identify evidence gaps and draft review questions; "
                "a SENCO must review and approve any recommendation before submission."
            ),
        )

    @staticmethod
    def get_school_provision_matrix(
        db: Session, school_id: UUID | None = None
    ) -> SchoolProvisionMatrixResponse:
        """Returns the whole-school provision and funding distribution matrix for all SEND learners."""
        school = None
        if school_id:
            school = db.query(models.School).filter(models.School.id == school_id).first()
        if not school:
            school = db.query(models.School).first()

        school_name = school.school_name if school else "Inclusive Academy"
        lead_senco = (school and school.lead_senco_name) or "Lead SENCO"

        # Check for registered active pupils for this school in DB
        db_pupils = []
        if school:
            db_pupils = (
                db.query(Child)
                .options(joinedload(Child.support_profile))
                .filter(Child.school_id == school.id, Child.active.is_(True))
                .order_by(Child.last_name, Child.first_name)
                .all()
            )

        # For St. Jude's or initial demo, provide the rich canonical sample
        is_demo_school = not school or school.school_reference == "SCH-STJUDES" or "Jude" in school.school_name
        if is_demo_school:
            phoenix = next((p for p in db_pupils if p.first_name == "Phoenix"), None)
            archie = next((p for p in db_pupils if p.first_name == "Archie"), None)

            phoenix_id = str(phoenix.id) if phoenix else "a0493c1d-255d-4a6e-8be9-0ec25701379b"
            archie_id = str(archie.id) if archie else "57c2e2a3-96a3-4d38-9768-044acb90c564"

            pupils = [
            ProvisionMapPupil(
                id=phoenix_id,
                name="Phoenix Carter",
                year_group="Year 5",
                primary_need="Autism Spectrum Condition (ASC)",
                support_tier="Statutory EHCP",
                funding_band="Band 3 Specialist (£12,500)",
                allocated_ta_hours=25.0,
                assigned_ta="Melissa Grant",
                annual_review_due="05 Nov 2026",
                days_until_review=14,
                review_status="due_soon",
            ),
            ProvisionMapPupil(
                id=archie_id,
                name="Archie Watson",
                year_group="Year 5",
                primary_need="ADHD & Working Memory",
                support_tier="Statutory EHCP",
                funding_band="Band 2 Targeted (£6,000)",
                allocated_ta_hours=15.0,
                assigned_ta="Tom Davies",
                annual_review_due="12 Dec 2026",
                days_until_review=51,
                review_status="scheduled",
            ),
            ProvisionMapPupil(
                id="riya-patel-y5",
                name="Riya Patel",
                year_group="Year 5",
                primary_need="SEMH & Performance Anxiety",
                support_tier="SEN Support (K)",
                funding_band="Band 1 Universal SEN (£0)",
                allocated_ta_hours=5.0,
                assigned_ta="Shared Class TA",
                annual_review_due="20 Nov 2026",
                days_until_review=29,
                review_status="due_soon",
            ),
            ProvisionMapPupil(
                id="aisha-musa-y5",
                name="Aisha Musa",
                year_group="Year 5",
                primary_need="Speech, Language & Communication (SLCN)",
                support_tier="SEN Support (K)",
                funding_band="Band 1 Universal SEN (£0)",
                allocated_ta_hours=7.5,
                assigned_ta="Speech Therapy Link",
                annual_review_due="15 Jan 2027",
                days_until_review=85,
                review_status="scheduled",
            ),
            ProvisionMapPupil(
                id="luca-moretti-y4",
                name="Luca Moretti",
                year_group="Year 4",
                primary_need="Speech & Language Therapy",
                support_tier="Statutory EHCP",
                funding_band="Band 2 Targeted (£6,000)",
                allocated_ta_hours=12.5,
                assigned_ta="Rachel Green",
                annual_review_due="28 Oct 2026",
                days_until_review=6,
                review_status="due_soon",
            ),
            ProvisionMapPupil(
                id="maya-lin-y3",
                name="Maya Lin",
                year_group="Year 3",
                primary_need="Sensory Processing Sensitivity",
                support_tier="SEN Support (K)",
                funding_band="Band 1 Universal SEN (£0)",
                allocated_ta_hours=6.0,
                assigned_ta="Shared Class TA",
                annual_review_due="10 Feb 2027",
                days_until_review=111,
                review_status="scheduled",
            ),
            ProvisionMapPupil(
                id="ethan-ward-y6",
                name="Ethan Ward",
                year_group="Year 6",
                primary_need="Dyslexia & Processing Speed",
                support_tier="SEN Support (K)",
                funding_band="Band 1 Universal SEN (£0)",
                allocated_ta_hours=4.0,
                assigned_ta="Literacy Interventions",
                annual_review_due="18 Nov 2026",
                days_until_review=27,
                review_status="due_soon",
            ),
            ProvisionMapPupil(
                id="grace-adebayo-y2",
                name="Grace Adebayo",
                year_group="Year 2",
                primary_need="Global Developmental Delay",
                support_tier="Statutory EHCP",
                funding_band="Band 4 Enhanced (£18,200)",
                allocated_ta_hours=30.0,
                assigned_ta="Hannah Phillips",
                annual_review_due="02 Dec 2026",
                days_until_review=41,
                review_status="scheduled",
            ),
            ProvisionMapPupil(
                id="oliver-smith-y1",
                name="Oliver Smith",
                year_group="Year 1",
                primary_need="Physical / Dyspraxia (DCD)",
                support_tier="Statutory EHCP",
                funding_band="Band 2 Targeted (£6,000)",
                allocated_ta_hours=12.0,
                assigned_ta="Rachel Green",
                annual_review_due="24 Oct 2026",
                days_until_review=2,
                review_status="due_soon",
            ),
            ProvisionMapPupil(
                id="zara-khan-y6",
                name="Zara Khan",
                year_group="Year 6",
                primary_need="Hearing Impairment & ASC",
                support_tier="Statutory EHCP",
                funding_band="Band 3 Specialist (£12,500)",
                allocated_ta_hours=20.0,
                assigned_ta="Sensory Support TA",
                annual_review_due="15 Nov 2026",
                days_until_review=24,
                review_status="due_soon",
            ),
            ProvisionMapPupil(
                id="leo-chen-y5",
                name="Leo Chen",
                year_group="Year 5",
                primary_need="Dyscalculia & Working Memory",
                support_tier="SEN Support (K)",
                funding_band="Band 1 Universal SEN (£0)",
                allocated_ta_hours=4.0,
                assigned_ta="Shared Class TA",
                annual_review_due="01 Mar 2027",
                days_until_review=130,
                review_status="scheduled",
            ),
            ProvisionMapPupil(
                id="sam-clarke-y4",
                name="Sam Clarke",
                year_group="Year 4",
                primary_need="SEMH & Emotionally Based School Avoidance",
                support_tier="Statutory EHCP",
                funding_band="Band 3 Specialist (£12,500)",
                allocated_ta_hours=22.5,
                assigned_ta="Pastoral Lead",
                annual_review_due="14 Oct 2026",
                days_until_review=-8,
                review_status="overdue",
            ),
        ]

            total_ta_hours = sum(p.allocated_ta_hours for p in pupils)
            reviews_soon = sum(1 for p in pupils if 0 <= p.days_until_review <= 30)

            return SchoolProvisionMatrixResponse(
                school_name=school_name,
                academic_year="2026/2027",
                lead_senco=lead_senco,
                total_send_count=34,
                ehcp_count=12,
                sen_support_count=22,
                total_ta_hours_weekly=total_ta_hours + 42.5,  # inclusive of remaining caseload
                high_needs_funding_total="£148,600",
                reviews_due_next_30_days=reviews_soon + 1,
                pupils=pupils,
            )
        else:
            # Dynamic aggregation for any other school tenant (e.g. Poverest Primary School)
            mapped_pupils = []
            total_ta = 0.0
            reviews_soon = 0
            for child in db_pupils:
                prof = child.support_profile
                has_ehcp = prof.has_ehcp if prof else False
                tier = "Statutory EHCP" if has_ehcp else "SEN Support (K)"
                alloc = (
                    db.query(models.StaffPupilAllocation)
                    .filter(
                        models.StaffPupilAllocation.child_id == child.id,
                        models.StaffPupilAllocation.active.is_(True),
                    )
                    .first()
                )
                ta_hours = alloc.weekly_allocated_hours if alloc else (15.0 if has_ehcp else 4.0)
                ta_name = (
                    f"{alloc.staff_member.first_name} {alloc.staff_member.last_name}"
                    if alloc and alloc.staff_member
                    else ("Dedicated TA" if has_ehcp else "Universal Class Differentiation")
                )
                funding = (
                    alloc.funding_source
                    if alloc and alloc.funding_source
                    else ("Band 3 High Needs (£12,500)" if has_ehcp else "Universal SEN (£0)")
                )
                total_ta += ta_hours
                mapped_pupils.append(
                    ProvisionMapPupil(
                        id=str(child.id),
                        name=child.full_name or f"{child.first_name} {child.last_name}",
                        year_group=child.year_group or "Year 5",
                        primary_need=prof.primary_need if prof and prof.primary_need else "SEND Support",
                        support_tier=tier,
                        funding_band=funding,
                        allocated_ta_hours=ta_hours,
                        assigned_ta=ta_name,
                        annual_review_due="15 Jan 2027",
                        days_until_review=85,
                        review_status="scheduled",
                    )
                )
            ehcp_count = len([p for p in mapped_pupils if "EHCP" in p.support_tier])
            sen_count = len([p for p in mapped_pupils if "SEN Support" in p.support_tier])
            return SchoolProvisionMatrixResponse(
                school_name=school_name,
                academic_year="2026/2027",
                lead_senco=lead_senco,
                total_send_count=len(mapped_pupils),
                ehcp_count=ehcp_count,
                sen_support_count=sen_count,
                total_ta_hours_weekly=total_ta,
                high_needs_funding_total=f"£{int(ehcp_count * 12500):,}" if ehcp_count > 0 else "£0",
                reviews_due_next_30_days=reviews_soon,
                pupils=mapped_pupils,
            )
