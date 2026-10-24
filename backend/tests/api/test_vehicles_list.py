"""GET /api/vehicles"""

from decimal import Decimal

from tests.factories import auth_headers, make_user, make_vehicle

URL = "/api/vehicles"


def test_list_is_empty_when_there_are_no_vehicles(client, db_session, test_settings):
    """API-VEH-04"""
    user = make_user(db_session)

    response = client.get(URL, headers=auth_headers(user, test_settings))

    assert response.status_code == 200
    assert response.json() == []


def test_regular_user_sees_every_vehicle_including_out_of_stock_ones(
    client, db_session, test_settings
):
    """API-VEH-05 and API-AUTHZ-13 (list): zero-stock vehicles are listed too."""
    make_vehicle(db_session, model="Corolla", quantity=2)
    make_vehicle(db_session, model="RAV4", category="SUV", price=Decimal("30000"), quantity=0)
    make_vehicle(db_session, make="Honda", model="Civic", price=Decimal("25000.50"), quantity=1)
    user = make_user(db_session)

    response = client.get(URL, headers=auth_headers(user, test_settings))

    assert response.status_code == 200
    body = response.json()
    assert [vehicle["model"] for vehicle in body] == ["Corolla", "RAV4", "Civic"]
    assert set(body[0]) == {"id", "make", "model", "category", "price", "quantity"}
    assert body[1]["quantity"] == 0
    assert body[2]["price"] == 25000.5
