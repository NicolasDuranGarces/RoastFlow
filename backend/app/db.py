from sqlmodel import SQLModel, create_engine

from .core.config import settings

engine = create_engine(settings.database_url, echo=False, pool_pre_ping=True)


def init_db() -> None:
    SQLModel.metadata.create_all(bind=engine)
