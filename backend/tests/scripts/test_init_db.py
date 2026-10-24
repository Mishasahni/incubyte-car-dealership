"""init_db: creating tables is safe to repeat and never destroys data."""

from decimal import Decimal

from sqlalchemy import func, inspect, select

from app.db.base import Base
from app.models import Vehicle
from scripts.init_db import create_tables


def test_create_tables_is_idempotent_and_keeps_existing_data(test_app):
    """IT-DB-06: tables are created on an empty schema; a second run changes nothing."""
    engine = test_app.state.engine
    Base.metadata.drop_all(engine)

    create_tables(engine)
    assert {"users", "vehicles"} <= set(inspect(engine).get_table_names())

    with test_app.state.session_factory() as session:
        session.add(
            Vehicle(
                make="Ford", model="F-150", category="Truck", price=Decimal("45000"), quantity=4
            )
        )
        session.commit()

    create_tables(engine)

    with test_app.state.session_factory() as session:
        assert session.scalar(select(func.count()).select_from(Vehicle)) == 1
