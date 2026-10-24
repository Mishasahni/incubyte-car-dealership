"""Smoke tests: the application starts and the test database is reachable."""

from sqlalchemy import text


def test_app_serves_its_openapi_schema(client):
    response = client.get("/openapi.json")

    assert response.status_code == 200
    assert response.json()["info"]["title"] == "Car Dealership Inventory API"


def test_test_database_is_reachable(db_session):
    database = db_session.execute(text("select current_database()")).scalar_one()

    assert database.endswith("_test")
