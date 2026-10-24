"""Request and response bodies for registration and login."""

from pydantic import BaseModel, ConfigDict, EmailStr, Field

PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128


class RegisterRequest(BaseModel):
    """New account details. There is deliberately no role field: new users are never admins."""

    email: EmailStr
    password: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)


class UserResponse(BaseModel):
    """Public view of a user. Never includes the password hash."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    role: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
