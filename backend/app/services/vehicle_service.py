"""Vehicle inventory rules (no HTTP concerns)."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleUpdate


class VehicleNotFoundError(Exception):
    """Raised when no vehicle has the requested id."""


def _get_vehicle(session: Session, vehicle_id: int) -> Vehicle:
    vehicle = session.get(Vehicle, vehicle_id)
    if vehicle is None:
        raise VehicleNotFoundError(vehicle_id)
    return vehicle


def list_vehicles(session: Session) -> list[Vehicle]:
    """Every vehicle, in stock or not, oldest first."""
    return list(session.scalars(select(Vehicle).order_by(Vehicle.id)))


def create_vehicle(session: Session, data: VehicleCreate) -> Vehicle:
    vehicle = Vehicle(**data.model_dump())
    session.add(vehicle)
    session.commit()
    return vehicle


def update_vehicle(session: Session, vehicle_id: int, data: VehicleUpdate) -> Vehicle:
    """Replace every editable field of a vehicle; the id never changes."""
    vehicle = _get_vehicle(session, vehicle_id)
    for field, value in data.model_dump().items():
        setattr(vehicle, field, value)
    session.commit()
    return vehicle
