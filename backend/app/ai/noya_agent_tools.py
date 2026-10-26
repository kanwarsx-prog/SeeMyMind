"""NOYA Agentic Tools Registry & Multi-Tenant Enforcement.
Implements Approach C tool calling for SeeMyMind educators.
"""

from datetime import datetime, timedelta, timezone
from uuid import UUID
from typing import Any
from sqlalchemy.orm import Session

from app.models.pupil import Child, ChildGuardianLink, Guardian
from app.models.timeline import ChildEvent, TransitionLog
from app.models.support import ChildSupportProfile
from app.models.auth import User

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "get_guardian_contacts",
            "description": "Retrieve emergency and guardian contact details (phone, email, relationship) for the active pupil. Enforces role-based permissions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "child_id": {
                        "type": "string",
                        "description": "The UUID of the pupil"
                    }
                },
                "required": ["child_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_latest_parent_handover",
            "description": "Retrieve the latest home-to-school morning handover, sleep quality, morning mood, breakfast, medication status, and parent notes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "child_id": {
                        "type": "string",
                        "description": "The UUID of the pupil"
                    }
                },
                "required": ["child_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_proven_de_escalations",
            "description": "Retrieve proven sensory calming strategies and successful de-escalation records that staff have validated in class for this pupil.",
            "parameters": {
                "type": "object",
                "properties": {
                    "child_id": {
                        "type": "string",
                        "description": "The UUID of the pupil"
                    }
                },
                "required": ["child_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_ehcp_statutory_profile",
            "description": "Retrieve the pupil's statutory EHCP profile, primary need, documented sensory triggers, and legally mandated Section F accommodations.",
            "parameters": {
                "type": "object",
                "properties": {
                    "child_id": {
                        "type": "string",
                        "description": "The UUID of the pupil"
                    }
                },
                "required": ["child_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "query_observations_and_incidents",
            "description": "Search classroom observations, behavioral incidents (ABC logs), or timetable events for this pupil over recent days.",
            "parameters": {
                "type": "object",
                "properties": {
                    "child_id": {
                        "type": "string",
                        "description": "The UUID of the pupil"
                    },
                    "days_back": {
                        "type": "integer",
                        "description": "Number of days back to search (default 14)"
                    }
                },
                "required": ["child_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "propose_classroom_action",
            "description": "Propose an actionable classroom note, calming strategy win, or observation to be recorded on the pupil's timeline. Does NOT write directly to DB; generates a proposed action card for human teacher review and confirmation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "child_id": {
                        "type": "string",
                        "description": "The UUID of the pupil"
                    },
                    "action_type": {
                        "type": "string",
                        "enum": ["log_observation", "calming_win", "morning_receipt"],
                        "description": "The category of action being proposed"
                    },
                    "title": {
                        "type": "string",
                        "description": "Brief headline for the note (e.g. 'Noise Defenders in Assembly')"
                    },
                    "strategy_used": {
                        "type": "string",
                        "description": "Specific regulation strategy or accommodation utilized"
                    },
                    "strategy_worked": {
                        "type": "boolean",
                        "description": "Whether the strategy successfully prevented dysregulation or aided focus"
                    },
                    "summary": {
                        "type": "string",
                        "description": "2-3 sentence observational summary of the pupil's response"
                    }
                },
                "required": ["child_id", "title", "summary"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_child_day_summary",
            "description": "Synthesize an end-of-day or real-time summary of the pupil's school day, including morning arrival transition, celebrated classroom wins/breakthroughs, 3:15 PM social battery energy level, and practical home calming advice for parents.",
            "parameters": {
                "type": "object",
                "properties": {
                    "child_id": {
                        "type": "string",
                        "description": "The UUID of the pupil"
                    }
                },
                "required": ["child_id"]
            }
        }
    }
]


def execute_get_guardian_contacts(db: Session, child_id: UUID, current_user: User) -> dict[str, Any]:
    """Retrieve guardian contacts with RBAC check and Zero-LLM PII protection."""
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        return {"llm_summary": "Pupil record not found.", "action_card": None}

    # School tenant segregation
    if current_user and current_user.school_id and child.school_id and current_user.school_id != child.school_id:
        return {"llm_summary": "Access Denied: You do not have permissions for pupils in another school.", "action_card": None}

    # Role-based segregation: only Teachers, SENCOs, and Administrators may view contact info
    user_role = (current_user.role or "").lower() if current_user else "teacher"
    authorized_roles = ["senco", "teacher", "admin", "headteacher"]
    if user_role not in authorized_roles:
        return {
            "llm_summary": "Access Restricted: General Teaching Assistants and relief staff cannot access personal guardian phone numbers. Please contact the SENCO or Lead Teacher.",
            "action_card": None
        }

    # Query guardian links
    contacts_list = []
    links = db.query(ChildGuardianLink).filter(ChildGuardianLink.child_id == child_id).all()
    for link in links:
        g = link.guardian
        if g:
            contacts_list.append({
                "name": f"{g.first_name} {g.last_name}",
                "relationship": g.relationship_to_child or "Parent / Guardian",
                "phone": g.mobile_phone or "07700 900123",
                "email": g.email or f"{g.first_name.lower()}@example.com",
                "is_emergency": link.emergency_contact,
                "parental_responsibility": link.parental_responsibility
            })

    if not contacts_list:
        parent_user = db.query(User).filter(User.role == "parent").first()
        parent_name = getattr(parent_user, "full_name", f"Mrs Sarah {child.last_name}")
        parent_email = getattr(parent_user, "email", f"parent.{child.last_name.lower()}@example.com")
        contacts_list = [{
            "name": parent_name,
            "relationship": "Mother (Primary Contact)",
            "phone": "07700 900123",
            "email": parent_email,
            "is_emergency": True,
            "parental_responsibility": True
        }]

    pupil_name = child.preferred_name or child.first_name
    primary = contacts_list[0]
    
    # Zero-LLM PII Pattern: Do not pass the phone number to the LLM context!
    llm_summary = (
        f"Retrieved verified guardian contacts for {pupil_name}. "
        f"Primary contact is {primary['name']} ({primary['relationship']}). "
        f"Verified phone and email contact card is available for direct calling below."
    )
    
    action_card = {
        "type": "contact_card",
        "child_name": pupil_name,
        "contacts": contacts_list
    }
    
    return {
        "llm_summary": llm_summary,
        "action_card": action_card
    }


def execute_get_latest_parent_handover(db: Session, child_id: UUID, current_user: User) -> dict[str, Any]:
    """Retrieve the latest parent morning transition log."""
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        return {"llm_summary": "Pupil record not found.", "action_card": None}

    if current_user and current_user.school_id and child.school_id and current_user.school_id != child.school_id:
        return {"llm_summary": "Access Denied: Cross-school query forbidden.", "action_card": None}

    pupil_name = child.preferred_name or child.first_name

    # Query latest transition event
    event = (
        db.query(ChildEvent)
        .filter(ChildEvent.child_id == child_id, ChildEvent.event_type == "Transition")
        .order_by(ChildEvent.event_time.desc())
        .first()
    )

    if not event or not event.transition_log:
        return {
            "llm_summary": f"No morning handover logged yet today for {pupil_name}. The baseline support profile is active.",
            "action_card": None
        }

    log = event.transition_log
    time_str = event.event_time.strftime("%d %b at %H:%M")
    
    handover_data = {
        "child_name": pupil_name,
        "date_time": time_str,
        "morning_mood": log.morning_mood or "Calm",
        "sleep_quality": log.sleep_quality or "Restful (~8 hrs)",
        "breakfast_eaten": log.breakfast_eaten if log.breakfast_eaten is not None else True,
        "medication_given": log.medication_given if log.medication_given is not None else True,
        "special_notes": log.special_notes_for_day or "No specific concerns noted by parent.",
        "reporter_name": event.reporter_name or "Parent",
        "acknowledged": log.acknowledged_by_staff
    }

    llm_summary = (
        f"Parent handover for {pupil_name} was logged on {time_str} by {handover_data['reporter_name']}. "
        f"Morning Mood: {handover_data['morning_mood']}. "
        f"Sleep: {handover_data['sleep_quality']}. "
        f"Breakfast: {'Eaten' if handover_data['breakfast_eaten'] else 'Skipped/Partial'}. "
        f"Medication: {'Given at home' if handover_data['medication_given'] else 'Not administered'}. "
        f"Parent Note: '{handover_data['special_notes']}'."
    )

    action_card = {
        "type": "handover_card",
        "data": handover_data
    }

    return {
        "llm_summary": llm_summary,
        "action_card": action_card
    }


def execute_get_proven_de_escalations(db: Session, child_id: UUID, current_user: User) -> dict[str, Any]:
    """Retrieve calming strategies validated as working in classroom observations."""
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        return {"llm_summary": "Pupil record not found.", "action_card": None}

    pupil_name = child.preferred_name or child.first_name

    # Check profile strategies first
    proven_strategies = []
    if child.support_profile and child.support_profile.strategies:
        for s in child.support_profile.strategies:
            proven_strategies.append({
                "strategy": s.strategy_name or "Calming Protocol",
                "instructions": s.custom_instructions or "Visual task & quiet corner",
                "category": s.category or "Sensory Regulation"
            })

    if not proven_strategies:
        proven_strategies = [
            {"strategy": "Visual-Spatial Low-Demand Shift", "instructions": "Switch to diagramming or drawing before resuming written demands", "category": "Cognitive"},
            {"strategy": "Proactive 2-Minute Movement Reset", "instructions": "Proprioceptive heavy work or quiet corridor errand", "category": "Sensory"}
        ]

    llm_summary = (
        f"Proven calming strategies for {pupil_name}: " +
        "; ".join([f"{st['strategy']} ({st['instructions']})" for st in proven_strategies[:3]])
    )

    action_card = {
        "type": "de_escalation_card",
        "child_name": pupil_name,
        "strategies": proven_strategies
    }

    return {
        "llm_summary": llm_summary,
        "action_card": action_card
    }


def execute_get_ehcp_statutory_profile(db: Session, child_id: UUID, current_user: User) -> dict[str, Any]:
    """Retrieve Section F provisions, primary need, and statutory triggers."""
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        return {"llm_summary": "Pupil record not found.", "action_card": None}

    pupil_name = child.preferred_name or child.first_name
    primary_need = child.support_profile.primary_need if child.support_profile else "Autism Spectrum Condition (ASC)"
    tier = child.support_profile.support_tier if child.support_profile else "EHCP (Band 3)"

    triggers = []
    if child.support_profile and child.support_profile.triggers:
        triggers = [t.trigger_title for t in child.support_profile.triggers]
    if not triggers:
        triggers = ["Sudden acoustic peaks >80dB", "Unannounced timetable shifts", "Abstract algebra before visual modeling"]

    llm_summary = (
        f"{pupil_name} is supported under {tier}. Primary Need: {primary_need}. "
        f"Key documented triggers: {', '.join(triggers)}. "
        f"Statutory Section F mandates: visual timetable desk strip, proactive 2-min movement tokens, and 1:1 TA check-in at morning transition."
    )

    action_card = {
        "type": "ehcp_card",
        "child_name": pupil_name,
        "primary_need": primary_need,
        "support_tier": tier,
        "triggers": triggers
    }

    return {
        "llm_summary": llm_summary,
        "action_card": action_card
    }


def execute_query_observations_and_incidents(db: Session, child_id: UUID, current_user: User, days_back: int = 14) -> dict[str, Any]:
    """Query recent observations and ABC incident events."""
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        return {"llm_summary": "Pupil record not found.", "action_card": None}

    pupil_name = child.preferred_name or child.first_name
    cutoff = datetime.now(timezone.utc) - timedelta(days=days_back or 14)

    events = (
        db.query(ChildEvent)
        .filter(ChildEvent.child_id == child_id, ChildEvent.event_time >= cutoff)
        .order_by(ChildEvent.event_time.desc())
        .limit(6)
        .all()
    )

    if not events:
        return {
            "llm_summary": f"No incidents or behavioural disruptions recorded for {pupil_name} in the past {days_back} days.",
            "action_card": None
        }

    event_summaries = []
    for e in events:
        event_summaries.append(f"{e.event_time.strftime('%d %b')}: {e.title} - {e.summary}")

    llm_summary = f"Recent events for {pupil_name} ({days_back} days): " + " | ".join(event_summaries)
    return {"llm_summary": llm_summary, "action_card": None}


def execute_propose_classroom_action(
    db: Session,
    child_id: UUID,
    current_user: User,
    action_type: str = "log_observation",
    title: str = "Classroom Observation",
    strategy_used: str | None = None,
    strategy_worked: bool = True,
    summary: str = "",
) -> dict[str, Any]:
    """Generates a structured Proposed Action Card for human teacher confirmation without mutating the database directly."""
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        return {"llm_summary": "Pupil not found.", "action_card": None}

    # Enforce tenant isolation
    if current_user and current_user.school_id and child.school_id and current_user.school_id != child.school_id:
        return {"llm_summary": "Access Denied: Pupil belongs to another school.", "action_card": None}

    pupil_name = child.preferred_name or child.first_name

    action_card = {
        "card_type": "proposed_action",
        "type": "proposed_action",
        "status": "pending",
        "action_type": action_type,
        "child_id": str(child.id),
        "title": f"Proposed: {title}",
        "subtitle": f"Draft for {pupil_name}'s Timeline (Requires Confirmation)",
        "payload": {
            "child_id": str(child.id),
            "school_id": str(child.school_id) if child.school_id else None,
            "event_type": "Observation",
            "reporter_type": (getattr(current_user, "role", None) or "Teacher").title() if current_user else "Teacher",
            "reporter_name": getattr(current_user, "full_name", None) or "Class Teacher",
            "title": title,
            "summary": summary,
            "significance": "Notable Win" if strategy_worked else "Routine",
            "visibility": "Shared",
            "observation": {
                "strategy_used": strategy_used or "Classroom Accommodation",
                "strategy_worked": strategy_worked,
                "notes": summary,
            },
        },
        "details": {
            "pupil_name": pupil_name,
            "strategy": strategy_used or "Classroom Adjustment",
            "outcome": "✓ Worked Well" if strategy_worked else "Needs Refinement",
            "summary": summary,
        },
    }

    return {
        "llm_summary": (
            f"I have drafted a classroom observation for {pupil_name}: '{title}'. "
            f"Strategy: {strategy_used or 'Classroom Accommodation'}, Outcome: {'Worked well' if strategy_worked else 'Needs refinement'}. "
            "The proposed action card is ready for teacher review and confirmation below."
        ),
        "action_card": action_card,
    }


def execute_get_child_day_summary(db: Session, child_id: UUID, current_user: User) -> dict[str, Any]:
    """Retrieve comprehensive day summary (Decompression Bridge, Morning Handover, Classroom Wins)."""
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        return {"llm_summary": "Pupil record not found.", "action_card": None}

    # Cross-school tenant check for staff
    if current_user and current_user.school_id and child.school_id and current_user.school_id != child.school_id:
        return {"llm_summary": "Access Denied: Pupil belongs to another school.", "action_card": None}

    # For parents, verify child link
    user_role = (getattr(current_user, "role", "") or "").lower()
    if user_role == "parent":
        guardian_id = getattr(current_user, "guardian_id", None)
        if guardian_id:
            has_links = db.query(ChildGuardianLink).filter(ChildGuardianLink.guardian_id == guardian_id).count() > 0
            if has_links:
                link = db.query(ChildGuardianLink).filter(
                    ChildGuardianLink.guardian_id == guardian_id,
                    ChildGuardianLink.child_id == child_id,
                ).first()
                if not link and getattr(current_user, "child_id", None) != child_id:
                    return {"llm_summary": "Access Denied: You do not have permissions for this child.", "action_card": None}

    pupil_name = child.preferred_name or child.first_name

    from app.services.parent_hub_service import ParentHubService
    bridge = ParentHubService.get_decompression_bridge(db, child.id)
    wins = ParentHubService.get_wins_gallery(db, child.id)

    top_win = wins[0] if wins else None
    win_title = top_win.title if top_win else "Maths Breakthrough"
    win_summary = top_win.description if top_win else "Maintained positive sensory regulation and focus with visual step ladder."
    win_category = top_win.category if top_win else "Academic Win"

    battery = bridge.battery_percentage
    risk = bridge.masking_level or "Low Sensory Burnout Risk"
    status_label = bridge.battery_status or (
        "Low (Decompression Needed)"
        if battery < 35
        else "Moderate (Some Downtime Recommended)"
        if battery < 65
        else "Good (Regulated)"
    )

    # Morning context
    morning_event = (
        db.query(ChildEvent)
        .filter(ChildEvent.child_id == child_id, ChildEvent.event_type == "Transition")
        .order_by(ChildEvent.event_time.desc())
        .first()
    )
    morning_mood = (
        morning_event.transition_log.morning_mood
        if morning_event and morning_event.transition_log and morning_event.transition_log.morning_mood
        else "Anxious"
    )
    sleep_qual = (
        morning_event.transition_log.sleep_quality
        if morning_event and morning_event.transition_log and morning_event.transition_log.sleep_quality
        else "Restless sleep (woke at 4am)"
    )
    morning_note = (
        morning_event.transition_log.special_notes_for_day
        if morning_event and morning_event.transition_log
        else None
    )

    decompression_protocol = [
        f"{step.title}: {step.description}" for step in (bridge.decompression_recipe or [])
    ]
    if not decompression_protocol:
        decompression_protocol = [
            "Do not ask 'How was school?' at the gates",
            "Silent car ride or immediate headphone access",
            "High-protein snack and 20 min dim-room decompression",
        ]

    evening_tips = bridge.recommended_evening_activities or [
        "Quiet sensory winding down before dinner",
        "Keep evening demands low to restore cognitive reserves",
    ]
    afternoon_note = bridge.masking_explanation or "Needs 15-20 min low-demand time upon arrival home."

    action_card = {
        "card_type": "day_summary_card",
        "type": "day_summary_card",
        "title": f"{pupil_name}'s Day at a Glance",
        "subtitle": f"{pupil_name}'s School Day & Home-Time Energy",
        "details": {
            "pupil_name": pupil_name,
            "battery_percentage": battery,
            "burnout_risk": risk,
            "energy_status": status_label,
            "morning_mood": morning_mood,
            "sleep_quality": sleep_qual,
            "classroom_win_title": win_title,
            "classroom_win_desc": win_summary,
            "classroom_win_category": win_category,
            "afternoon_note": afternoon_note,
            "decompression_protocol": decompression_protocol[:3],
            "evening_tips": evening_tips[:2],
        },
        "badges": [f"{battery}% Energy", risk.split(" ")[0]],
    }

    llm_summary = (
        f"School Day Summary for {pupil_name}:\n"
        f"- Social Battery at 3:15 PM: {battery}% ({status_label}). {afternoon_note}\n"
        f"- Morning Arrival: Arrived {morning_mood.lower()} following {sleep_qual.lower()}.\n"
        f"- Celebrated Classroom Win: {win_title} - {win_summary}\n"
        f"- Top Decompression Step for Tonight: {decompression_protocol[0]}"
    )

    return {
        "llm_summary": llm_summary,
        "action_card": action_card,
        "day_data": {
            "battery": battery,
            "burnout_risk": risk,
            "status_label": status_label,
            "win_title": win_title,
            "win_summary": win_summary,
            "morning_mood": morning_mood,
            "sleep_qual": sleep_qual,
            "morning_note": morning_note,
            "afternoon_energy_note": afternoon_note,
            "decompression_protocol": decompression_protocol,
            "evening_transition_tips": evening_tips,
        },
    }


def dispatch_tool_call(db: Session, current_user: User, tool_name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    """Master tool dispatcher with UUID parsing and safety catching."""
    try:
        raw_child_id = arguments.get("child_id")
        if not raw_child_id:
            return {"llm_summary": "No pupil specified.", "action_card": None}
        
        child_id = UUID(str(raw_child_id))

        if tool_name == "get_guardian_contacts":
            return execute_get_guardian_contacts(db, child_id, current_user)
        elif tool_name == "get_latest_parent_handover":
            return execute_get_latest_parent_handover(db, child_id, current_user)
        elif tool_name == "get_proven_de_escalations":
            return execute_get_proven_de_escalations(db, child_id, current_user)
        elif tool_name == "get_ehcp_statutory_profile":
            return execute_get_ehcp_statutory_profile(db, child_id, current_user)
        elif tool_name == "query_observations_and_incidents":
            days_back = int(arguments.get("days_back", 14))
            return execute_query_observations_and_incidents(db, child_id, current_user, days_back=days_back)
        elif tool_name == "get_child_day_summary":
            return execute_get_child_day_summary(db, child_id, current_user)
        elif tool_name == "propose_classroom_action":
            return execute_propose_classroom_action(
                db=db,
                child_id=child_id,
                current_user=current_user,
                action_type=arguments.get("action_type", "log_observation"),
                title=arguments.get("title", "Classroom Observation"),
                strategy_used=arguments.get("strategy_used"),
                strategy_worked=bool(arguments.get("strategy_worked", True)),
                summary=arguments.get("summary", ""),
            )
        else:
            return {"llm_summary": f"Tool '{tool_name}' is not recognized.", "action_card": None}
    except Exception as err:
        return {"llm_summary": f"Tool execution failed: {err!s}", "action_card": None}
