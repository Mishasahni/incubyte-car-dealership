"""DELETE /api/vehicles/{id}"""

from tests.factories import make_vehicle

LIST_URL = "/api/vehicles"
REPLACEMENT = {"make": "Ford", "model": "F-150", "category": "Truck", "price": 45000, "quantity": 4}


def url(vehicle_id: int) -> str:
    return f"{LIST_URL}/{vehicle_id}"


def test_admin_deletes_a_vehicle_and_it_is_gone(client, db_session, admin_headers):
    """API-VEH-09: 204 with no body; it leaves the list and can no longer be updated."""
    kept = make_vehicle(db_session, model="Corolla")
    removed = make_vehicle(db_session, model="RAV4")

    response = client.delete(url(removed.id), headers=admin_headers)

    assert response.status_code == 204
    assert response.content == b""
    listed = client.get(LIST_URL, headers=admin_headers).json()
    assert [vehicle["id"] for vehicle in listed] == [kept.id]
    follow_up = client.put(url(removed.id), json=REPLACEMENT, headers=admin_headers)
    assert follow_up.status_code == 404


def test_deleting_a_vehicle_that_does_not_exist_returns_404(client, admin_headers):
    """API-VEH-10"""
    response = client.delete(url(99999), headers=admin_headers)

    assert response.status_code == 404
    assert response.json()["detail"] == "Vehicle not found"
