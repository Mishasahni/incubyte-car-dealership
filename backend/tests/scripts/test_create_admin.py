"""scripts.create_admin: idempotent admin creation with a hidden password prompt."""

import logging

import pytest
from sqlalchemy import func, select

from app.core.security import verify_password
from app.models import User
from scripts import create_admin
from tests.factories import make_user

ADMIN_EMAIL = "admin@dealership.com"
ADMIN_PASSWORD = "Adm1n-pass-long"


class ScriptedPrompt:
    """Stands in for getpass: returns prepared answers and records each prompt."""

    def __init__(self) -> None:
        self.answers: list[str] = []
        self.prompts: list[str] = []

    def __call__(self, prompt: str = "") -> str:
        self.prompts.append(prompt)
        return self.answers.pop(0)


@pytest.fixture
def getpass_prompt(monkeypatch) -> ScriptedPrompt:
    prompt = ScriptedPrompt()
    monkeypatch.setattr(create_admin, "getpass", prompt)
    return prompt


@pytest.fixture
def run(test_settings):
    def _run(*args: str) -> int:
        return create_admin.main(list(args), settings=test_settings)

    return _run


def count_users(session) -> int:
    return session.scalar(select(func.count()).select_from(User))


def test_creates_an_admin_after_a_hidden_password_prompt(db_session, run, getpass_prompt):
    """ADM-01"""
    getpass_prompt.answers += [ADMIN_PASSWORD, ADMIN_PASSWORD]

    assert run("--email", ADMIN_EMAIL) == 0

    admin = db_session.scalars(select(User)).one()
    assert (admin.email, admin.role) == (ADMIN_EMAIL, "admin")
    assert verify_password(ADMIN_PASSWORD, admin.password_hash)
    assert len(getpass_prompt.prompts) == 2


def test_running_again_for_an_existing_admin_changes_nothing(
    db_session, run, getpass_prompt, capsys
):
    """ADM-02"""
    getpass_prompt.answers += [ADMIN_PASSWORD, ADMIN_PASSWORD]
    run("--email", ADMIN_EMAIL)
    original_hash = db_session.scalars(select(User)).one().password_hash
    capsys.readouterr()

    assert run("--email", ADMIN_EMAIL) == 0

    db_session.expire_all()
    assert count_users(db_session) == 1
    assert db_session.scalars(select(User)).one().password_hash == original_hash
    assert len(getpass_prompt.prompts) == 2
    assert "already an admin" in capsys.readouterr().out


def test_an_existing_regular_user_is_promoted_without_changing_the_password(
    db_session, run, getpass_prompt
):
    """ADM-03"""
    user = make_user(db_session, email=ADMIN_EMAIL)
    original_hash = user.password_hash

    assert run("--email", ADMIN_EMAIL) == 0

    db_session.refresh(user)
    assert user.role == "admin"
    assert user.password_hash == original_hash
    assert getpass_prompt.prompts == []


def test_the_password_is_never_printed_or_logged(run, getpass_prompt, capsys, caplog):
    """ADM-04"""
    caplog.set_level(logging.DEBUG)
    getpass_prompt.answers += [ADMIN_PASSWORD, ADMIN_PASSWORD]

    run("--email", ADMIN_EMAIL)

    output = capsys.readouterr()
    assert ADMIN_PASSWORD not in output.out + output.err + caplog.text


def test_there_is_no_password_option_so_it_cannot_reach_shell_history(run):
    """ADM-04"""
    with pytest.raises(SystemExit) as excinfo:
        run("--email", ADMIN_EMAIL, "--password", ADMIN_PASSWORD)

    assert excinfo.value.code == 2


@pytest.mark.parametrize(
    ("email", "answers"),
    [
        (ADMIN_EMAIL, [ADMIN_PASSWORD, "a-different-password"]),
        (ADMIN_EMAIL, ["7chars!", "7chars!"]),
        ("not-an-email", []),
    ],
    ids=["passwords-do-not-match", "password-too-short", "invalid-email"],
)
def test_invalid_input_fails_clearly_and_creates_nothing(
    db_session, run, getpass_prompt, capsys, email, answers
):
    """ADM-05"""
    getpass_prompt.answers += answers

    assert run("--email", email) != 0

    assert count_users(db_session) == 0
    assert capsys.readouterr().err.strip() != ""


def test_admin_created_by_the_script_can_log_in_and_add_vehicles(client, run, getpass_prompt):
    """API-AUTHZ-11"""
    getpass_prompt.answers += [ADMIN_PASSWORD, ADMIN_PASSWORD]
    run("--email", ADMIN_EMAIL)

    login = client.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert login.status_code == 200
    assert login.json()["user"]["role"] == "admin"

    vehicle = {"make": "Ford", "model": "F-150", "category": "Truck", "price": 45000, "quantity": 4}
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    assert client.post("/api/vehicles", json=vehicle, headers=headers).status_code == 201
