"""Public authentication endpoints: register and log in."""

from fastapi import APIRouter, HTTPException, status

from app.api.deps import AppSettings, DbSession
from app.core.security import create_access_token
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserResponse)
def register(body: RegisterRequest, session: DbSession) -> UserResponse:
    try:
        user = auth_service.register_user(session, body.email, body.password)
    except auth_service.DuplicateEmailError as error:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered") from error
    return UserResponse.model_validate(user)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, session: DbSession, settings: AppSettings) -> TokenResponse:
    user = auth_service.authenticate(session, body.email, body.password)
    return TokenResponse(
        access_token=create_access_token(str(user.id), settings),
        user=UserResponse.model_validate(user),
    )
