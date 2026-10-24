"""Shared fixtures: a guarded test database, empty tables per test, and an HTTP client."""

import os
from collections.abc import Iterator

import pytest
from dotenv import dotenv_values
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import Engine, text
from sqlalchemy.orm import Session

from app.core.config import BACKEND_DIR, Settings
from app.db.base import Base
from app.main import create_app
from scripts.init_db import create_tables
from tests.support import ensure_test_database_url

TEST_JWT_SECRET = "test-only-secret-not-used-anywhere-else"


def _test_database_url() -> str | None:
    """Read TEST_DATABASE_URL from the environment, falling back to backend/.env."""
    return os.environ.get("TEST_DATABASE_URL") or dotenv_values(BACKEND_DIR / ".env").get(
        "TEST_DATABASE_URL"
    )


@pytest.fixture(scope="session")
def test_settings() -> Settings:
    """Settings for tests only: the guarded test database and a throwaway JWT secret."""
    url = _test_database_url()
    if not url:
        pytest.fail(
            "TEST_DATABASE_URL is not set. Add it to backend/.env (see .env.example).",
            pytrace=False,
        )
    try:
        ensure_test_database_url(url)
    except RuntimeError as error:
        pytest.exit(str(error), returncode=2)
    return Settings(database_url=url, jwt_secret_key=TEST_JWT_SECRET, _env_file=None)


@pytest.fixture(scope="session")
def test_app(test_settings: Settings) -> Iterator[FastAPI]:
    """One app for the whole run, with tables created at the start and dropped at the end."""
    application = create_app(test_settings)
    create_tables(application.state.engine)
    yield application
    Base.metadata.drop_all(application.state.engine)
    application.state.engine.dispose()


def _truncate_all_tables(engine: Engine) -> None:
    table_names = ", ".join(table.name for table in Base.metadata.sorted_tables)
    if table_names:
        with engine.begin() as connection:
            connection.execute(text(f"TRUNCATE {table_names} RESTART IDENTITY CASCADE"))


@pytest.fixture
def clean_database(test_app: FastAPI) -> None:
    """Empty every table so each test starts from a known state."""
    _truncate_all_tables(test_app.state.engine)


@pytest.fixture
def db_session(test_app: FastAPI, clean_database: None) -> Iterator[Session]:
    session = test_app.state.session_factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(test_app: FastAPI, clean_database: None) -> Iterator[TestClient]:
    with TestClient(test_app) as test_client:
        yield test_client
