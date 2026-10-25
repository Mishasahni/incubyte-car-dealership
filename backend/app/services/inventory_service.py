"""Stock changes: purchasing and restocking vehicles (no HTTP concerns)."""

from sqlalchemy.orm import Session

from app.models import Vehicle


def purchase(session: Session, vehicle_id: int) -> Vehicle:
    """Sell exactly one unit of a vehicle."""
    vehicle = session.get(Vehicle, vehicle_id)
    vehicle.quantity -= 1
    session.commit()
    return vehicle
