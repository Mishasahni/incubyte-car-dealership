"""Password hashing and JWT access tokens."""

from datetime import UTC, datetime, timedelta

import jwt
import pytest

from app.core.config import Settings
from app.core.security import (
    InvalidTokenError,
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)

SECRET = "unit-test-secret-that-is-at-least-32-bytes-long"
SETTINGS = Settings(
    database_url="postgresql+psycopg://unused@localhost/unused_test",
    jwt_secret_key=SECRET,
    _env_file=None,
)


def test_hash_is_not_the_plaintext_and_verifies_against_it():
    """UT-SEC-01"""
    hashed = hash_password("Secr3t-pass")

    assert hashed != "Secr3t-pass"
    assert "Secr3t-pass" not in hashed
    assert verify_password("Secr3t-pass", hashed) is True


def test_wrong_password_does_not_verify():
    """UT-SEC-02"""
    hashed = hash_password("Secr3t-pass")

    assert verify_password("wrong-pass", hashed) is False


def test_access_token_carries_its_subject_and_expires_after_the_configured_lifetime():
    """UT-SEC-04"""
    now = datetime.now(UTC)

    token = create_access_token("42", SETTINGS, now=now)

    assert decode_access_token(token, SETTINGS) == "42"
    payload = jwt.decode(token, SECRET, algorithms=["HS256"])
    assert payload["exp"] == int((now + timedelta(minutes=60)).timestamp())


def test_expired_token_is_rejected():
    """UT-SEC-05"""
    two_hours_ago = datetime.now(UTC) - timedelta(hours=2)
    token = create_access_token("42", SETTINGS, now=two_hours_ago)

    with pytest.raises(InvalidTokenError):
        decode_access_token(token, SETTINGS)


def test_token_signed_with_another_secret_is_rejected():
    """UT-SEC-06"""
    other = SETTINGS.model_copy(update={"jwt_secret_key": "a-different-secret-also-32-bytes-long"})
    token = create_access_token("42", other)

    with pytest.raises(InvalidTokenError):
        decode_access_token(token, SETTINGS)
