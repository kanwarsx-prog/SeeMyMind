def test_demo_login_all_roles(client):
    roles = ["senco", "teacher", "parent", "child", "ta", "admin"]
    for role in roles:
        resp = client.post("/api/v1/auth/demo-login", json={"role": role})
        assert resp.status_code == 200, f"Failed demo login for role {role}: {resp.text}"
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["role"] == role


def test_demo_login_invalid_role(client):
    resp = client.post("/api/v1/auth/demo-login", json={"role": "superadmin"})
    assert resp.status_code == 400
    assert "Invalid demo role" in resp.json()["detail"]


def test_demo_personas_are_backend_catalogue(client):
    resp = client.get("/api/v1/auth/demo-personas")
    assert resp.status_code == 200
    personas = resp.json()
    assert {persona["role"] for persona in personas} == {
        "admin",
        "senco",
        "teacher",
        "parent",
        "child",
        "ta",
    }
    teacher = next(persona for persona in personas if persona["role"] == "teacher")
    assert teacher["name"] == "Ms Clara Johnson"
    assert "Room 4" not in teacher["subtitle"]


def test_login_staff_email_and_password(client):
    # Ensure SENCO account exists via demo login first
    client.post("/api/v1/auth/demo-login", json={"role": "senco"})

    # Standard login with valid credentials
    resp = client.post(
        "/api/v1/auth/login",
        json={"email_or_username": "senco@stjudes.sch.uk", "password_or_pin": "password123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["email"] == "senco@stjudes.sch.uk"
    assert data["user"]["role"] == "senco"
    assert "access_token" in data

    # Test /me endpoint with this token
    token = data["access_token"]
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == "senco@stjudes.sch.uk"
    assert me_data["role"] == "senco"


def test_login_invalid_credentials(client):
    # Non-existent user
    resp = client.post(
        "/api/v1/auth/login",
        json={"email_or_username": "unknown@example.com", "password_or_pin": "wrongpass"},
    )
    assert resp.status_code == 401

    # Wrong password
    client.post("/api/v1/auth/demo-login", json={"role": "teacher"})
    resp2 = client.post(
        "/api/v1/auth/login",
        json={"email_or_username": "teacher@stjudes.sch.uk", "password_or_pin": "incorrect_pwd"},
    )
    assert resp2.status_code == 401
    assert "Incorrect password" in resp2.json()["detail"]


def test_pupil_voice_pin_login(client):
    # Ensure Phoenix demo pupil voice exists
    client.post("/api/v1/auth/demo-login", json={"role": "child"})

    # Login using username and 4-digit PIN
    resp = client.post(
        "/api/v1/auth/login",
        json={"email_or_username": "phoenix", "password_or_pin": "1234"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["role"] == "child"
    assert data["user"]["username"] == "phoenix"

    # Wrong PIN
    resp_wrong = client.post(
        "/api/v1/auth/login",
        json={"email_or_username": "phoenix", "password_or_pin": "9999"},
    )
    assert resp_wrong.status_code == 401
    assert "Incorrect 4-digit PIN" in resp_wrong.json()["detail"]


def test_theme_preference_persistence(client):
    # 1. Login as teacher
    login_resp = client.post("/api/v1/auth/demo-login", json={"role": "teacher"})
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    assert login_resp.json()["user"]["theme_preference"] in ["system", "light", "dark"]

    # 2. Update theme to dark
    patch_resp = client.patch(
        "/api/v1/auth/theme",
        headers={"Authorization": f"Bearer {token}"},
        json={"theme": "dark"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["theme_preference"] == "dark"

    # 3. Verify /me reflects dark theme
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["theme_preference"] == "dark"

    # 4. Update theme to light
    patch_resp2 = client.patch(
        "/api/v1/auth/theme",
        headers={"Authorization": f"Bearer {token}"},
        json={"theme": "light"},
    )
    assert patch_resp2.status_code == 200
    assert patch_resp2.json()["theme_preference"] == "light"

    # 5. Invalid theme rejected
    bad_resp = client.patch(
        "/api/v1/auth/theme",
        headers={"Authorization": f"Bearer {token}"},
        json={"theme": "neon-glow"},
    )
    assert bad_resp.status_code == 422

