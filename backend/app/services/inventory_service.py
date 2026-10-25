"""Stock changes: purchasing and restocking vehicles (no HTTP concerns)."""

from sqlalchemy import update
from sqlalchemy.orm import Session

from app.models import Vehicle
from app.services.vehicle_service import VehicleNotFoundError


class OutOfStockError(Exception):
    """Raised when a purchase is attempted on a vehicle with no units left."""


def purchase(session: Session, vehicle_id: int) -> Vehicle:
    """Sell exactly one unit of a vehicle, safely under concurrent purchases.

    A single conditional UPDATE decrements the stock only while it is above zero. When two
    purchases race for the same row, PostgreSQL makes the second wait for the first to
    commit and then re-checks ``quantity > 0`` against the new value, so stock can never be
    oversold. Python never reads the quantity and writes it back.
    """
    sold = session.scalars(
        update(Vehicle)
        .where(Vehicle.id == vehicle_id, Vehicle.quantity > 0)
        .values(quantity=Vehicle.quantity - 1)
        .returning(Vehicle)
    ).one_or_none()
    if sold is None:
        # Nothing was updated: either there is no such vehicle or it has no stock left.
        if session.get(Vehicle, vehicle_id) is None:
            raise VehicleNotFoundError(vehicle_id)
        raise OutOfStockError(vehicle_id)
    session.commit()
    return sold
