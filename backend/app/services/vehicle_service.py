"""Vehicle inventory rules (no HTTP concerns)."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Vehicle
from app.schemas.vehicle import VehicleCreate


def list_vehicles(session: Session) -> list[Vehicle]:
    """Every vehicle, in stock or not, oldest first."""
    return list(session.scalars(select(Vehicle).order_by(Vehicle.id)))


def create_vehicle(session: Session, data: VehicleCreate) -> Vehicle:
    vehicle = Vehicle(**data.model_dump())
    session.add(vehicle)
    session.commit()
    return vehicle
