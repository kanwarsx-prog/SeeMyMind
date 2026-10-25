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



