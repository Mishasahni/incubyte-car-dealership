"""Vehicle inventory rules (no HTTP concerns)."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleSearch, VehicleUpdate


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


def search_vehicles(session: Session, filters: VehicleSearch) -> list[Vehicle]:
    """Vehicles matching every filter given, oldest first; in-stock or not.

    Make and model match a case-insensitive substring and category matches exactly in any
    case. ``autoescape`` makes ``%`` and ``_`` in the input literal characters.
    """
    query = select(Vehicle).order_by(Vehicle.id)
    if filters.make is not None:
        query = query.where(Vehicle.make.icontains(filters.make, autoescape=True))
    if filters.model is not None:
        query = query.where(Vehicle.model.icontains(filters.model, autoescape=True))
    if filters.category is not None:
        query = query.where(func.lower(Vehicle.category) == filters.category.lower())
    if filters.min_price is not None:
        query = query.where(Vehicle.price >= filters.min_price)
    if filters.max_price is not None:
        query = query.where(Vehicle.price <= filters.max_price)
    return list(session.scalars(query))


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


def delete_vehicle(session: Session, vehicle_id: int) -> None:
    session.delete(_get_vehicle(session, vehicle_id))
    session.commit()
