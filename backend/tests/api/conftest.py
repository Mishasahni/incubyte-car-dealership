"""Fixtures shared by the API tests: auth headers for an admin and for a regular user."""

import pytest

from tests.factories import auth_headers, make_user


@pytest.fixture
def admin_headers(db_session, test_settings) -> dict[str, str]:
    admin = make_user(db_session, email="admin@dealership.com", role="admin")
    return auth_headers(admin, test_settings)


@pytest.fixture
def user_headers(db_session, test_settings) -> dict[str, str]:
    user = make_user(db_session, email="buyer@dealership.com", role="user")
    return auth_headers(user, test_settings)
