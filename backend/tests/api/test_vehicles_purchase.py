"""POST /api/vehicles/{id}/purchase"""

from app.models import Vehicle
from tests.factories import make_vehicle


def url(vehicle_id: int) -> str:
    return f"/api/vehicles/{vehicle_id}/purchase"


def stored_quantity(session, vehicle_id: int) -> int:
    session.expire_all()
    return session.get(Vehicle, vehicle_id).quantity


def test_regular_user_buys_exactly_one_unit(client, db_session, user_headers):
    """API-INV-01 and API-AUTHZ-13 (purchase): no body, one unit per request."""
    vehicle = make_vehicle(db_session, quantity=3)

    response = client.post(url(vehicle.id), headers=user_headers)

    assert response.status_code == 200
    assert response.json()["quantity"] == 2
    assert stored_quantity(db_session, vehicle.id) == 2


def test_buying_the_last_unit_leaves_zero_stock(client, db_session, user_headers):
    """API-INV-02"""
    vehicle = make_vehicle(db_session, quantity=1)

    response = client.post(url(vehicle.id), headers=user_headers)

    assert response.status_code == 200
    assert response.json()["quantity"] == 0
    assert stored_quantity(db_session, vehicle.id) == 0


def test_buying_a_vehicle_with_no_stock_returns_409_and_stock_stays_zero(
    client, db_session, user_headers
):
    """API-INV-03"""
    vehicle = make_vehicle(db_session, quantity=0)

    response = client.post(url(vehicle.id), headers=user_headers)

    assert response.status_code == 409
    assert response.json()["detail"] == "Vehicle is out of stock"
    assert stored_quantity(db_session, vehicle.id) == 0


def test_buying_a_vehicle_that_does_not_exist_returns_404(client, user_headers):
    """API-INV-04"""
    response = client.post(url(99999), headers=user_headers)

    assert response.status_code == 404
    assert response.json()["detail"] == "Vehicle not found"
