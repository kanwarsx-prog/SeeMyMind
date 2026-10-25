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
from app.schemas.ai import AskNoyaResponse, EvidenceCitation, MorningBriefingResponse


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

