"""PUT /api/vehicles/{id}"""

from decimal import Decimal

import pytest

from app.models import Vehicle
from tests.factories import make_vehicle

UPDATED = {
    "make": "Honda",
    "model": "Civic",
    "category": "Hatchback",
    "price": 24500.5,
    "quantity": 7,
}


def url(vehicle_id: int) -> str:
    return f"/api/vehicles/{vehicle_id}"


def test_admin_replaces_every_field_of_a_vehicle(client, db_session, admin_headers):
    """API-VEH-06"""
    vehicle = make_vehicle(db_session)

    response = client.put(url(vehicle.id), json=UPDATED, headers=admin_headers)

    assert response.status_code == 200
    assert response.json() == {"id": vehicle.id, **UPDATED}
    assert client.get("/api/vehicles", headers=admin_headers).json() == [response.json()]


def test_admin_can_correct_stock_through_an_update(client, db_session, admin_headers):
    """API-VEH-12: PUT may set quantity to any whole number of 0 or more."""
    vehicle = make_vehicle(db_session, quantity=3)

    for quantity in (0, 10):
        response = client.put(
            url(vehicle.id), json=UPDATED | {"quantity": quantity}, headers=admin_headers
        )
        assert response.status_code == 200
        db_session.expire_all()
        assert db_session.get(Vehicle, vehicle.id).quantity == quantity


@pytest.mark.parametrize(
    "payload",
    [
        UPDATED | {"price": -5},
        {key: value for key, value in UPDATED.items() if key != "model"},
        UPDATED | {"quantity": -1},
    ],
    ids=["negative-price", "missing-model", "negative-quantity"],
)
def test_invalid_update_is_rejected_and_the_vehicle_is_unchanged(
    client, db_session, admin_headers, payload
):
    """API-VEH-08"""
    vehicle = make_vehicle(db_session)

    response = client.put(url(vehicle.id), json=payload, headers=admin_headers)

    assert response.status_code == 422
    db_session.expire_all()
    stored = db_session.get(Vehicle, vehicle.id)
    assert (stored.make, stored.model, stored.price, stored.quantity) == (
        "Toyota",
        "Corolla",
        Decimal("20000.00"),
        2,
    )
