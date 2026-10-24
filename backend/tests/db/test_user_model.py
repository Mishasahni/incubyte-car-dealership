"""User table: database-level integrity constraints."""

import pytest
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from app.models.user import User


def test_database_rejects_a_second_user_with_the_same_email(db_session):
    """IT-DB-04: the email column is unique, so a duplicate insert fails and nothing is added."""
    db_session.add(User(email="a@x.com", password_hash="hash-1"))
    db_session.commit()

    db_session.add(User(email="a@x.com", password_hash="hash-2"))
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    assert db_session.scalar(select(func.count()).select_from(User)) == 1
