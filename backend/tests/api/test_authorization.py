"""Authentication and authorisation across the vehicle endpoints."""

from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import func, select

from app.core.security import create_access_token
from app.models import Vehicle
from tests.factories import auth_headers, make_user, make_vehicle

LIST_URL = "/api/vehicles"

# Every endpoint that requires a token. Grows as endpoints are added.
PROTECTED_ENDPOINTS = [
    ("GET", LIST_URL),
    ("POST", LIST_URL),
    ("PUT", f"{LIST_URL}/1"),
    ("DELETE", f"{LIST_URL}/1"),
    ("GET", f"{LIST_URL}/search"),
    ("POST", f"{LIST_URL}/1/purchase"),
]


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
    forger = test_settings.model_copy(
        update={"jwt_secret_key": "another-secret-that-is-32-bytes!!"}
    )
    token = create_access_token(str(user.id), forger)

    assert client.get(LIST_URL, headers=bearer(token)).status_code == 401


def test_token_for_a_deleted_user_is_rejected(client, db_session, test_settings):
    """API-AUTHZ-05"""
    user = make_user(db_session)
    headers = auth_headers(user, test_settings)
    db_session.delete(user)
    db_session.commit()

    assert client.get(LIST_URL, headers=headers).status_code == 401


NEW_VEHICLE = {"make": "Ford", "model": "F-150", "category": "Truck", "price": 45000, "quantity": 4}


def count_vehicles(session) -> int:
    return session.scalar(select(func.count()).select_from(Vehicle))


def test_regular_user_cannot_create_a_vehicle(client, db_session, test_settings):
    """API-AUTHZ-08(a): adding vehicles is admin-only (our reading of the frontend rules)."""
    user = make_user(db_session)

    response = client.post(LIST_URL, json=NEW_VEHICLE, headers=auth_headers(user, test_settings))

    assert response.status_code == 403
    assert count_vehicles(db_session) == 0


def test_admin_role_is_read_from_the_database_not_the_token(client, db_session, test_settings):
    """API-AUTHZ-10: an admin demoted after login loses admin rights immediately."""
    admin = make_user(db_session, email="admin@dealership.com", role="admin")
    old_token_headers = auth_headers(admin, test_settings)
    admin.role = "user"
    db_session.commit()

    response = client.post(LIST_URL, json=NEW_VEHICLE, headers=old_token_headers)

    assert response.status_code == 403
    assert count_vehicles(db_session) == 0


def test_regular_user_cannot_update_a_vehicle(client, db_session, user_headers):
    """API-AUTHZ-08(b): updating vehicles is admin-only (our reading of the frontend rules)."""
    vehicle = make_vehicle(db_session, model="Corolla", quantity=2)

    response = client.put(
        f"{LIST_URL}/{vehicle.id}",
        json=NEW_VEHICLE,
        headers=user_headers,
    )

    assert response.status_code == 403
    db_session.expire_all()
    stored = db_session.get(Vehicle, vehicle.id)
    assert (stored.model, stored.quantity) == ("Corolla", 2)


def test_regular_user_cannot_delete_a_vehicle(client, db_session, user_headers):
    """API-AUTHZ-06: deleting vehicles is admin-only (stated in the assignment)."""
    vehicle = make_vehicle(db_session)

    response = client.delete(f"{LIST_URL}/{vehicle.id}", headers=user_headers)

    assert response.status_code == 403
    assert count_vehicles(db_session) == 1
