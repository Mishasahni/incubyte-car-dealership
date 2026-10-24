"""Database engine, session factory, and the per-request session dependency."""

from collections.abc import Iterator

from fastapi import Request
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker


def build_engine(database_url: str) -> Engine:
    """Create an engine; ``pool_pre_ping`` drops connections the server has closed."""
    return create_engine(database_url, pool_pre_ping=True)


def build_session_factory(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db(request: Request) -> Iterator[Session]:
    """Yield one session per request from the factory the app was created with."""
    session = request.app.state.session_factory()
    try:
        yield session
    finally:
        session.close()
