"""User: an account that can log in. Only the password hash is ever stored."""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    # Public registration always creates "user"; only the admin CLI grants "admin".
    role: Mapped[str] = mapped_column(String(20), default="user", server_default="user")
