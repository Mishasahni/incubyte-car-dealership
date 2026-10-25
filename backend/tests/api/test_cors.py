"""CORS: only the configured frontend origin may call the API from a browser."""

from fastapi.testclient import TestClient

from app.main import create_app

FRONTEND = "http://localhost:5173"


def preflight(client, origin: str):
    return client.options(
        "/api/vehicles",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
        },
    )


def test_preflight_from_the_frontend_origin_is_allowed(client):
    response = preflight(client, FRONTEND)

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == FRONTEND
    assert "authorization" in response.headers["access-control-allow-headers"].lower()


def test_responses_to_the_frontend_origin_carry_the_allow_origin_header(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "nobody@dealership.com", "password": "Secr3t-pass"},
        headers={"Origin": FRONTEND},
    )

    assert response.headers["access-control-allow-origin"] == FRONTEND


def test_other_origins_are_not_allowed(client):
    response = preflight(client, "http://evil.example")

    assert "access-control-allow-origin" not in response.headers


def test_allowed_origins_come_from_configuration(test_settings):
    settings = test_settings.model_copy(update={"cors_origins": ["https://dealer.example"]})
    app = create_app(settings)
    try:
        with TestClient(app) as client:
            allowed = preflight(client, "https://dealer.example")
            default = preflight(client, FRONTEND)
    finally:
        app.state.engine.dispose()

    assert allowed.headers["access-control-allow-origin"] == "https://dealer.example"
    assert "access-control-allow-origin" not in default.headers
