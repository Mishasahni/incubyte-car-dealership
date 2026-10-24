"""FastAPI application factory."""

from fastapi import FastAPI

from app.api.routes import auth
from app.core.config import Settings, get_settings
from app.db.session import build_engine, build_session_factory


def create_app(settings: Settings | None = None) -> FastAPI:
    """Build the app. Tests pass their own settings; production reads them from the environment."""
    settings = settings or get_settings()
    app = FastAPI(title="Car Dealership Inventory API")

    engine = build_engine(settings.database_url)
    app.state.settings = settings
    app.state.engine = engine
    app.state.session_factory = build_session_factory(engine)

    app.include_router(auth.router)
    return app
