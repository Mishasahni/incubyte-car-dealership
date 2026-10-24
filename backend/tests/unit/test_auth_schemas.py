"""Validation rules for registration input."""

import pytest
from pydantic import ValidationError

from app.schemas.auth import RegisterRequest


def test_accepts_a_valid_email_and_an_eight_character_password():
    request = RegisterRequest(email="buyer@dealership.com", password="8chars!!")

    assert request.email == "buyer@dealership.com"


@pytest.mark.parametrize(
    ("email", "password", "invalid_field"),
    [
        ("not-an-email", "long-enough-pass", "email"),
        ("buyer@dealership.com", "7chars!", "password"),
        ("buyer@dealership.com", "x" * 129, "password"),
    ],
)
def test_rejects_invalid_registration_input(email, password, invalid_field):
    """UT-VAL-07"""
    with pytest.raises(ValidationError) as excinfo:
        RegisterRequest(email=email, password=password)

    assert [error["loc"][0] for error in excinfo.value.errors()] == [invalid_field]
