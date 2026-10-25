"""Vehicle endpoints. Every route here requires a valid bearer token."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import DbSession, get_current_user, require_admin
from app.schemas.vehicle import VehicleCreate, VehicleResponse, VehicleSearch, VehicleUpdate
from app.services import inventory_service, vehicle_service

router = APIRouter(
    prefix="/api/vehicles",
    tags=["vehicles"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=list[VehicleResponse])
def list_vehicles(session: DbSession) -> list[VehicleResponse]:
    return [VehicleResponse.model_validate(v) for v in vehicle_service.list_vehicles(session)]


@router.get("/search", response_model=list[VehicleResponse])
def search_vehicles(
    filters: Annotated[VehicleSearch, Query()], session: DbSession
) -> list[VehicleResponse]:
    vehicles = vehicle_service.search_vehicles(session, filters)
    return [VehicleResponse.model_validate(v) for v in vehicles]


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=VehicleResponse,
    dependencies=[Depends(require_admin)],
)
def create_vehicle(body: VehicleCreate, session: DbSession) -> VehicleResponse:
    return VehicleResponse.model_validate(vehicle_service.create_vehicle(session, body))


@router.put(
    "/{vehicle_id}",
    response_model=VehicleResponse,
    dependencies=[Depends(require_admin)],
)
def update_vehicle(vehicle_id: int, body: VehicleUpdate, session: DbSession) -> VehicleResponse:
    try:
        vehicle = vehicle_service.update_vehicle(session, vehicle_id, body)
    except vehicle_service.VehicleNotFoundError as error:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vehicle not found") from error
    return VehicleResponse.model_validate(vehicle)


@router.delete(
    "/{vehicle_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def delete_vehicle(vehicle_id: int, session: DbSession) -> None:
    try:
        vehicle_service.delete_vehicle(session, vehicle_id)
    except vehicle_service.VehicleNotFoundError as error:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vehicle not found") from error


@router.post("/{vehicle_id}/purchase", response_model=VehicleResponse)
def purchase_vehicle(vehicle_id: int, session: DbSession) -> VehicleResponse:
    """Any logged-in user may buy one unit; no request body."""
    return VehicleResponse.model_validate(inventory_service.purchase(session, vehicle_id))
