"""Create an admin account, or promote an existing user to admin.

Safe to run repeatedly. The password is read with a hidden prompt and confirmed;
there is deliberately no --password option, so it never reaches shell history.
Usage, from ``backend/``::

    python -m scripts.create_admin --email admin@example.com
"""

import argparse
import sys
from getpass import getpass

from pydantic import EmailStr, TypeAdapter, ValidationError

from app.core.config import Settings, get_settings
from app.db.session import build_engine, build_session_factory
from app.schemas.auth import PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH
from app.services import auth_service

_email_adapter = TypeAdapter(EmailStr)


def _parse_args(argv: list[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create or promote an admin account.")
    parser.add_argument("--email", required=True, help="email address of the admin account")
    return parser.parse_args(argv)


def _fail(message: str) -> int:
    print(f"Error: {message}", file=sys.stderr)
    return 1


def _read_new_password() -> str | None:
    """Prompt twice without echoing; None if the entries differ or break the policy."""
    password = getpass("New admin password: ")
    if getpass("Confirm password: ") != password:
        _fail("passwords do not match. Nothing was changed.")
        return None
    if not PASSWORD_MIN_LENGTH <= len(password) <= PASSWORD_MAX_LENGTH:
        _fail(
            f"password must be {PASSWORD_MIN_LENGTH}-{PASSWORD_MAX_LENGTH} characters. "
            "Nothing was changed."
        )
        return None
    return password


def main(argv: list[str] | None = None, settings: Settings | None = None) -> int:
    args = _parse_args(argv)
    try:
        email = _email_adapter.validate_python(args.email)
    except ValidationError:
        return _fail(f"{args.email!r} is not a valid email address. Nothing was changed.")

    engine = build_engine((settings or get_settings()).database_url)
    try:
        with build_session_factory(engine)() as session:
            user = auth_service.find_user_by_email(session, email)
            if user is not None and user.role == "admin":
                print(f"{email} is already an admin. Nothing was changed.")
                return 0
            if user is not None:
                auth_service.promote_to_admin(session, user)
                print(f"Promoted existing user {email} to admin. Password unchanged.")
                return 0

            password = _read_new_password()
            if password is None:
                return 1
            auth_service.create_admin(session, email, password)
            print(f"Created admin account {email}.")
            return 0
    finally:
        engine.dispose()


if __name__ == "__main__":
    sys.exit(main())
