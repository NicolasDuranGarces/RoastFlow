from sqlmodel import Session, select

from ..db import engine
from ..models import User
from .config import settings
from .security import get_password_hash


def create_initial_superuser() -> None:
    if not settings.first_superuser_email or not settings.first_superuser_password:
        return

    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == settings.first_superuser_email)).first()
        if user:
            return

        superuser = User(
            email=settings.first_superuser_email,
            full_name="Admin",
            hashed_password=get_password_hash(settings.first_superuser_password),
            is_superuser=True,
            is_active=True,
        )
        session.add(superuser)
        session.commit()
