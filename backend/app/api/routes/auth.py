"""Public authentication endpoints: register, log in, and demo sign-in when the server allows it."""

from fastapi import APIRouter, HTTPException, status

from app.api.deps import AppSettings, DbSession
from app.core.security import create_access_token
from app.schemas.auth import (
    DemoStatus,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services import auth_service, demo_service

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
    try:
        user = auth_service.authenticate(session, body.email, body.password)
    except auth_service.InvalidCredentialsError as error:
        # One message for both cases, so the response never reveals which emails exist.
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        ) from error
    return TokenResponse(
        access_token=create_access_token(str(user.id), settings),
        user=UserResponse.model_validate(user),
    )


@router.get("/demo", response_model=DemoStatus)
def demo_status(settings: AppSettings) -> DemoStatus:
    """Which demo roles are offered. Never includes the accounts' emails or passwords."""
    roles = demo_service.available_roles(settings)
    return DemoStatus(enabled=bool(roles), roles=roles)


@router.post("/demo/{role}", response_model=TokenResponse)
def demo_login(
    role: demo_service.DemoRole, session: DbSession, settings: AppSettings
) -> TokenResponse:
    """Sign in the dedicated demo account for ``role``, as a normal login would."""
    try:
        user = demo_service.authenticate(session, settings, role)
    except demo_service.DemoUnavailableError as error:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Demo access is not available") from error
    except demo_service.DemoAccountError as error:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, "Demo account is not set up"
        ) from error
    return TokenResponse(
        access_token=create_access_token(str(user.id), settings),
        user=UserResponse.model_validate(user),
    )
