"""Password hashing and JWT access tokens."""

from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash

from app.core.config import Settings

# Argon2 via pwdlib's recommended settings: salted, slow by design.
_password_hash = PasswordHash.recommended()


class InvalidTokenError(Exception):
    """Raised for any token that is expired, malformed, or not signed with our secret."""


def hash_password(password: str) -> str:
    return _password_hash.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return _password_hash.verify(password, password_hash)


def create_access_token(subject: str, settings: Settings, now: datetime | None = None) -> str:
    """Sign a token for ``subject`` (a user id) that expires after the configured lifetime."""
    issued_at = now or datetime.now(UTC)
    expires_at = issued_at + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "exp": expires_at}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str, settings: Settings) -> str:
    """Return the token's subject. The algorithm is pinned so ``alg`` cannot be swapped."""
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except jwt.InvalidTokenError as error:
        raise InvalidTokenError("Invalid or expired token") from error
    return payload["sub"]
