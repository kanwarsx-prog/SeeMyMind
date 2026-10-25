def test_decompression_bridge_synthesis(client):
    # 1. Setup school & child
    school_resp = client.post(
        "/api/v1/schools/",
        json={
            "school_name": "St. Jude's Academy",
            "school_reference": "SCH-PARENT-HUB-1",
        },
    )
    assert school_resp.status_code == 201
    school_id = school_resp.json()["id"]

    child_resp = client.post(
        "/api/v1/pupils/",
        json={
            "first_name": "Phoenix",
            "last_name": "Carter",
            "date_of_birth": "2015-04-12",
            "school_id": school_id,
            "primary_need": "Autism Spectrum Condition",
        },
    )
    assert child_resp.status_code == 201
    child_id = child_resp.json()["id"]

    # 2. Parent logs morning handover with restless sleep
    morning_resp = client.post(
        f"/api/v1/transitions/morning-handover/{child_id}",
        json={
            "transition_type": "Morning Handover (Home)",
            "sleep_quality": "Restless (woke at 4am)",
            "morning_mood": "Anxious",
            "breakfast_eaten": False,
            "medication_given": True,
            "special_notes_for_day": "Worried about whole school assembly echo.",
        },
    )
    assert morning_resp.status_code == 201

    # 3. Retrieve Decompression Bridge & Masking Decoder
    bridge_resp = client.get(f"/api/v1/transitions/children/{child_id}/decompression-bridge")
    assert bridge_resp.status_code == 200
    bridge_data = bridge_resp.json()

    assert bridge_data["child_name"] == "Phoenix Carter"
    assert "battery_percentage" in bridge_data
    assert 0 <= bridge_data["battery_percentage"] <= 100
    assert "battery_status" in bridge_data
    assert "masking_level" in bridge_data
    assert len(bridge_data["adult_observation_clues"]) >= 2
    assert len(bridge_data["decompression_recipe"]) == 4
    assert bridge_data["decompression_recipe"][0]["title"] == "Zero-Demand Doorway"
    assert len(bridge_data["draining_factors"]) > 0


def test_evening_handover_and_timeline_sync(client):
    # 1. Setup school & child
    school_resp = client.post(
        "/api/v1/schools/",
        json={
            "school_name": "St. Jude's Academy",
            "school_reference": "SCH-PARENT-HUB-2",
        },
    )
    school_id = school_resp.json()["id"]

    child_resp = client.post(
        "/api/v1/pupils/",
        json={
            "first_name": "Phoenix",
            "last_name": "Carter",
            "date_of_birth": "2015-04-12",
            "school_id": school_id,
        },
    )
    child_id = child_resp.json()["id"]

    # 2. Parent submits evening recovery check-in
    evening_resp = client.post(
        f"/api/v1/transitions/evening-handover/{child_id}",
        json={
            "child_id": child_id,
            "parent_name": "Dana Carter",
            "after_school_decompression": "Mild Sensory Wobble (10-15m)",
            "evening_mood": "Tired but Regulated",
            "dinner_eaten": True,
            "screen_free_downtime_minutes": 35,
            "notes_for_tomorrow": "Calmed down after pretzels and Lego. Ready for tomorrow.",
        },
    )
    assert evening_resp.status_code == 201
    evening_data = evening_resp.json()
    assert evening_data["parent_name"] == "Dana Carter"
    assert evening_data["after_school_decompression"] == "Mild Sensory Wobble (10-15m)"
    assert evening_data["notes_for_tomorrow"] == "Calmed down after pretzels and Lego. Ready for tomorrow."

    # 3. Verify event is synced to timeline for teachers
    timeline_resp = client.get(f"/api/v1/timeline/children/{child_id}/events")
    assert timeline_resp.status_code == 200
    events = timeline_resp.json()
    assert len(events) >= 1
    latest_event = events[0]
    assert latest_event["reporter_type"] == "Parent"
    assert "Evening Recovery Check-In" in latest_event["title"]
    assert "Mild Sensory Wobble" in latest_event["summary"]


def test_medication_correlation_digest(client):
    school_resp = client.post(
        "/api/v1/schools/",
        json={
            "school_name": "St. Jude's Academy",
            "school_reference": "SCH-PARENT-HUB-3",
        },
    )
    school_id = school_resp.json()["id"]

    child_resp = client.post(
        "/api/v1/pupils/",
        json={
            "first_name": "Phoenix",
            "last_name": "Carter",
            "date_of_birth": "2015-04-12",
            "school_id": school_id,
        },
    )
    child_id = child_resp.json()["id"]

    corr_resp = client.get(f"/api/v1/transitions/children/{child_id}/correlation-digest")
    assert corr_resp.status_code == 200
    corr_data = corr_resp.json()
    assert "Equasym XL" in corr_data["medication_name"]
    assert len(corr_data["correlation_insights"]) >= 3
    assert "CLINICAL SUMMARY FOR CAMHS" in corr_data["pediatrician_summary"]


def test_wins_gallery(client):
    school_resp = client.post(
        "/api/v1/schools/",
        json={
            "school_name": "St. Jude's Academy",
            "school_reference": "SCH-PARENT-HUB-4",
        },
    )
    school_id = school_resp.json()["id"]

    child_resp = client.post(
        "/api/v1/pupils/",
        json={
            "first_name": "Phoenix",
            "last_name": "Carter",
            "date_of_birth": "2015-04-12",
            "school_id": school_id,
        },
    )
    child_id = child_resp.json()["id"]

    wins_resp = client.get(f"/api/v1/transitions/children/{child_id}/wins-gallery")
    assert wins_resp.status_code == 200
    wins = wins_resp.json()
    assert any("Kindness" in w["celebration_badge"] or "STEM" in w["celebration_badge"] for w in wins)


def test_parent_multi_child_isolation_and_switching(client):
    # 1. Login as parent (Dana Carter)
    login_resp = client.post("/api/v1/auth/demo-login", json={"role": "parent"})
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Query pupils as parent
    pupils_resp = client.get("/api/v1/pupils/", headers=headers)
    assert pupils_resp.status_code == 200
    pupils = pupils_resp.json()

    # 3. Verify parent sees only their own children (Phoenix and Leo), not unrelated pupils
    pupil_names = [p["full_name"] for p in pupils]
    assert "Phoenix Carter" in pupil_names
    assert "Leo Carter" in pupil_names
    assert "Isla Evans" not in pupil_names
    assert "Rowan Bailey" not in pupil_names
    assert len(pupils) == 2

    # 4. Verify parent can query timeline for both children
    phoenix_id = next(p["id"] for p in pupils if p["first_name"] == "Phoenix")
    leo_id = next(p["id"] for p in pupils if p["first_name"] == "Leo")

    phoenix_timeline = client.get(f"/api/v1/timeline/children/{phoenix_id}/events", headers=headers)
    assert phoenix_timeline.status_code == 200

    leo_timeline = client.get(f"/api/v1/timeline/children/{leo_id}/events", headers=headers)
    assert leo_timeline.status_code == 200
