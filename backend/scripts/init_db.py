"""Create the application's tables in the configured database.

Safe to run repeatedly: existing tables are left untouched. Usage, from ``backend/``::

    python -m scripts.init_db
"""

from sqlalchemy import Engine

import app.models  # noqa: F401  (registers every model on Base.metadata)
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import build_engine


def create_tables(engine: Engine) -> None:
    """Create any missing tables; never drops or alters existing ones."""
    Base.metadata.create_all(engine)


def main() -> None:
    engine = build_engine(get_settings().database_url)
    try:
        create_tables(engine)
    finally:
        engine.dispose()
    print(f"Tables are up to date in database {engine.url.database!r}.")


if __name__ == "__main__":
    main()
