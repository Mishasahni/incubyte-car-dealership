"""Request bodies for stock changes."""

from typing import Annotated

from pydantic import BaseModel, Field


class RestockRequest(BaseModel):
    """How many units to add. No upper limit is set: the requirements give none."""

    quantity: Annotated[int, Field(ge=1)]
