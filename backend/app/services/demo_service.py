"""Demo access: which demo roles the server offers, and signing in their dedicated accounts."""

from typing import Literal

from sqlalchemy.orm import Session

from app.core.config import Settings, reveal
from app.models import User
from app.services import auth_service

DemoRole = Literal["buyer", "admin"]

# The account role each demo button must lead to; anything else is refused.
ACCOUNT_ROLES: dict[DemoRole, str] = {"buyer": "user", "admin": "admin"}


class DemoUnavailableError(Exception):
    """Raised when demo access is off, or the role has no configured account."""


class DemoAccountError(Exception):
    """Raised when the configured account is missing, or its password or role does not match."""


def credentials(settings: Settings, role: DemoRole) -> tuple[str, str] | None:
    """The configured email and password for a demo role, or None if either is missing."""
    email = getattr(settings, f"demo_{role}_email")
    password = reveal(getattr(settings, f"demo_{role}_password"))
    return (email, password) if email and password else None


def available_roles(settings: Settings) -> list[DemoRole]:
    if not settings.demo_access_enabled:
        return []
    return [role for role in ACCOUNT_ROLES if credentials(settings, role)]


def authenticate(session: Session, settings: Settings, role: DemoRole) -> User:
    """Sign in the demo account for ``role`` with the normal password check."""
    found = credentials(settings, role) if settings.demo_access_enabled else None
    if found is None:
        raise DemoUnavailableError(role)
    try:
        user = auth_service.authenticate(session, *found)
    except auth_service.InvalidCredentialsError as error:
        raise DemoAccountError(role) from error
    if user.role != ACCOUNT_ROLES[role]:
        raise DemoAccountError(role)
    return user
