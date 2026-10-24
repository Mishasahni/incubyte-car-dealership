"""Vehicle endpoints. Every route here requires a valid bearer token."""

from fastapi import APIRouter, Depends, status

from app.api.deps import DbSession, get_current_user
from app.schemas.vehicle import VehicleCreate, VehicleResponse
from app.services import vehicle_service

router = APIRouter(
    prefix="/api/vehicles",
    tags=["vehicles"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=list[VehicleResponse])
def list_vehicles(session: DbSession) -> list[VehicleResponse]:
    return [VehicleResponse.model_validate(v) for v in vehicle_service.list_vehicles(session)]


@router.post("", status_code=status.HTTP_201_CREATED, response_model=VehicleResponse)
def create_vehicle(body: VehicleCreate, session: DbSession) -> VehicleResponse:
    return VehicleResponse.model_validate(vehicle_service.create_vehicle(session, body))
