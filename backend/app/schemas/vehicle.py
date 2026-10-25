"""Request and response bodies for vehicles."""

from decimal import Decimal
from typing import Annotated

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    PlainSerializer,
    StringConstraints,
    model_validator,
)

# Stored as an exact Decimal, sent to clients as a JSON number (two decimal places).
Price = Annotated[Decimal, PlainSerializer(float, return_type=float, when_used="json")]

VehicleName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
CategoryName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]
PositivePrice = Annotated[Decimal, Field(gt=0, max_digits=12, decimal_places=2)]
StockQuantity = Annotated[int, Field(ge=0)]
PriceBound = Annotated[Decimal, Field(ge=0)]


class VehicleCreate(BaseModel):
    """A new vehicle. Any ``id`` in the request is ignored; the database assigns it."""

    make: VehicleName
    model: VehicleName
    category: CategoryName
    price: PositivePrice
    quantity: StockQuantity


# PUT is a full replacement, so an update carries exactly the same fields and rules as a create.
VehicleUpdate = VehicleCreate


class VehicleSearch(BaseModel):
    """Optional search filters; any that are given must all match."""

    make: str | None = None
    model: str | None = None
    category: str | None = None
    min_price: PriceBound | None = None
    max_price: PriceBound | None = None

    @model_validator(mode="after")
    def _price_range_is_ordered(self) -> "VehicleSearch":
        if (
            self.min_price is not None
            and self.max_price is not None
            and self.min_price > self.max_price
        ):
            raise ValueError("min_price must not be greater than max_price")
        return self


class VehicleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    make: str
    model: str
    category: str
    price: Price
    quantity: int
