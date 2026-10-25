"""Validation rules for vehicle search filters."""

from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.schemas.vehicle import VehicleSearch


def test_every_search_filter_is_optional():
    assert VehicleSearch().model_dump() == {
        "make": None,
        "model": None,
        "category": None,
        "min_price": None,
        "max_price": None,
    }


def test_equal_price_bounds_are_accepted():
    """UT-VAL-06"""
    search = VehicleSearch(min_price=25000, max_price=25000)

    assert (search.min_price, search.max_price) == (Decimal("25000"), Decimal("25000"))


@pytest.mark.parametrize(
    "bounds",
    [{"min_price": 30000, "max_price": 10000}, {"min_price": -1}, {"max_price": -1}],
    ids=["min-above-max", "negative-min", "negative-max"],
)
def test_invalid_price_bounds_are_rejected(bounds):
    """UT-VAL-06"""
    with pytest.raises(ValidationError):
        VehicleSearch(**bounds)
