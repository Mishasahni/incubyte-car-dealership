"""POST /api/vehicles"""

from decimal import Decimal

import pytest
from sqlalchemy import func, select

from app.models import Vehicle

URL = "/api/vehicles"
VALID = {
    "make": "Toyota",
    "model": "Corolla",
    "category": "Sedan",
    "price": 21999.99,
    "quantity": 3,
}


def count_vehicles(session) -> int:
    return session.scalar(select(func.count()).select_from(Vehicle))


def without(field: str) -> dict:
    return {key: value for key, value in VALID.items() if key != field}


def test_admin_creates_a_vehicle(client, db_session, admin_headers):
    """API-VEH-01"""
    response = client.post(URL, json=VALID, headers=admin_headers)

    assert response.status_code == 201
    body = response.json()
    assert isinstance(body["id"], int)
    assert {key: body[key] for key in VALID} == VALID
    assert db_session.get(Vehicle, body["id"]).price == Decimal("21999.99")


def test_text_is_trimmed_and_a_client_supplied_id_is_ignored(client, db_session, admin_headers):
    """UT-VAL-04 (through the API) and API-VEH-03"""
    payload = VALID | {"id": 999, "make": "  Toyota  ", "category": " Sedan "}

    response = client.post(URL, json=payload, headers=admin_headers)

    assert response.status_code == 201
    body = response.json()
    assert (body["make"], body["category"]) == ("Toyota", "Sedan")
    assert body["id"] != 999


INVALID = {
    "missing-make": without("make"),
    "missing-model": without("model"),
    "missing-category": without("category"),
    "missing-price": without("price"),
    "missing-quantity": without("quantity"),
    "empty-make": VALID | {"make": ""},
    "blank-model": VALID | {"model": "   "},
    "make-too-long": VALID | {"make": "x" * 101},
    "category-too-long": VALID | {"category": "x" * 51},
    "zero-price": VALID | {"price": 0},
    "negative-price": VALID | {"price": -1},
    "text-price": VALID | {"price": "abc"},
    "price-with-three-decimals": VALID | {"price": 1.999},
    "negative-quantity": VALID | {"quantity": -1},
    "fractional-quantity": VALID | {"quantity": 1.5},
    "text-quantity": VALID | {"quantity": "x"},
}


@pytest.mark.parametrize("payload", INVALID.values(), ids=INVALID.keys())
def test_invalid_vehicle_is_rejected_and_nothing_is_stored(
    client, db_session, admin_headers, payload
):
    """API-VEH-02 (also UT-VAL-01 to -03 through the API)"""
    response = client.post(URL, json=payload, headers=admin_headers)

    assert response.status_code == 422
    assert count_vehicles(db_session) == 0
