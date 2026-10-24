"""Account registration and authentication rules (no HTTP concerns)."""

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models import User


class DuplicateEmailError(Exception):
    """Raised when registering an email that already has an account."""


def register_user(session: Session, email: str, password: str) -> User:
    """Create a regular user, storing only a hash of the password."""
    if session.scalar(select(User.id).where(User.email == email)) is not None:
        raise DuplicateEmailError(email)

    user = User(email=email, password_hash=hash_password(password))
    session.add(user)
    try:
        session.commit()
    except IntegrityError as error:
        # Two concurrent registrations can both pass the check above; the unique
        # constraint decides, and the loser gets the same error as a sequential duplicate.
        session.rollback()
        raise DuplicateEmailError(email) from error
    return user


class InvalidCredentialsError(Exception):
    """Raised when the email is unknown or the password does not match."""


def authenticate(session: Session, email: str, password: str) -> User:
    """Return the user whose email and password match."""
    user = session.scalar(select(User).where(User.email == email))
    if user is None or not verify_password(password, user.password_hash):
        raise InvalidCredentialsError
    return user


def find_user_by_email(session: Session, email: str) -> User | None:
    return session.scalar(select(User).where(User.email == email))


def promote_to_admin(session: Session, user: User) -> None:
    user.role = "admin"
    session.commit()


def create_admin(session: Session, email: str, password: str) -> User:
    """Create an admin account. Only the admin CLI calls this; no endpoint can."""
    user = User(email=email, password_hash=hash_password(password), role="admin")
    session.add(user)
    session.commit()
    return user
