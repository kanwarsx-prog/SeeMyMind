import json
import logging
import re
import time
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app import models
from app.ai.client import get_openai_client
from app.core.config import settings
from app.models.ai_noya import AIRun
from app.models.pupil import Child
from app.schemas.pathway import (
    CurriculumUnit,
    LessonPathwayResponse,
    PathwayGenerateRequest,
    PathwayStepSchema,
    PeerAdaptationSchema,
)

logger = logging.getLogger(__name__)

CURRICULUM_UNITS: list[CurriculumUnit] = [
    CurriculumUnit(
        id="maths-graphs",
        subject="Mathematics",
        year_group="Year 5",
        title="Straight Line Graphs & Gradients",
        strand="Geometry & Algebra",
        default_objective="Calculate gradient m = rise / run on a coordinate plane and observe y = mx + c.",
    ),
    CurriculumUnit(
        id="maths-fractions",
        subject="Mathematics",
        year_group="Year 5",
        title="Equivalent Fractions & Visual Bar Models",
        strand="Number & Fractions",
        default_objective="Find equivalent fractions and convert mixed numbers using concrete visual strip representations.",
    ),
    CurriculumUnit(
        id="english-highwayman",
        subject="English",
        year_group="Year 5",
        title="The Highwayman — Narrative Inference",
        strand="Reading & Comprehension",
        default_objective="Infer character motives, mood, and atmosphere from figurative language and descriptive imagery.",
    ),
    CurriculumUnit(
        id="science-circuits",
        subject="Science",
        year_group="Year 5",
        title="Electrical Circuits, Voltage & Switches",
        strand="Physics & Scientific Enquiry",
        default_objective="Investigate how component variation and switches affect electrical current in a series circuit.",
    ),
    CurriculumUnit(
        id="computing-loops",
        subject="Computing",
        year_group="Year 5",
        title="Algorithmic Loops & Game Design",
        strand="Computer Science",
        default_objective="Design game character movement loops and debug condition-triggered actions.",
    ),
    CurriculumUnit(
        id="history-saxons",
        subject="History",
        year_group="Year 5",
        title="Anglo-Saxon Settlements & Artifact Analysis",
        strand="Historical Enquiry",
        default_objective="Deduce daily life and cultural practices from archaeological evidence and physical artifacts.",
    ),
]


