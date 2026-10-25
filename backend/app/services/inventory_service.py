"""Stock changes: purchasing and restocking vehicles (no HTTP concerns)."""

from sqlalchemy.orm import Session

from app.models import Vehicle
from app.services.vehicle_service import VehicleNotFoundError


class OutOfStockError(Exception):
    """Raised when a purchase is attempted on a vehicle with no units left."""


def purchase(session: Session, vehicle_id: int) -> Vehicle:
    """Sell exactly one unit of a vehicle."""
    vehicle = session.get(Vehicle, vehicle_id)
    if vehicle is None:
        raise VehicleNotFoundError(vehicle_id)
    if vehicle.quantity <= 0:
        raise OutOfStockError(vehicle_id)
    vehicle.quantity -= 1
    session.commit()
    return vehicle
