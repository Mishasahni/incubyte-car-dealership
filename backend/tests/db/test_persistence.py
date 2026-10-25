"""Data lives in PostgreSQL, not in the application process."""

from fastapi.testclient import TestClient

from app.main import create_app
from tests.factories import auth_headers, make_user

NEW_VEHICLE = {"make": "Ford", "model": "F-150", "category": "Truck", "price": 45000, "quantity": 4}


def test_a_vehicle_created_through_the_api_survives_an_application_restart(
    test_app, test_settings, client, db_session
):
    """IT-DB-05"""
    headers = auth_headers(make_user(db_session, role="admin"), test_settings)
    created = client.post("/api/vehicles", json=NEW_VEHICLE, headers=headers)
    assert created.status_code == 201

    # "Restart": drop every pooled connection of the running app, then build a new app
    # instance with its own engine, as a fresh process would.
    test_app.state.engine.dispose()
    restarted = create_app(test_settings)
    try:
        with TestClient(restarted) as fresh_client:
            listed = fresh_client.get("/api/vehicles", headers=headers)
    finally:
        restarted.state.engine.dispose()

    assert listed.status_code == 200
    assert listed.json() == [created.json()]
