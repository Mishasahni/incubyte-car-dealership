"""Demo access: one-click sign-in to dedicated demo accounts, only when the server enables it."""

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.factories import make_user

BUYER_EMAIL = "buyer.demo@example.com"
BUYER_PASSWORD = "Demo-buyer-test-pass"
ADMIN_EMAIL = "admin.demo@example.com"
ADMIN_PASSWORD = "Demo-admin-test-pass"

DEMO_SETTINGS = {
    "demo_access_enabled": True,
    "demo_buyer_email": BUYER_EMAIL,
    "demo_buyer_password": BUYER_PASSWORD,
    "demo_admin_email": ADMIN_EMAIL,
    "demo_admin_password": ADMIN_PASSWORD,
}
VALID_VEHICLE = {
    "make": "Ford",
    "model": "F-150",
    "category": "Truck",
    "price": 45000,
    "quantity": 4,
}


@pytest.fixture
def demo_client(test_settings, clean_database) -> Iterator[TestClient]:
    """A client for an app whose server configuration turns demo access on."""
    settings = test_settings.model_copy(update=DEMO_SETTINGS)
    application = create_app(settings)
    with TestClient(application) as test_client:
        yield test_client
    application.state.engine.dispose()


@pytest.fixture
def demo_accounts(db_session) -> None:
    make_user(db_session, email=BUYER_EMAIL, role="user", password=BUYER_PASSWORD)
    make_user(db_session, email=ADMIN_EMAIL, role="admin", password=ADMIN_PASSWORD)


def bearer(response) -> dict[str, str]:
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_demo_access_is_off_by_default(client):
    assert client.get("/api/auth/demo").json() == {"enabled": False, "roles": []}
    for role in ("buyer", "admin"):
        response = client.post(f"/api/auth/demo/{role}")
        assert response.status_code == 404
        assert response.json() == {"detail": "Demo access is not available"}


def test_status_lists_the_configured_roles_and_nothing_secret(demo_client, demo_accounts):
    response = demo_client.get("/api/auth/demo")

    assert response.json() == {"enabled": True, "roles": ["buyer", "admin"]}
    for secret in (BUYER_PASSWORD, ADMIN_PASSWORD, BUYER_EMAIL, ADMIN_EMAIL):
        assert secret not in response.text


def test_buyer_demo_signs_in_a_regular_user_who_cannot_manage_inventory(demo_client, demo_accounts):
    response = demo_client.post("/api/auth/demo/buyer")

    assert response.status_code == 200
    assert response.json()["user"]["email"] == BUYER_EMAIL
    assert response.json()["user"]["role"] == "user"
    assert BUYER_PASSWORD not in response.text
    headers = bearer(response)
    assert demo_client.get("/api/vehicles", headers=headers).status_code == 200
    created = demo_client.post("/api/vehicles", json=VALID_VEHICLE, headers=headers)
    assert created.status_code == 403
    assert demo_client.delete("/api/vehicles/1", headers=headers).status_code == 403


def test_admin_demo_signs_in_an_admin_through_the_normal_checks(demo_client, demo_accounts):
    response = demo_client.post("/api/auth/demo/admin")

    assert response.status_code == 200
    assert response.json()["user"]["role"] == "admin"
    assert ADMIN_PASSWORD not in response.text
    created = demo_client.post("/api/vehicles", json=VALID_VEHICLE, headers=bearer(response))
    assert created.status_code == 201


def test_a_misconfigured_account_with_the_wrong_role_is_refused(demo_client, db_session):
    # The buyer button must never yield an admin session, even if the configuration points at one.
    make_user(db_session, email=BUYER_EMAIL, role="admin", password=BUYER_PASSWORD)

    response = demo_client.post("/api/auth/demo/buyer")

    assert response.status_code == 503
    assert response.json() == {"detail": "Demo account is not set up"}
    assert "access_token" not in response.text


def test_an_account_whose_password_differs_is_refused(demo_client, db_session):
    make_user(db_session, email=ADMIN_EMAIL, role="admin", password="Someone-elses-pass")

    response = demo_client.post("/api/auth/demo/admin")

    assert response.status_code == 503
    assert "access_token" not in response.text


def test_a_missing_demo_account_is_reported_without_details(demo_client):
    response = demo_client.post("/api/auth/demo/buyer")

    assert response.status_code == 503
    assert response.json() == {"detail": "Demo account is not set up"}


def test_unknown_demo_roles_are_rejected(demo_client, demo_accounts):
    assert demo_client.post("/api/auth/demo/superuser").status_code == 422


def test_a_role_without_credentials_is_not_offered(test_settings, clean_database, demo_accounts):
    settings = test_settings.model_copy(
        update={**DEMO_SETTINGS, "demo_admin_email": None, "demo_admin_password": None}
    )
    application = create_app(settings)
    with TestClient(application) as demo_client:
        assert demo_client.get("/api/auth/demo").json() == {"enabled": True, "roles": ["buyer"]}
        assert demo_client.post("/api/auth/demo/admin").status_code == 404
    application.state.engine.dispose()


def test_registration_still_creates_regular_users_when_demo_is_on(demo_client):
    response = demo_client.post(
        "/api/auth/register",
        json={"email": "new@example.com", "password": "Secr3t-pass", "role": "admin"},
    )

    assert response.status_code == 201
    assert response.json()["role"] == "user"
