"""scripts.create_demo_accounts: provisions the two dedicated demo accounts from configuration."""

import pytest
from sqlalchemy import select

from app.core.security import verify_password
from app.models import User
from scripts import create_demo_accounts
from tests.factories import make_user

BUYER_EMAIL = "buyer.demo@example.com"
BUYER_PASSWORD = "Demo-buyer-test-pass"
ADMIN_EMAIL = "admin.demo@example.com"
ADMIN_PASSWORD = "Demo-admin-test-pass"


@pytest.fixture
def run(test_settings, clean_database):
    def _run(**overrides) -> int:
        settings = test_settings.model_copy(
            update={
                "demo_buyer_email": BUYER_EMAIL,
                "demo_buyer_password": BUYER_PASSWORD,
                "demo_admin_email": ADMIN_EMAIL,
                "demo_admin_password": ADMIN_PASSWORD,
            }
            | overrides
        )
        return create_demo_accounts.main(settings=settings)

    return _run


def users(session) -> dict[str, User]:
    session.expire_all()
    return {user.email: user for user in session.scalars(select(User))}


def test_creates_a_buyer_and_a_separate_admin(db_session, run, capsys):
    assert run() == 0

    accounts = users(db_session)
    assert accounts[BUYER_EMAIL].role == "user"
    assert accounts[ADMIN_EMAIL].role == "admin"
    assert verify_password(BUYER_PASSWORD, accounts[BUYER_EMAIL].password_hash)
    assert verify_password(ADMIN_PASSWORD, accounts[ADMIN_EMAIL].password_hash)
    output = capsys.readouterr()
    assert BUYER_PASSWORD not in output.out + output.err
    assert ADMIN_PASSWORD not in output.out + output.err


def test_running_again_changes_nothing(db_session, run):
    assert run() == 0
    before = {email: user.password_hash for email, user in users(db_session).items()}

    assert run() == 0

    after = {email: user.password_hash for email, user in users(db_session).items()}
    assert after == before


def test_never_takes_over_an_existing_account_that_is_not_the_demo_account(db_session, run, capsys):
    make_user(db_session, email=ADMIN_EMAIL, role="user", password="Personal-pass-123")

    assert run() == 1

    account = users(db_session)[ADMIN_EMAIL]
    assert account.role == "user"
    assert verify_password("Personal-pass-123", account.password_hash)
    assert "not the demo account" in capsys.readouterr().err


def test_refuses_an_account_with_the_right_password_but_the_wrong_role(db_session, run):
    make_user(db_session, email=BUYER_EMAIL, role="admin", password=BUYER_PASSWORD)

    assert run() == 1
    assert users(db_session)[BUYER_EMAIL].role == "admin"


def test_requires_at_least_one_configured_account(db_session, run, capsys):
    result = run(
        demo_buyer_email=None,
        demo_buyer_password=None,
        demo_admin_email=None,
        demo_admin_password=None,
    )

    assert result == 1
    assert users(db_session) == {}
    assert "DEMO_BUYER_EMAIL" in capsys.readouterr().err


def test_rejects_a_password_outside_the_policy(db_session, run):
    assert run(demo_admin_password="short") == 1
    assert ADMIN_EMAIL not in users(db_session)


def test_rejects_an_email_without_its_password(db_session, run):
    assert run(demo_buyer_password=None) == 1
    assert users(db_session) == {}
