"""Authentication and authorisation across the vehicle endpoints."""

from datetime import UTC, datetime, timedelta

import pytest

from app.core.security import create_access_token
from tests.factories import auth_headers, make_user

LIST_URL = "/api/vehicles"

# Every endpoint that requires a token. Grows as endpoints are added.
PROTECTED_ENDPOINTS = [("GET", LIST_URL)]


def bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.parametrize(("method", "path"), PROTECTED_ENDPOINTS)
def test_request_without_a_token_is_rejected(client, method, path):
    """API-AUTHZ-01"""
    response = client.request(method, path)

    assert response.status_code == 401


@pytest.mark.parametrize(
    "header",
    ["Token abc", "Bearer", "Bearer not-a-jwt"],
    ids=["wrong-scheme", "no-token", "not-a-jwt"],
)
def test_malformed_authorization_header_is_rejected(client, header):
    """API-AUTHZ-02"""
    response = client.get(LIST_URL, headers={"Authorization": header})

    assert response.status_code == 401


def test_expired_token_is_rejected(client, db_session, test_settings):
    """API-AUTHZ-03"""
    user = make_user(db_session)
    two_hours_ago = datetime.now(UTC) - timedelta(hours=2)
    token = create_access_token(str(user.id), test_settings, now=two_hours_ago)

    assert client.get(LIST_URL, headers=bearer(token)).status_code == 401


def test_token_signed_with_another_secret_is_rejected(client, db_session, test_settings):
    """API-AUTHZ-04"""
    user = make_user(db_session)
    forger = test_settings.model_copy(update={"jwt_secret_key": "another-secret-that-is-32-bytes!!"})
    token = create_access_token(str(user.id), forger)

    assert client.get(LIST_URL, headers=bearer(token)).status_code == 401


def test_token_for_a_deleted_user_is_rejected(client, db_session, test_settings):
    """API-AUTHZ-05"""
    user = make_user(db_session)
    headers = auth_headers(user, test_settings)
    db_session.delete(user)
    db_session.commit()

    assert client.get(LIST_URL, headers=headers).status_code == 401
