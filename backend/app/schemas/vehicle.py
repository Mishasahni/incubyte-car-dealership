"""Request and response bodies for vehicles."""

from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, PlainSerializer

# Stored as an exact Decimal, sent to clients as a JSON number (two decimal places).
Price = Annotated[Decimal, PlainSerializer(float, return_type=float, when_used="json")]


class VehicleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    make: str
    model: str
    category: str
    price: Price
    quantity: int
