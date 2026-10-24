"""Vehicle: one inventory listing with its price and stock level."""

from decimal import Decimal

from sqlalchemy import Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(primary_key=True)
    make: Mapped[str] = mapped_column(String(100))
    model: Mapped[str] = mapped_column(String(100))
    category: Mapped[str] = mapped_column(String(50))
    # Exact decimal: money must never be stored as a float.
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    quantity: Mapped[int]
