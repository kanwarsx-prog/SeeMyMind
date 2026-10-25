def test_get_curriculum_units(client):
    """Test retrieving pre-curated National Curriculum units with filters."""
    response = client.get("/api/v1/noya/pathway/curriculum-units")
    assert response.status_code == 200
    units = response.json()
    assert len(units) >= 15
    titles = [u["title"] for u in units]
    assert any("Equivalent Fractions" in t for t in titles)

    # Test year_group filter
    y5_resp = client.get("/api/v1/noya/pathway/curriculum-units?year_group=Year+5")
    assert y5_resp.status_code == 200
    y5_units = y5_resp.json()
    assert len(y5_units) >= 5
    assert all(u["year_group"] == "Year 5" for u in y5_units)

    # Test subject filter
    math_resp = client.get("/api/v1/noya/pathway/curriculum-units?year_group=Year+5&subject=Mathematics")
    assert math_resp.status_code == 200
    math_units = math_resp.json()
    assert len(math_units) >= 2
    assert all(u["subject"] == "Mathematics" for u in math_units)


def test_get_curriculum_metadata(client):
    """Test curriculum metadata endpoint returning year groups and subjects."""
    resp = client.get("/api/v1/noya/pathway/curriculum-metadata")
    assert resp.status_code == 200
    meta = resp.json()
    assert "year_groups" in meta
    assert "subjects" in meta
    assert "Year 5" in meta["year_groups"]
    assert "Mathematics" in meta["subjects"]
    assert meta["total_units"] >= 20


def test_sync_oak_curriculum(client):
    """Test Oak National Academy API sync / cache fallback."""
    resp = client.post("/api/v1/noya/pathway/curriculum-sync-oak")
    assert resp.status_code == 200
    data = resp.json()
    assert "status" in data
    assert data["units_count"] >= 20



def test_generate_pathway_maths(client):
    """Test generating a bespoke maths pathway for Phoenix Carter."""
    # Setup school & pupil
    school_resp = client.post(
        "/api/v1/schools/",
        json={"school_name": "St. Jude's Inclusive Academy"},
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
            "room_name": "Room 4",
            "school_id": school_id,
            "primary_need": "Autism Spectrum Condition (ASC)",
            "has_ehcp": True,
        },
    )
    child_id = child_resp.json()["id"]

    # Generate pathway for Maths Graphs
    resp = client.post(
        "/api/v1/noya/pathway/generate",
        json={
            "child_id": child_id,
            "subject": "Mathematics",
            "topic": "Straight Line Graphs & Gradients",
            "learning_objective": "Calculate gradient m = rise / run on a coordinate plane.",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["child_name"] == "Phoenix"
    assert data["subject"] == "Mathematics"
    assert len(data["steps"]) == 4
    # Step 1 should start active, step 2 next, step 3 locked, step 4 locked
    assert data["steps"][0]["number"] == 1
    assert data["steps"][0]["status"] == "active"
    assert "Start Here" in data["steps"][0]["badge"]
    assert data["steps"][1]["number"] == 2
    assert data["steps"][1]["status"] == "next"
    assert data["steps"][1]["sensory_pause_after"] is True
    assert data["steps"][2]["status"] == "locked"
    assert data["steps"][3]["status"] == "locked"
    assert "cognitive_rationale" in data
    assert "ta_briefing" in data
    assert len(data["peer_adaptations"]) >= 1


def test_generate_pathway_english(client):
    """Test generating a bespoke English narrative inference pathway."""
    child_resp = client.post(
        "/api/v1/pupils/",
        json={
            "first_name": "Riya",
            "last_name": "Patel",
            "preferred_name": "Riya",
            "date_of_birth": "2015-06-18",
            "year_group": "Year 5",
            "room_name": "Room 4",
            "primary_need": "ADHD & Performance Anxiety",
            "has_ehcp": False,
        },
    )
    child_id = child_resp.json()["id"]

    resp = client.post(
        "/api/v1/noya/pathway/generate",
        json={
            "child_id": child_id,
            "subject": "English",
            "topic": "The Highwayman — Narrative Inference",
            "learning_objective": "Infer character motives and atmosphere.",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["child_name"] == "Riya"
    assert len(data["steps"]) == 4
    assert data["steps"][0]["status"] == "active"
    assert data["steps"][1]["status"] == "next"
    assert "galleon" in data["steps"][0]["description"]
    assert "ta_briefing" in data


def test_generate_pathway_iron_man(client):
    """Test generating an English pathway for The Iron Man, ensuring it does NOT bleed into The Highwayman."""
    child_resp = client.post(
        "/api/v1/pupils/",
        json={
            "first_name": "Phoenix",
            "last_name": "Carter",
            "preferred_name": "Phoenix",
            "date_of_birth": "2015-04-12",
            "year_group": "Year 4",
            "room_name": "Room 4",
            "primary_need": "Autism Spectrum Condition (ASC)",
            "has_ehcp": True,
        },
    )
    child_id = child_resp.json()["id"]

    resp = client.post(
        "/api/v1/noya/pathway/generate",
        json={
            "child_id": child_id,
            "subject": "English",
            "topic": "The Iron Man — Figurative Personification",
            "learning_objective": "Identify and analyse powerful verbs, similes, and mechanical metaphors.",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["child_name"] == "Phoenix"
    assert len(data["steps"]) == 4
    # Step 1 must start as active, not done
    assert data["steps"][0]["status"] == "active"
    assert "Start Here" in data["steps"][0]["badge"]
    # Verify it has Iron Man personification content, not Highwayman
    assert "Iron Man" in data["steps"][0]["description"] or "tractor" in data["steps"][0]["description"]
    assert "galleon" not in data["steps"][0]["description"]
    assert "highwayman" not in data["steps"][2]["description"].lower()


def test_generate_pathway_not_found(client):
    """Test 404 response for nonexistent pupil."""
    import uuid
    resp = client.post(
        "/api/v1/noya/pathway/generate",
        json={
            "child_id": str(uuid.uuid4()),
            "subject": "Science",
            "topic": "Electric Circuits",
        },
    )
    assert resp.status_code == 404
