"""Small builders for test data. Each one commits, so the API sees the rows."""

from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.security import create_access_token, hash_password
from app.models import User, Vehicle

DEFAULT_PASSWORD = "Secr3t-pass"


def make_user(
    session: Session,
    email: str = "user@dealership.com",
    role: str = "user",
    password: str = DEFAULT_PASSWORD,
) -> User:
    user = User(email=email, password_hash=hash_password(password), role=role)
    session.add(user)
    session.commit()
    return user


def make_vehicle(session: Session, **overrides) -> Vehicle:
    fields = {
        "make": "Toyota",
        "model": "Corolla",
        "category": "Sedan",
        "price": Decimal("20000.00"),
        "quantity": 2,
    }
    vehicle = Vehicle(**(fields | overrides))
    session.add(vehicle)
    session.commit()
    return vehicle


def auth_headers(user: User, settings: Settings) -> dict[str, str]:
    """Authorization header carrying a valid token for ``user``."""
    return {"Authorization": f"Bearer {create_access_token(str(user.id), settings)}"}
