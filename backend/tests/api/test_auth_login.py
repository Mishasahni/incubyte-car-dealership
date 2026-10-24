"""POST /api/auth/login"""

import pytest

from app.core.security import decode_access_token

LOGIN_URL = "/api/auth/login"
CREDENTIALS = {"email": "buyer@dealership.com", "password": "Secr3t-pass"}


@pytest.fixture
def registered_user(client) -> dict:
    response = client.post("/api/auth/register", json=CREDENTIALS)
    assert response.status_code == 201
    return response.json()


def test_login_returns_a_bearer_token_for_the_user(client, registered_user, test_settings):
    """API-AUTH-07"""
    response = client.post(LOGIN_URL, json=CREDENTIALS)

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["user"] == registered_user
    assert decode_access_token(body["access_token"], test_settings) == str(registered_user["id"])


@pytest.mark.parametrize(
    "payload",
    [{"password": "Secr3t-pass"}, {"email": "buyer@dealership.com"}, {}],
    ids=["missing-email", "missing-password", "empty-body"],
)
def test_login_with_missing_fields_returns_422(client, payload):
    """API-AUTH-10"""
    response = client.post(LOGIN_URL, json=payload)

    assert response.status_code == 422
