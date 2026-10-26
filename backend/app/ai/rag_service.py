import time
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.ai.client import get_openai_client
from app.ai.prompts import ASK_NOYA_RAG_PROMPT, MORNING_BRIEFING_PROMPT, SYSTEM_GUARDRAIL_PROMPT
from app.core.config import settings
from app.models.ai_noya import AIInsight, AIInsightEvidence, AIRun
from app.models.pupil import Child
from app.models.timeline import ChildEvent
from app.models.auth import User
from app.ai.noya_agent_tools import TOOL_DEFINITIONS, dispatch_tool_call
from app.schemas.ai import (
    AskNoyaResponse,
    EvidenceCitation,
    MorningBriefingResponse,
    NoyaCopilotChatRequest,
    NoyaCopilotChatResponse,
)


class NoyaRAGService:
    @staticmethod
    def generate_morning_briefing(db: Session, child_id: UUID) -> MorningBriefingResponse:
        """Synthesizes recent timeline events and today's morning handover into a teacher briefing."""
        child = db.query(Child).filter(Child.id == child_id).first()
        if not child:
            raise ValueError("Child not found")

        # Fetch recent events (last 5)
        recent_events = (
            db.query(ChildEvent)
            .filter(ChildEvent.child_id == child_id)
            .order_by(ChildEvent.event_time.desc())
            .limit(5)
            .all()
        )

        timeline_lines = []
        citations: list[EvidenceCitation] = []
        for e in recent_events:
            line = f"- [{e.event_time.strftime('%Y-%m-%d %H:%M')}] {e.title}: {e.summary} (Reporter: {e.reporter_name or e.reporter_type})"
            timeline_lines.append(line)
            citations.append(
                EvidenceCitation(
                    citation_text=f"{e.title} ({e.event_time.strftime('%d %b %Y')})",
                    snippet=e.summary[:150],
                    event_id=e.id,
                )
            )

        timeline_context = (
            "\n".join(timeline_lines) if timeline_lines else "No recent events logged."
        )

        # Support profile info
        primary_need = (
            child.support_profile.primary_need if child.support_profile else "Unspecified"
        )
        triggers = (
            ", ".join([t.trigger_title for t in child.support_profile.triggers])
            if child.support_profile and child.support_profile.triggers
            else "None recorded"
        )
        strategies = (
            ", ".join([s.custom_instructions for s in child.support_profile.strategies])
            if child.support_profile and child.support_profile.strategies
            else "Standard classroom adjustments"
        )

        child_name = child.preferred_name or child.first_name
        prompt = MORNING_BRIEFING_PROMPT.format(
            system_guardrail=SYSTEM_GUARDRAIL_PROMPT,
            child_name=child_name,
            year_group=child.year_group or "Not assigned",
            primary_need=primary_need,
            triggers=triggers,
            strategies=strategies,
            timeline_context=timeline_context,
        )

        client = get_openai_client()
        start_time = time.time()

        if client:
            try:
                response = client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                )
                output_text = response.choices[0].message.content or ""
                latency_ms = int((time.time() - start_time) * 1000)
                input_tokens = response.usage.prompt_tokens if response.usage else 0
                output_tokens = response.usage.completion_tokens if response.usage else 0
            except Exception as e:
                output_text = f"**Morning Status**: {child_name} is arriving today. Recent logs note: {timeline_context}\n\n*Note: AI real-time synthesis unavailable ({e!s}).*"
                latency_ms = int((time.time() - start_time) * 1000)
                input_tokens, output_tokens = 0, 0
        else:
            # Fallback mock for local development without OpenAI API key
            output_text = (
                f"- **Arrival Status**: Latest update indicates ready for transition.\n"
                f"- **Sensory & Emotional Readiness**: Needs calm welcome. Primary need: {primary_need}.\n"
                f"- **Recommended Action**: Allow 5 minutes settling time with preferred visual schedule."
            )
            latency_ms = 10
            input_tokens, output_tokens = 50, 80

        # Clean any accidental inline timestamp brackets or raw citation blocks
        import re
        output_text = re.sub(r"`?Citations:?\s*\[[^\]]*\]`?", "", output_text, flags=re.IGNORECASE)
        output_text = re.sub(r"\s*\[\d{4}-\d{2}-\d{2}[^\]]*\]", "", output_text).strip()

        # Save audit record in AIRun
        ai_run = AIRun(
            child_id=child_id,
            requester_role="Teacher",
            prompt_type="MorningBriefing",
            model_name=settings.OPENAI_MODEL if client else "local-mock",
            input_prompt=prompt,
            output_text=output_text,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            latency_ms=latency_ms,
            status="Success",
        )
        db.add(ai_run)
        db.flush()

        # Save AIInsight
        insight = AIInsight(
            child_id=child_id,
            run_id=ai_run.id,
            insight_type="MorningBriefing",
            title=f"Morning Briefing: {child_name} ({datetime.now(UTC).strftime('%d %b %Y')})",
            content_markdown=output_text,
            confidence_level="High",
            review_status="Approved",
        )
        db.add(insight)
        db.flush()

        for c in citations:
            evidence = AIInsightEvidence(
                insight_id=insight.id,
                event_id=c.event_id,
                citation_text=c.citation_text,
                snippet=c.snippet,
            )
            db.add(evidence)

        db.commit()

        return MorningBriefingResponse(
            child_id=child_id,
            child_name=child_name,
            briefing_date=datetime.now(UTC).strftime("%Y-%m-%d"),
            summary_markdown=output_text,
            recommended_focus=[
                "Sensory check upon arrival",
                "Check visual timetable",
                "Acknowledge morning mood",
            ],
            citations=citations,
            confidence_level="High",
        )

    @staticmethod
    def get_latest_morning_briefing(db: Session, child_id: UUID) -> MorningBriefingResponse | None:
        """Retrieves the most recent cached Morning Briefing for a pupil without consuming any AI tokens."""
        child = db.query(Child).filter(Child.id == child_id).first()
        if not child:
            raise ValueError(f"Pupil with ID {child_id} not found")

        insight = (
            db.query(AIInsight)
            .filter(
                AIInsight.child_id == child_id,
                AIInsight.insight_type == "MorningBriefing",
            )
            .order_by(AIInsight.created_at.desc())
            .first()
        )
        if not insight:
            return None

        citations = [
            EvidenceCitation(
                citation_text=ev.citation_text,
                snippet=ev.snippet,
                event_id=ev.event_id,
                chunk_id=ev.chunk_id,
            )
            for ev in insight.evidence_citations
        ]

        child_name = child.preferred_name or child.first_name

        return MorningBriefingResponse(
            child_id=child_id,
            child_name=child_name,
            briefing_date=insight.created_at.strftime("%Y-%m-%d"),
            summary_markdown=insight.content_markdown,
            recommended_focus=[
                "Sensory check upon arrival",
                "Check visual timetable",
                "Acknowledge morning mood",
            ],
            citations=citations,
            confidence_level=insight.confidence_level or "High",
        )

    @staticmethod
    def ask_noya(db: Session, child_id: UUID, question: str, top_k: int = 5) -> AskNoyaResponse:
        """RAG query over child-scoped events and document chunks."""
        child = db.query(Child).filter(Child.id == child_id).first()
        if not child:
            raise ValueError("Child not found")

        child_name = child.preferred_name or child.first_name
        primary_need = (
            child.support_profile.primary_need if child.support_profile else "Unspecified"
        )

        # 1. Retrieve child events
        events = (
            db.query(ChildEvent)
            .filter(ChildEvent.child_id == child_id)
            .order_by(ChildEvent.event_time.desc())
            .limit(top_k)
            .all()
        )

        chunk_lines = []
        citations: list[EvidenceCitation] = []
        for e in events:
            chunk_lines.append(
                f"Event [{e.event_time.strftime('%Y-%m-%d')} - {e.title}]: {e.summary}"
            )
            citations.append(
                EvidenceCitation(
                    citation_text=f"{e.title} ({e.event_time.strftime('%Y-%m-%d')})",
                    snippet=e.summary[:150],
                    event_id=e.id,
                )
            )

        retrieved_context = (
            "\n".join(chunk_lines) if chunk_lines else "No event history recorded yet."
        )

        prompt = ASK_NOYA_RAG_PROMPT.format(
            system_guardrail=SYSTEM_GUARDRAIL_PROMPT,
            question=question,
            child_name=child_name,
            primary_need=primary_need,
            retrieved_chunks=retrieved_context,
        )

        client = get_openai_client()
        start_time = time.time()
        input_tokens = 0
        output_tokens = 0

        if client:
            try:
                response = client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.2,
                )
                answer = response.choices[0].message.content or ""
                latency_ms = int((time.time() - start_time) * 1000)
                model_used = settings.OPENAI_MODEL
                if response.usage:
                    input_tokens = response.usage.prompt_tokens
                    output_tokens = response.usage.completion_tokens
            except Exception as e:
                answer = f"Error generating answer: {e!s}"
                latency_ms = int((time.time() - start_time) * 1000)
                model_used = "error"
        else:
            snippet_text = (
                f'"{citations[0].snippet}"' if citations else "Baseline support profile guidance"
            )
            answer = (
                f"Based on recent records for **{child_name}** ({primary_need}):\n"
                f"- Relevant observation notes: *{snippet_text}*\n"
                f"- Consistent regulation strategies have shown positive engagement."
            )
            latency_ms = 12
            model_used = "local-mock"
            input_tokens = 60
            output_tokens = 85

        # Immutable Audit Record
        try:
            ai_run = AIRun(
                child_id=child_id,
                requester_role="SENCO",
                prompt_type="AskNOYA",
                model_name=model_used,
                input_prompt=prompt,
                output_text=answer,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                latency_ms=latency_ms,
                status="Success" if model_used != "error" else "Failed",
            )
            db.add(ai_run)
            db.commit()
        except Exception:
            db.rollback()

        return AskNoyaResponse(
            question=question,
            answer_markdown=answer,
            citations=citations,
            model_used=model_used,
            latency_ms=latency_ms,
        )


    @staticmethod
    def copilot_chat(
        db: Session,
        current_user: User,
        request: NoyaCopilotChatRequest,
    ) -> NoyaCopilotChatResponse:
        """Context-Aware Conversational Copilot powered by Approach C Agentic Tool Calling."""
        import json
        import time

        start_time = time.time()
        child = None
        child_name = "Pupil"
        primary_need = "Unspecified"
        year_group = "Unassigned"

        if request.child_id:
            child = db.query(Child).filter(Child.id == request.child_id).first()
            if child:
                # Multi-tenant school isolation check
                if current_user and current_user.school_id and child.school_id and current_user.school_id != child.school_id:
                    return NoyaCopilotChatResponse(
                        answer_markdown="Access Denied: You do not have permission to query pupils from another school.",
                        action_card=None,
                        suggested_followups=[],
                        tool_called=None,
                        model_used="security-guardrail",
                        latency_ms=1,
                    )
                child_name = child.preferred_name or child.first_name
                year_group = child.year_group or "Year 5"
                if child.support_profile and child.support_profile.primary_need:
                    primary_need = child.support_profile.primary_need

        staff_name = getattr(current_user, "full_name", "Educator")
        staff_role = getattr(current_user, "role", "Teacher")
        school_obj = getattr(current_user, "school", None)
        school_name = getattr(current_user, "school_name", None) or (school_obj.school_name if school_obj else "Inclusive Academy")

        is_classroom_view = (
            not request.child_id
            and getattr(current_user, "role", "") != "parent"
            and (
                request.active_view in ["classroom_matrix", "room4-matrix", "matrix", "classroom"]
                or getattr(current_user, "role", "") in ["teacher", "ta"]
            )
        )
        is_senco_overview = (
            not request.child_id
            and getattr(current_user, "role", "") != "parent"
            and (
                request.active_view in ["senco_overview", "provision_map", "staff_team"]
                or getattr(current_user, "role", "") == "senco"
            )
        )
        is_parent = getattr(current_user, "role", "") == "parent" or request.active_view == "parent_hub"

        # Live, school-scoped figures for classroom / SENCO views (never hardcoded)
        cohort = None
        if (is_classroom_view or is_senco_overview) and not is_parent:
            from app.services.cohort_stats_service import CohortStatsService

            user_school_id = getattr(current_user, "school_id", None)
            if is_classroom_view:
                room = CohortStatsService.resolve_room(db, user_school_id, request.room_name, request.message)
                cohort = CohortStatsService.compute(db, user_school_id, room_name=room, school_label=school_name)
            else:
                cohort = CohortStatsService.compute(db, user_school_id, school_label=school_name)

        if is_parent and child:
            system_prompt = (
                f"You are NOYA, a warm, non-clinical AI partner supporting parents on SeeMyMind.\n"
                f"Current User: {staff_name} (Parent of {child_name}).\n"
                f"Active Child: {child_name} ({year_group}, Primary Need: {primary_need}).\n"
                f"Rules: Speak in simple, reassuring, human language. Zero diagnostic or bureaucratic jargon.\n"
                f"Focus on how {child_name} settled arriving home, tonight's calming steps, strengths in class, and reassurance."
            )
        elif is_classroom_view:
            system_prompt = (
                f"You are NOYA, an advisory classroom inclusion copilot for educators on SeeMyMind.\n"
                f"Current User: {staff_name} ({staff_role}) at {school_name}.\n"
                f"Active Scope: {cohort.scope_label} ({cohort.total_pupils} pupils).\n"
                f"Rules: Summarize class sensory accommodations, TA hours, and strategy success rates across the whole cohort. "
                f"Only quote figures you have been given; never invent numbers."
            )
        elif is_senco_overview:
            system_prompt = (
                f"You are NOYA, a SENCO governance copilot on SeeMyMind.\n"
                f"Current User: {staff_name} ({staff_role}) at {school_name}.\n"
                f"Active Scope: Whole-school SEND register ({cohort.total_pupils} pupils).\n"
                f"Rules: Focus on EHCP vs SEN Support distribution, annual review dates and high-needs TA support hours. "
                f"Only quote figures you have been given; never claim compliance you cannot evidence."
            )
        else:
            system_prompt = (
                f"You are NOYA, an advisory, evidence-grounded AI copilot for educators on SeeMyMind.\n"
                f"Current User: {staff_name} ({staff_role}) at {school_name}.\n"
                f"Active Pupil: {child_name} ({year_group}, Primary Need: {primary_need}).\n"
                f"Active Screen: {request.active_view or 'Pupil Focus'}.\n\n"
                f"CRITICAL SAFETY & GOVERNANCE RULES:\n"
                f"1. You are non-diagnostic and strengths-based.\n"
                f"2. You have access to tools to query guardian contacts, parent morning handovers, de-escalation strategies, and EHCP profiles.\n"
                f"3. Use the available tools when asked for specific facts (contacts, handover status, sleep quality, calming strategies).\n"
                f"4. Keep your answer concise (2-3 sentences max). Educators need rapid, actionable information.\n"
                f"5. For contact details, indicate that the verified contact card is rendered below for one-click calling or emailing."
            )

        client = get_openai_client()
        answer = ""
        action_card = None
        tool_called = None
        citations: list[EvidenceCitation] = []
        model_used = "noya-agent"

        if client and child and not is_parent:
            try:
                # Format conversation history
                messages = [{"role": "system", "content": system_prompt}]
                for msg in request.history[-4:]:
                    messages.append({"role": msg.role, "content": msg.content})
                messages.append({"role": "user", "content": request.message})

                # Turn 1: tool selection
                first_resp = client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=messages,
                    tools=TOOL_DEFINITIONS,
                    tool_choice="auto",
                    temperature=0.2,
                )

                first_msg = first_resp.choices[0].message
                if first_msg.tool_calls:
                    t_call = first_msg.tool_calls[0]
                    tool_called = t_call.function.name
                    raw_args = json.loads(t_call.function.arguments)
                    # Force active child_id
                    raw_args["child_id"] = str(child.id)

                    tool_output = dispatch_tool_call(db, current_user, tool_called, raw_args)
                    action_card = tool_output.get("action_card")

                    # Turn 2: answer synthesis
                    messages.append(first_msg)
                    messages.append({
                        "role": "tool",
                        "tool_call_id": t_call.id,
                        "content": tool_output.get("llm_summary", "No data returned."),
                    })

                    second_resp = client.chat.completions.create(
                        model=settings.OPENAI_MODEL,
                        messages=messages,
                        temperature=0.3,
                    )
                    answer = second_resp.choices[0].message.content or ""
                else:
                    answer = first_msg.content or ""
            except Exception as e:
                # Fallback to local deterministic execution if cloud call errors
                model_used = f"local-fallback ({e!s})"

        # Fallback deterministic execution for offline/local test runs or if cloud call didn't execute
        if not answer:
            q_lower = request.message.lower()
            if is_parent and child:
                if any(k in q_lower for k in ["settle", "evening", "home", "calm down", "after school", "bedtime", "routine"]):
                    from app.services.parent_hub_service import ParentHubService
                    bridge_obj = None
                    try:
                        bridge_obj = ParentHubService.get_decompression_bridge(db=db, child_id=child.id)
                    except Exception:
                        pass
                    battery = bridge_obj.battery_percentage if bridge_obj else 92
                    first_step_text = "10-15m quiet buffer before asking about school"
                    if bridge_obj and getattr(bridge_obj, "decompression_recipe", None) and len(bridge_obj.decompression_recipe) > 0:
                        first_step_text = f"{bridge_obj.decompression_recipe[0].title}: {bridge_obj.decompression_recipe[0].description}"
                    activities_text = ", ".join(bridge_obj.recommended_evening_activities[:2]) if (bridge_obj and getattr(bridge_obj, "recommended_evening_activities", None)) else "dim lighting and preferred quiet puzzle"
                    answer = (
                        f"For {child_name}, arriving home after school is best supported with a **{first_step_text}**. "
                        f"Their estimated afternoon energy battery is at **{battery}%**. "
                        f"Tonight's recommended calming steps: {activities_text}."
                    )
                elif any(k in q_lower for k in ["morning", "handover", "seen", "teacher", "check in", "check-in", "receipt", "note"]):
                    from app.services.transition_service import TransitionService
                    handover_obj = TransitionService.get_latest_handover(db, child.id)
                    if handover_obj and handover_obj.acknowledged_by_staff:
                        time_str = handover_obj.acknowledged_at.strftime("%H:%M") if handover_obj.acknowledged_at else "08:48"
                        answer = (
                            f"Yes! {child_name}'s morning check-in was seen and acknowledged by classroom staff at **{time_str}**. "
                            f"The team noted their arrival mood (**{handover_obj.morning_mood or 'Calm'}**) and put settling adjustments in place."
                        )
                    elif handover_obj:
                        answer = (
                            f"{child_name}'s morning check-in was received by the school platform and is active in the arrival queue for teacher review. "
                            f"Logged state: Mood is **{handover_obj.morning_mood or 'Calm'}**, sleep: **{handover_obj.sleep_quality or 'Good'}**."
                        )
                    else:
                        answer = f"No morning note has been submitted for {child_name} yet today. You can tap the Morning Check-In tab to send a 20-second note to the teacher."
                elif any(k in q_lower for k in ["strength", "win", "celebrate", "proud", "well", "positive"]):
                    answer = (
                        f"{child_name} has shown fantastic strengths in classroom teamwork, creative problem-solving in STEM, and self-advocacy when overwhelmed. "
                        f"Staff frequently note their kindness and persistence."
                    )
                elif any(k in q_lower for k in ["energy", "3:15", "battery"]):
                    from app.services.parent_hub_service import ParentHubService
                    bridge_obj = None
                    try:
                        bridge_obj = ParentHubService.get_decompression_bridge(db=db, child_id=child.id)
                    except Exception:
                        pass
                    battery = bridge_obj.battery_percentage if bridge_obj else 92
                    answer = (
                        f"{child_name}'s afternoon energy battery is estimated at **{battery}%**. "
                        f"A high energy level indicates they have regulated well today, but will still benefit from a quiet 10-15m transition buffer at home."
                    )
                else:
                    answer = (
                        f"I'm here to support you and {child_name}. You can ask me how to help {child_name} settle tonight, "
                        f"check if the teacher has seen your morning note, or review today's home-time energy levels."
                    )
            elif is_classroom_view:
                stats = cohort
                label = stats.scope_label
                action_card = {
                    "type": "cohort_accommodations",
                    "title": f"{label} Cohort Accommodations",
                    "details": {
                        "cohort_size": stats.total_pupils,
                        "ehcp_count": stats.ehcp_count,
                        "sen_support_count": stats.sen_support_count,
                        "weekly_ta_hours": stats.weekly_ta_hours,
                        "calming_success_rate": stats.win_rate,
                        "top_strategies": stats.top_strategies,
                    },
                }
                if stats.total_pupils == 0:
                    answer = f"There are no active pupils recorded in {label} yet, so I have no figures to share."
                elif any(k in q_lower for k in ["sensory", "accommodat", "environment", "class", "quiet", "break"]):
                    if stats.top_strategies:
                        answer = (
                            f"{label} sensory accommodations & support ({stats.total_pupils} pupils): "
                            f"The sensory accommodations and calming strategies that have helped most often so far are: {', '.join(stats.top_strategies)}."
                        )
                    else:
                        answer = (
                            f"{label} has {stats.total_pupils} pupils with SEND support, but no sensory accommodations "
                            "or calming strategies have been recorded yet. Log a quick classroom note after a strategy and I will start tracking what helps."
                        )
                elif any(k in q_lower for k in ["ta hours", "teaching assistant", "staff allocation", "support hours"]):
                    answer = (
                        f"{label} has {stats.weekly_ta_hours:g} weekly TA hours allocated across its "
                        f"{stats.total_pupils} pupils."
                    )
                elif any(k in q_lower for k in ["win", "rate", "success", "strateg"]):
                    if stats.win_rate is None:
                        answer = f"No calming strategies have been recorded in {label} yet, so there is no success rate to report."
                    else:
                        answer = (
                            f"Calming strategies in {label} helped in {stats.win_rate:g}% of cases "
                            f"({stats.strategy_wins} of {stats.strategy_observations} recorded)."
                        )
                else:
                    answer = (
                        f"You are viewing {label}: {stats.total_pupils} pupils, {stats.ehcp_count} with an EHCP and "
                        f"{stats.sen_support_count} on SEN Support. "
                        "Ask me about sensory accommodations, weekly TA hours, or how well calming strategies are working."
                    )
            elif is_senco_overview:
                stats = cohort
                review_count = len(stats.reviews_due)
                action_card = {
                    "type": "whole_school_stats",
                    "title": f"{school_name} SEND Register Overview",
                    "details": {
                        "total_on_register": stats.total_pupils,
                        "ehcp_count": stats.ehcp_count,
                        "sen_support_count": stats.sen_support_count,
                        "annual_reviews_due": review_count,
                        "annual_reviews_overdue": len(stats.reviews_overdue),
                        "ehcp_missing_review_date": stats.ehcp_without_review_date,
                        "weekly_ta_hours": stats.weekly_ta_hours,
                    },
                }
                if stats.total_pupils == 0:
                    answer = f"There are no active pupils on the register for {school_name} yet."
                elif any(k in q_lower for k in ["distribution", "ehcp", "sen support", "register", "breakdown"]):
                    needs = f" Most common needs: {', '.join(stats.top_needs)}." if stats.top_needs else ""
                    answer = (
                        f"{school_name} has {stats.total_pupils} pupils on the register: "
                        f"{stats.ehcp_count} with an EHCP and {stats.sen_support_count} on SEN Support.{needs}"
                    )
                elif any(k in q_lower for k in ["annual", "review", "due", "schedule", "term"]):
                    parts = []
                    if stats.reviews_overdue:
                        parts.append(
                            "Overdue: " + ", ".join(f"{r.pupil_name} ({r.due:%d %b %Y})" for r in stats.reviews_overdue) + "."
                        )
                    if stats.reviews_due:
                        parts.append(
                            "Due in the next 90 days: "
                            + ", ".join(f"{r.pupil_name} ({r.due:%d %b %Y}, {r.days_until} days)" for r in stats.reviews_due)
                            + "."
                        )
                    if stats.ehcp_without_review_date:
                        parts.append(
                            f"{stats.ehcp_without_review_date} EHCP pupil(s) have no review date recorded, so I cannot check them."
                        )
                    answer = " ".join(parts) if parts else "No EHCP annual reviews are due in the next 90 days."
                elif any(k in q_lower for k in ["ta hours", "teaching assistant", "high-needs", "ta allocation", "weekly ta"]):
                    answer = (
                        f"{school_name} has {stats.weekly_ta_hours:g} weekly TA hours allocated across "
                        f"{stats.total_pupils} pupils on the register."
                    )
                else:
                    answer = (
                        f"{school_name}: {stats.total_pupils} pupils on the register "
                        f"({stats.ehcp_count} EHCP, {stats.sen_support_count} SEN Support), "
                        f"{review_count} annual review(s) due in the next 90 days. "
                        "Ask me about the register breakdown, annual review dates, or TA hours."
                    )
            elif child and any(k in q_lower for k in ["contact", "phone", "email", "mum", "dad", "parent details", "emergency", "call"]):
                t_out = dispatch_tool_call(db, current_user, "get_guardian_contacts", {"child_id": str(child.id)})
                action_card = t_out.get("action_card")
                tool_called = "get_guardian_contacts"
                answer = f"I've retrieved {child_name}'s verified emergency and guardian contact details below. You can tap to call or email directly."
            elif child and any(k in q_lower for k in ["handover", "check in", "check-in", "status", "sleep", "mood", "morning", "arrive"]):
                t_out = dispatch_tool_call(db, current_user, "get_latest_parent_handover", {"child_id": str(child.id)})
                action_card = t_out.get("action_card")
                tool_called = "get_latest_parent_handover"
                data = action_card.get("data", {}) if action_card else {}
                time_val = data.get("date_time", "Today at 08:15 AM")
                mood_val = data.get("morning_mood", "Anxious")
                sleep_val = data.get("sleep_quality", "Restless sleep (woke at 4am)")
                note_val = data.get("special_notes", "Needs a quiet start before assembly.")
                answer = (
                    f"{child_name}'s parent checked in on **{time_val}**. "
                    f"Morning status is noted as **{mood_val}** following **{sleep_val}**. "
                    f"Home note: '{note_val}'."
                )
            elif child and any(k in q_lower for k in ["calm", "de-escalat", "strateg", "meltdown", "overwhelm", "sensory"]):
                t_out = dispatch_tool_call(db, current_user, "get_proven_de_escalations", {"child_id": str(child.id)})
                action_card = t_out.get("action_card")
                tool_called = "get_proven_de_escalations"
                answer = f"Proven calming strategies for {child_name} include hands-on visual tasks (like Game Slope) and proactive 2-minute movement breaks."
            elif child and any(k in q_lower for k in ["ehcp", "section f", "trigger", "provision", "target"]):
                t_out = dispatch_tool_call(db, current_user, "get_ehcp_statutory_profile", {"child_id": str(child.id)})
                action_card = t_out.get("action_card")
                tool_called = "get_ehcp_statutory_profile"
                answer = f"{child_name} is supported under Section F statutory provisions including visual desk strip aids, 1:1 TA check-ins at morning transition, and proactive movement breaks."
            else:
                answer = (
                    f"Based on {child_name}'s profile ({primary_need}), support is tailored to their learning and sensory needs. "
                    f"Ask me about morning check-in status, emergency contacts, or proven calming strategies."
                )

        # Generate contextual suggested follow-ups
        if is_parent and child:
            suggested_followups = [
                f"How can I help {child_name} settle arriving home tonight?",
                f"Has {child_name}'s morning check-in been seen by the teacher?",
                f"What are {child_name}'s proven strengths in class?",
            ]
        elif is_classroom_view:
            scope = cohort.scope_label if cohort else "the class"
            suggested_followups = [
                f"Summarize {scope} sensory accommodations",
                f"What are the weekly TA hours across {scope}?",
                "How well are calming strategies working in our class?",
            ]
        elif is_senco_overview:
            suggested_followups = [
                "What is our whole-school EHCP vs SEN Support distribution?",
                "Which pupils have annual reviews due this term?",
                "Show total weekly high-needs TA support hours",
            ]
        elif tool_called == "get_guardian_contacts":
            suggested_followups = [
                f"When did {child_name}'s parent check in last?",
                f"What calming strategies work for {child_name}?",
            ]
        elif tool_called == "get_latest_parent_handover":
            suggested_followups = [
                f"What calming strategies work for {child_name}?",
                f"Give me {child_name}'s contact details",
            ]
        elif tool_called == "get_proven_de_escalations":
            suggested_followups = [
                f"What Section F provisions are in {child_name}'s EHCP?",
                f"When did {child_name}'s parent check in last?",
            ]
        else:
            suggested_followups = [
                f"When did {child_name}'s parent check in last?",
                f"Give me {child_name}'s contact details",
                f"What calming strategies work for {child_name}?",
            ]

        latency_ms = int((time.time() - start_time) * 1000)

        # Audit logging
        try:
            ai_run = AIRun(
                child_id=child.id if child else None,
                requester_role=staff_role,
                prompt_type="CopilotChat",
                model_name=model_used,
                input_prompt=request.message,
                output_text=answer,
                input_tokens=0,
                output_tokens=0,
                latency_ms=latency_ms,
                status="Success",
            )
            db.add(ai_run)
            db.commit()
        except Exception:
            db.rollback()

        return NoyaCopilotChatResponse(
            answer_markdown=answer,
            action_card=action_card,
            suggested_followups=suggested_followups,
            tool_called=tool_called,
            citations=citations,
            model_used=model_used,
            latency_ms=latency_ms,
        )
