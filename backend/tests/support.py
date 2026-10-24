"""Helpers shared by the test suite."""

from sqlalchemy import make_url


def ensure_test_database_url(url: str) -> str:
    """Return ``url`` unchanged, or raise if its database name does not end in ``_test``.

    Tests truncate every table, so pointing them at a real database would destroy data.
    The error names the database only, never the full URL, so passwords are not printed.
    """
    database = make_url(url).database or ""
    if not database.endswith("_test"):
        raise RuntimeError(
            f"Refusing to run tests against database {database!r}: "
            "the test database name must end in '_test'."
        )
    return url
