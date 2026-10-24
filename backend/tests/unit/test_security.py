"""Password hashing and JWT access tokens."""

from app.core.security import hash_password, verify_password


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
