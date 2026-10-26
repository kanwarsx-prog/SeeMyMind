def test_noya_morning_briefing_generation(client):
    # Setup school & pupil
    school_resp = client.post(
        "/api/v1/schools/",
        json={
            "school_name": "Phoenix Academy",
        },
    )
    school_id = school_resp.json()["id"]

    child_resp = client.post(
        "/api/v1/pupils/",
        json={
            "first_name": "Phoenix",
            "last_name": "Carter",
            "preferred_name": "Phoenix",
            "date_of_birth": "2015-04-12",
            "year_group": "Year 5",
            "school_id": school_id,
            "primary_need": "Autism Spectrum Condition",
            "has_ehcp": True,
        },
    )
    child_id = child_resp.json()["id"]

    # Log morning handover
    client.post(
        f"/api/v1/transitions/morning-handover/{child_id}?school_id={school_id}&parent_name=Dana%20Carter",
        json={
            "transition_type": "Morning Handover (Home)",
            "sleep_quality": "Restless",
            "morning_mood": "Anxious",
            "special_notes_for_day": "Sensory sensitivities are elevated this morning.",
        },
    )

    # Trigger NOYA Morning Briefing
    briefing_resp = client.post(f"/api/v1/noya/morning-briefing/{child_id}")
    assert briefing_resp.status_code == 200
    briefing_data = briefing_resp.json()
    assert briefing_data["child_name"] == "Phoenix"
    assert "summary_markdown" in briefing_data
    assert len(briefing_data["citations"]) >= 1
    assert "Morning Home Handover" in briefing_data["citations"][0]["citation_text"]


def test_noya_ask_rag_query(client):
    # Setup pupil
    child_resp = client.post(
        "/api/v1/pupils/",
        json={
            "first_name": "Phoenix",
            "last_name": "Carter",
            "date_of_birth": "2015-04-12",
            "primary_need": "Autism Spectrum Condition",
        },
    )
    child_id = child_resp.json()["id"]

    # Ask NOYA a question
    ask_resp = client.post(
        "/api/v1/noya/ask",
        json={
            "child_id": child_id,
            "question": "What calm-down strategies have worked best when sensory load is high?",
            "top_k": 3,
        },
    )
    assert ask_resp.status_code == 200
    ask_data = ask_resp.json()
    assert (
        ask_data["question"]
        == "What calm-down strategies have worked best when sensory load is high?"
    )
    assert "answer_markdown" in ask_data
    assert "model_used" in ask_data


def test_noya_latest_morning_briefing_and_audit_runs(client):
    # Setup pupil
    child_resp = client.post(
        "/api/v1/pupils/",
        json={
            "first_name": "Phoenix",
            "last_name": "Carter",
            "date_of_birth": "2015-04-12",
            "primary_need": "Autism Spectrum Condition",
        },
    )
    child_id = child_resp.json()["id"]

    # 1. Before generating, latest briefing should be None
    latest_resp = client.get(f"/api/v1/noya/morning-briefing/{child_id}/latest")
    assert latest_resp.status_code == 200
    assert latest_resp.json() is None

    # 2. Trigger generation
    gen_resp = client.post(f"/api/v1/noya/morning-briefing/{child_id}")
    assert gen_resp.status_code == 200

    # 3. Now latest briefing returns the cached briefing without an AI call
    latest_resp2 = client.get(f"/api/v1/noya/morning-briefing/{child_id}/latest")
    assert latest_resp2.status_code == 200
    assert latest_resp2.json() is not None
    assert latest_resp2.json()["child_id"] == child_id

    # 4. Check audit runs endpoint
    audit_resp = client.get(f"/api/v1/noya/audit-runs?child_id={child_id}")
    assert audit_resp.status_code == 200
    audit_data = audit_resp.json()
    assert len(audit_data) >= 1
    first_run = audit_data[0]
    assert first_run["prompt_type"] == "MorningBriefing"
    assert first_run["input_prompt"] is not None
    assert first_run["output_text"] is not None


