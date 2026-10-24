"""Vehicle table: persistence and database-level integrity constraints."""

from decimal import Decimal

import pytest
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError

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


def test_database_rejects_a_negative_quantity(db_session):
    """IT-DB-02: even raw SQL that bypasses the API cannot make stock negative."""
    vehicle = make_vehicle()
    db_session.add(vehicle)
    db_session.commit()

    with pytest.raises(IntegrityError):
        db_session.execute(
            text("UPDATE vehicles SET quantity = -1 WHERE id = :id"), {"id": vehicle.id}
        )
    db_session.rollback()
