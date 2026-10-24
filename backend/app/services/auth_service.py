"""Account registration and authentication rules (no HTTP concerns)."""

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import User


def register_user(session: Session, email: str, password: str) -> User:
    """Create a regular user, storing only a hash of the password."""
    user = User(email=email, password_hash=hash_password(password))
    session.add(user)
    session.commit()
    return user
