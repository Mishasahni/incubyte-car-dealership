"""ORM models. Import every model module here so ``Base.metadata`` knows all tables."""

from app.models.vehicle import Vehicle

__all__ = ["Vehicle"]
