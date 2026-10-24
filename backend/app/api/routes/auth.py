"""Public authentication endpoints: register and log in."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import RegisterRequest, UserResponse
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])

DbSession = Annotated[Session, Depends(get_db)]


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserResponse)
def register(body: RegisterRequest, session: DbSession) -> UserResponse:
    try:
        user = auth_service.register_user(session, body.email, body.password)
    except auth_service.DuplicateEmailError as error:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered") from error
    return UserResponse.model_validate(user)
