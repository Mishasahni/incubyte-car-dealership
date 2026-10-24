"""The test-database guard must refuse any database that is not clearly a test database."""

import pytest

from tests.support import ensure_test_database_url


def test_accepts_a_database_whose_name_ends_in_test():
    url = "postgresql+psycopg://app:secret@localhost:5432/car_dealership_test"

    assert ensure_test_database_url(url) == url


@pytest.mark.parametrize(
    "database",
    ["car_dealership", "car_dealership_test_backup", "postgres", ""],
)
def test_refuses_any_other_database(database):
    url = f"postgresql+psycopg://app:secret@localhost:5432/{database}"

    with pytest.raises(RuntimeError, match="_test"):
        ensure_test_database_url(url)


def test_refusal_message_does_not_reveal_the_password():
    url = "postgresql+psycopg://app:s3cr3t-value@localhost:5432/car_dealership"

    with pytest.raises(RuntimeError) as excinfo:
        ensure_test_database_url(url)

    assert "s3cr3t-value" not in str(excinfo.value)
