"""Vehicle endpoints."""

from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.vehicle import VehicleResponse
from app.services import vehicle_service

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


@router.get("", response_model=list[VehicleResponse])
def list_vehicles(session: DbSession) -> list[VehicleResponse]:
    return [VehicleResponse.model_validate(v) for v in vehicle_service.list_vehicles(session)]
