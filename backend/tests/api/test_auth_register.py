"""POST /api/auth/register"""

import pytest
from sqlalchemy import func, select

from app.core.security import verify_password
from app.models import User

REGISTER_URL = "/api/auth/register"
VALID = {"email": "buyer@dealership.com", "password": "Secr3t-pass"}


def count_users(session) -> int:
    return session.scalar(select(func.count()).select_from(User))


def test_register_creates_a_regular_user_and_returns_it_without_secrets(client):
    """API-AUTH-01"""
    response = client.post(REGISTER_URL, json=VALID)

    assert response.status_code == 201
    body = response.json()
    assert set(body) == {"id", "email", "role"}
    assert isinstance(body["id"], int)
    assert body["email"] == "buyer@dealership.com"
    assert body["role"] == "user"


def test_register_stores_only_a_hash_of_the_password(client, db_session):
    """API-AUTH-02"""
    client.post(REGISTER_URL, json=VALID)

    user = db_session.scalars(select(User)).one()
    assert user.password_hash != VALID["password"]
    assert verify_password(VALID["password"], user.password_hash)


@pytest.mark.parametrize(
    "payload",
    [
        {"password": "Secr3t-pass"},
        {"email": "not-an-email", "password": "Secr3t-pass"},
        {"email": "buyer@dealership.com"},
        {"email": "buyer@dealership.com", "password": "7chars!"},
        {},
    ],
    ids=["missing-email", "invalid-email", "missing-password", "short-password", "empty-body"],
)
def test_register_rejects_invalid_input_without_creating_a_user(client, db_session, payload):
    """API-AUTH-05"""
    response = client.post(REGISTER_URL, json=payload)

    assert response.status_code == 422
    assert count_users(db_session) == 0


def test_register_ignores_a_requested_admin_role(client, db_session):
    """API-AUTH-06: public registration can never create an admin."""
    response = client.post(REGISTER_URL, json=VALID | {"role": "admin"})

    assert response.status_code == 201
    assert response.json()["role"] == "user"
    assert db_session.scalars(select(User)).one().role == "user"
