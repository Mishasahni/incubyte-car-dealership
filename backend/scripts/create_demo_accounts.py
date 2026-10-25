"""Create the dedicated demo accounts that one-click demo access signs in.

Reads DEMO_BUYER_EMAIL / DEMO_BUYER_PASSWORD and DEMO_ADMIN_EMAIL / DEMO_ADMIN_PASSWORD from
the environment or ``backend/.env``. Safe to run repeatedly. It never changes an existing
account that is not already that demo account, and never prints a password. Usage, from
``backend/``::

    python -m scripts.create_demo_accounts
"""

import sys

from pydantic import EmailStr, TypeAdapter, ValidationError

from app.core.config import Settings, get_settings
from app.core.security import verify_password
from app.db.session import build_engine, build_session_factory
from app.schemas.auth import PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH
from app.services import auth_service, demo_service

_email_adapter = TypeAdapter(EmailStr)


def _fail(message: str) -> int:
    print(f"Error: {message}", file=sys.stderr)
    return 1


def _check_configuration(settings: Settings) -> list[tuple[str, str, str]] | str:
    """The (demo role, email, password) to provision, or the reason the configuration is wrong."""
    accounts = []
    for role in demo_service.ACCOUNT_ROLES:
        prefix = f"DEMO_{role.upper()}"
        email = getattr(settings, f"demo_{role}_email")
        found = demo_service.credentials(settings, role)
        if email is None and found is None and getattr(settings, f"demo_{role}_password") is None:
            continue
        if found is None:
            return f"{prefix}_EMAIL and {prefix}_PASSWORD must be set together."
        email, password = found
        try:
            _email_adapter.validate_python(email)
        except ValidationError:
            return f"{prefix}_EMAIL is not a valid email address."
        if not PASSWORD_MIN_LENGTH <= len(password) <= PASSWORD_MAX_LENGTH:
            return (
                f"{prefix}_PASSWORD must be {PASSWORD_MIN_LENGTH}-{PASSWORD_MAX_LENGTH} characters."
            )
        accounts.append((role, email, password))
    if not accounts:
        return (
            "set DEMO_BUYER_EMAIL and DEMO_BUYER_PASSWORD, "
            "DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD, or both pairs."
        )
    return accounts


def main(settings: Settings | None = None) -> int:
    settings = settings or get_settings()
    accounts = _check_configuration(settings)
    if isinstance(accounts, str):
        return _fail(f"{accounts} Nothing was changed.")

    engine = build_engine(settings.database_url)
    try:
        with build_session_factory(engine)() as session:
            # Check every account first, so a problem with one leaves both untouched.
            to_create = []
            for role, email, password in accounts:
                user = auth_service.find_user_by_email(session, email)
                if user is None:
                    to_create.append((role, email, password))
                elif user.role != demo_service.ACCOUNT_ROLES[role] or not verify_password(
                    password, user.password_hash
                ):
                    return _fail(
                        f"{email} already exists and is not the demo account (its password or "
                        "role differs). Choose another demo email. Nothing was changed."
                    )
                else:
                    print(f"Demo {role} account {email} is already set up.")
            for role, email, password in to_create:
                if role == "admin":
                    auth_service.create_admin(session, email, password)
                else:
                    auth_service.register_user(session, email, password)
                print(f"Created demo {role} account {email}.")
            return 0
    finally:
        engine.dispose()


if __name__ == "__main__":
    sys.exit(main())
