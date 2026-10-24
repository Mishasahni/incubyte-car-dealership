"""Vehicle: one inventory listing with its price and stock level."""

from decimal import Decimal

from sqlalchemy import CheckConstraint, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Vehicle(Base):
    __tablename__ = "vehicles"
    # Enforced by PostgreSQL too, so no code path can oversell or store a free car.
    __table_args__ = (
        CheckConstraint("quantity >= 0", name="ck_vehicles_quantity_non_negative"),
        CheckConstraint("price > 0", name="ck_vehicles_price_positive"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    make: Mapped[str] = mapped_column(String(100))
    model: Mapped[str] = mapped_column(String(100))
    category: Mapped[str] = mapped_column(String(50))
    # Exact decimal: money must never be stored as a float.
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    quantity: Mapped[int]
