"""Vehicle endpoints. Every route here requires a valid bearer token."""

from collections.abc import Callable
from typing import Annotated

from fastapi import APIRouter, Depends, FastAPI, Query, Request, status
from fastapi.responses import JSONResponse

from app.api.deps import DbSession, get_current_user, require_admin
from app.schemas.inventory import RestockRequest
from app.schemas.vehicle import VehicleCreate, VehicleResponse, VehicleSearch, VehicleUpdate
from app.services import inventory_service, vehicle_service

router = APIRouter(
    prefix="/api/vehicles",
    tags=["vehicles"],
    dependencies=[Depends(get_current_user)],
)

# Service errors and the HTTP responses they become, for every vehicle route.
ERROR_RESPONSES: dict[type[Exception], tuple[int, str]] = {
    vehicle_service.VehicleNotFoundError: (status.HTTP_404_NOT_FOUND, "Vehicle not found"),
    inventory_service.OutOfStockError: (status.HTTP_409_CONFLICT, "Vehicle is out of stock"),
}


def add_error_handlers(app: FastAPI) -> None:
    """Register ERROR_RESPONSES on the app, so routes can let service errors propagate."""
    for error, (status_code, detail) in ERROR_RESPONSES.items():
        app.add_exception_handler(error, _error_response(status_code, detail))


def _error_response(status_code: int, detail: str) -> Callable[[Request, Exception], JSONResponse]:
    def handler(_request: Request, _error: Exception) -> JSONResponse:
        return JSONResponse({"detail": detail}, status_code=status_code)

    return handler


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
    return VehicleResponse.model_validate(vehicle_service.update_vehicle(session, vehicle_id, body))


@router.delete(
    "/{vehicle_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def delete_vehicle(vehicle_id: int, session: DbSession) -> None:
    vehicle_service.delete_vehicle(session, vehicle_id)


@router.post("/{vehicle_id}/purchase", response_model=VehicleResponse)
def purchase_vehicle(vehicle_id: int, session: DbSession) -> VehicleResponse:
    """Any logged-in user may buy one unit; no request body."""
    return VehicleResponse.model_validate(inventory_service.purchase(session, vehicle_id))


@router.post(
    "/{vehicle_id}/restock",
    response_model=VehicleResponse,
    dependencies=[Depends(require_admin)],
)
def restock_vehicle(vehicle_id: int, body: RestockRequest, session: DbSession) -> VehicleResponse:
    return VehicleResponse.model_validate(
        inventory_service.restock(session, vehicle_id, body.quantity)
    )
