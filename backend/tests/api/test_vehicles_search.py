"""GET /api/vehicles/search"""

from decimal import Decimal

import pytest

from tests.factories import make_vehicle

SEARCH_URL = "/api/vehicles/search"


@pytest.fixture
def seeded(db_session) -> dict[str, int]:
    """The TEST_PLAN search seed; returns model name -> vehicle id."""
    vehicles = [
        make_vehicle(db_session, make="Toyota", model="Corolla", category="Sedan",
                     price=Decimal("20000"), quantity=2),
        make_vehicle(db_session, make="Toyota", model="RAV4", category="SUV",
                     price=Decimal("30000"), quantity=0),
        make_vehicle(db_session, make="Honda", model="Civic", category="Sedan",
                     price=Decimal("25000"), quantity=1),
        make_vehicle(db_session, make="Ford", model="F-150", category="Truck",
                     price=Decimal("45000"), quantity=4),
    ]  # fmt: skip
    return {vehicle.model: vehicle.id for vehicle in vehicles}


def found_models(response) -> set[str]:
    assert response.status_code == 200
    return {vehicle["model"] for vehicle in response.json()}


@pytest.mark.parametrize(
    ("params", "expected"),
    [
        ({"make": "toy"}, {"Corolla", "RAV4"}),
        ({"model": "CIVIC"}, {"Civic"}),
        ({"category": "sedan"}, {"Corolla", "Civic"}),
        ({"min_price": 25000}, {"Civic", "RAV4", "F-150"}),
        ({"max_price": 25000}, {"Corolla", "Civic"}),
        ({"min_price": 20000, "max_price": 30000}, {"Corolla", "Civic", "RAV4"}),
        ({"make": "toyota", "category": "suv", "max_price": 35000}, {"RAV4"}),
        ({"make": "Tesla"}, set()),
        ({}, {"Corolla", "RAV4", "Civic", "F-150"}),
    ],
    ids=[
        "API-SRCH-01-make-substring",
        "API-SRCH-02-model-any-case",
        "API-SRCH-03-category-exact",
        "API-SRCH-04-min-price-inclusive",
        "API-SRCH-05-max-price-inclusive",
        "API-SRCH-06-price-range",
        "API-SRCH-07-filters-combine",
        "API-SRCH-08-no-match",
        "API-SRCH-09-no-filters",
    ],
)
def test_search_returns_the_matching_vehicles(client, seeded, user_headers, params, expected):
    """API-SRCH-01 to -09: a regular user can search; zero-stock vehicles are included."""
    response = client.get(SEARCH_URL, params=params, headers=user_headers)

    assert found_models(response) == expected


def test_search_returns_every_vehicle_field(client, seeded, user_headers):
    response = client.get(SEARCH_URL, params={"model": "RAV4"}, headers=user_headers)

    assert response.json() == [
        {
            "id": seeded["RAV4"],
            "make": "Toyota",
            "model": "RAV4",
            "category": "SUV",
            "price": 30000.0,
            "quantity": 0,
        }
    ]


@pytest.mark.parametrize(
    "params",
    [{"min_price": 30000, "max_price": 10000}, {"min_price": -1}, {"max_price": "abc"}],
    ids=["min-above-max", "negative-min", "text-max"],
)
def test_invalid_price_filters_return_422(client, seeded, user_headers, params):
    """API-SRCH-10"""
    response = client.get(SEARCH_URL, params=params, headers=user_headers)

    assert response.status_code == 422


@pytest.mark.parametrize("text", ["%", "_", "' OR 1=1 --"], ids=["percent", "underscore", "sql"])
def test_search_text_is_matched_literally(client, seeded, user_headers, text):
    """API-SRCH-11: wildcards and SQL in the input are plain characters, not patterns."""
    response = client.get(SEARCH_URL, params={"make": text}, headers=user_headers)

    assert found_models(response) == set()


def test_a_deleted_vehicle_no_longer_appears_in_search(client, seeded, admin_headers, user_headers):
    """API-VEH-09 (search part)"""
    client.delete(f"/api/vehicles/{seeded['RAV4']}", headers=admin_headers)

    response = client.get(SEARCH_URL, params={"make": "toyota"}, headers=user_headers)

    assert found_models(response) == {"Corolla"}
