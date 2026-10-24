"""Dependencies shared by the API routers."""

from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.security import InvalidTokenError, decode_access_token
from app.db.session import get_db
from app.models import User


def get_app_settings(request: Request) -> Settings:
    """The settings this app instance was created with (tests pass their own)."""
    return request.app.state.settings


DbSession = Annotated[Session, Depends(get_db)]
AppSettings = Annotated[Settings, Depends(get_app_settings)]

# auto_error=False so every failure below returns the same 401, never FastAPI's default.
_bearer_scheme = HTTPBearer(auto_error=False)


def _not_authenticated() -> HTTPException:
    return HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        "Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
    session: DbSession,
    settings: AppSettings,
) -> User:
    """The user named by a valid bearer token, loaded fresh from the database."""
    if credentials is None:
        raise _not_authenticated()
    try:
        user_id = int(decode_access_token(credentials.credentials, settings))
    except (InvalidTokenError, ValueError) as error:
        raise _not_authenticated() from error
    user = session.get(User, user_id)
    if user is None:
        raise _not_authenticated()
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