def test_pathway_deterministic_vs_manual_ai(client):
    child_resp = client.post(
        "/api/v1/pupils/",
        json={
            "first_name": "Phoenix",
            "last_name": "Carter",
            "date_of_birth": "2015-04-12",
            "primary_need": "Autism Spectrum Condition",
        },
    )
    child_id = child_resp.json()["id"]

    # Deterministic generation (use_ai=False by default)
    det_resp = client.post(
        "/api/v1/noya/pathway/generate",
        json={
            "child_id": child_id,
            "subject": "Mathematics",
            "topic": "Straight Line Graphs & Gradients",
            "use_ai": False,
        },
    )
    assert det_resp.status_code == 200
    det_data = det_resp.json()
    assert len(det_data["steps"]) == 4

    # Verify audit log captures the run
    audit_resp = client.get(f"/api/v1/noya/audit-runs?child_id={child_id}")
    assert audit_resp.status_code == 200
    audit_runs = audit_resp.json()
    pathway_run = next(r for r in audit_runs if r["prompt_type"] == "LessonPathwayScaffolding")
    assert pathway_run["input_tokens"] == 0
    assert pathway_run["output_tokens"] == 0
    assert pathway_run["model_name"] == "curriculum-standard"


def test_noya_copilot_chat_guardian_contacts(client):
    """Test Approach C tool calling for guardian contact details."""
    child_resp = client.post(
        "/api/v1/pupils/",
        json={
            "first_name": "Phoenix",
            "last_name": "Carter",
            "date_of_birth": "2015-04-12",
            "primary_need": "Autism Spectrum Condition",
        },
    )
    child_id = child_resp.json()["id"]

    # Ask NOYA for contact details
    resp = client.post(
        "/api/v1/noya/copilot/chat",
        json={
            "child_id": child_id,
            "active_view": "senco_overview",
            "message": "give me the contact details",
            "history": [],
        },
        headers={"x-user-role": "senco"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "contact" in data["answer_markdown"].lower() or "guardian" in data["answer_markdown"].lower()

    # Also verify /api/v1/noya/chat route alias works identically
    resp_chat = client.post(
        "/api/v1/noya/chat",
        json={
            "child_id": child_id,
            "active_view": "senco_overview",
            "message": "give me the contact details",
            "history": [],
        },
        headers={"x-user-role": "senco"},
    )
    assert resp_chat.status_code == 200
    assert "contact" in resp_chat.json()["answer_markdown"].lower() or "guardian" in resp_chat.json()["answer_markdown"].lower()
    assert data["action_card"] is not None
    assert data["action_card"]["type"] == "contact_card"
    assert len(data["action_card"]["contacts"]) >= 1
    assert data["tool_called"] == "get_guardian_contacts"
    assert len(data["suggested_followups"]) >= 1


def test_noya_copilot_chat_handover_status(client):
    """Test Approach C tool calling for morning handover status."""
    child_resp = client.post(
        "/api/v1/pupils/",
        json={
            "first_name": "Isla",
            "last_name": "Evans",
            "date_of_birth": "2015-08-20",
            "primary_need": "ADHD & Sensory Processing",
        },
    )
    child_id = child_resp.json()["id"]

    # Log morning handover
    client.post(
        f"/api/v1/transitions/morning-handover/{child_id}?parent_name=Claire%20Evans",
        json={
            "transition_type": "Morning Handover (Home)",
            "sleep_quality": "Restless (woke at 4am)",
            "morning_mood": "Anxious",
            "special_notes_for_day": "Agitated about assembly. Ear defenders in bag.",
        },
    )

    # Ask NOYA for last check in status
    resp = client.post(
        "/api/v1/noya/copilot/chat",
        json={
            "child_id": child_id,
            "active_view": "teacher_focus",
            "message": "when did a pupil's parent check in the status last or what was the status?",
            "history": [],
        },
        headers={"x-user-role": "teacher"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "handover" in data["answer_markdown"].lower() or "parent" in data["answer_markdown"].lower()
    assert data["action_card"] is not None
    assert data["action_card"]["type"] == "handover_card"
    assert data["tool_called"] == "get_latest_parent_handover"
    assert len(data["suggested_followups"]) >= 1


def test_noya_copilot_chat_ta_rbac_guardian_contacts(client):
    """Verify Teaching Assistants cannot access private guardian contact numbers."""
    child_resp = client.post(
        "/api/v1/pupils/",
        json={
            "first_name": "Phoenix",
            "last_name": "Carter",
            "date_of_birth": "2015-04-12",
            "primary_need": "Autism Spectrum Condition",
        },
    )
    child_id = child_resp.json()["id"]

    resp = client.post(
        "/api/v1/noya/copilot/chat",
        json={
            "child_id": child_id,
            "active_view": "ta_view",
            "message": "what is Mum's phone number and contact details?",
            "history": [],
        },
        headers={"x-user-role": "ta"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access restricted" in data["answer_markdown"].lower() or "cannot access" in data["answer_markdown"].lower() or data["action_card"] is None


def test_noya_copilot_chat_tenant_isolation(client):
    """Verify cross-school queries are strictly blocked at tenant layer."""
    school_a = client.post("/api/v1/schools/", json={"school_name": "School Alpha"}).json()["id"]
    school_b = client.post("/api/v1/schools/", json={"school_name": "School Beta"}).json()["id"]

    child = client.post(
        "/api/v1/pupils/",
        json={
            "first_name": "Student",
            "last_name": "Beta",
            "date_of_birth": "2015-05-15",
            "school_id": school_b,
        },
    ).json()["id"]

    # Register user in school A
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "teacher.alpha@alpha.org",
            "password": "Password123!",
            "full_name": "Teacher Alpha",
            "role": "teacher",
            "school_id": school_a,
        },
    )

    # Attempt to query child from School B
    resp = client.post(
        "/api/v1/noya/copilot/chat",
        json={
            "child_id": child,
            "message": "tell me about this child",
        },
        headers={"x-user-role": "teacher", "x-user-email": "teacher.alpha@alpha.org"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access denied" in data["answer_markdown"].lower() or "permission" in data["answer_markdown"].lower()


def test_noya_copilot_chat_parent_role(client):
    """Verify parent queries receive warm, jargon-free support and parent-tailored follow-ups."""
    child = client.post(
        "/api/v1/pupils/",
        json={
            "first_name": "Leo",
            "last_name": "Carter",
            "date_of_birth": "2017-09-10",
            "primary_need": "Speech, Language and Communication",
        },
    ).json()["id"]

    resp = client.post(
        "/api/v1/noya/copilot/chat",
        json={
            "child_id": child,
            "active_view": "parent_hub",
            "message": "How can I help Leo settle arriving home tonight?",
            "history": [],
        },
        headers={"x-user-role": "parent"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "calm" in data["answer_markdown"].lower() or "home" in data["answer_markdown"].lower() or "settle" in data["answer_markdown"].lower()
    # Confirm suggested followups are parent-tailored (no Section F or emergency contact)
    for followup in data["suggested_followups"]:
        assert "section f" not in followup.lower()
        assert "emergency contact" not in followup.lower()
    assert any("morning check-in" in f.lower() or "settle" in f.lower() or "strengths" in f.lower() for f in data["suggested_followups"])


def test_noya_copilot_chat_classroom_overview(client):
    """Verify classroom overview queries return Room 4 cohort insights without requiring a child ID."""
    resp = client.post(
        "/api/v1/noya/copilot/chat",
        json={
            "child_id": None,
            "active_view": "classroom_matrix",
            "message": "Summarize Room 4 sensory accommodations",
            "history": [],
        },
        headers={"x-user-role": "teacher"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "room 4" in data["answer_markdown"].lower() or "sensory" in data["answer_markdown"].lower()
    assert data["action_card"] is not None
    assert data["action_card"]["type"] == "cohort_accommodations"
    assert any("room 4" in f.lower() or "class" in f.lower() for f in data["suggested_followups"])


def test_noya_copilot_chat_senco_overview(client):
    """Verify SENCO overview queries return whole-school inclusion governance insights."""
    resp = client.post(
        "/api/v1/noya/copilot/chat",
        json={
            "child_id": None,
            "active_view": "senco_overview",
            "message": "What is our whole-school EHCP vs SEN Support distribution?",
            "history": [],
        },
        headers={"x-user-role": "senco"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "st. jude's" in data["answer_markdown"].lower() or "ehcp" in data["answer_markdown"].lower() or "sen support" in data["answer_markdown"].lower()
    assert data["action_card"] is not None
    assert data["action_card"]["type"] == "whole_school_stats"
    assert any("ehcp" in f.lower() or "annual review" in f.lower() or "ta support" in f.lower() for f in data["suggested_followups"])


def test_pii_anonymizer_zero_llm_exposure():
    """Verify deterministic tokenization of student/guardian names, phones, and emails before LLM transmission."""
    from app.ai.pii_anonymizer import PIIAnonymizer

    tokens = PIIAnonymizer.extract_entity_tokens(
        pupil_name="Phoenix Carter",
        guardian_names=["Dana Carter"],
        school_name="St. Jude's Inclusive Academy",
    )
    raw_prompt = "Phoenix Carter at St. Jude's Inclusive Academy called Dana Carter on 020 7946 0192 regarding test@example.com."
    anon_text, rehyd_map = PIIAnonymizer.anonymize_text(raw_prompt, tokens)

    # Verify no PII remains in anonymized text
    assert "Phoenix" not in anon_text
    assert "Carter" not in anon_text
    assert "Dana" not in anon_text
    assert "020 7946 0192" not in anon_text
    assert "test@example.com" not in anon_text

    # Verify generic tokens are used
    assert "[PUPIL_NAME]" in anon_text or "[PUPIL_FIRST_NAME]" in anon_text
    assert "[SCHOOL_NAME]" in anon_text
    assert "[PHONE_1]" in anon_text
    assert "[EMAIL_1]" in anon_text

    # Verify perfect local rehydration
    restored = PIIAnonymizer.rehydrate_text(anon_text, rehyd_map)
    assert "Phoenix Carter" in restored
    assert "Dana Carter" in restored
    assert "St. Jude's Inclusive Academy" in restored
    assert "020 7946 0192" in restored
    assert "test@example.com" in restored


def test_noya_propose_action_card_human_in_the_loop(client):
    """Verify NOYA generates an interactive Action Proposal card without unconfirmed database writes."""
    child_resp = client.post(
        "/api/v1/pupils/",
        json={
            "first_name": "Phoenix",
            "last_name": "Carter",
            "date_of_birth": "2015-04-12",
            "primary_need": "Autism Spectrum Condition",
        },
    )
    assert child_resp.status_code == 201
    child_id = child_resp.json()["id"]

    # Request to log an observation via chat
    chat_resp = client.post(
        "/api/v1/noya/chat",
        json={
            "child_id": child_id,
            "message": "Log that Phoenix used noise defenders in class and it worked well",
            "history": [],
        },
        headers={"x-user-role": "teacher"},
    )
    assert chat_resp.status_code == 200
    data = chat_resp.json()

    # 1. Action card is generated as a proposal
    assert data["action_card"] is not None
    assert data["action_card"]["type"] == "proposed_action"
    assert data["action_card"]["status"] == "pending"
    assert "noise" in data["action_card"]["title"].lower() or "sensory" in data["action_card"]["title"].lower()
    assert data["action_card"]["payload"] is not None

    # 2. Check timeline before human confirmation: NOT yet committed (HITL safety)
    timeline_before = client.get(f"/api/v1/timeline/children/{child_id}/events")
    assert timeline_before.status_code == 200
    events_before = timeline_before.json()
    assert not any("noise defenders" in (e.get("title") or "").lower() for e in events_before)

    # 3. Human educator clicks confirm: calls timeline events API with card payload
    confirm_resp = client.post("/api/v1/timeline/events", json=data["action_card"]["payload"])
    assert confirm_resp.status_code == 201

    # 4. Timeline now reflects the confirmed observation
    timeline_after = client.get(f"/api/v1/timeline/children/{child_id}/events")
    assert timeline_after.status_code == 200
    events_after = timeline_after.json()
    assert any("noise" in (e.get("title") or "").lower() for e in events_after)


def test_noya_execution_steps_multi_step_trace(client):
    """Verify NOYA chat returns human-friendly execution_steps showing reasoning and consulted records."""
    child_resp = client.post(
        "/api/v1/pupils/",
        json={
            "first_name": "Phoenix",
            "last_name": "Carter",
            "date_of_birth": "2015-04-12",
            "primary_need": "Autism Spectrum Condition",
        },
    )
    assert child_resp.status_code == 201
    child_id = child_resp.json()["id"]

    # 1. Multi-step query: Proposing an action requires checking profile and drafting note
    chat_resp = client.post(
        "/api/v1/noya/chat",
        json={
            "child_id": child_id,
            "message": "Log that Phoenix used noise defenders in class and it worked well",
            "history": [],
        },
        headers={"x-user-role": "teacher"},
    )
    assert chat_resp.status_code == 200
    data = chat_resp.json()

    assert "execution_steps" in data
    steps = data["execution_steps"]
    assert len(steps) >= 2

    # Verify first step: profile check
    assert steps[0]["step_number"] == 1
    assert "Profile" in steps[0]["title"] or "Support" in steps[0]["title"]
    assert steps[0]["status"] == "completed"
    assert steps[0]["detail"] is not None

    # Verify second step: action proposal
    assert steps[1]["step_number"] == 2
    assert "Proposal" in steps[1]["title"] or "Drafted" in steps[1]["title"]
    assert steps[1]["tool_name"] == "propose_classroom_action"
    assert steps[1]["status"] == "completed"


def test_noya_audit_run_persists_execution_steps(client):
    """Verify that AIRun audit logs capture immutable execution_steps for SENCO compliance."""
    child_resp = client.post(
        "/api/v1/pupils/",
        json={
            "first_name": "Phoenix",
            "last_name": "Carter",
            "date_of_birth": "2015-04-12",
            "primary_need": "Autism Spectrum Condition",
        },
    )
    assert child_resp.status_code == 201
    child_id = child_resp.json()["id"]

    # Trigger a query
    chat_resp = client.post(
        "/api/v1/noya/chat",
        json={
            "child_id": child_id,
            "message": "What proven calming strategies work best for Phoenix?",
            "history": [],
        },
        headers={"x-user-role": "teacher"},
    )
    assert chat_resp.status_code == 200

    # Retrieve audit runs
    audit_resp = client.get(f"/api/v1/noya/audit-runs?child_id={child_id}")
    assert audit_resp.status_code == 200
    runs = audit_resp.json()
    assert len(runs) >= 1

    latest_run = runs[0]
    assert latest_run["prompt_type"] == "CopilotChat"
    assert latest_run["execution_steps"] is not None
    assert len(latest_run["execution_steps"]) >= 1
    first_step = latest_run["execution_steps"][0]
    assert "Calming" in first_step["title"] or "Strategies" in first_step["title"]
    assert first_step["status"] == "completed"


def test_noya_persona_grounded_dynamic_pupil_resolution(client):
    """Verify that a teacher or parent can ask about any accessible pupil without rigid UI scope switching."""
    phoenix_id = client.post(
        "/api/v1/pupils/",
        json={"first_name": "Phoenix", "last_name": "Carter", "date_of_birth": "2015-04-12", "primary_need": "Autism Spectrum Condition"},
    ).json()["id"]
    client.post(
        "/api/v1/pupils/",
        json={"first_name": "Leo", "last_name": "Carter", "date_of_birth": "2017-09-10", "primary_need": "Speech, Language and Communication"},
    ).json()["id"]

    # Teacher has Phoenix focused on screen, but asks about Leo in natural language
    chat_resp = client.post(
        "/api/v1/noya/chat",
        json={
            "child_id": phoenix_id,  # Phoenix is focused in UI
            "message": "What proven calming strategies work for Leo?",
            "history": [],
        },
        headers={"x-user-role": "teacher"},
    )
    assert chat_resp.status_code == 200
    data = chat_resp.json()
    # Response dynamically resolves Leo!
    assert "Leo" in data["answer_markdown"]


def test_noya_parent_how_was_child_day_today(client):
    """Verify parents can ask natural day summary questions ('How was Phoenix's day today?') and receive a warm, grounded summary with day_summary_card."""
    phoenix_id = client.post(
        "/api/v1/pupils/",
        json={
            "first_name": "Phoenix",
            "last_name": "Carter",
            "date_of_birth": "2015-04-12",
            "primary_need": "Autism Spectrum Condition",
        },
    ).json()["id"]

    # Ask NOYA: "How was Phoenix's day today?"
    resp = client.post(
        "/api/v1/noya/copilot/chat",
        json={
            "child_id": phoenix_id,
            "active_view": "parent_hub",
            "message": "How was Phoenix's day today?",
            "history": [],
        },
        headers={"x-user-role": "parent"},
    )
    assert resp.status_code == 200
    data = resp.json()

    # 1. Answer text check: warm, bulleted summary
    assert "Phoenix" in data["answer_markdown"]
    assert "Battery" in data["answer_markdown"] or "battery" in data["answer_markdown"].lower()
    assert "Win" in data["answer_markdown"] or "breakthrough" in data["answer_markdown"].lower() or "engagement" in data["answer_markdown"].lower()
    assert "Calming" in data["answer_markdown"] or "buffer" in data["answer_markdown"].lower() or "decompression" in data["answer_markdown"].lower()

    # 2. Action Card verification: day_summary_card
    assert data["action_card"] is not None
    assert data["action_card"]["card_type"] == "day_summary_card"
    details = data["action_card"]["details"]
    assert details["pupil_name"] == "Phoenix"
    assert "battery_percentage" in details
    assert "decompression_protocol" in details
    assert len(details["decompression_protocol"]) >= 1

    # 3. Tool dispatch & explainability
    assert data["tool_called"] == "get_child_day_summary"
    assert len(data["execution_steps"]) >= 1
    assert "Decompression Bridge" in data["execution_steps"][0]["title"]
    assert any("How was Phoenix's day today?" in f for f in data["suggested_followups"])







