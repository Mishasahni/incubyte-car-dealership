"""Password hashing and JWT access tokens."""

from pwdlib import PasswordHash

# Argon2 via pwdlib's recommended settings: salted, slow by design.
_password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return _password_hash.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return _password_hash.verify(password, password_hash)
