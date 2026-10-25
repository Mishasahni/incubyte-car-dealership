"""Validation rules for restock input."""

import pytest
from pydantic import ValidationError

from app.schemas.inventory import RestockRequest


def test_a_restock_of_one_unit_is_accepted():
    """UT-VAL-05"""
    assert RestockRequest(quantity=1).quantity == 1


@pytest.mark.parametrize(
    "payload",
    [{"quantity": 0}, {"quantity": -5}, {"quantity": 2.5}, {}],
    ids=["zero", "negative", "fractional", "missing"],
)
def test_invalid_restock_amounts_are_rejected(payload):
    """UT-VAL-05"""
    with pytest.raises(ValidationError):
        RestockRequest(**payload)
