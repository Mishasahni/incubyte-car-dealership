"""POST /api/vehicles/{id}/restock"""

import pytest

from app.models import Vehicle
from tests.factories import make_vehicle


def url(vehicle_id: int, action: str = "restock") -> str:
    return f"/api/vehicles/{vehicle_id}/{action}"


def stored_quantity(session, vehicle_id: int) -> int:
    session.expire_all()
    return session.get(Vehicle, vehicle_id).quantity


def test_admin_restock_adds_the_given_number_of_units(client, db_session, admin_headers):
    """API-INV-05"""
    vehicle = make_vehicle(db_session, quantity=2)

    response = client.post(url(vehicle.id), json={"quantity": 5}, headers=admin_headers)

    assert response.status_code == 200
    assert response.json()["quantity"] == 7
    assert stored_quantity(db_session, vehicle.id) == 7


@pytest.mark.parametrize(
    "payload",
    [{"quantity": 0}, {"quantity": -3}, {"quantity": 1.5}, {}],
    ids=["zero", "negative", "fractional", "missing"],
)
def test_invalid_restock_returns_422_and_stock_is_unchanged(
    client, db_session, admin_headers, payload
):
    """API-INV-06"""
    vehicle = make_vehicle(db_session, quantity=2)

    response = client.post(url(vehicle.id), json=payload, headers=admin_headers)

    assert response.status_code == 422
    assert stored_quantity(db_session, vehicle.id) == 2


def test_restocking_a_vehicle_that_does_not_exist_returns_404(client, admin_headers):
    """API-INV-07"""
    response = client.post(url(99999), json={"quantity": 1}, headers=admin_headers)

    assert response.status_code == 404
    assert response.json()["detail"] == "Vehicle not found"


def test_restocking_makes_a_sold_out_vehicle_purchasable_again(
    client, db_session, admin_headers, user_headers
):
    """API-INV-08"""
    vehicle = make_vehicle(db_session, quantity=0)

    sold_out = client.post(url(vehicle.id, "purchase"), headers=user_headers)
    restocked = client.post(url(vehicle.id), json={"quantity": 1}, headers=admin_headers)
    bought = client.post(url(vehicle.id, "purchase"), headers=user_headers)

    assert sold_out.status_code == 409
    assert (restocked.status_code, restocked.json()["quantity"]) == (200, 1)
    assert (bought.status_code, bought.json()["quantity"]) == (200, 0)
