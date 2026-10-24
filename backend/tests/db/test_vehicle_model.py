"""Vehicle table: persistence and database-level integrity constraints."""

from decimal import Decimal

from sqlalchemy import select

from app.models.vehicle import Vehicle


def make_vehicle(**overrides) -> Vehicle:
    fields = {
        "make": "Toyota",
        "model": "Corolla",
        "category": "Sedan",
        "price": Decimal("21999.99"),
        "quantity": 3,
    }
    return Vehicle(**(fields | overrides))


def test_vehicle_is_persisted_and_readable_from_a_new_session(test_app, db_session):
    """IT-DB-01: a committed vehicle can be read back unchanged by a separate session."""
    db_session.add(make_vehicle())
    db_session.commit()

    with test_app.state.session_factory() as fresh_session:
        stored = fresh_session.scalars(select(Vehicle)).one()

    assert isinstance(stored.id, int)
    assert (stored.make, stored.model, stored.category, stored.price, stored.quantity) == (
        "Toyota",
        "Corolla",
        "Sedan",
        Decimal("21999.99"),
        3,
    )
