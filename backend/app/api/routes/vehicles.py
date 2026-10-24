"""Vehicle endpoints. Every route here requires a valid bearer token."""

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, get_current_user
from app.schemas.vehicle import VehicleResponse
from app.services import vehicle_service

router = APIRouter(
    prefix="/api/vehicles",
    tags=["vehicles"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=list[VehicleResponse])
def list_vehicles(session: DbSession) -> list[VehicleResponse]:
    return [VehicleResponse.model_validate(v) for v in vehicle_service.list_vehicles(session)]