class PathwayService:
    @staticmethod
    def get_curriculum_units() -> list[CurriculumUnit]:
        """Returns the pre-curated National Curriculum Year 5 unit library."""
        return CURRICULUM_UNITS

    @staticmethod
    def generate_pathway(
        db: Session, request: PathwayGenerateRequest
    ) -> LessonPathwayResponse:
        """Synthesizes a bespoke 4-step learning pathway and TA briefing
        combining the teacher's lesson objective with the pupil's support profile.
        """
        child = db.query(Child).filter(Child.id == request.child_id).first()
        if not child:
            raise ValueError(f"Pupil with ID {request.child_id} not found")

        child_name = child.preferred_name or child.first_name or "Pupil"
        full_child_name = child.full_name or f"{child.first_name} {child.last_name}"

        # Support profile intelligence
        profile = child.support_profile
        primary_need = profile.primary_need if profile else "Autism Spectrum Condition (ASC)"
        triggers = (
            ", ".join([t.trigger_title for t in profile.triggers])
            if profile and profile.triggers
            else "Abstract notation overload, high-frequency acoustic environments, sudden transitions"
        )
        strategies = (
            ", ".join([s.custom_instructions for s in profile.strategies])
            if profile and profile.strategies
            else "Visual task strips, concrete-pictorial-abstract progression, 10:00 AM snack bridge, scheduled movement tokens"
        )

        objective = request.learning_objective or f"Master key concepts in {request.topic} with independent problem solving."

        # Fetch classmate peer adaptations if available
        peers = (
            db.query(Child)
            .filter(
                Child.room_name == child.room_name,
                Child.id != child.id,
                Child.active.is_(True),
            )
            .limit(3)
            .all()
        )
        peer_adaptations = PathwayService._build_peer_adaptations(peers)

        # Attempt OpenAI synthesis ONLY if explicitly requested by user (opt-in manual trigger)
        client = get_openai_client()
        if request.use_ai and client and settings.OPENAI_API_KEY:
            try:
                ai_data = PathwayService._call_openai(
                    client=client,
                    child_name=child_name,
                    full_name=full_child_name,
                    primary_need=primary_need,
                    triggers=triggers,
                    strategies=strategies,
                    subject=request.subject,
                    topic=request.topic,
                    objective=objective,
                )
                if ai_data and ai_data.get("parsed"):
                    ai_result = ai_data["parsed"]
                    # Log audit record for AI execution
                    try:
                        ai_run = AIRun(
                            child_id=child.id,
                            requester_role="Teacher",
                            prompt_type="LessonPathwayScaffolding",
                            model_name=settings.OPENAI_MODEL or "gpt-4o",
                            input_prompt=f"SYSTEM:\n{ai_data['system_prompt']}\n\nUSER:\n{ai_data['user_prompt']}",
                            output_text=ai_data["raw_response"],
                            input_tokens=ai_data["input_tokens"],
                            output_tokens=ai_data["output_tokens"],
                            latency_ms=ai_data["latency_ms"],
                            status="Success",
                        )
                        db.add(ai_run)
                        db.commit()
                    except Exception as err:
                        logger.warning("Could not persist AIRun for pathway: %s", err)
                        db.rollback()

                    return LessonPathwayResponse(
                        child_id=child.id,
                        child_name=child_name,
                        subject=request.subject,
                        topic=request.topic,
                        learning_objective=objective,
                        cognitive_rationale=ai_result.get("rationale", ""),
                        steps=[
                            PathwayStepSchema(
                                number=s["number"],
                                title=s["title"],
                                description=s["description"],
                                status="done" if s["number"] == 1 else ("active" if s["number"] == 2 else ("next" if s["number"] == 3 else "locked")),
                                badge=s.get("badge", f"Step {s['number']}"),
                                sensory_pause_after=s.get("sensory_pause_after", s["number"] == 2),
                            )
                            for s in ai_result.get("steps", [])
                        ],
                        ta_briefing=ai_result.get("ta_briefing", ""),
                        peer_adaptations=peer_adaptations,
                        generated_at=datetime.now(UTC),
                        model_used=settings.OPENAI_MODEL or "gpt-4o",
                    )
            except Exception as e:
                logger.warning("OpenAI pathway generation encountered an issue, falling back to deterministic synthesis: %s", e)

        # High-fidelity deterministic fallback / standard synthesis (0 tokens, instant)
        deterministic_res = PathwayService._generate_deterministic_pathway(
            child_id=child.id,
            child_name=child_name,
            subject=request.subject,
            topic=request.topic,
            objective=objective,
            primary_need=primary_need,
            triggers=triggers,
            peer_adaptations=peer_adaptations,
        )

        model_name = "standard-scaffold-ai-unavailable" if request.use_ai else "curriculum-standard"
        deterministic_res.model_used = model_name

        # Log zero-token audit record for transparency
        try:
            ai_run = AIRun(
                child_id=child.id,
                requester_role="Teacher",
                prompt_type="LessonPathwayScaffolding",
                model_name=model_name,
                input_prompt=f"Subject: {request.subject}\nTopic: {request.topic}\nObjective: {objective}\nPupil Primary Need: {primary_need}",
                output_text=json.dumps({
                    "cognitive_rationale": deterministic_res.cognitive_rationale,
                    "steps": [s.model_dump() for s in deterministic_res.steps],
                    "ta_briefing": deterministic_res.ta_briefing,
                }, indent=2),
                input_tokens=0,
                output_tokens=0,
                latency_ms=1,
                status="Fallback (AI unavailable)" if request.use_ai else "Success",
            )
            db.add(ai_run)
            db.commit()
        except Exception as err:
            logger.warning("Could not persist deterministic AIRun: %s", err)
            db.rollback()

        return deterministic_res

    @staticmethod
    def _call_openai(
        client,
        child_name: str,
        full_name: str,
        primary_need: str,
        triggers: str,
        strategies: str,
        subject: str,
        topic: str,
        objective: str,
    ) -> dict | None:
        """Invokes OpenAI GPT-4o with structured JSON schema for pathway generation."""
        system_prompt = (
            "You are NOYA AI, an expert UK Educational Psychologist and SEND Pedagogy Specialist. "
            "You adapt National Curriculum lesson plans for neurodivergent learners following the SEND Code of Practice (CoP 6.44-6.56) "
            "and EEF High Quality Teaching principles. "
            "Do NOT alter or dumb down the core learning objective. Instead, construct a 4-step progressive cognitive access ladder "
            "(e.g., Concrete/Real-World Hook -> Visual Model/Pictorial Representation -> Concept Naming -> Abstract Formalization). "
            "Return ONLY valid JSON matching this exact structure:\n"
            "{\n"
            '  "rationale": "Clear pedagogical reasoning referencing the pupil\'s neurotype and why this route prevents cognitive shutdown.",\n'
            '  "steps": [\n'
            '    {"number": 1, "title": "1. Real-World Physical Hook", "description": "Engaging context before theory", "badge": "Visual Hook", "sensory_pause_after": false},\n'
            '    {"number": 2, "title": "2. Pictorial / Visual Model", "description": "Spatial drawing without abstract notation", "badge": "Active Task", "sensory_pause_after": true},\n'
            '    {"number": 3, "title": "3. Pattern Identification & Naming", "description": "Labelling the concept with mathematical/literary terms", "badge": "Concept Naming", "sensory_pause_after": false},\n'
            '    {"number": 4, "title": "4. Formal Abstraction & Independent Mastery", "description": "Formal equations, rules, and synthesis", "badge": "Independent Mastery", "sensory_pause_after": false}\n'
            "  ],\n"
            '  "ta_briefing": "Concise 60-second scaffolding guidance and scheduled sensory token instructions for the 1:1 Teaching Assistant."\n'
            "}"
        )

        user_prompt = (
            f"Pupil: {full_name} ({child_name})\n"
            f"Primary Need: {primary_need}\n"
            f"Known Triggers: {triggers}\n"
            f"Scaffolding Strategies: {strategies}\n"
            f"Subject: {subject}\n"
            f"Lesson Topic: {topic}\n"
            f"Core Learning Objective: {objective}\n\n"
            f"Generate the adapted 4-step pathway and 1:1 TA briefing."
        )

        start_time = time.time()
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL or "gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=1000,
        )
        latency_ms = int((time.time() - start_time) * 1000)

        content = response.choices[0].message.content
        input_tokens = response.usage.prompt_tokens if response.usage else 0
        output_tokens = response.usage.completion_tokens if response.usage else 0

        parsed = json.loads(content) if content else None
        return {
            "parsed": parsed,
            "system_prompt": system_prompt,
            "user_prompt": user_prompt,
            "raw_response": content or "",
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "latency_ms": latency_ms,
        }

    @staticmethod
    def _generate_deterministic_pathway(
        child_id: UUID,
        child_name: str,
        subject: str,
        topic: str,
        objective: str,
        primary_need: str,
        triggers: str,
        peer_adaptations: list[PeerAdaptationSchema],
    ) -> LessonPathwayResponse:
        """Deterministic, battle-tested pedagogical synthesis when external AI is unavailable."""
        topic_lower = topic.lower()

        # Match maths graphs strictly as whole words (avoiding collisions with geography, biography, etc.)
        is_maths_graph = bool(
            re.search(r"\b(gradient|gradients|slope|slopes|coordinate|coordinates)\b", topic_lower)
            or (
                re.search(r"\bgraphs?\b", topic_lower)
                and not re.search(r"\b(geography|biography|photography|autobiography|paragraph)\b", topic_lower)
            )
        )

        if is_maths_graph:
            rationale = (
                f"{child_name} is a strong visual-spatial thinker who excels when concepts have tangible geometry. "
                f"Abstract formulas like y = mx + c trigger notation anxiety and cognitive shutdown. "
                f"Framing the slope as 'how fast a game character climbs a hill' anchors the concept in lived intuition. Draw first, equation second."
            )
            steps = [
                PathwayStepSchema(
                    number=1,
                    title="1. Real-world hook — the game level slope",
                    description='"A game character moves up a slope. How steep is it?" Draw on paper first.',
                    status="done",
                    badge="✓ Completed",
                    sensory_pause_after=False,
                ),
                PathwayStepSchema(
                    number=2,
                    title="2. Draw it — plot the slope visually",
                    description="Plot coordinates on visual grid. No algebra equation yet. Feel the slope geometry.",
                    status="active",
                    badge="→ In progress now",
                    sensory_pause_after=True,
                ),
                PathwayStepSchema(
                    number=3,
                    title="3. Name the pattern — rise ÷ run",
                    description="Label the triangle. Rise = how high (6). Run = how far (2). Gradient = 6 ÷ 2 = 3.",
                    status="next",
                    badge="Up next",
                    sensory_pause_after=False,
                ),
                PathwayStepSchema(
                    number=4,
                    title="4. The equation emerges — y = mx + c",
                    description="Only once gradient is felt intuitively. Algebra labels what he already understands.",
                    status="locked",
                    badge="Unlocks after step 3",
                    sensory_pause_after=False,
                ),
            ]
            ta_briefing = (
                f"Scaffolding Rule for 1:1 TA: Do NOT introduce the algebraic formula y = mx + c until Step 3 is verified. "
                f"Offer the scheduled proactive sensory reset token at Step 2 after coordinate plotting."
            )
        elif any(w in topic_lower for w in ["geography", "rainforest", "rain forest", "ecosystem", "habitat", "biome", "climate", "volcano", "river"]):
            rationale = (
                f"{child_name} excels when complex natural systems are grounded in tangible sensory environments. "
                f"Abstract environmental jargon triggers working memory overload. "
                f"Structuring {topic} into physical, dual-coded visual layers with concrete artifact sorting makes geographic concepts intuitive."
            )
            steps = [
                PathwayStepSchema(
                    number=1,
                    title=f"1. Sensory landscape immersion — {topic}",
                    description=f"Explore high-resolution visual cross-sections and real-world audio cues of {topic}.",
                    status="done",
                    badge="✓ Completed",
                    sensory_pause_after=False,
                ),
                PathwayStepSchema(
                    number=2,
                    title="2. Layer-by-layer organism & feature mapping",
                    description=f"Map physical components and wildlife tokens onto the dual-coded {topic} vertical diagram.",
                    status="active",
                    badge="→ In progress now",
                    sensory_pause_after=True,
                ),
                PathwayStepSchema(
                    number=3,
                    title="3. Interdependence & adaptation bridge",
                    description="Connect survival traits and physical processes to environmental conditions with structured cue cards.",
                    status="next",
                    badge="Up next",
                    sensory_pause_after=False,
                ),
                PathwayStepSchema(
                    number=4,
                    title="4. Synthesis & human impact analysis",
                    description=f"Evaluate environmental balance and conservation using a 3-stage cause-and-effect scaffold.",
                    status="locked",
                    badge="Unlocks after step 3",
                    sensory_pause_after=False,
                ),
            ]
            ta_briefing = (
                f"TA Protocol for {child_name}: Provide physical visual diagram on desk. "
                f"Administer scheduled 2-minute sensory/movement pause after Step 2. Keep text density low."
            )
        elif "fraction" in topic_lower:
            rationale = (
                f"{child_name} processes numerical magnitude through concrete area models. "
                f"Symbolic fraction notation can cause dyscalculia-like disorientation without visual partitioning. "
                f"Bar models and dual-coded strips provide immediate tactile and visual equivalence validation."
            )
            steps = [
                PathwayStepSchema(
                    number=1,
                    title="1. Concrete strip partitioning",
                    description="Fold paper strips into 4 equal segments to physically experience denominators.",
                    status="done",
                    badge="✓ Completed",
                    sensory_pause_after=False,
                ),
                PathwayStepSchema(
                    number=2,
                    title="2. Interactive visual bar model",
                    description="Shade 3/4 on the digital dual-coded fraction bar and compare alongside 6/8.",
                    status="active",
                    badge="→ In progress now",
                    sensory_pause_after=True,
                ),
                PathwayStepSchema(
                    number=3,
                    title="3. Multiplier bridge identification",
                    description="Discover the multiplier rule: multiply top and bottom by 2 (3×2=6, 4×2=8).",
                    status="next",
                    badge="Up next",
                    sensory_pause_after=False,
                ),
                PathwayStepSchema(
                    number=4,
                    title="4. Mixed numbers & problem solving",
                    description="Convert improper fractions into mixed numbers with zero visual overload.",
                    status="locked",
                    badge="Unlocks after step 3",
                    sensory_pause_after=False,
                ),
            ]
            ta_briefing = (
                f"TA Protocol: Keep fraction bars physically aligned on desk. "
                f"Reinforce verbal script: 'Equal parts of the same whole'. Trigger movement pause after Step 2."
            )
        elif "highwayman" in topic_lower or "english" in subject.lower() or "infer" in topic_lower:
            rationale = (
                f"{child_name} experiences cognitive overload with dense literary texts but excels at visual scene deduction. "
                f"Pre-teaching vocabulary and breaking figurative imagery into dual-coded scenes eliminates anxiety."
            )
            steps = [
                PathwayStepSchema(
                    number=1,
                    title="1. Atmosphere scene illustration",
                    description="Examine the 'ghostly galleon tossed upon cloudy seas' illustration to decode mood.",
                    status="done",
                    badge="✓ Completed",
                    sensory_pause_after=False,
                ),
                PathwayStepSchema(
                    number=2,
                    title="2. Sensory cue mapping",
                    description="Highlight auditory metaphors ('clatter and clash') using color-coded highlighters.",
                    status="active",
                    badge="→ In progress now",
                    sensory_pause_after=True,
                ),
                PathwayStepSchema(
                    number=3,
                    title="3. Character motive deduction",
                    description="Complete 2-sentence inference frame: 'The highwayman came because...'.",
                    status="next",
                    badge="Up next",
                    sensory_pause_after=False,
                ),
                PathwayStepSchema(
                    number=4,
                    title="4. Analytical paragraph synthesis",
                    description="Synthesize evidence with PEEL scaffold strip for independent writing.",
                    status="locked",
                    badge="Unlocks after step 3",
                    sensory_pause_after=False,
                ),
            ]
            ta_briefing = (
                f"TA Protocol: Pre-teach words 'galleon', 'moor', and 'rapier' before reading aloud. "
                f"Allow non-verbal card selections for mood if speech anxiety rises."
            )
        else:
            # Universal 4-step scaffold for any generic subject
            rationale = (
                f"Targeted adaptation for {child_name} ({primary_need}): "
                f"Reduces cognitive friction by sequencing from concrete real-world anchors to structured abstraction. "
                f"Mitigates {triggers} with scheduled micro-breaks and visual-spatial task chunking."
            )
            steps = [
                PathwayStepSchema(
                    number=1,
                    title=f"1. Real-world context hook — {topic}",
                    description=f"Anchor {topic} in practical everyday experience before introducing formal terminology.",
                    status="done",
                    badge="✓ Completed",
                    sensory_pause_after=False,
                ),
                PathwayStepSchema(
                    number=2,
                    title=f"2. Visual model & dual-coded organizer",
                    description=f"Represent key relationships in {topic} with diagrams and color-coded components.",
                    status="active",
                    badge="→ In progress now",
                    sensory_pause_after=True,
                ),
                PathwayStepSchema(
                    number=3,
                    title="3. Guided practice & concept naming",
                    description="Name core terminology with guided TA scaffolding and partner checks.",
                    status="next",
                    badge="Up next",
                    sensory_pause_after=False,
                ),
                PathwayStepSchema(
                    number=4,
                    title="4. Independent mastery & challenge",
                    description=f"Apply {objective} independently with scaffolded checklist verification.",
                    status="locked",
                    badge="Unlocks after step 3",
                    sensory_pause_after=False,
                ),
            ]
            ta_briefing = (
                f"TA Protocol: Verify Step 1 understanding with check-in. "
                f"Administer scheduled 2-minute regulation token after Step 2. Keep text density low."
            )

        return LessonPathwayResponse(
            child_id=child_id,
            child_name=child_name,
            subject=subject,
            topic=topic,
            learning_objective=objective,
            cognitive_rationale=rationale,
            steps=steps,
            ta_briefing=ta_briefing,
            peer_adaptations=peer_adaptations,
            generated_at=datetime.now(UTC),
            model_used="noya-heuristic-engine",
        )

    @staticmethod
    def _build_peer_adaptations(peers: list[Child]) -> list[PeerAdaptationSchema]:
        """Constructs peer adaptations for classmates in Room 4 cohort."""
        color_palette = [
            "bg-purple-50 text-purple-800 border border-purple-200",
            "bg-rose-50 text-rose-800 border border-rose-200",
            "bg-amber-50 text-amber-900 border border-amber-200",
            "bg-emerald-50 text-emerald-800 border border-emerald-200",
        ]

        default_peers = [
            PeerAdaptationSchema(
                initials="AW",
                name="Archie Watson — Dyslexia & Processing",
                need="Auditory step-by-step verbal walkthrough · minimal visual clutter",
                route="Verbal instruction strip",
                method="Auditory",
                color=color_palette[0],
            ),
            PeerAdaptationSchema(
                initials="RP",
                name="Riya Patel — ADHD & Anxiety",
                need="Short 10-minute chunked tasks with scheduled movement break at step 2",
                route="Kinesthetic chunking",
                method="Kinesthetic",
                color=color_palette[1],
            ),
            PeerAdaptationSchema(
                initials="AM",
                name="Aisha Musa — Autism & Selective Mutism",
                need="Written prompt cards only · non-verbal partner pairing with Jake O'Brien",
                route="Written & partner work",
                method="Written",
                color=color_palette[2],
            ),
        ]

        if not peers:
            return default_peers

        results: list[PeerAdaptationSchema] = []
        for idx, p in enumerate(peers[:3]):
            init = (p.first_name[0] if p.first_name else "") + (p.last_name[0] if p.last_name else "")
            name_str = f"{p.full_name or p.first_name} — {p.support_profile.primary_need if p.support_profile else 'SEND Support'}"
            route = "Visual task strip"
            method = "Visual"
            need_desc = "Targeted classroom differentiation"
            if "adhd" in name_str.lower():
                route = "Kinesthetic chunking"
                method = "Kinesthetic"
                need_desc = "Short 10-minute intervals with scheduled movement breaks"
            elif "dyslexia" in name_str.lower() or "speech" in name_str.lower():
                route = "Auditory instruction strip"
                method = "Auditory"
                need_desc = "Auditory step-by-step verbal guidance with reduced reading density"
            elif "autism" in name_str.lower() or "asc" in name_str.lower():
                route = "Dual-coded visual organizer"
                method = "Written"
                need_desc = "Low-stimulus task cards with non-verbal partner check-ins"

            results.append(
                PeerAdaptationSchema(
                    initials=init or f"P{idx+1}",
                    name=name_str,
                    need=need_desc,
                    route=route,
                    method=method,
                    color=color_palette[idx % len(color_palette)],
                )
            )

        return results or default_peers
