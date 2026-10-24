"""Declarative base class shared by all ORM models."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base for SQLAlchemy models; ``Base.metadata`` holds every table."""
